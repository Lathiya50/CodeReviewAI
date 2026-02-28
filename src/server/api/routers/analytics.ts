import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

/**
 * Analytics tRPC router — aggregates Review and Repository data for the analytics dashboard.
 * All procedures are protected and scoped to the authenticated user.
 */
export const analyticsRouter = createTRPCRouter({
  /**
   * Returns high-level review stats: total reviews, completed, avg risk score, pass rate.
   * @returns { total, completed, failed, pending, processing, avgRiskScore, passRate }
   */
  stats: protectedProcedure.query(async ({ ctx }) => {
    const reviews = await ctx.db.review.findMany({
      where: { userId: ctx.user.id },
      select: { status: true, riskScore: true },
    });

    const total = reviews.length;
    const completed = reviews.filter((r) => r.status === "COMPLETED").length;
    const failed = reviews.filter((r) => r.status === "FAILED").length;
    const pending = reviews.filter((r) => r.status === "PENDING").length;
    const processing = reviews.filter((r) => r.status === "PROCESSING").length;

    const completedWithScore = reviews.filter(
      (r) => r.status === "COMPLETED" && r.riskScore !== null,
    );
    const avgRiskScore =
      completedWithScore.length > 0
        ? Math.round(
            completedWithScore.reduce(
              (sum, r) => sum + (r.riskScore ?? 0),
              0,
            ) / completedWithScore.length,
          )
        : 0;

    // Pass rate: completed reviews where risk score <= 60
    const passed = completedWithScore.filter(
      (r) => (r.riskScore ?? 100) <= 60,
    ).length;
    const passRate =
      completedWithScore.length > 0
        ? Math.round((passed / completedWithScore.length) * 100)
        : 0;

    return { total, completed, failed, pending, processing, avgRiskScore, passRate };
  }),

  /**
   * Returns review counts grouped by day for the last N days (trend chart data).
   * @param days - number of days to look back (default 30)
   * @returns Array of { date: string, reviews: number }
   */
  reviewTrend: protectedProcedure
    .input(z.object({ days: z.number().min(7).max(90).default(30) }))
    .query(async ({ ctx, input }) => {
      const since = new Date();
      since.setDate(since.getDate() - input.days);

      const reviews = await ctx.db.review.findMany({
        where: {
          userId: ctx.user.id,
          createdAt: { gte: since },
        },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      });

      // Build a map of date -> count
      const dateMap: Record<string, number> = {};
      for (let i = 0; i < input.days; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (input.days - 1 - i));
        const key = d.toISOString().split("T")[0] as string;
        dateMap[key] = 0;
      }

      for (const review of reviews) {
        const key = review.createdAt.toISOString().split("T")[0] as string;
        if (key in dateMap) {
          dateMap[key] = (dateMap[key] ?? 0) + 1;
        }
      }

      return Object.entries(dateMap).map(([date, reviews]) => ({
        date,
        reviews,
      }));
    }),

  /**
   * Returns distribution of reviews by risk score range for donut chart.
   * @returns Array of { range: string, count: number, color: string }
   */
  riskDistribution: protectedProcedure.query(async ({ ctx }) => {
    const reviews = await ctx.db.review.findMany({
      where: {
        userId: ctx.user.id,
        status: "COMPLETED",
        riskScore: { not: null },
      },
      select: { riskScore: true },
    });

    const low = reviews.filter((r) => (r.riskScore ?? 0) <= 30).length;
    const medium = reviews.filter(
      (r) => (r.riskScore ?? 0) > 30 && (r.riskScore ?? 0) <= 60,
    ).length;
    const high = reviews.filter((r) => (r.riskScore ?? 0) > 60).length;

    return [
      { range: "Low (0-30)", count: low, fill: "var(--color-low)" },
      { range: "Medium (31-60)", count: medium, fill: "var(--color-medium)" },
      { range: "High (61-100)", count: high, fill: "var(--color-high)" },
    ];
  }),

  /**
   * Returns the top issue categories aggregated from review comments (bar chart).
   * Parses JSON comments field from completed reviews.
   * @returns Array of { category: string, count: number } sorted by count desc
   */
  topIssues: protectedProcedure.query(async ({ ctx }) => {
    const reviews = await ctx.db.review.findMany({
      where: {
        userId: ctx.user.id,
        status: "COMPLETED",
        comments: { not: "DbNull" as unknown as never },
      },
      select: { comments: true },
    });

    const categoryCounts: Record<string, number> = {};

    for (const review of reviews) {
      if (!review.comments) continue;

      let comments: Array<{ severity?: string; category?: string; type?: string }> = [];
      try {
        const raw = review.comments;
        if (Array.isArray(raw)) {
          comments = raw as typeof comments;
        } else if (typeof raw === "object" && raw !== null && "comments" in raw) {
          const nested = (raw as { comments: unknown }).comments;
          if (Array.isArray(nested)) {
            comments = nested as typeof comments;
          }
        }
      } catch {
        continue;
      }

      for (const comment of comments) {
        const cat =
          comment.category ||
          comment.type ||
          comment.severity ||
          "Other";
        const normalized = String(cat).charAt(0).toUpperCase() + String(cat).slice(1).toLowerCase();
        categoryCounts[normalized] = (categoryCounts[normalized] ?? 0) + 1;
      }
    }

    return Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }),

  /**
   * Returns activity heatmap data: review count per day for the last 52 weeks (GitHub-style).
   * @returns Array of { date: string, count: number, week: number, day: number }
   */
  activityHeatmap: protectedProcedure.query(async ({ ctx }) => {
    const since = new Date();
    since.setDate(since.getDate() - 363); // 52 weeks back (364 days)

    const reviews = await ctx.db.review.findMany({
      where: {
        userId: ctx.user.id,
        createdAt: { gte: since },
      },
      select: { createdAt: true },
    });

    const dateMap: Record<string, number> = {};
    for (const review of reviews) {
      const key = review.createdAt.toISOString().split("T")[0] as string;
      dateMap[key] = (dateMap[key] ?? 0) + 1;
    }

    const result: Array<{
      date: string;
      count: number;
      week: number;
      day: number;
    }> = [];

    for (let i = 0; i < 364; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (363 - i));
      const key = d.toISOString().split("T")[0] as string;
      result.push({
        date: key,
        count: dateMap[key] ?? 0,
        week: Math.floor(i / 7),
        day: d.getDay(),
      });
    }

    return result;
  }),

  /**
   * Returns per-repository review leaderboard (most active repos).
   * @param limit - max number of repos to return (default 5)
   * @returns Array of { repoName: string, total: number, completed: number, avgRiskScore: number }
   */
  repoLeaderboard: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(5) }))
    .query(async ({ ctx, input }) => {
      const reviews = await ctx.db.review.findMany({
        where: { userId: ctx.user.id },
        select: {
          riskScore: true,
          status: true,
          repository: { select: { name: true, fullName: true } },
        },
      });

      const repoMap: Record<
        string,
        { total: number; completed: number; riskSum: number; riskCount: number }
      > = {};

      for (const review of reviews) {
        const key = review.repository.fullName;
        if (!repoMap[key]) {
          repoMap[key] = { total: 0, completed: 0, riskSum: 0, riskCount: 0 };
        }
        repoMap[key]!.total += 1;
        if (review.status === "COMPLETED") {
          repoMap[key]!.completed += 1;
          if (review.riskScore !== null) {
            repoMap[key]!.riskSum += review.riskScore;
            repoMap[key]!.riskCount += 1;
          }
        }
      }

      return Object.entries(repoMap)
        .map(([fullName, data]) => ({
          repoName: fullName.split("/")[1] ?? fullName,
          fullName,
          total: data.total,
          completed: data.completed,
          avgRiskScore:
            data.riskCount > 0
              ? Math.round(data.riskSum / data.riskCount)
              : 0,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, input.limit);
    }),
});
