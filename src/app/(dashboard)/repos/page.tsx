"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
  GitPullRequest,
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
            <span className="flex items-center gap-0.5 text-[10px] text-amber-500">
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

function ConnectedRepoCard({
  repo,
  onDisconnect,
  isDisconnecting,
}: {
  repo: { id: string; name: string; fullName: string; private: boolean };
  onDisconnect: () => void;
  isDisconnecting: boolean;
}) {
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
                This will remove <strong>{repo.fullName}</strong> and all its
                review data. This action cannot be undone.
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

      <div className="mt-4 flex items-center gap-2">
        {repo.private ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-500 ring-1 ring-amber-500/20">
            <Lock className="h-2.5 w-2.5" />
            Private
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-500 ring-1 ring-emerald-500/20">
            <Globe className="h-2.5 w-2.5" />
            Public
          </span>
        )}
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
    onSuccess: () => {
      reposQuery.refetch();
      githubQuery.refetch();
      setSelected(new Set());
      setShowImport(false);
      toast.success("Repositories connected successfully");
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
            <div className="mt-6 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5">
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
            </div>
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
