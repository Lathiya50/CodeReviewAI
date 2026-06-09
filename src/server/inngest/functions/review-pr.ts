import { inngest } from "../client";
import { db } from "@/server/db";
import { resolveUserAiConfig, reviewCode } from "@/server/services/ai";
import {
  fetchPullRequest,
  fetchPullRequestFiles,
  getGitHubAccessToken,
  createGitHubPRReview,
} from "@/server/services/github";

export type ReviewPREvent = {
  name: "review/pr.requested";
  data: {
    reviewId: string;
    repositoryId: string;
    prNumber: number;
    userId: string;
    // Webhook-originated reviews set these to auto-post the result back to the
    // PR. Manual UI triggers omit them and keep their review-then-click flow.
    autoPost?: boolean;
    postEvent?: "COMMENT" | "REQUEST_CHANGES";
  };
};

export type ReviewPRCancelledEvent = {
  name: "review/pr.cancelled";
  data: {
    reviewId: string;
  };
};

// Condenses a thrown error into a short, user-facing message for the UI.
// Strips multiline noise and caps length so it fits the FAILED state nicely.
function toUserFacingError(error: unknown): string {
  const message =
    error instanceof Error ? error.message : String(error ?? "Unknown error");
  const firstLine =
    message
      .split("\n")
      .map((line) => line.trim())
      .find(Boolean) ?? "The review failed unexpectedly.";
  return firstLine.slice(0, 500);
}

export const reviewPR = inngest.createFunction(
  {
    id: "review-pr",
    retries: 2,
    cancelOn: [{ event: "review/pr.cancelled", match: "data.reviewId" }],
    // Runs only after all retries are exhausted. Marks the review FAILED with
    // the final error so the UI stops polling and can show the message + a
    // re-run action (otherwise the review is stuck PROCESSING forever).
    onFailure: async ({ event, error, step }) => {
      const originalData = event.data.event.data as { reviewId?: string };
      const reviewId = originalData?.reviewId;
      if (!reviewId) return;

      await step.run("mark-review-failed", async () => {
        await db.review.updateMany({
          // Guard so we never overwrite a COMPLETED/CANCELLED review.
          where: { id: reviewId, status: { in: ["PENDING", "PROCESSING"] } },
          data: { status: "FAILED", error: toUserFacingError(error) },
        });
      });
    },
  },
  { event: "review/pr.requested" },
  async ({ event, step }) => {
    const { reviewId, repositoryId, prNumber, userId, autoPost, postEvent } =
      event.data;

    await step.run("update-status-processing", async () => {
      await db.review.update({
        where: { id: reviewId },
        data: { status: "PROCESSING" },
      });
    });

    const repository = await step.run("get-repository", async () => {
      return db.repository.findUnique({
        where: { id: repositoryId },
      });
    });

    if (!repository) {
      await step.run("mark-failed-no-repo", async () => {
        await db.review.update({
          where: { id: reviewId },
          data: { status: "FAILED", error: "No repository found" },
        });
      });
      return { success: false, error: "No repository found" };
    }

    const accessToken = await step.run("get-access-token", async () => {
      return getGitHubAccessToken(userId);
    });

    if (!accessToken) {
      await step.run("mark-failed-no-token", async () => {
        await db.review.update({
          where: { id: reviewId },
          data: {
            status: "FAILED",
            error: "GitHub access token not found",
          },
        });
      });
      return { success: false, error: "GitHub access token not found" };
    }

    const [owner, repo] = repository.fullName.split("/");
    if (!owner || !repo) {
      await step.run("mark-failed-invalid-repo", async () => {
        await db.review.update({
          where: { id: reviewId },
          data: {
            status: "FAILED",
            error: "Invalid repository name",
          },
        });
      });
      return { success: false, error: "Invalid repository name" };
    }

    const files = await step.run("fetch-pr-files", async () => {
      return fetchPullRequestFiles(accessToken, owner, repo, prNumber);
    });

    const pr = await step.run("fetch-pr", async () => {
      return fetchPullRequest(accessToken, owner, repo, prNumber);
    });

    const reviewResult = await step.run("generate-review", async () => {
      // Resolve the user's AI settings (provider/model/key/instructions) and
      // decrypt the key INSIDE this step. The decrypted key must never be
      // returned from a step — Inngest persists step outputs durably.
      const aiConfig = await resolveUserAiConfig(userId);

      return reviewCode(
        pr.title,
        files.map((f) => ({
          filename: f.filename,
          status: f.status,
          additions: f.additions,
          deletions: f.deletions,
          patch: f.patch,
        })),
        aiConfig,
      );
    });

    await step.run("save-review-result", async () => {
      await db.review.update({
        where: { id: reviewId },
        data: {
          status: "COMPLETED",
          summary: reviewResult.summary,
          riskScore: reviewResult.riskScore,
          comments: reviewResult.comments,
        },
      });
    });

    // Auto-post the review back to the PR for webhook-originated reviews. A
    // posting failure is a soft error: the review stays COMPLETED with results
    // saved, we just record why the post didn't land. This step is cancel-safe.
    if (autoPost && reviewResult.comments.length > 0) {
      await step.run("post-to-github", async () => {
        try {
          const result = await createGitHubPRReview(
            accessToken,
            owner,
            repo,
            prNumber,
            reviewResult.comments,
            files,
            postEvent ?? "COMMENT",
            reviewResult.summary,
          );
          await db.review.update({
            where: { id: reviewId },
            data: {
              postedToGithub: true,
              githubReviewId: result.githubReviewId,
            },
          });
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to auto-post review to GitHub";
          await db.review.update({
            where: { id: reviewId },
            data: { error: `Auto-post failed: ${message}` },
          });
        }
      });
    }

    return { success: true, reviewId };
  },
);
