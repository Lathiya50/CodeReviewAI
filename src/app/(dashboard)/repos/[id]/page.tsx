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
import { StatusDot } from "@/components/ui/status-dot";
import { RepoDetailSkeleton, PRListItemSkeleton } from "@/components/shimmer-skeleton";
import {
  ArrowLeft,
  ArrowRight,
  GitPullRequest,
  GitMerge,
  CircleDot,
  ExternalLink,
  GitBranch,
  FileDiff, FileCode, AlertTriangle
} from "lucide-react";

type PRState = "open" | "closed" | "all";

function ReviewStatusBadge({ status }: { status: string | null }) {
  if (!status) return null;

  const configs: Record<string, { dot: "success" | "processing" | "warning" | "error" | "info"; label: string; className: string }> = {
    COMPLETED: { dot: "success", label: "Reviewed", className: "bg-emerald-500/10 text-emerald-500 ring-emerald-500/20" },
    PROCESSING: { dot: "processing", label: "Processing", className: "bg-blue-500/10 text-blue-500 ring-blue-500/20" },
    PENDING: { dot: "warning", label: "Pending", className: "bg-amber-500/10 text-amber-500 ring-amber-500/20" },
    FAILED: { dot: "error", label: "Failed", className: "bg-red-500/10 text-red-500 ring-red-500/20" },
    CANCELLED: { dot: "info", label: "Cancelled", className: "bg-muted text-muted-foreground ring-border" },
  };

  const config = configs[status];
  if (!config) return null;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1 ${config.className}`}>
      <StatusDot status={config.dot} />
      {config.label}
    </span>
  );
}

function PRIcon({ state, mergedAt }: { state: string; mergedAt: string | null }) {
  if (mergedAt !== null) return <GitMerge className="h-4 w-4 text-purple-500" />;
  if (state === "open") return <CircleDot className="h-4 w-4 text-emerald-500" />;
  return <GitPullRequest className="h-4 w-4 text-red-500" />;
}

function PullRequestCard({
  pr,
  repoId,
}: {
  pr: {
    id: number;
    number: number;
    title: string;
    state: string;
    draft: boolean;
    htmlUrl: string;
    author: { login: string; avatarUrl: string };
    headRef: string;
    baseRef: string;
    additions: number;
    deletions: number;
    changedFiles: number;
    createdAt: string;
    updatedAt: string;
    mergedAt: string | null;
    review: { prNumber: number; status: string; createdAt: Date } | null;
  };
  repoId: string;
}) {
  return (
    <motion.div
      whileHover={{ x: 2 }}
      transition={{ duration: 0.15 }}
    >
      <Link
        href={`/repos/${repoId}/pr/${pr.number}`}
        className="group flex items-center gap-4 rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm px-4 py-3.5 hover:border-border/70 hover:bg-card/80 transition-all"
      >
        <PRIcon state={pr.state} mergedAt={pr.mergedAt} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">
              {pr.title}
            </span>
            <span className="text-xs text-muted-foreground shrink-0">#{pr.number}</span>
          </div>

          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              {pr.author.avatarUrl && (
                <img
                  src={pr.author.avatarUrl}
                  alt={pr.author.login}
                  className="h-4 w-4 rounded-full ring-1 ring-border/40"
                />
              )}
              {pr.author.login}
            </span>
            <span className="flex items-center gap-1">
              <GitBranch className="h-3 w-3" />
              {pr.headRef}
            </span>
            <span className="hidden sm:flex items-center gap-2">
              <span className="text-emerald-500">+{pr.additions}</span>
              <span className="text-red-500">-{pr.deletions}</span>
              <span className="flex items-center gap-0.5">
                <FileCode className="h-3 w-3" />
                {pr.changedFiles}
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <ReviewStatusBadge status={pr.review?.status ?? null} />
          <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </Link>
    </motion.div>
  );
}

export default function RepositoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [prState, setPrState] = useState<PRState>("open");

  const reposQuery = trpc.repository.list.useQuery();
  const repo = useMemo(
    () => reposQuery.data?.find((r) => r.id === id),
    [reposQuery.data, id]
  );

  const prsQuery = trpc.pullRequest.list.useQuery(
    { repositoryId: id, state: prState },
    { enabled: !!repo }
  );

  const tabs = [
    {
      id: "open" as const,
      label: "Open",
      icon: <CircleDot className="h-3.5 w-3.5" />,
      count: prsQuery.data?.filter((p) => p.state === "open" && p.mergedAt === null).length,
    },
    {
      id: "closed" as const,
      label: "Closed",
      icon: <GitPullRequest className="h-3.5 w-3.5" />,
      count: prsQuery.data?.filter((p) => p.state === "closed" || p.mergedAt !== null).length,
    },
    {
      id: "all" as const,
      label: "All",
      icon: <FileDiff className="h-3.5 w-3.5" />,
    },
  ];

  if (reposQuery.isLoading) {
    return <RepoDetailSkeleton />;
  }

  if (!repo) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Repository not found"
        description="The repository you're looking for doesn't exist or has been disconnected."
        action={
          <Button asChild variant="outline" className="gap-2">
            <Link href="/repos">
              <ArrowLeft className="h-4 w-4" />
              Back to Repositories
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
        <span className="text-foreground font-medium">{repo.name}</span>
      </div>

      {/* Repo header */}
      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
              <GitBranch className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">{repo.name}</h1>
              <p className="text-sm text-muted-foreground">{repo.fullName}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild className="gap-1.5">
            <a
              href={`https://github.com/${repo.fullName}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              GitHub
            </a>
          </Button>
        </div>
      </div>

      {/* Tabs + PR List */}
      <div className="flex items-center justify-between mb-4">
        <AnimatedTabs
          tabs={tabs}
          activeTab={prState}
          onTabChange={(id) => setPrState(id as PRState)}
          layoutId="pr-state-tabs"
        />
      </div>

      {prsQuery.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <PRListItemSkeleton key={i} />
          ))}
        </div>
      ) : prsQuery.data?.length === 0 ? (
        <EmptyState
          icon={GitPullRequest}
          title="No pull requests"
          description={`No ${prState === "all" ? "" : prState} pull requests found for this repository.`}
        />
      ) : (
        <AnimatedList className="space-y-2">
          {prsQuery.data?.map((pr) => (
            <AnimatedListItem key={pr.id}>
              <PullRequestCard pr={pr} repoId={id} />
            </AnimatedListItem>
          ))}
        </AnimatedList>
      )}
    </AnimatedPage>
  );
}
