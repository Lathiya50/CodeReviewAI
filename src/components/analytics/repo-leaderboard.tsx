"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderGit2, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface RepoData {
  repoName: string;
  fullName: string;
  total: number;
  completed: number;
  avgRiskScore: number;
}

interface RepoLeaderboardProps {
  data: RepoData[];
  isLoading?: boolean;
}

const MEDALS = ["🥇", "🥈", "🥉"];

/**
 * Returns a badge variant based on risk score.
 * @param score - numeric risk score (0–100)
 * @returns shadcn Badge variant
 */
function getRiskVariant(
  score: number,
): "default" | "secondary" | "destructive" | "outline" {
  if (score <= 30) return "default";
  if (score <= 60) return "secondary";
  return "destructive";
}

/**
 * Inline progress bar showing the completed/total ratio.
 * @param completed - completed review count
 * @param total - total review count
 */
function ProgressBar({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-1 rounded-full bg-emerald-500 transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/**
 * RepoLeaderboard — ranked list of repositories by total review volume.
 * @param data - array of repo stats sorted by total desc
 * @param isLoading - whether data is loading
 */
export function RepoLeaderboard({
  data,
  isLoading = false,
}: RepoLeaderboardProps) {
  if (isLoading) {
    return (
      <Card className="rounded-xl">
        <CardHeader className="px-6 pt-6 pb-4">
          <div className="space-y-2">
            <div className="h-4 w-36 animate-pulse rounded-md bg-muted" />
            <div className="h-3 w-48 animate-pulse rounded-md bg-muted" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3 px-6 pb-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
              <div className="size-7 animate-pulse rounded-full bg-muted" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-32 animate-pulse rounded-md bg-muted" />
                <div className="h-2.5 w-20 animate-pulse rounded-md bg-muted" />
              </div>
              <div className="h-6 w-14 animate-pulse rounded-md bg-muted" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="rounded-xl">
        <CardHeader className="px-6 pt-6 pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Trophy className="size-4 text-yellow-500" />
            Repo Leaderboard
          </CardTitle>
          <CardDescription className="text-sm">Most reviewed repositories</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[200px] items-center justify-center px-6 pb-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <FolderGit2 className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No repositories yet</p>
            <p className="text-xs text-muted-foreground/70">Connect repos and trigger reviews to populate this</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl">
      <CardHeader className="px-6 pt-6 pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Trophy className="size-4 text-yellow-500" />
          Repo Leaderboard
        </CardTitle>
        <CardDescription className="mt-0.5 text-sm">
          Top repositories by review volume
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6 pt-3">
        <div className="space-y-2.5">
          {data.map((repo, index) => {
            const rank = index + 1;
            return (
              <div
                key={repo.fullName}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors hover:bg-muted/40",
                  rank === 1 && "border-yellow-200/60 bg-yellow-50/30 dark:border-yellow-900/30 dark:bg-yellow-950/10",
                )}
              >
                {/* Medal / rank */}
                <span className="w-6 shrink-0 text-center text-base leading-none">
                  {rank <= 3 ? MEDALS[rank - 1] : (
                    <span className="text-xs font-bold text-muted-foreground">{rank}</span>
                  )}
                </span>

                {/* Repo info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <FolderGit2 className="size-3.5 shrink-0 text-muted-foreground" />
                    <p className="truncate text-sm font-semibold leading-snug">{repo.repoName}</p>
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                    {repo.fullName}
                  </p>
                  <ProgressBar completed={repo.completed} total={repo.total} />
                </div>

                {/* Stats */}
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <div className="text-right">
                    <span className="text-sm font-bold tabular-nums">{repo.total}</span>
                    <span className="ml-1 text-[11px] text-muted-foreground">reviews</span>
                  </div>
                  {repo.completed > 0 && (
                    <Badge
                      variant={getRiskVariant(repo.avgRiskScore)}
                      className="h-5 px-1.5 text-[10px] font-semibold"
                    >
                      risk {repo.avgRiskScore}
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
