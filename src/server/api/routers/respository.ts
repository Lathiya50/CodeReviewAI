import { z } from "zod";
import crypto from "crypto";
import { TRPCError } from "@trpc/server";
import { AutomationMode } from "@prisma/client";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import {
  fetchGitHubRepos,
  getGitHubAccessToken,
  registerRepoWebhook,
  deleteRepoWebhook,
} from "@/server/services/github";
import { deriveAutomation } from "@/server/services/automation";

/**
 * Resolves the public app URL GitHub must reach to deliver webhooks. Mirrors the
 * resolution used by better-auth so the webhook endpoint and auth callbacks
 * agree on the canonical origin. For local dev this must be a public HTTPS
 * tunnel (e.g. cloudflared / ngrok) — GitHub cannot reach `localhost`.
 */
function getAppUrl(): string {
  return (
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000")
  );
}

/**
 * Builds the public webhook endpoint GitHub delivers to. `WEBHOOK_PUBLIC_URL`
 * takes precedence so the webhook target can be decoupled from the app/auth
 * origin: in local dev `BETTER_AUTH_URL` / `NEXT_PUBLIC_APP_URL` can stay on
 * `localhost` (which GitHub can't reach) while webhooks are tunneled in via a
 * public HTTPS URL (e.g. ngrok). Accepts either the bare origin or the full
 * endpoint URL.
 */
function getWebhookUrl(): string {
  const explicit = process.env.WEBHOOK_PUBLIC_URL?.trim();
  const base = explicit || getAppUrl();
  return base.endsWith("/api/webhooks/github")
    ? base
    : `${base.replace(/\/+$/, "")}/api/webhooks/github`;
}

export const repositoryRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const repositories = await ctx.db.repository.findMany({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: "desc" },
      // Never expose the per-repo webhook secret to the client.
      omit: { webhookSecret: true },
    });
    return repositories;
  }),

  fetchFromGithub: protectedProcedure.query(async ({ ctx }) => {
    const accessToken = await getGitHubAccessToken(ctx.user.id);

    if (!accessToken) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "User has not authorized GitHub access",
      });
    }

    const repos = await fetchGitHubRepos(accessToken);
    return repos.map((repo) => ({
      githubId: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      private: repo.private,
      htmlUrl: repo.html_url,
      description: repo.description,
      language: repo.language,
      stars: repo.stargazers_count,
      updatedAt: repo.updated_at,
    }));
  }),

  connect: protectedProcedure
    .input(
      z.object({
        repos: z.array(
          z.object({
            githubId: z.number(),
            name: z.string(),
            fullName: z.string(),
            private: z.boolean(),
            htmlUrl: z.string(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const accessToken = await getGitHubAccessToken(ctx.user.id);
      const webhookUrl = getWebhookUrl();

      const results = await Promise.all(
        input.repos.map(async (repo) => {
          const record = await ctx.db.repository.upsert({
            where: { githubId: repo.githubId },
            create: {
              userId: ctx.user.id,
              githubId: repo.githubId,
              name: repo.name,
              fullName: repo.fullName,
              private: repo.private,
              htmlUrl: repo.htmlUrl,
            },
            update: {
              name: repo.name,
              fullName: repo.fullName,
              private: repo.private,
              htmlUrl: repo.htmlUrl,
              updatedAt: new Date(),
            },
          });

          // Register the webhook best-effort — a failure must not abort the
          // whole batch or the DB connection. Mark the repo FAILED instead.
          // We always (re)ensure the hook rather than trusting an ACTIVE flag,
          // so the delivery URL and secret self-heal on every connect.
          if (!accessToken) {
            await ctx.db.repository.update({
              where: { id: record.id },
              data: { webhookStatus: "FAILED" },
            });
            return {
              id: record.id,
              fullName: repo.fullName,
              webhookStatus: "FAILED" as const,
              webhookError: "GitHub account not connected",
            };
          }

          const [owner, repoName] = repo.fullName.split("/");
          if (!owner || !repoName) {
            await ctx.db.repository.update({
              where: { id: record.id },
              data: { webhookStatus: "FAILED" },
            });
            return {
              id: record.id,
              fullName: repo.fullName,
              webhookStatus: "FAILED" as const,
              webhookError: "Invalid repository name",
            };
          }

          try {
            const secret =
              record.webhookSecret ?? crypto.randomBytes(32).toString("hex");
            const hookId = await registerRepoWebhook(
              accessToken,
              owner,
              repoName,
              { url: webhookUrl, secret, existingHookId: record.webhookId },
            );
            await ctx.db.repository.update({
              where: { id: record.id },
              data: {
                webhookId: hookId,
                webhookSecret: secret,
                webhookStatus: "ACTIVE",
              },
            });
            return {
              id: record.id,
              fullName: repo.fullName,
              webhookStatus: "ACTIVE" as const,
              webhookError: null,
            };
          } catch (error) {
            await ctx.db.repository.update({
              where: { id: record.id },
              data: { webhookStatus: "FAILED" },
            });
            return {
              id: record.id,
              fullName: repo.fullName,
              webhookStatus: "FAILED" as const,
              webhookError:
                error instanceof Error
                  ? error.message
                  : "Failed to register webhook",
            };
          }
        }),
      );

      return {
        connected: results.length,
        results,
      };
    }),

  disconnect: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const repository = await ctx.db.repository.findUnique({
        where: { id: input.id, userId: ctx.user.id },
      });

      if (!repository) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Repository not found",
        });
      }

      // Best-effort webhook teardown so we don't leave orphan hooks on GitHub.
      if (repository.webhookId) {
        const accessToken = await getGitHubAccessToken(ctx.user.id);
        const [owner, repoName] = repository.fullName.split("/");
        if (accessToken && owner && repoName) {
          try {
            await deleteRepoWebhook(
              accessToken,
              owner,
              repoName,
              repository.webhookId,
            );
          } catch {
            // Ignore — the DB row is removed regardless; a stale hook will fail
            // signature verification and be ignored anyway.
          }
        }
      }

      await ctx.db.repository.delete({
        where: { id: input.id, userId: ctx.user.id },
      });
      return { success: true };
    }),

  setAutomation: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        automationMode: z.nativeEnum(AutomationMode),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const repository = await ctx.db.repository.findUnique({
        where: { id: input.id, userId: ctx.user.id },
      });

      if (!repository) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Repository not found",
        });
      }

      // `automationMode` is the single source of truth. We also write the derived
      // legacy columns so the DB stays self-consistent during Phase A (they get
      // dropped in the Phase B follow-up once nothing reads them).
      const derived = deriveAutomation(input.automationMode);

      const updated = await ctx.db.repository.update({
        where: { id: input.id },
        data: {
          automationMode: input.automationMode,
          autoReviewEnabled: derived.autoReview,
          autoPostEnabled: derived.autoPost,
          postEvent: derived.postEvent,
        },
      });

      return updated;
    }),

  reconnectWebhook: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const repository = await ctx.db.repository.findUnique({
        where: { id: input.id, userId: ctx.user.id },
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
          message: "GitHub account not connected. Please re-authenticate.",
        });
      }

      const [owner, repoName] = repository.fullName.split("/");
      if (!owner || !repoName) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid repository name",
        });
      }

      try {
        // Reuse the existing secret if present so a hook GitHub already stores
        // keeps verifying; otherwise mint a fresh one.
        const secret =
          repository.webhookSecret ?? crypto.randomBytes(32).toString("hex");
        const hookId = await registerRepoWebhook(accessToken, owner, repoName, {
          url: getWebhookUrl(),
          secret,
          existingHookId: repository.webhookId,
        });
        const updated = await ctx.db.repository.update({
          where: { id: repository.id },
          data: {
            webhookId: hookId,
            webhookSecret: secret,
            webhookStatus: "ACTIVE",
          },
        });
        return { webhookStatus: updated.webhookStatus };
      } catch (error) {
        await ctx.db.repository.update({
          where: { id: repository.id },
          data: { webhookStatus: "FAILED" },
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to register webhook",
        });
      }
    }),
});
