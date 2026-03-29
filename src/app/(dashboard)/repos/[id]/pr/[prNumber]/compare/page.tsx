"use client";

import { use, useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { AnimatedPage } from "@/components/ui/animated-page";
import { AnimatedList, AnimatedListItem } from "@/components/ui/animated-list";
import { AnimatedTabs } from "@/components/ui/animated-tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { ComparisonCommentCard } from "@/components/review-comparison-card";
import { PRHeaderSkeleton } from "@/components/shimmer-skeleton";
import {
  parseReviewComments,
  computeReviewComparison,
} from "@/lib/review-comparison";
import {
  ArrowLeft,
  ArrowRightLeft,
  CheckCircle,
  AlertTriangle,
  Minus,
  TrendingDown,
  TrendingUp,
  GitPullRequest,
} from "lucide-react";

export default function ReviewComparePage({
  params,
}: {
  params: Promise<{ id: string; prNumber: string }>;
}) {
  const { id, prNumber } = use(params);
  const prNumberInt = parseInt(prNumber, 10);

  const [baselineId, setBaselineId] = useState<string>("");
  const [currentId, setCurrentId] = useState<string>("");
  const [filter, setFilter] = useState<"all" | "fixed" | "new" | "unchanged">("all");

  const prQuery = trpc.pullRequest.get.useQuery({
    repositoryId: id,
    prNumber: prNumberInt,
  });

  const reviewsQuery = trpc.review.listForPR.useQuery(
    { repositoryId: id, prNumber: prNumberInt },
  );

  const completedReviews = useMemo(
    () => reviewsQuery.data ?? [],
    [reviewsQuery.data]
  );

  // Auto-select: oldest as baseline, newest as current when nothing is explicitly chosen
  const effectiveBaselineId = baselineId || (completedReviews[completedReviews.length - 1]?.id ?? "");
  const effectiveCurrentId  = currentId  || (completedReviews[0]?.id ?? "");

  const comparison = useMemo(() => {
    if (!effectiveBaselineId || !effectiveCurrentId || effectiveBaselineId === effectiveCurrentId) return null;

    const baseline = completedReviews.find((r) => r.id === effectiveBaselineId);
    const current = completedReviews.find((r) => r.id === effectiveCurrentId);
    if (!baseline || !current) return null;

    const baseComments = parseReviewComments(baseline.comments);
    const currComments = parseReviewComments(current.comments);
    return {
      ...computeReviewComparison(baseComments, currComments),
      baselineScore: baseline.riskScore ?? 0,
      currentScore: current.riskScore ?? 0,
    };
  }, [effectiveBaselineId, effectiveCurrentId, completedReviews]);

  const scoreDelta = comparison
    ? comparison.currentScore - comparison.baselineScore
    : 0;

  const filteredItems = useMemo(() => {
    if (!comparison) return [];
    if (filter === "all") return [
      ...comparison.fixed.items.map((c) => ({ ...c, _variant: "fixed" as const })),
      ...comparison.new.items.map((c) => ({ ...c, _variant: "new" as const })),
      ...comparison.unchanged.items.map((c) => ({ ...c, _variant: "unchanged" as const })),
    ];
    if (filter === "fixed") return comparison.fixed.items.map((c) => ({ ...c, _variant: "fixed" as const }));
    if (filter === "new") return comparison.new.items.map((c) => ({ ...c, _variant: "new" as const }));
    return comparison.unchanged.items.map((c) => ({ ...c, _variant: "unchanged" as const }));
  }, [comparison, filter]);

  const pr = prQuery.data;

  if (prQuery.isLoading || reviewsQuery.isLoading) {
    return <PRHeaderSkeleton />;
  }

  if (!pr) {
    return (
      <EmptyState
        icon={GitPullRequest}
        title="Pull request not found"
        description="Could not load this pull request."
        action={
          <Button asChild variant="outline" className="gap-2">
            <Link href={`/repos/${id}`}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
        }
      />
    );
  }

  if (completedReviews.length < 2) {
    return (
      <AnimatedPage>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/repos" className="hover:text-foreground transition-colors">Repositories</Link>
          <span>/</span>
          <Link href={`/repos/${id}`} className="hover:text-foreground transition-colors">Repo</Link>
          <span>/</span>
          <Link href={`/repos/${id}/pr/${pr.number}`} className="hover:text-foreground transition-colors">#{pr.number}</Link>
          <span>/</span>
          <span className="text-foreground font-medium">Compare</span>
        </div>
        <EmptyState
          icon={ArrowRightLeft}
          title="Not enough reviews"
          description="You need at least two completed reviews to compare. Run another review to enable comparison."
          action={
            <Button asChild variant="outline" className="gap-2">
              <Link href={`/repos/${id}/pr/${pr.number}`}>
                <ArrowLeft className="h-4 w-4" />
                Back to PR
              </Link>
            </Button>
          }
        />
      </AnimatedPage>
    );
  }

  const tabs = [
    { id: "all" as const, label: "All", count: comparison ? comparison.fixed.count + comparison.new.count + comparison.unchanged.count : 0 },
    { id: "fixed" as const, label: "Fixed", icon: <CheckCircle className="h-3 w-3 text-emerald-500" />, count: comparison?.fixed.count },
    { id: "new" as const, label: "New", icon: <AlertTriangle className="h-3 w-3 text-amber-500" />, count: comparison?.new.count },
    { id: "unchanged" as const, label: "Unchanged", icon: <Minus className="h-3 w-3" />, count: comparison?.unchanged.count },
  ];

  return (
    <AnimatedPage>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/repos" className="hover:text-foreground transition-colors">Repositories</Link>
        <span>/</span>
        <Link href={`/repos/${id}`} className="hover:text-foreground transition-colors">Repo</Link>
        <span>/</span>
        <Link href={`/repos/${id}/pr/${pr.number}`} className="hover:text-foreground transition-colors">#{pr.number}</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Compare</span>
      </div>

      {/* Header */}
      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 mb-6">
        <h1 className="text-xl font-bold tracking-tight mb-4">
          Review Comparison
          <span className="text-muted-foreground font-normal ml-2">#{pr.number}</span>
        </h1>

        {/* Review selectors */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Baseline (older)
            </label>
            <select
              value={effectiveBaselineId}
              onChange={(e) => setBaselineId(e.target.value)}
              className="w-full rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Select review...</option>
              {completedReviews.map((r) => (
                <option key={r.id} value={r.id} disabled={r.id === effectiveCurrentId}>
                  {new Date(r.createdAt).toLocaleString()} — Risk: {r.riskScore ?? "N/A"}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Current (newer)
            </label>
            <select
              value={effectiveCurrentId}
              onChange={(e) => setCurrentId(e.target.value)}
              className="w-full rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Select review...</option>
              {completedReviews.map((r) => (
                <option key={r.id} value={r.id} disabled={r.id === effectiveBaselineId}>
                  {new Date(r.createdAt).toLocaleString()} — Risk: {r.riskScore ?? "N/A"}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {effectiveBaselineId === effectiveCurrentId && effectiveBaselineId && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-500 mb-6">
          Please select two different reviews to compare.
        </div>
      )}

      {comparison && (
        <>
          {/* Summary cards */}
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 text-center"
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                {scoreDelta < 0 ? (
                  <TrendingDown className="h-4 w-4 text-emerald-500" />
                ) : scoreDelta > 0 ? (
                  <TrendingUp className="h-4 w-4 text-red-500" />
                ) : (
                  <Minus className="h-4 w-4 text-muted-foreground" />
                )}
                <span className={`text-xl font-bold ${scoreDelta < 0 ? "text-emerald-500" : scoreDelta > 0 ? "text-red-500" : "text-muted-foreground"}`}>
                  {scoreDelta > 0 ? "+" : ""}{scoreDelta}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Risk Delta</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center"
            >
              <span className="text-xl font-bold text-emerald-500">{comparison.fixed.count}</span>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-1">Fixed</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-center"
            >
              <span className="text-xl font-bold text-amber-500">{comparison.new.count}</span>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-1">New Issues</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="rounded-xl border border-border/50 bg-card/50 p-4 text-center"
            >
              <span className="text-xl font-bold text-muted-foreground">{comparison.unchanged.count}</span>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-1">Unchanged</p>
            </motion.div>
          </div>

          {/* Filter tabs */}
          <AnimatedTabs
            tabs={tabs}
            activeTab={filter}
            onTabChange={(id) => setFilter(id as typeof filter)}
            layoutId="compare-filter-tabs"
          />

          {/* Comment List */}
          <div className="mt-4">
            {filteredItems.length === 0 ? (
              <EmptyState
                icon={CheckCircle}
                title="No items"
                description={`No ${filter} comments for this comparison.`}
              />
            ) : (
              <AnimatedList className="space-y-2">
                {filteredItems.map((item, i) => (
                  <AnimatedListItem key={`${item._variant}-${item.file}-${item.line}-${i}`}>
                    <ComparisonCommentCard
                      comment={item}
                      variant={item._variant}
                    />
                  </AnimatedListItem>
                ))}
              </AnimatedList>
            )}
          </div>
        </>
      )}
    </AnimatedPage>
  );
}
