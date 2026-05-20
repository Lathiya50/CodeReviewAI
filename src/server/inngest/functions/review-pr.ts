import { inngest } from "../client";
import { db } from "@/server/db";
import { reviewCode } from "@/server/services/ai";
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

export const reviewPR = inngest.createFunction(
  {
    id: "review-pr",
    retries: 2,
    cancelOn: [{ event: "review/pr.cancelled", match: "data.reviewId" }],
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
      return reviewCode(
        pr.title,
        files.map((f) => ({
          filename: f.filename,
          status: f.status,
          additions: f.additions,
          deletions: f.deletions,
          patch: f.patch,
        })),
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
