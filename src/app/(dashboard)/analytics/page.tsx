"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { AnimatedPage } from "@/components/ui/animated-page";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { StatsCards } from "@/components/analytics/stats-cards";
import { ReviewChart } from "@/components/analytics/review-chart";
import { RiskDistribution } from "@/components/analytics/risk-distribution";
import { TopIssues } from "@/components/analytics/top-issues";
import { ActivityHeatmap } from "@/components/analytics/activity-heatmap";
import { RepoLeaderboard } from "@/components/analytics/repo-leaderboard";
import { RotateCcw, TrendingUp, Target, CheckCircle, XCircle } from "lucide-react";
import { StatusDot } from "@/components/ui/status-dot";

export default function AnalyticsPage() {
  const [trendRange, setTrendRange] = useState<"7d" | "30d" | "90d">("30d");

  const statsQuery = trpc.analytics.stats.useQuery();
  const trendQuery = trpc.analytics.reviewTrend.useQuery({ days: trendRange === "7d" ? 7 : trendRange === "30d" ? 30 : 90 });
  const riskQuery = trpc.analytics.riskDistribution.useQuery();
  const issuesQuery = trpc.analytics.topIssues.useQuery();
  const heatmapQuery = trpc.analytics.activityHeatmap.useQuery();
  const leaderboardQuery = trpc.analytics.repoLeaderboard.useQuery({ limit: 5 });

  const stats = statsQuery.data;

  const handleRefresh = () => {
    statsQuery.refetch();
    trendQuery.refetch();
    riskQuery.refetch();
    issuesQuery.refetch();
    heatmapQuery.refetch();
    leaderboardQuery.refetch();
  };

  return (
    <AnimatedPage>
      <PageHeader
        title="Analytics"
        description="Insights and metrics across all your code reviews."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        }
      />

      {/* KPI Stats */}
      <div className="mt-6">
        <StatsCards data={stats} isLoading={statsQuery.isLoading} />
      </div>

      {/* Review Trend */}
      <div className="mt-6">
        <ReviewChart
          data={trendQuery.data}
          isLoading={trendQuery.isLoading}
          range={trendRange}
          onRangeChange={setTrendRange}
        />
      </div>

      {/* Risk Distribution + Top Issues */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <RiskDistribution data={riskQuery.data} isLoading={riskQuery.isLoading} />
        <TopIssues data={issuesQuery.data} isLoading={issuesQuery.isLoading} />
      </div>

      {/* Activity Heatmap */}
      <div className="mt-6">
        <ActivityHeatmap data={heatmapQuery.data} isLoading={heatmapQuery.isLoading} />
      </div>

      {/* Leaderboard + Health Summary */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RepoLeaderboard data={leaderboardQuery.data} isLoading={leaderboardQuery.isLoading} />
        </div>

        <div className="space-y-6">
          {/* Overall Health */}
          <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Overall Health
            </h3>
            {stats ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">Pass Rate</span>
                    <span className="font-semibold">{stats.passRate.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-emerald-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${stats.passRate}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">Avg Risk Score</span>
                    <span className="font-semibold">{stats.avgRiskScore.toFixed(0)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${stats.avgRiskScore <= 30 ? "bg-emerald-500" : stats.avgRiskScore <= 60 ? "bg-amber-500" : "bg-red-500"}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${stats.avgRiskScore}%` }}
                      transition={{ duration: 1, delay: 0.7 }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="h-2 rounded-full bg-muted/40 animate-pulse" />
                <div className="h-2 rounded-full bg-muted/40 animate-pulse" />
              </div>
            )}
          </div>

          {/* Review Status Breakdown */}
          <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Review Status
            </h3>
            {stats ? (
              <div className="space-y-3">
                {[
                  { label: "Completed", value: stats.completed, dot: "success" as const, icon: CheckCircle },
                  { label: "Pending", value: stats.pending, dot: "warning" as const },
                  { label: "Processing", value: stats.processing, dot: "processing" as const },
                  { label: "Failed", value: stats.failed, dot: "error" as const, icon: XCircle },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <StatusDot status={item.dot} />
                      {item.label}
                    </span>
                    <span className="font-semibold tabular-nums">{item.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-5 rounded bg-muted/40 animate-pulse" />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
}
