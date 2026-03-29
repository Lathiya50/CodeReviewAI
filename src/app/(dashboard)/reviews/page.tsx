"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { AnimatedPage } from "@/components/ui/animated-page";
import { AnimatedList, AnimatedListItem } from "@/components/ui/animated-list";
import { AnimatedTabs } from "@/components/ui/animated-tabs";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusDot } from "@/components/ui/status-dot";
import { ReviewCardSkeleton } from "@/components/shimmer-skeleton";
import {
  CheckCircle,
  Loader2,
  Clock,
  XCircle,
  Ban,
  RotateCcw,
  MessageSquare,
  GitPullRequest,
} from "lucide-react";

type ReviewStatus = "all" | "COMPLETED" | "PROCESSING" | "PENDING" | "FAILED" | "CANCELLED";

function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

function getRiskConfig(score: number) {
  if (score <= 30) return { label: "Low", className: "bg-emerald-500/10 text-emerald-500 ring-emerald-500/20" };
  if (score <= 60) return { label: "Medium", className: "bg-amber-500/10 text-amber-500 ring-amber-500/20" };
  return { label: "High", className: "bg-red-500/10 text-red-500 ring-red-500/20" };
}

function getStatusConfig(status: string): { icon: React.ReactNode; dot: "success" | "processing" | "warning" | "error" | "info"; label: string } {
  const configs: Record<string, { icon: React.ReactNode; dot: "success" | "processing" | "warning" | "error" | "info"; label: string }> = {
    COMPLETED: { icon: <CheckCircle className="h-4 w-4 text-emerald-500" />, dot: "success", label: "Completed" },
    PROCESSING: { icon: <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />, dot: "processing", label: "Processing" },
    PENDING: { icon: <Clock className="h-4 w-4 text-amber-500" />, dot: "warning", label: "Pending" },
    FAILED: { icon: <XCircle className="h-4 w-4 text-red-500" />, dot: "error", label: "Failed" },
    CANCELLED: { icon: <Ban className="h-4 w-4 text-muted-foreground" />, dot: "info", label: "Cancelled" },
  };
  return configs[status] || configs.PENDING;
}

function ReviewCard({
  review,
  onRetry,
  isRetrying,
}: {
  review: {
    id: string;
    status: string;
    riskScore: number | null;
    summary: string | null;
    comments: unknown;
    createdAt: string | Date;
    repositoryId: string;
    prNumber: number;
    prTitle: string;
    prUrl: string;
    repository: { id: string; name: string; fullName: string };
  };
  onRetry: () => void;
  isRetrying: boolean;
}) {
  const config = getStatusConfig(review.status);
  const commentCount = Array.isArray(review.comments) ? review.comments.length : 0;

  return (
    <motion.div whileHover={{ x: 2 }} transition={{ duration: 0.15 }}>
      <Link
        href={`/repos/${review.repository.id}/pr/${review.prNumber}`}
        className="group flex items-start gap-4 rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm px-4 py-4 hover:border-border/70 hover:bg-card/80 transition-all"
      >
        <div className="mt-0.5 shrink-0">{config.icon}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">
              {review.prTitle}
            </span>
            <span className="text-xs text-muted-foreground shrink-0">
              #{review.prNumber}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{review.repository.name}</span>
            <span>{formatRelativeTime(review.createdAt)}</span>
            {commentCount > 0 && (
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {commentCount}
              </span>
            )}
          </div>

          {review.summary && review.status === "COMPLETED" && (
            <p className="mt-2 text-xs text-muted-foreground line-clamp-1">
              {review.summary}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {review.riskScore !== null && review.status === "COMPLETED" && (
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${getRiskConfig(review.riskScore).className}`}>
              {review.riskScore}
            </span>
          )}

          {review.status === "FAILED" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 hover:bg-amber-500/10 hover:text-amber-500"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRetry();
              }}
              disabled={isRetrying}
            >
              {isRetrying ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RotateCcw className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

export default function ReviewsPage() {
  const [statusFilter, setStatusFilter] = useState<ReviewStatus>("all");

  const reviewsQuery = trpc.review.list.useQuery(
    { limit: 50 },
    {
      refetchInterval: (query) => {
        const data = query.state.data;
        if (!data) return false;
        const hasActive = data.some(
          (r) => r.status === "PENDING" || r.status === "PROCESSING"
        );
        return hasActive ? 3000 : false;
      },
    }
  );

  const retryMutation = trpc.review.trigger.useMutation({
    onSuccess: () => {
      reviewsQuery.refetch();
      toast.success("Review retry started");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const filteredReviews = useMemo(() => {
    if (!reviewsQuery.data) return [];
    if (statusFilter === "all") return reviewsQuery.data;
    return reviewsQuery.data.filter((r) => r.status === statusFilter);
  }, [reviewsQuery.data, statusFilter]);

  const statusCounts = useMemo(() => {
    if (!reviewsQuery.data) return {};
    const counts: Record<string, number> = {};
    reviewsQuery.data.forEach((r) => {
      counts[r.status] = (counts[r.status] || 0) + 1;
    });
    return counts;
  }, [reviewsQuery.data]);

  const tabs = [
    { id: "all" as const, label: "All", count: reviewsQuery.data?.length },
    { id: "COMPLETED" as const, label: "Completed", icon: <CheckCircle className="h-3 w-3" />, count: statusCounts.COMPLETED },
    { id: "PROCESSING" as const, label: "Processing", icon: <Loader2 className="h-3 w-3" />, count: statusCounts.PROCESSING },
    { id: "PENDING" as const, label: "Pending", icon: <Clock className="h-3 w-3" />, count: statusCounts.PENDING },
    { id: "FAILED" as const, label: "Failed", icon: <XCircle className="h-3 w-3" />, count: statusCounts.FAILED },
    { id: "CANCELLED" as const, label: "Cancelled", icon: <Ban className="h-3 w-3" />, count: statusCounts.CANCELLED },
  ];

  const hasActivePoll = reviewsQuery.data?.some(
    (r) => r.status === "PENDING" || r.status === "PROCESSING"
  );

  return (
    <AnimatedPage>
      <PageHeader
        title="Reviews"
        description="All AI code reviews across your repositories."
        actions={
          hasActivePoll ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <StatusDot status="processing" />
              Live updating
            </div>
          ) : undefined
        }
      />

      <div className="mt-6 overflow-x-auto pb-1">
        <AnimatedTabs
          tabs={tabs}
          activeTab={statusFilter}
          onTabChange={(id) => setStatusFilter(id as ReviewStatus)}
          layoutId="review-status-tabs"
        />
      </div>

      <div className="mt-4">
        {reviewsQuery.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <ReviewCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredReviews.length === 0 ? (
          <EmptyState
            icon={GitPullRequest}
            title="No reviews found"
            description={
              statusFilter === "all"
                ? "Start by connecting a repository and triggering a review on a pull request."
                : `No ${statusFilter.toLowerCase()} reviews at the moment.`
            }
          />
        ) : (
          <AnimatedList className="space-y-2">
            {filteredReviews.map((review) => (
              <AnimatedListItem key={review.id}>
                <ReviewCard
                  review={review}
                  onRetry={() =>
                    retryMutation.mutate({
                      repositoryId: review.repositoryId,
                      prNumber: review.prNumber,
                    })
                  }
                  isRetrying={retryMutation.isPending}
                />
              </AnimatedListItem>
            ))}
          </AnimatedList>
        )}
      </div>
    </AnimatedPage>
  );
}
