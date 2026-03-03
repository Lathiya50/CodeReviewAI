"use client";

import { use, useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  XCircle,
  BarChart3,
  TrendingDown,
  TrendingUp,
  Minus,
  ScanSearch,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  parseReviewComments,
  computeReviewComparison,
} from "@/lib/review-comparison";
import { ComparisonCommentCard } from "@/components/review-comparison-card";

type PageProps = {
  params: Promise<{ id: string; prNumber: string }>;
};

/**
 * Formats a date for display in review selector and headers.
 */
function formatReviewDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ReviewComparePage({ params }: PageProps) {
  const { id, prNumber } = use(params);
  const prNum = parseInt(prNumber, 10);

  const pr = trpc.pullRequest.get.useQuery(
    { repositoryId: id, prNumber: prNum },
    { enabled: !Number.isNaN(prNum) },
  );

  const reviewsQuery = trpc.review.listForPR.useQuery(
    { repositoryId: id, prNumber: prNum },
    { enabled: !Number.isNaN(prNum) },
  );

  const reviews = reviewsQuery.data ?? [];
  const [baselineId, setBaselineId] = useState<string | "">("");
  const [currentId, setCurrentId] = useState<string | "">("");

  // Default to oldest (baseline) and newest (current) when data loads
  useEffect(() => {
    if (reviews.length === 0) return;
    const newest = reviews[0];
    const oldest = reviews[reviews.length - 1];
    if (reviews.length === 1) {
      setBaselineId(newest.id);
      setCurrentId(newest.id);
    } else {
      setBaselineId((prev) =>
        !prev || !reviews.some((r) => r.id === prev) ? oldest.id : prev,
      );
      setCurrentId((prev) =>
        !prev || !reviews.some((r) => r.id === prev) ? newest.id : prev,
      );
    }
  }, [reviews]);

  const baseline = reviews.find((r) => r.id === baselineId);
  const current = reviews.find((r) => r.id === currentId);

  const comparison = useMemo(() => {
    if (!baseline || !current) return null;
    const baselineComments = parseReviewComments(baseline.comments);
    const currentComments = parseReviewComments(current.comments);
    return computeReviewComparison(baselineComments, currentComments);
  }, [baseline, current]);

  const riskDelta =
    baseline && current && baseline.riskScore != null && current.riskScore != null
      ? current.riskScore - baseline.riskScore
      : null;

  const isLoading = pr.isLoading || reviewsQuery.isLoading;
  const isInvalidPr = pr.error || !pr.data;
  const hasEnoughReviews = reviews.length >= 2;
  const sameSelection = baselineId && currentId && baselineId === currentId;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Skeleton className="size-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (isInvalidPr) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="py-16 px-6 text-center">
          <div className="mx-auto size-14 rounded-full bg-destructive/10 flex items-center justify-center">
            <XCircle className="size-7 text-destructive" />
          </div>
          <p className="mt-5 font-medium text-destructive">
            {pr.error?.message ?? "Pull request not found"}
          </p>
          <Link href={`/repos/${id}`} className="mt-6 inline-block">
            <Button variant="outline" size="sm" className="rounded-lg gap-2">
              <ArrowLeft className="size-4" />
              Back to repository
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <Link href={`/repos/${id}/pr/${prNumber}`}>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 size-10 rounded-xl"
              aria-label="Back to PR"
            >
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div className="min-w-0 pt-0.5">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                <BarChart3 className="size-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-semibold tracking-tight text-foreground">
                  Compare reviews
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5 truncate">
                  PR #{prNumber}
                  {pr.data?.title ? ` · ${pr.data.title}` : ""}
                </p>
              </div>
            </div>
          </div>
        </div>
        <Link href={`/repos/${id}/pr/${prNumber}`} className="shrink-0">
          <Button variant="outline" size="sm" className="gap-2 rounded-lg">
            View PR
            <ArrowRight className="size-4" />
          </Button>
        </Link>
      </header>

      {/* Review selectors */}
      <Card className="rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="px-6 pt-6 pb-4 sm:px-8 sm:pt-8 sm:pb-6">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ScanSearch className="size-4 text-muted-foreground" />
            Select two reviews to compare
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">
            Baseline = older run, Current = newer run. Fixed = in baseline but
            not in current; New = in current but not in baseline.
          </p>
        </CardHeader>
        <CardContent className="px-6 pb-6 sm:px-8 sm:pb-8 pt-0 space-y-6">
          {reviews.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 py-12 px-6 text-center">
              <p className="font-medium text-muted-foreground">
                No completed reviews yet
              </p>
              <p className="text-sm text-muted-foreground mt-1.5">
                Run at least two AI reviews on this PR to compare them.
              </p>
              <Link
                href={`/repos/${id}/pr/${prNumber}`}
                className="mt-5 inline-block"
              >
                <Button size="sm" className="rounded-lg">Go to PR</Button>
              </Link>
            </div>
          ) : reviews.length === 1 ? (
            <div className="rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 py-10 px-6 text-center">
              <p className="font-medium text-amber-700 dark:text-amber-400">
                Only one completed review
              </p>
              <p className="text-sm text-muted-foreground mt-1.5">
                Run another review on this PR to compare.
              </p>
              <Link
                href={`/repos/${id}/pr/${prNumber}`}
                className="mt-5 inline-block"
              >
                <Button variant="outline" size="sm" className="rounded-lg">
                  Go to PR
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="baseline"
                  className="text-sm font-medium text-foreground"
                >
                  Baseline (older)
                </Label>
                <select
                  id="baseline"
                  value={baselineId}
                  onChange={(e) => setBaselineId(e.target.value)}
                  className={cn(
                    "flex h-11 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm",
                    "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                  )}
                >
                  {reviews.map((r) => (
                    <option key={r.id} value={r.id}>
                      {formatReviewDate(r.createdAt)} · Risk {r.riskScore ?? "—"}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="current"
                  className="text-sm font-medium text-foreground"
                >
                  Current (newer)
                </Label>
                <select
                  id="current"
                  value={currentId}
                  onChange={(e) => setCurrentId(e.target.value)}
                  className={cn(
                    "flex h-11 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm",
                    "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                  )}
                >
                  {reviews.map((r) => (
                    <option key={r.id} value={r.id}>
                      {formatReviewDate(r.createdAt)} · Risk {r.riskScore ?? "—"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Same selection warning */}
      {hasEnoughReviews && sameSelection && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-800 dark:text-amber-200">
          Select two different reviews to see the comparison.
        </div>
      )}

      {/* Comparison summary and results */}
      {hasEnoughReviews && baseline && current && !sameSelection && comparison && (
        <>
          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="rounded-2xl border border-border/60 shadow-sm overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Risk score
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    Baseline → Current
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-2 flex-wrap">
                  <span className="text-2xl font-bold tabular-nums">
                    {baseline.riskScore ?? "—"}
                  </span>
                  <ArrowRight className="size-4 text-muted-foreground shrink-0" />
                  <span className="text-2xl font-bold tabular-nums">
                    {current.riskScore ?? "—"}
                  </span>
                  {riskDelta !== null && (
                    <span
                      className={cn(
                        "text-sm font-semibold tabular-nums",
                        riskDelta < 0 &&
                          "text-emerald-600 dark:text-emerald-400",
                        riskDelta > 0 && "text-amber-600 dark:text-amber-400",
                        riskDelta === 0 && "text-muted-foreground",
                      )}
                    >
                      {riskDelta > 0 ? "+" : ""}
                      {riskDelta}
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  {riskDelta != null && riskDelta < 0 && (
                    <>
                      <TrendingDown className="size-3.5" />
                      Improved
                    </>
                  )}
                  {riskDelta != null && riskDelta > 0 && (
                    <>
                      <TrendingUp className="size-3.5" />
                      Higher risk
                    </>
                  )}
                  {riskDelta != null && riskDelta === 0 && (
                    <>
                      <Minus className="size-3.5" />
                      No change
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <SummaryCard
              label="Fixed"
              count={comparison.fixed.count}
              description="In baseline, not in current"
              variant="success"
            />
            <SummaryCard
              label="New"
              count={comparison.new.count}
              description="In current, not in baseline"
              variant="warning"
            />
            <SummaryCard
              label="Unchanged"
              count={comparison.unchanged.count}
              description="In both reviews"
              variant="muted"
            />
          </div>

          {/* Comment sections */}
          <div className="space-y-8">
            {comparison.fixed.count > 0 && (
              <section className="space-y-4">
                <h2 className="text-base font-semibold flex items-center gap-2.5">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">
                    {comparison.fixed.count}
                  </span>
                  Fixed issues
                </h2>
                <div className="space-y-4">
                  {comparison.fixed.items.map((comment, i) => (
                    <ComparisonCommentCard
                      key={`fixed-${i}`}
                      comment={comment}
                      variant="fixed"
                      index={i}
                    />
                  ))}
                </div>
              </section>
            )}

            {comparison.new.count > 0 && (
              <section className="space-y-4">
                <h2 className="text-base font-semibold flex items-center gap-2.5">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold tabular-nums">
                    {comparison.new.count}
                  </span>
                  New issues
                </h2>
                <div className="space-y-4">
                  {comparison.new.items.map((comment, i) => (
                    <ComparisonCommentCard
                      key={`new-${i}`}
                      comment={comment}
                      variant="new"
                      index={i}
                    />
                  ))}
                </div>
              </section>
            )}

            {comparison.unchanged.count > 0 && (
              <section className="space-y-4">
                <h2 className="text-base font-semibold flex items-center gap-2.5">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground font-bold tabular-nums">
                    {comparison.unchanged.count}
                  </span>
                  Unchanged issues
                </h2>
                <div className="space-y-4">
                  {comparison.unchanged.items.map((comment, i) => (
                    <ComparisonCommentCard
                      key={`unchanged-${i}`}
                      comment={comment}
                      variant="unchanged"
                      index={i}
                    />
                  ))}
                </div>
              </section>
            )}

            {comparison.fixed.count === 0 &&
              comparison.new.count === 0 &&
              comparison.unchanged.count === 0 && (
                <Card className="rounded-2xl border border-border/60">
                  <CardContent className="py-14 text-center">
                    <p className="text-muted-foreground">
                      No comments in either review to compare.
                    </p>
                  </CardContent>
                </Card>
              )}
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  count,
  description,
  variant,
}: {
  label: string;
  count: number;
  description: string;
  variant: "success" | "warning" | "muted";
}) {
  const styles = {
    success:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    warning:
      "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    muted: "bg-muted/50 text-muted-foreground border-border/60",
  }[variant];

  return (
    <Card
      className={cn(
        "rounded-2xl border shadow-sm overflow-hidden",
        styles,
      )}
    >
      <CardContent className="p-6">
        <p className="text-sm font-medium opacity-90">{label}</p>
        <p className="text-2xl font-bold tabular-nums mt-1.5">{count}</p>
        <p className="text-xs opacity-80 mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}
