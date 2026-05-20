import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/server/db";
import { inngest } from "@/server/inngest";

interface PullRequestPayload {
  action: string;
  number: number;
  pull_request: {
    id: number;
    number: number;
    title: string;
    html_url: string;
    state: string;
    draft: boolean;
    user?: { login: string };
  };
  repository: {
    id: number;
    full_name: string;
  };
  sender?: {
    login: string;
    type?: string;
  };
}

/**
 * Verifies the GitHub HMAC signature against the supplied secret. Guards against
 * the `timingSafeEqual` length-mismatch throw by comparing buffer lengths first.
 * When no secret is available the request is allowed through (legacy behaviour
 * for hooks configured before per-repo secrets existed).
 */
function verifySignature(
  payload: string,
  signature: string | null,
  secret: string | undefined,
): boolean {
  if (!secret) {
    console.warn("No webhook secret available, skipping verification");
    return true;
  }

  if (!signature) {
    return false;
  }

  const hmac = crypto.createHmac("sha256", secret);
  const digest = "sha256=" + hmac.update(payload).digest("hex");

  const digestBuffer = Buffer.from(digest);
  const signatureBuffer = Buffer.from(signature);

  // timingSafeEqual throws if the buffers differ in length.
  if (digestBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(digestBuffer, signatureBuffer);
}

function verifySignatureAgainstSecrets(
  payload: string,
  signature: string | null,
  secrets: Array<string | null | undefined>,
): boolean {
  const availableSecrets = secrets.filter(
    (secret): secret is string => Boolean(secret),
  );

  if (availableSecrets.length === 0) {
    return verifySignature(payload, signature, undefined);
  }

  return availableSecrets.some((secret) =>
    verifySignature(payload, signature, secret),
  );
}

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get("x-hub-signature-256");
  const event = request.headers.get("x-github-event");

  // Parse early (cheaply) so we can resolve the repo and its per-repo secret.
  // The raw `payload` string is still what we HMAC-verify below.
  let data: PullRequestPayload;
  try {
    data = JSON.parse(payload) as PullRequestPayload;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Look up the repo first so signature verification can use its per-repo
  // secret. Falls back to the global GH_WEBHOOK_SECRET for legacy hooks.
  const repository = data.repository?.id
    ? await db.repository.findUnique({
        where: { githubId: data.repository.id },
      })
    : null;

  const secret = repository?.webhookSecret;
  const fallbackSecret = process.env.GH_WEBHOOK_SECRET;

  if (!verifySignatureAgainstSecrets(payload, signature, [secret, fallbackSecret])) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // GitHub sends a `ping` event when a webhook is first created.
  if (event === "ping") {
    return NextResponse.json({ message: "pong" }, { status: 200 });
  }

  // Only handle pull_request events
  if (event !== "pull_request") {
    return NextResponse.json({ message: "Event ignored" }, { status: 200 });
  }

  // Only trigger on open, synchronize (new commits), or reopen
  if (!["opened", "synchronize", "reopened"].includes(data.action)) {
    return NextResponse.json(
      { message: `Action '${data.action}' ignored` },
      { status: 200 },
    );
  }

  // Skip draft PRs
  if (data.pull_request.draft) {
    return NextResponse.json({ message: "Draft PR ignored" }, { status: 200 });
  }

  // Bot-loop guard. We only subscribe to `pull_request` (not
  // `pull_request_review`), so our own posted reviews can't loop back here, but
  // we still ignore GitHub App bot senders to avoid reacting to automation noise.
  const senderLogin = data.sender?.login ?? "";
  if (senderLogin.endsWith("[bot]")) {
    return NextResponse.json(
      { message: "Bot sender ignored" },
      { status: 200 },
    );
  }

  if (!repository) {
    return NextResponse.json(
      { message: "Repository not connected" },
      { status: 200 },
    );
  }

  // Respect the per-repo automation toggle.
  if (!repository.autoReviewEnabled) {
    return NextResponse.json(
      { message: "Auto-review disabled for repository" },
      { status: 200 },
    );
  }

  // Check if there's already a review in progress
  const existingReview = await db.review.findFirst({
    where: {
      repositoryId: repository.id,
      prNumber: data.pull_request.number,
      status: { in: ["PENDING", "PROCESSING"] },
    },
  });

  if (existingReview) {
    return NextResponse.json(
      { message: "Review already in progress" },
      { status: 200 },
    );
  }

  // Create a new review record
  const review = await db.review.create({
    data: {
      repositoryId: repository.id,
      userId: repository.userId,
      prNumber: data.pull_request.number,
      prTitle: data.pull_request.title,
      prUrl: data.pull_request.html_url,
      status: "PENDING",
    },
  });

  // Trigger the Inngest job. Auto-post is webhook-only — manual UI triggers keep
  // their review-then-click flow and never set these flags.
  await inngest.send({
    name: "review/pr.requested",
    data: {
      reviewId: review.id,
      repositoryId: repository.id,
      prNumber: data.pull_request.number,
      userId: repository.userId,
      autoPost: repository.autoPostEnabled,
      postEvent: repository.postEvent,
    },
  });

  return NextResponse.json(
    { message: "Review triggered", reviewId: review.id },
    { status: 200 },
  );
}
