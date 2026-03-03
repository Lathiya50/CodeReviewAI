import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { inngest } from "@/server/inngest";
import {
  fetchPullRequest,
  fetchPullRequestFiles,
  getGitHubAccessToken,
  createGitHubPRReview,
  getAuthenticatedGitHubLogin,
} from "@/server/services/github";
import type { ReviewComment } from "@/server/services/ai/types";

export const reviewRouter = createTRPCRouter({
  trigger: protectedProcedure
    .input(
      z.object({
        repositoryId: z.string(),
        prNumber: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const repository = await ctx.db.repository.findUnique({
        where: { id: input.repositoryId, userId: ctx.user.id },
      });

      if (!repository) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Repository not found",
        });
      }

      const accessToken = await getGitHubAccessToken(ctx.user.id);
      if (!accessToken) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "GitHub account not connected",
        });
      }

      const [owner, repo] = repository.fullName.split("/");
      if (!owner || !repo) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid repository name",
        });
      }

      const pr = await fetchPullRequest(
        accessToken,
        owner,
        repo,
        input.prNumber,
      );

      const review = await ctx.db.review.create({
        data: {
          repositoryId: repository.id,
          userId: ctx.user.id,
          prNumber: pr.number,
          prTitle: pr.title,
          prUrl: pr.html_url,
          status: "PENDING",
        },
      });

      await inngest.send({
        name: "review/pr.requested",
        data: {
          reviewId: review.id,
          repositoryId: repository.id,
          prNumber: pr.number,
          userId: ctx.user.id,
        },
      });

      return { reviewId: review.id };
    }),
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const review = await ctx.db.review.findUnique({
        where: { id: input.id, userId: ctx.user.id },
        include: { repository: true },
      });

      if (!review) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Review not found",
        });
      }

      return review;
    }),
  list: protectedProcedure
    .input(
      z.object({
        repositoryId: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const reviews = await ctx.db.review.findMany({
        where: {
          userId: ctx.user.id,
          ...(input.repositoryId && { repositoryId: input.repositoryId }),
        },
        include: { repository: true },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });

      return reviews;
    }),
  getLatestForPR: protectedProcedure
    .input(
      z.object({
        repositoryId: z.string(),
        prNumber: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const review = await ctx.db.review.findFirst({
        where: {
          repositoryId: input.repositoryId,
          prNumber: input.prNumber,
          userId: ctx.user.id,
        },
        orderBy: { createdAt: "desc" },
      });

      return review;
    }),

  listForPR: protectedProcedure
    .input(
      z.object({
        repositoryId: z.string(),
        prNumber: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const reviews = await ctx.db.review.findMany({
        where: {
          repositoryId: input.repositoryId,
          prNumber: input.prNumber,
          userId: ctx.user.id,
          status: "COMPLETED",
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          createdAt: true,
          riskScore: true,
          summary: true,
          comments: true,
        },
      });

      return reviews;
    }),


  postToGithub: protectedProcedure
    .input(
      z.object({
        reviewId: z.string(),
        commentIndices: z.array(z.number()),
        event: z.enum(["COMMENT", "REQUEST_CHANGES"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const review = await ctx.db.review.findUnique({
        where: { id: input.reviewId, userId: ctx.user.id },
        include: { repository: true },
      });

      if (!review) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Review not found",
        });
      }

      if (review.status !== "COMPLETED") {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Only completed reviews can be posted to GitHub",
        });
      }

      const allComments = Array.isArray(review.comments)
        ? (review.comments as ReviewComment[])
        : [];

      if (allComments.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Review has no comments to post",
        });
      }

      const selectedComments = input.commentIndices
        .filter((i) => i >= 0 && i < allComments.length)
        .map((i) => allComments[i]);

      if (selectedComments.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No valid comments selected",
        });
      }

      const accessToken = await getGitHubAccessToken(ctx.user.id);
      if (!accessToken) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "GitHub account not connected. Please re-authenticate.",
        });
      }

      const [owner, repo] = review.repository.fullName.split("/");
      if (!owner || !repo) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid repository name",
        });
      }

      const [files, pr] = await Promise.all([
        fetchPullRequestFiles(accessToken, owner, repo, review.prNumber),
        fetchPullRequest(accessToken, owner, repo, review.prNumber),
      ]);

      // GitHub doesn't allow REQUEST_CHANGES on your own PR — force COMMENT
      const authenticatedLogin = await getAuthenticatedGitHubLogin(accessToken);
      const isOwnPR = !!authenticatedLogin && authenticatedLogin === pr.user?.login;
      const resolvedEvent = isOwnPR ? "COMMENT" : input.event;

      try {
        const result = await createGitHubPRReview(
          accessToken,
          owner,
          repo,
          review.prNumber,
          selectedComments,
          files,
          resolvedEvent,
          review.summary ?? "AI Code Review",
        );

        await ctx.db.review.update({
          where: { id: input.reviewId },
          data: {
            postedToGithub: true,
            githubReviewId: result.githubReviewId,
          },
        });

        return {
          ...result,
          forcedComment: isOwnPR && input.event === "REQUEST_CHANGES",
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to post review to GitHub";
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message,
        });
      }
    }),
});
