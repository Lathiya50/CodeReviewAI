import { db } from "@/server/db";
import type { ReviewComment } from "@/server/services/ai/types";

export interface GitHubPullRequestFile {
  sha: string;
  filename: string;
  status:
    | "added"
    | "removed"
    | "modified"
    | "renamed"
    | "copied"
    | "changed"
    | "unchanged";
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
  previous_filename?: string;
}

export interface GitHubUser {
  login: string;
  avatar_url: string;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  state: "open" | "closed";
  html_url: string;
  user: GitHubUser;
  created_at: string;
  updated_at: string;
  merged_at: string | null;
  draft: boolean;
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
  };
  additions: number;
  deletions: number;
  changed_files: number;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  updated_at: string;
}

export async function getGitHubAccessToken(
  userId: string,
): Promise<string | null> {
  const account = await db.account.findFirst({
    where: {
      userId,
      providerId: "github",
    },
    select: {
      accessToken: true,
    },
  });

  return account?.accessToken ?? null;
}

export async function getAuthenticatedGitHubLogin(
  accessToken: string,
): Promise<string | null> {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
    },
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { login: string };
  return data.login ?? null;
}

export async function fetchGitHubRepos(
  accessToken: string,
): Promise<GitHubRepo[]> {
  const repos: GitHubRepo[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const response = await fetch(
      `https://api.github.com/user/repos?per_page=${perPage}&page=${page}&sort=updated`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch GitHub repos: ${response.status}`);
    }

    const data = (await response.json()) as GitHubRepo[];
    repos.push(...data);
    if (data.length < perPage) break;
    page++;
  }

  return repos;
}

export async function fetchPullRequests(
  accessToken: string,
  owner: string,
  repo: string,
  state: "open" | "closed" | "all" = "open",
): Promise<GitHubPullRequest[]> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls?state=${state}&per_page=30&sort=updated&direction=desc`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const pulls = (await response.json()) as GitHubPullRequest[];

  // The list endpoint doesn't include additions/deletions/changed_files,
  // so we fetch each PR individually to get those stats.
  const detailed = await Promise.all(
    pulls.map((pr) => fetchPullRequest(accessToken, owner, repo, pr.number)),
  );

  return detailed;
}

export async function fetchPullRequest(
  accessToken: string,
  owner: string,
  repo: string,
  prNumber: number,
): Promise<GitHubPullRequest> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  return (await response.json()) as GitHubPullRequest;
}

export async function fetchPullRequestFiles(
  accessToken: string,
  owner: string,
  repo: string,
  prNumber: number,
): Promise<GitHubPullRequestFile[]> {
  const files: GitHubPullRequestFile[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/files?per_page=${perPage}&page=${page}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = (await response.json()) as GitHubPullRequestFile[];
    files.push(...data);

    if (data.length < perPage) break;
    page++;
  }

  return files;
}

// ─── Repository Webhooks ──────────────────────────────────────────────────────

interface GitHubHook {
  id: number;
  config?: { url?: string };
}

const WEBHOOK_EVENTS = ["pull_request"] as const;

/**
 * Finds an existing repository webhook whose delivery URL matches `url`.
 * Returns the hook id, or null if none is found / the lookup fails.
 */
async function findRepoWebhook(
  accessToken: string,
  owner: string,
  repo: string,
  url: string,
): Promise<bigint | null> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/hooks?per_page=100`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    },
  );

  if (!response.ok) return null;

  const hooks = (await response.json()) as GitHubHook[];
  const match = hooks.find((hook) => hook.config?.url === url);
  return match ? BigInt(match.id) : null;
}

type WebhookConfig = {
  url: string;
  content_type: "json";
  secret: string;
  insecure_ssl: "0";
};

/** Maps a failed GitHub hooks API response to a descriptive Error. */
function webhookError(status: number, body: string): Error {
  // GitHub returns 404 (not 403) for hook endpoints when the token lacks the
  // `admin:repo_hook` scope or the user is not a repo admin.
  if (status === 403 || status === 404) {
    return new Error(
      "Insufficient permissions to manage webhooks. The connected GitHub account must be an admin of this repository, and you may need to reconnect GitHub to grant the `admin:repo_hook` scope.",
    );
  }
  if (status === 401) {
    return new Error(
      "GitHub authorization expired. Please reconnect your GitHub account.",
    );
  }
  return new Error(`Failed to register webhook (${status}): ${body}`);
}

/** PATCHes an existing hook so its delivery URL, events, and secret match ours. */
async function patchRepoWebhook(
  accessToken: string,
  owner: string,
  repo: string,
  hookId: bigint,
  config: WebhookConfig,
): Promise<Response> {
  return fetch(
    `https://api.github.com/repos/${owner}/${repo}/hooks/${hookId.toString()}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ active: true, events: WEBHOOK_EVENTS, config }),
    },
  );
}

/**
 * Ensures a `pull_request` webhook exists on the repo, pointing at our endpoint
 * with a per-repo HMAC secret. The operation is idempotent and self-healing:
 *
 *  1. If `existingHookId` is known, PATCH it — this re-points a hook whose URL
 *     drifted (e.g. a rotated dev tunnel) and re-syncs the secret. A 404 means
 *     it was deleted on GitHub, so we fall through and create a fresh one.
 *  2. Otherwise POST a new hook.
 *  3. On 422 (a hook for this URL already exists), locate it and PATCH so the
 *     stored secret matches — keeping signature verification consistent.
 *
 * Returns the GitHub hook id. Throws a descriptive error on permission/auth
 * failures so callers can surface it.
 */
export async function registerRepoWebhook(
  accessToken: string,
  owner: string,
  repo: string,
  options: { url: string; secret: string; existingHookId?: bigint | null },
): Promise<bigint> {
  const config: WebhookConfig = {
    url: options.url,
    content_type: "json",
    secret: options.secret,
    insecure_ssl: "0",
  };

  // 1. Re-sync a hook we already track. 404 => it's gone, fall through to create.
  if (options.existingHookId != null) {
    const patched = await patchRepoWebhook(
      accessToken,
      owner,
      repo,
      options.existingHookId,
      config,
    );
    if (patched.ok) return options.existingHookId;
    if (patched.status !== 404) {
      throw webhookError(patched.status, await patched.text());
    }
  }

  // 2. Create a new hook.
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/hooks`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "web",
        active: true,
        events: WEBHOOK_EVENTS,
        config,
      }),
    },
  );

  if (response.ok) {
    const data = (await response.json()) as { id: number };
    return BigInt(data.id);
  }

  const errorBody = await response.text();

  // 3. 422: a hook for this URL already exists. Reuse it and PATCH the secret.
  if (response.status === 422) {
    const existingId = await findRepoWebhook(accessToken, owner, repo, options.url);
    if (existingId !== null) {
      const patched = await patchRepoWebhook(
        accessToken,
        owner,
        repo,
        existingId,
        config,
      );
      if (patched.ok) return existingId;
      throw webhookError(patched.status, await patched.text());
    }
  }

  throw webhookError(response.status, errorBody);
}

/**
 * Deletes a repository webhook. A 404 (already gone) is treated as success.
 */
export async function deleteRepoWebhook(
  accessToken: string,
  owner: string,
  repo: string,
  hookId: bigint,
): Promise<void> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/hooks/${hookId.toString()}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    },
  );

  if (!response.ok && response.status !== 404) {
    const errorBody = await response.text();
    throw new Error(`Failed to delete webhook (${response.status}): ${errorBody}`);
  }
}

// ─── Inline PR Comments ───────────────────────────────────────────────────────

export interface GitHubReviewComment {
  path: string;
  body: string;
  line: number;
  side: "RIGHT";
}

interface GitHubCreateReviewResponse {
  id: number;
  html_url: string;
}


function parseDiffLines(patch: string): Set<number> {
  const validLines = new Set<number>();
  if (!patch) return validLines;

  const lines = patch.split("\n");
  let currentLine = 0;

  for (const line of lines) {
    const hunkMatch = line.match(/^@@\s+-\d+(?:,\d+)?\s+\+(\d+)(?:,\d+)?\s+@@/);
    if (hunkMatch) {
      currentLine = parseInt(hunkMatch[1], 10);
      continue;
    }

    if (line.startsWith("-")) {
      continue;
    }

    if (line.startsWith("+") || !line.startsWith("\\")) {
      validLines.add(currentLine);
      currentLine++;
    }
  }

  return validLines;
}

function mapCommentsToGitHub(
  comments: ReviewComment[],
  files: GitHubPullRequestFile[],
): { mapped: GitHubReviewComment[]; skippedCount: number } {
  const filePatches = new Map<string, Set<number>>();
  for (const file of files) {
    if (file.patch) {
      filePatches.set(file.filename, parseDiffLines(file.patch));
    }
  }

  const mapped: GitHubReviewComment[] = [];
  let skippedCount = 0;

  for (const comment of comments) {
    const validLines = filePatches.get(comment.file);

    if (!validLines || !validLines.has(comment.line)) {
      skippedCount++;
      continue;
    }

    const severityEmoji: Record<string, string> = {
      critical: "🔴",
      high: "🟠",
      medium: "🟡",
      low: "⚪",
    };

    const emoji = severityEmoji[comment.severity] ?? "⚪";
    let body = `${emoji} **${comment.severity.toUpperCase()}** — _${comment.category ?? "general"}_\n\n${comment.message}`;

    if (comment.suggestion) {
      body += `\n\n💡 **Suggestion:** ${comment.suggestion}`;
    }

    mapped.push({
      path: comment.file,
      body,
      line: comment.line,
      side: "RIGHT",
    });
  }

  return { mapped, skippedCount };
}

export async function createGitHubPRReview(
  accessToken: string,
  owner: string,
  repo: string,
  prNumber: number,
  comments: ReviewComment[],
  files: GitHubPullRequestFile[],
  event: "COMMENT" | "REQUEST_CHANGES",
  summary: string,
): Promise<{ githubReviewId: bigint; postedCount: number; skippedCount: number }> {
  const { mapped, skippedCount } = mapCommentsToGitHub(comments, files);

  if (mapped.length === 0) {
    throw new Error(
      "No comments could be mapped to valid diff lines. All comments were outside the diff range.",
    );
  }

  const body = `## 🤖 CodeReviewAI\n\n${summary}\n\n---\n_${mapped.length} inline comment(s) posted${skippedCount > 0 ? `, ${skippedCount} skipped (outside diff range)` : ""}_`;

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/reviews`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        body,
        event,
        comments: mapped,
      }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    if (response.status === 422) {
      // GitHub does not allow REQUEST_CHANGES on the author's own PR — retry as COMMENT
      if (
        event === "REQUEST_CHANGES" &&
        errorBody.includes("Can not request changes on your own pull request")
      ) {
        return createGitHubPRReview(
          accessToken,
          owner,
          repo,
          prNumber,
          comments,
          files,
          "COMMENT",
          summary,
        );
      }
      throw new Error(
        `GitHub rejected the review. Some comments may reference invalid line numbers. Details: ${errorBody}`,
      );
    }
    if (response.status === 403) {
      throw new Error(
        "Insufficient permissions. Ensure your GitHub account has write access to this repository.",
      );
    }
    throw new Error(`GitHub API error ${response.status}: ${errorBody}`);
  }

  const data = (await response.json()) as GitHubCreateReviewResponse;

  return {
    githubReviewId: BigInt(data.id),
    postedCount: mapped.length,
    skippedCount,
  };
}
