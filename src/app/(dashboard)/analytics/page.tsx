"use client";

import { trpc } from "@/lib/trpc/client";
import { StatsCards } from "@/components/analytics/stats-cards";
import { ReviewChart } from "@/components/analytics/review-chart";
import { RiskDistribution } from "@/components/analytics/risk-distribution";
import { TopIssues } from "@/components/analytics/top-issues";
import { ActivityHeatmap } from "@/components/analytics/activity-heatmap";
import { RepoLeaderboard } from "@/components/analytics/repo-leaderboard";
import { BarChart2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * AnalyticsPage — `/analytics` dashboard.
 * Fetches all analytics data in parallel via tRPC.
 * Layout: page header → KPI row → trend chart → risk + issues row
 *          → heatmap → leaderboard + health sidebar.
 */
export default function AnalyticsPage() {
  const stats = trpc.analytics.stats.useQuery();
  const trend = trpc.analytics.reviewTrend.useQuery({ days: 90 });
  const riskDist = trpc.analytics.riskDistribution.useQuery();
  const topIssues = trpc.analytics.topIssues.useQuery();
  const heatmap = trpc.analytics.activityHeatmap.useQuery();
  const leaderboard = trpc.analytics.repoLeaderboard.useQuery({ limit: 5 });

  const isAnyLoading =
    stats.isLoading ||
    trend.isLoading ||
    riskDist.isLoading ||
    topIssues.isLoading ||
    heatmap.isLoading ||
    leaderboard.isLoading;

  /** Refetches all analytics queries simultaneously */
  const refetchAll = () => {
    void stats.refetch();
    void trend.refetch();
    void riskDist.refetch();
    void topIssues.refetch();
    void heatmap.refetch();
    void leaderboard.refetch();
  };

  const passRate = stats.data?.passRate ?? 0;
  const avgRisk = stats.data?.avgRiskScore ?? 0;

  return (
    <div className="mx-auto max-w-screen-xl space-y-7 pb-10">
      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4 pt-1">
        <div className="flex items-center gap-3.5">
          <div className="flex size-11 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 dark:border-blue-900/40 dark:bg-blue-950/40">
            <BarChart2 className="size-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              Analytics
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Insights and trends across all your code reviews
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refetchAll}
          disabled={isAnyLoading}
          className="gap-2 rounded-lg"
        >
          <RefreshCw
            className={cn("size-3.5", isAnyLoading && "animate-spin")}
          />
          Refresh
        </Button>
      </div>

      {/* ── KPI stat cards ───────────────────────────────────────────── */}
      <StatsCards
        total={stats.data?.total ?? 0}
        completed={stats.data?.completed ?? 0}
        avgRiskScore={avgRisk}
        passRate={passRate}
        failed={stats.data?.failed ?? 0}
        isLoading={stats.isLoading}
      />

      {/* ── Review trend (full width) ─────────────────────────────────── */}
      <ReviewChart data={trend.data ?? []} isLoading={trend.isLoading} />

      {/* ── Risk distribution + Top issues (side-by-side) ─────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RiskDistribution
          data={riskDist.data ?? []}
          isLoading={riskDist.isLoading}
        />
        <TopIssues
          data={topIssues.data ?? []}
          isLoading={topIssues.isLoading}
        />
      </div>

      {/* ── Activity heatmap (full width) ─────────────────────────────── */}
      <ActivityHeatmap data={heatmap.data ?? []} isLoading={heatmap.isLoading} />

      {/* ── Leaderboard + health summary sidebar ─────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Leaderboard spans 2/3 */}
        <div className="lg:col-span-2">
          <RepoLeaderboard
            data={leaderboard.data ?? []}
            isLoading={leaderboard.isLoading}
          />
        </div>

        {/* Health summary stacked in 1/3 */}
        <div className="flex flex-col gap-5">
          {/* Overall health card */}
          <div className="rounded-xl border border-border/60 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 p-5 dark:from-blue-950/20 dark:to-indigo-950/20">
            <p className="text-sm font-semibold">Overall Health</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Based on {stats.data?.completed ?? 0} completed reviews
            </p>

            <div className="mt-4 space-y-4">
              {/* Pass rate bar */}
              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Pass rate</span>
                  <span
                    className={cn(
                      "font-semibold tabular-nums",
                      passRate >= 70
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-yellow-600 dark:text-yellow-400",
                    )}
                  >
                    {passRate}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/60 dark:bg-black/20">
                  <div
                    className={cn(
                      "h-2 rounded-full transition-all duration-700",
                      passRate >= 70 ? "bg-emerald-500" : "bg-yellow-500",
                    )}
                    style={{ width: `${passRate}%` }}
                  />
                </div>
              </div>

              {/* Avg risk bar */}
              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Avg risk score</span>
                  <span
                    className={cn(
                      "font-semibold tabular-nums",
                      avgRisk > 60
                        ? "text-red-600 dark:text-red-400"
                        : avgRisk > 30
                          ? "text-yellow-600 dark:text-yellow-400"
                          : "text-emerald-600 dark:text-emerald-400",
                    )}
                  >
                    {avgRisk}/100
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/60 dark:bg-black/20">
                  <div
                    className="h-2 rounded-full transition-all duration-700"
                    style={{
                      width: `${avgRisk}%`,
                      backgroundColor:
                        avgRisk > 60
                          ? "hsl(0 72.2% 50.6%)"
                          : avgRisk > 30
                            ? "hsl(37.7 92.1% 50.2%)"
                            : "hsl(142.1 76.2% 36.3%)",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Review status breakdown card */}
          <div className="rounded-xl border border-border/60 bg-gradient-to-br from-violet-50/80 to-purple-50/80 p-5 dark:from-violet-950/20 dark:to-purple-950/20">
            <p className="text-sm font-semibold">Review Status</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Breakdown of all {stats.data?.total ?? 0} reviews
            </p>

            <div className="mt-4 space-y-2.5">
              {[
                {
                  label: "Completed",
                  value: stats.data?.completed ?? 0,
                  color: "bg-emerald-500",
                },
                {
                  label: "Pending",
                  value: stats.data?.pending ?? 0,
                  color: "bg-yellow-400",
                },
                {
                  label: "Processing",
                  value: stats.data?.processing ?? 0,
                  color: "bg-blue-500",
                },
                {
                  label: "Failed",
                  value: stats.data?.failed ?? 0,
                  color: "bg-red-500",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "size-2 shrink-0 rounded-full",
                        item.color,
                      )}
                    />
                    <span className="text-xs text-muted-foreground">
                      {item.label}
                    </span>
                  </div>
                  <span className="text-xs font-bold tabular-nums">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
