"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { FolderGit2, Trophy } from "lucide-react";

interface RepoData {
  repoName: string;
  fullName: string;
  total: number;
  completed: number;
  avgRiskScore: number;
}

interface RepoLeaderboardProps {
  data: RepoData[] | undefined;
  isLoading: boolean;
}

function getRiskBadge(score: number | null) {
  if (score === null) return null;
  if (score <= 30)
    return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]">{score.toFixed(0)}</Badge>;
  if (score <= 60)
    return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px]">{score.toFixed(0)}</Badge>;
  return <Badge className="bg-red-500/10 text-red-500 border-red-500/20 text-[10px]">{score.toFixed(0)}</Badge>;
}

const MEDAL_ICONS = ["🥇", "🥈", "🥉"];

export function RepoLeaderboard({ data, isLoading }: RepoLeaderboardProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5">
        <div className="h-5 w-32 rounded bg-muted/40 animate-pulse mb-4" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-muted/20 animate-pulse mb-2" />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5">
      <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
        <Trophy className="h-4 w-4 text-primary" />
        Repository Leaderboard
      </h3>

      {!data || data.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
          No repository data available.
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-2"
        >
          {data.map((repo, i) => (
            <motion.div
              key={repo.repoName}
              variants={staggerItem}
              className="flex items-center gap-3 rounded-lg border border-border/30 bg-background/30 px-3 py-2.5 hover:bg-background/50 transition-colors"
            >
              <span className="w-6 text-center text-sm shrink-0">
                {i < 3 ? MEDAL_ICONS[i] : <span className="text-xs text-muted-foreground">{i + 1}</span>}
              </span>

              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
                <FolderGit2 className="h-3.5 w-3.5 text-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{repo.repoName}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex-1 max-w-[120px] h-1.5 rounded-full bg-muted/40 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{
                        width: `${repo.total > 0 ? (repo.completed / repo.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    {repo.completed}/{repo.total}
                  </span>
                </div>
              </div>

              <div className="shrink-0">{getRiskBadge(repo.avgRiskScore)}</div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
