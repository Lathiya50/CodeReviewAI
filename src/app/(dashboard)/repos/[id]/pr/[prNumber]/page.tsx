"use client";

import { use, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnimatedPage } from "@/components/ui/animated-page";
import { AnimatedTabs } from "@/components/ui/animated-tabs";
import { StatusDot } from "@/components/ui/status-dot";
import { ReviewResult } from "@/components/review-result";
import { DiffViewer } from "@/components/diff-viewer";
import { EmptyState } from "@/components/ui/empty-state";
import { PRHeaderSkeleton } from "@/components/shimmer-skeleton";
import {
  ArrowLeft,
  GitPullRequest,
  GitMerge,
  CircleDot,
  ExternalLink,
  GitBranch,
  Plus,
  Minus,
  FileCode,
  Wand2,
  XCircle,
  RotateCcw,
  ArrowRightLeft,
  Loader2
} from "lucide-react";

function PRStateBadge({ state, merged }: { state: string; merged: boolean }) {
  if (merged) {
    return (
      <Badge className="bg-purple-500/15 text-purple-500 border-purple-500/25 gap-1">
        <GitMerge className="h-3 w-3" />
        Merged
      </Badge>
    );
  }
  if (state === "open") {
    return (
      <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/25 gap-1">
        <CircleDot className="h-3 w-3" />
        Open
      </Badge>
    );
  }
  return (
    <Badge className="bg-red-500/15 text-red-500 border-red-500/25 gap-1">
      <GitPullRequest className="h-3 w-3" />
      Closed
    </Badge>
  );
}

function ReviewStatusIndicator({ status }: { status: string }) {
  const configs: Record<string, { dot: "success" | "processing" | "warning" | "error" | "info"; label: string }> = {
    COMPLETED: { dot: "success", label: "Review complete" },
    PROCESSING: { dot: "processing", label: "Processing review..." },
    PENDING: { dot: "warning", label: "Review pending..." },
    FAILED: { dot: "error", label: "Review failed" },
    CANCELLED: { dot: "info", label: "Review cancelled" },
  };
  const config = configs[status] || configs.PENDING;

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <StatusDot status={config.dot} />
      {config.label}
    </div>
  );
}

export default function PullRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string; prNumber: string }>;
}) {
  const { id, prNumber } = use(params);
  const prNumberInt = parseInt(prNumber, 10);
  const [activeTab, setActiveTab] = useState<"reviews" | "files">("reviews");

  const prQuery = trpc.pullRequest.get.useQuery({
    repositoryId: id,
    prNumber: prNumberInt,
  });

  const filesQuery = trpc.pullRequest.files.useQuery(
    { repositoryId: id, prNumber: prNumberInt },
    { enabled: activeTab === "files" }
  );

  const reviewQuery = trpc.review.getLatestForPR.useQuery(
    { repositoryId: id, prNumber: prNumberInt },
    {
      refetchInterval: (query) => {
        const status = query.state.data?.status;
        if (status === "PENDING" || status === "PROCESSING") return 2000;
        return false;
      },
    }
  );

  const triggerMutation = trpc.review.trigger.useMutation({
    onSuccess: () => {
      reviewQuery.refetch();
      toast.success("AI review started");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const cancelMutation = trpc.review.cancel.useMutation({
    onSuccess: () => {
      reviewQuery.refetch();
      toast.success("Review cancelled");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const pr = prQuery.data;
  const review = reviewQuery.data;
  const isActive = review?.status === "PENDING" || review?.status === "PROCESSING";
  const canTrigger = !isActive;
  const canCancel = isActive;

  const tabs = [
    { id: "reviews" as const, label: "Reviews", icon: <Wand2 className="h-3.5 w-3.5" /> },
    { id: "files" as const, label: "Changed Files", icon: <FileCode className="h-3.5 w-3.5" />, count: pr?.changedFiles },
  ];

  if (prQuery.isLoading) {
    return <PRHeaderSkeleton />;
  }

  if (!pr) {
    return (
      <EmptyState
        icon={GitPullRequest}
        title="Pull request not found"
        description="This pull request doesn't exist or couldn't be loaded."
        action={
          <Button asChild variant="outline" className="gap-2">
            <Link href={`/repos/${id}`}>
              <ArrowLeft className="h-4 w-4" />
              Back to Repository
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <AnimatedPage>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/repos" className="hover:text-foreground transition-colors">
          Repositories
        </Link>
        <span>/</span>
        <Link href={`/repos/${id}`} className="hover:text-foreground transition-colors">
          Repo
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">#{pr.number}</span>
      </div>

      {/* PR Header */}
      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <PRStateBadge state={pr.state} merged={pr.mergedAt !== null} />
              {review && <ReviewStatusIndicator status={review.status} />}
            </div>

            <h1 className="text-xl font-bold tracking-tight">
              {pr.title}
              <span className="text-muted-foreground font-normal ml-2">#{pr.number}</span>
            </h1>

            <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted-foreground">
              {pr.author?.login && (
                <span className="flex items-center gap-1.5">
                  {pr.author.avatarUrl && (
                    <img
                      src={pr.author.avatarUrl}
                      alt={pr.author.login}
                      className="h-5 w-5 rounded-full ring-1 ring-border/40"
                    />
                  )}
                  {pr.author.login}
                </span>
              )}
              <span className="flex items-center gap-1">
                <GitBranch className="h-3.5 w-3.5" />
                <code className="text-xs bg-muted/60 px-1.5 py-0.5 rounded">{pr.baseRef}</code>
                <span className="mx-0.5">←</span>
                <code className="text-xs bg-muted/60 px-1.5 py-0.5 rounded">{pr.headRef}</code>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" asChild className="gap-1.5">
              <a
                href={pr.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                GitHub
              </a>
            </Button>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-border/40">
          <div className="flex items-center gap-1.5 text-sm">
            <Plus className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-emerald-500 font-medium">{pr.additions}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <Minus className="h-3.5 w-3.5 text-red-500" />
            <span className="text-red-500 font-medium">{pr.deletions}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <FileCode className="h-3.5 w-3.5" />
            {pr.changedFiles} files
          </div>

          <div className="flex-1" />

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {review?.status === "COMPLETED" && (
              <Button variant="outline" size="sm" asChild className="gap-1.5">
                <Link href={`/repos/${id}/pr/${pr.number}/compare`}>
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                  Compare Reviews
                </Link>
              </Button>
            )}

            {canCancel && review && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-destructive hover:text-destructive"
                onClick={() => cancelMutation.mutate({ reviewId: review.id })}
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <XCircle className="h-3.5 w-3.5" />
                )}
                Cancel
              </Button>
            )}

            {canTrigger && (
              <Button
                size="sm"
                className="gap-1.5 glow-primary"
                onClick={() =>
                  triggerMutation.mutate({ repositoryId: id, prNumber: prNumberInt })
                }
                disabled={triggerMutation.isPending}
              >
                {triggerMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : review ? (
                  <RotateCcw className="h-3.5 w-3.5" />
                ) : (
                  <Wand2 className="h-3.5 w-3.5" />
                )}
                {review ? "Re-run Review" : "Run AI Review"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <AnimatedTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as "reviews" | "files")}
        layoutId="pr-detail-tabs"
      />

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === "reviews" ? (
          review ? (
            <ReviewResult
              review={review}
            />
          ) : (
            <EmptyState
              icon={Wand2}
              title="No reviews yet"
              description="Run an AI review to get instant feedback on this pull request."
              action={
                <Button
                  onClick={() =>
                    triggerMutation.mutate({ repositoryId: id, prNumber: prNumberInt })
                  }
                  disabled={triggerMutation.isPending}
                  className="gap-2 glow-primary"
                >
                  <Wand2 className="h-4 w-4" />
                  Run AI Review
                </Button>
              }
            />
          )
        ) : filesQuery.isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filesQuery.data ? (
          <DiffViewer files={filesQuery.data} />
        ) : null}
      </div>
    </AnimatedPage>
  );
}
