import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/server/db";
import { inngest } from "@/server/inngest";
import { deriveAutomation } from "@/server/services/automation";

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

  // Tag for log lines so the reason behind every 200 is greppable in prod logs.
  // Most "webhook 200 but no review appeared" reports are an intentional skip
  // here (a `push` event, a non-PR action, a draft, etc.) rather than a failure.
  const ctx = `[gh-webhook] event=${event} action=${data.action ?? "-"} repo=${data.repository?.full_name ?? "-"} pr=${data.pull_request?.number ?? "-"}`;
  const skip = (reason: string) => {
    console.info(`${ctx} → skipped: ${reason}`);
    return NextResponse.json({ message: reason }, { status: 200 });
  };

  // GitHub sends a `ping` event when a webhook is first created.
  if (event === "ping") {
    console.info(`${ctx} → pong`);
    return NextResponse.json({ message: "pong" }, { status: 200 });
  }

  // Only handle pull_request events. A plain `git push` sends a `push` event
  // (ignored here); a review only runs when there is an OPEN PR for the branch,
  // which is what fires the `pull_request` `synchronize` action below.
  if (event !== "pull_request") {
    return skip(`Event '${event}' ignored`);
  }

  // Only trigger on open, synchronize (new commits), or reopen
  if (!["opened", "synchronize", "reopened"].includes(data.action)) {
    return skip(`Action '${data.action}' ignored`);
  }

  // Skip draft PRs
  if (data.pull_request.draft) {
    return skip("Draft PR ignored");
  }

  // Bot-loop guard. We only subscribe to `pull_request` (not
  // `pull_request_review`), so our own posted reviews can't loop back here, but
  // we still ignore GitHub App bot senders to avoid reacting to automation noise.
  const senderLogin = data.sender?.login ?? "";
  if (senderLogin.endsWith("[bot]")) {
    return skip(`Bot sender '${senderLogin}' ignored`);
  }

  if (!repository) {
    return skip("Repository not connected");
  }

  // Respect the per-repo automation mode. OFF ⇒ no auto-review at all; every
  // other mode runs the review (REVIEW_ONLY just skips the GitHub post later).
  const automation = deriveAutomation(repository.automationMode);
  if (!automation.autoReview) {
    return skip("Auto-review disabled (mode OFF) for repository");
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
    return skip("Review already in progress");
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
  // their review-then-click flow and never set these flags. The post behavior is
  // derived from the repo's single automation mode.
  await inngest.send({
    name: "review/pr.requested",
    data: {
      reviewId: review.id,
      repositoryId: repository.id,
      prNumber: data.pull_request.number,
      userId: repository.userId,
      autoPost: automation.autoPost,
      postEvent: automation.postEvent,
    },
  });

  console.info(
    `${ctx} → review triggered reviewId=${review.id} mode=${repository.automationMode} autoPost=${automation.autoPost}`,
  );
  return NextResponse.json(
    { message: "Review triggered", reviewId: review.id },
    { status: 200 },
  );
}
