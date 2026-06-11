"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AnimatedPage } from "@/components/ui/animated-page";
import { AnimatedList, AnimatedListItem } from "@/components/ui/animated-list";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ConnectGithub } from "@/components/connect-github";
import { RepoCardSkeleton, ImportRepoSkeleton } from "@/components/shimmer-skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  FolderGit2,
  Plus,
  Search,
  X,
  ArrowRight,
  Trash2,
  Lock,
  Globe,
  Loader2,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  GitPullRequest,
  Webhook,
  RefreshCw,
} from "lucide-react";

interface GithubRepo {
  githubId: number;
  name: string;
  fullName: string;
  private: boolean;
  htmlUrl: string;
  description: string | null;
  language: string | null;
  stars: number;
  updatedAt: string;
}

function RepoSelectItem({
  repo,
  selected,
  onToggle,
}: {
  repo: GithubRepo;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.label
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/50 px-3 py-2.5 cursor-pointer hover:bg-card transition-all group"
    >
      <Checkbox
        checked={selected}
        onCheckedChange={onToggle}
        className="border-border/60 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate group-hover:text-foreground transition-colors">
          {repo.fullName}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {repo.language && (
            <span className="text-[10px] text-muted-foreground">{repo.language}</span>
          )}
          {repo.private ? (
            <span className="flex items-center gap-0.5 text-[10px] text-warning">
              <Lock className="h-2.5 w-2.5" />
              Private
            </span>
          ) : (
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <Globe className="h-2.5 w-2.5" />
              Public
            </span>
          )}
        </div>
      </div>
    </motion.label>
  );
}

type AutomationMode = "OFF" | "REVIEW_ONLY" | "COMMENT" | "REQUEST_CHANGES";

type ConnectedRepo = {
  id: string;
  name: string;
  fullName: string;
  private: boolean;
  webhookStatus: "NONE" | "ACTIVE" | "FAILED";
  automationMode: AutomationMode;
};

// Single, explicit choice per repo. The first two never write to GitHub.
const AUTOMATION_OPTIONS: {
  value: AutomationMode;
  label: string;
  description: string;
}[] = [
  {
    value: "OFF",
    label: "Off",
    description: "No auto-review on push.",
  },
  {
    value: "REVIEW_ONLY",
    label: "Review only",
    description: "Review in the dashboard — nothing posted to GitHub.",
  },
  {
    value: "COMMENT",
    label: "Comment on PR",
    description: "Review + non-blocking inline comments on the PR.",
  },
  {
    value: "REQUEST_CHANGES",
    label: "Request changes",
    description: "Review + a blocking “request changes” review.",
  },
];

function WebhookStatusBadge({ status }: { status: ConnectedRepo["webhookStatus"] }) {
  if (status === "ACTIVE") {
    return (
      <Badge variant="success" className="gap-1">
        <CheckCircle2 className="h-2.5 w-2.5" />
        Webhook active
      </Badge>
    );
  }
  if (status === "FAILED") {
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertCircle className="h-2.5 w-2.5" />
        Webhook failed
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="gap-1">
      <Webhook className="h-2.5 w-2.5" />
      Webhook not set
    </Badge>
  );
}

function ConnectedRepoCard({
  repo,
  onDisconnect,
  isDisconnecting,
}: {
  repo: ConnectedRepo;
  onDisconnect: () => void;
  isDisconnecting: boolean;
}) {
  const utils = trpc.useUtils();

  // Local mirror of automation state so the selection feels instant; the server
  // is the source of truth and a refetch reconciles after each mutation.
  const [mode, setMode] = useState<AutomationMode>(repo.automationMode);

  const setAutomation = trpc.repository.setAutomation.useMutation({
    onSuccess: () => utils.repository.list.invalidate(),
    onError: (error) => {
      toast.error(error.message);
      // Revert optimistic state to whatever the server last told us.
      setMode(repo.automationMode);
    },
  });

  const selectMode = (next: AutomationMode) => {
    if (next === mode) return;
    setMode(next);
    setAutomation.mutate({ id: repo.id, automationMode: next });
  };

  const reconnect = trpc.repository.reconnectWebhook.useMutation({
    onSuccess: () => {
      utils.repository.list.invalidate();
      toast.success("Webhook connected");
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="group relative rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm p-5 hover:border-border/80 hover:shadow-lg hover:shadow-primary/5 transition-all"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
            <FolderGit2 className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm truncate">{repo.name}</h3>
            <p className="text-xs text-muted-foreground truncate">{repo.fullName}</p>
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Disconnect repository?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove <strong>{repo.fullName}</strong>, its webhook on
                GitHub, and all its review data. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={onDisconnect}
                disabled={isDisconnecting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDisconnecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Disconnect"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {repo.private ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-warning/10 px-2 py-0.5 text-[10px] font-medium text-warning ring-1 ring-warning/20">
            <Lock className="h-2.5 w-2.5" />
            Private
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-md bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success ring-1 ring-success/20">
            <Globe className="h-2.5 w-2.5" />
            Public
          </span>
        )}
        <WebhookStatusBadge status={repo.webhookStatus} />
      </div>

      {/* Automation controls */}
      <div className="mt-4 space-y-3 rounded-lg border border-border/40 bg-background/40 p-3">
        {repo.webhookStatus !== "ACTIVE" && (
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-muted-foreground">
              {repo.webhookStatus === "FAILED"
                ? "Webhook setup failed. Reviews won't run on push."
                : "No webhook yet. Set one up to auto-review pushes."}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 text-xs shrink-0"
              onClick={() => reconnect.mutate({ id: repo.id })}
              disabled={reconnect.isPending}
            >
              {reconnect.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              {repo.webhookStatus === "FAILED" ? "Reconnect" : "Set up"}
            </Button>
          </div>
        )}

        <div
          role="radiogroup"
          aria-label="Automation mode"
          className="space-y-1.5"
        >
          <p className="text-[11px] font-medium text-muted-foreground">
            Automation
          </p>
          {AUTOMATION_OPTIONS.map((option) => {
            const active = mode === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={setAutomation.isPending}
                onClick={() => selectMode(option.value)}
                className={`flex w-full items-start gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-all disabled:opacity-60 ${
                  active
                    ? "border-primary/50 bg-primary/10"
                    : "border-border/40 bg-card/40 hover:border-border/70 hover:bg-card/70"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                    active ? "border-primary" : "border-border/70"
                  }`}
                >
                  {active && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </span>
                <span className="min-w-0">
                  <span
                    className={`block text-xs font-medium ${
                      active ? "text-foreground" : "text-foreground/90"
                    }`}
                  >
                    {option.label}
                  </span>
                  <span className="block text-[10px] leading-snug text-muted-foreground">
                    {option.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="w-full justify-between text-sm hover:bg-primary/5"
        >
          <Link href={`/repos/${repo.id}`}>
            <span className="flex items-center gap-1.5">
              <GitPullRequest className="h-3.5 w-3.5" />
              View Pull Requests
            </span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </motion.div>
  );
}

export default function ReposPage() {
  const [showImport, setShowImport] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");

  const reposQuery = trpc.repository.list.useQuery();
  const githubQuery = trpc.repository.fetchFromGithub.useQuery(undefined, {
    enabled: showImport,
  });
  const connectMutation = trpc.repository.connect.useMutation({
    onSuccess: (data) => {
      reposQuery.refetch();
      githubQuery.refetch();
      setSelected(new Set());
      setShowImport(false);
      const failed = data.results.filter((r) => r.webhookStatus === "FAILED");
      if (failed.length > 0) {
        toast.warning(
          `Connected, but webhook setup failed for ${failed.length} repo(s). Use "Reconnect" on the repo card.`,
        );
      } else {
        toast.success("Repositories connected successfully");
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  const disconnectMutation = trpc.repository.disconnect.useMutation({
    onSuccess: () => {
      reposQuery.refetch();
      toast.success("Repository disconnected");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const isGithubNotLinked =
    githubQuery.error?.data?.code === "PRECONDITION_FAILED";

  const connectedIds = useMemo(
    () => new Set(reposQuery.data?.map((r) => r.githubId) ?? []),
    [reposQuery.data]
  );

  const filteredRepos = useMemo(() => {
    if (!githubQuery.data) return [];
    return githubQuery.data
      .filter((r) => !connectedIds.has(r.githubId))
      .filter((r) =>
        r.fullName.toLowerCase().includes(search.toLowerCase())
      );
  }, [githubQuery.data, connectedIds, search]);

  const handleConnect = () => {
    if (selected.size === 0 || !githubQuery.data) return;
    const repos = githubQuery.data.filter((r) => selected.has(r.githubId));
    connectMutation.mutate({
      repos: repos.map((r) => ({
        githubId: r.githubId,
        name: r.name,
        fullName: r.fullName,
        private: r.private,
        htmlUrl: r.htmlUrl,
      })),
    });
  };

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filteredRepos.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredRepos.map((r) => r.githubId)));
    }
  };

  return (
    <AnimatedPage>
      <PageHeader
        title="Repositories"
        description="Connect your GitHub repositories to enable AI code reviews."
        actions={
          <Button
            onClick={() => setShowImport(!showImport)}
            className="gap-2"
            size="sm"
          >
            {showImport ? (
              <>
                <X className="h-3.5 w-3.5" />
                Close
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" />
                Add Repository
              </>
            )}
          </Button>
        }
      />

      {/* Import panel */}
      <AnimatePresence>
        {showImport && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <Card className="block mt-6 p-5">
              {isGithubNotLinked ? (
                <ConnectGithub />
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold">
                      Import from GitHub
                    </h3>
                    {filteredRepos.length > 0 && (
                      <button
                        onClick={toggleAll}
                        className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                      >
                        {selected.size === filteredRepos.length
                          ? "Clear all"
                          : "Select all"}
                      </button>
                    )}
                  </div>

                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search repositories..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 h-9 bg-background/50 border-border/50"
                    />
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                    {githubQuery.isLoading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <ImportRepoSkeleton key={i} />
                      ))
                    ) : filteredRepos.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">
                        {search
                          ? "No repositories match your search."
                          : "All repositories are connected."}
                      </p>
                    ) : (
                      filteredRepos.map((repo) => (
                        <RepoSelectItem
                          key={repo.githubId}
                          repo={repo}
                          selected={selected.has(repo.githubId)}
                          onToggle={() => toggleSelect(repo.githubId)}
                        />
                      ))
                    )}
                  </div>

                  {selected.size > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 flex items-center justify-between"
                    >
                      <span className="text-xs text-muted-foreground">
                        {selected.size} selected
                      </span>
                      <Button
                        size="sm"
                        onClick={handleConnect}
                        disabled={connectMutation.isPending}
                        className="gap-2"
                      >
                        {connectMutation.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle className="h-3.5 w-3.5" />
                        )}
                        Connect
                      </Button>
                    </motion.div>
                  )}
                </>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connected repos grid */}
      <div className="mt-8">
        {reposQuery.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <RepoCardSkeleton key={i} />
            ))}
          </div>
        ) : reposQuery.data?.length === 0 ? (
          <EmptyState
            icon={FolderGit2}
            title="No repositories connected"
            description="Connect your GitHub repositories to start getting AI-powered code reviews on your pull requests."
            action={
              <Button onClick={() => setShowImport(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Repository
              </Button>
            }
          />
        ) : (
          <AnimatedList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reposQuery.data?.map((repo) => (
              <AnimatedListItem key={repo.id}>
                <ConnectedRepoCard
                  repo={repo}
                  onDisconnect={() =>
                    disconnectMutation.mutate({ id: repo.id })
                  }
                  isDisconnecting={disconnectMutation.isPending}
                />
              </AnimatedListItem>
            ))}
          </AnimatedList>
        )}
      </div>
    </AnimatedPage>
  );
}
