import { pullRequestRouter } from "./routers/pull-request";
import { repositoryRouter } from "./routers/respository";
import { reviewRouter } from "./routers/review";
import { analyticsRouter } from "./routers/analytics";
import { settingsRouter } from "./routers/settings";
import { createCallerFactory, createTRPCRouter, publicProcedure } from "./trpc";

export const appRouter = createTRPCRouter({
  health: publicProcedure.query(() => {
    return { status: "ok", timestamps: new Date() };
  }),
  repository: repositoryRouter,
  pullRequest: pullRequestRouter,
  review: reviewRouter,
  analytics: analyticsRouter,
  settings: settingsRouter,
});

export type AppRouter = typeof appRouter;
export const createCaller = createCallerFactory(appRouter);
