# CodeReviewAI

> **Connect a GitHub repo once — every pull request is reviewed by AI automatically.**

CodeReviewAI is an AI-powered code review platform. It connects to your GitHub repositories, automatically registers a webhook, and reviews every pull request the moment it's opened or updated. Reviews include a plain-language summary, a 0–100 risk score, and severity-tagged inline comments (with concrete code fixes) that can be posted straight back to the PR — or kept in the dashboard for you to review first.

It also ships a full analytics dashboard: review trends, risk distribution, an activity heatmap, a repository leaderboard, and a breakdown of the most common issue categories across all your reviews.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [How It Works](#how-it-works)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Getting Started (Local Setup)](#getting-started-local-setup)
- [Local Webhooks (ngrok / tunnel)](#local-webhooks-ngrok--tunnel)
- [Available Scripts](#available-scripts)
- [Database Schema](#database-schema)
- [API Surface](#api-surface)
- [AI Providers](#ai-providers)
- [Project Structure](#project-structure)
- [Deployment (Vercel)](#deployment-vercel)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## Features

| | Feature | Description |
|---|---|---|
| 🤖 | **Automated AI reviews** | Pull requests are analyzed by an LLM that returns a summary, a risk score, and detailed inline comments. |
| ⚡ | **Auto-review on push** | Connect a repo once. Every PR opened — and every new commit pushed to an open PR — is reviewed automatically, zero manual steps. |
| 🪝 | **Automatic webhook setup** | Connecting a repo auto-registers a GitHub `pull_request` webhook with a unique per-repo HMAC secret. Disconnecting tears it down. Self-healing on reconnect. |
| 💬 | **Inline GitHub comments** | AI comments are posted directly onto the PR diff at the exact line, with severity emoji, category, and a suggested fix. |
| 🎛️ | **Per-repo automation controls** | Toggle auto-review and auto-post independently, and choose whether posts are a `COMMENT` or a `REQUEST_CHANGES` review. |
| 🎯 | **Risk scoring** | Each review gets a 0–100 risk score; the dashboard rolls these up into pass rates and distributions. |
| 🔍 | **Code comparison view** | Side-by-side old vs. suggested code for each finding, with diff highlighting. |
| 📊 | **Analytics dashboard** | Stats cards, review trend chart, risk distribution donut, top issue categories, 52-week activity heatmap, and a repo leaderboard. |
| 🔄 | **Reliable background jobs** | Reviews run asynchronously via Inngest with automatic retries, model fallback, and cancellation support. |
| 🔐 | **GitHub OAuth + email/password** | Sign in with GitHub (for repo access) or email/password. 7-day persistent sessions. |
| 🌙 | **Dark-first, responsive UI** | Built with Tailwind v4, Radix UI, and Framer Motion. Works across desktop and mobile. |

---

## Screenshot

![Add a screenshot of the app here](./docs/screenshot.png)

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org) (App Router, Turbopack) |
| **Language** | TypeScript 5 |
| **UI runtime** | React 19 |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com), [Radix UI](https://www.radix-ui.com) / ShadCN (New York), `tw-animate-css` |
| **Animation** | [Framer Motion v12](https://www.framer.com/motion/), [React Spring](https://www.react-spring.dev/) |
| **Auth** | [Better Auth v1](https://www.better-auth.com) — GitHub OAuth + email/password |
| **Database** | PostgreSQL + [Prisma ORM v6](https://www.prisma.io) |
| **API layer** | [tRPC v11](https://trpc.io) + [TanStack Query v5](https://tanstack.com/query) + superjson |
| **Background jobs** | [Inngest v3](https://www.inngest.com) |
| **AI** | [Groq](https://groq.com) (default) & [OpenAI](https://openai.com) / OpenAI-compatible endpoints, via a pluggable provider registry |
| **Validation** | [Zod v4](https://zod.dev) |
| **Charts / viz** | [Recharts](https://recharts.org), `react-calendar-heatmap`, `react-countup` |
| **Notifications** | [Sonner](https://sonner.emilkowal.ski) toasts |
| **Icons** | [Lucide](https://lucide.dev) |
| **Tooling** | pnpm, ESLint, Husky (pre-commit) |

---

## How It Works

```
                ┌─────────────┐     connect repo     ┌──────────────────┐
   You ───────► │  Dashboard  │ ───────────────────► │  GitHub REST API │
                └─────────────┘   register webhook    └──────────────────┘
                                  (per-repo secret)            │
                                                               │ PR opened / new commit
                                                               ▼
   ┌────────────────────────────────────────────────────────────────────┐
   │  POST /api/webhooks/github                                           │
   │   1. Verify HMAC signature (per-repo secret, w/ legacy fallback)     │
   │   2. Filter: only opened|synchronize|reopened, skip drafts & bots    │
   │   3. Create Review (PENDING)                                         │
   │   4. inngest.send("review/pr.requested")                            │
   └────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
   ┌────────────────────────────────────────────────────────────────────┐
   │  Inngest function  review-pr  (retries: 2, cancellable)             │
   │   • fetch PR details + changed files from GitHub                     │
   │   • reviewCode(): chunk large diffs, call AI (primary→fallback model)│
   │   • save summary + riskScore + comments → Review (COMPLETED)         │
   │   • if autoPost → post inline review to the PR (COMMENT / REQ_CHANGES)│
   └────────────────────────────────────────────────────────────────────┘
```

1. **Authenticate** — sign in with GitHub (grants `repo` + `admin:repo_hook` scopes) or email/password.
2. **Sync & connect** — the app lists your GitHub repos; connecting one upserts a `Repository` row and registers a `pull_request` webhook with a freshly generated per-repo HMAC secret. `webhookStatus` becomes `ACTIVE`.
3. **Push triggers a review** — GitHub delivers a `pull_request` event on **opened**, **synchronize** (new commits), or **reopened**. Draft PRs, ignored actions, and bot senders are skipped. The endpoint verifies the signature, creates a `Review`, and enqueues a `review/pr.requested` Inngest event.
4. **AI analysis** — the Inngest job fetches the diff, chunks large PRs to stay under token limits, and asks the AI provider for a structured JSON review (tries the primary model, falls back to a cheaper one, retries on 413/429/503).
5. **Results saved** — the review is stored with `status = COMPLETED`, a `summary`, a `riskScore` (0–100), and an array of `comments`.
6. **Auto-post (optional)** — when `autoPostEnabled` is on, comments are posted as an inline GitHub review. A posting failure is a *soft* error: the review still shows `COMPLETED`, with the reason recorded.
7. **Dashboard** — browse every review, drill into a PR, compare old vs. suggested code, and view aggregate analytics.

> A plain `git push` to a branch does **not** trigger a review. The change must arrive as a Pull Request — either a newly opened PR, or new commits on an already-open PR.

---

## Architecture

- **Server Components + tRPC** — pages are React Server Components; data access goes through type-safe tRPC routers (`src/server/api/routers`). Auth context is resolved per request via Better Auth.
- **Pluggable AI providers** — `src/server/services/ai` defines a `AiProvider` strategy interface, a registry, and per-provider configs. Adding a provider is: (1) add a config in `src/constant/ai.ts`, (2) implement the provider in `providers/`, (3) register it in `registry.ts`. Retry, chunking, prompt-building, and JSON validation live in the orchestrator (`review.ts`), not the providers.
- **Webhook automation is idempotent & self-healing** — `registerRepoWebhook` PATCHes an existing hook (re-pointing a drifted URL, re-syncing the secret), creates one if missing, and handles GitHub's 422 "hook already exists" by locating and patching it. So re-connecting always converges to a correct hook.
- **Background processing via Inngest** — the `review-pr` function is durable (each step is checkpointed), retries twice, and can be cancelled mid-flight via a `review/pr.cancelled` event keyed on `reviewId`.

---

## Prerequisites

- **Node.js 20+**
- **pnpm** (recommended) — `npm i -g pnpm`
- A **PostgreSQL** database (local, or hosted e.g. [Neon](https://neon.tech), Supabase, Railway)
- A **GitHub OAuth App** (Client ID + Secret)
- An AI API key — a **free [Groq](https://console.groq.com/keys) key** is the default; an OpenAI (or OpenAI-compatible, e.g. OpenRouter) key is optional
- For local webhook testing: a tunneling tool such as **ngrok** or **cloudflared** (GitHub cannot reach `localhost`)

### Creating the GitHub OAuth App

1. Go to **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**.
2. **Homepage URL**: your app URL (e.g. `http://localhost:3000`).
3. **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`.
4. Copy the **Client ID** and generate a **Client Secret** into `GH_CLIENT_ID` / `GH_CLIENT_SECRET`.

The app requests these OAuth scopes: `read:user`, `user:email`, `repo`, `admin:repo_hook`. The `admin:repo_hook` scope is required to create the per-repo webhook used for auto-review — the connected account must be an **admin** of the repository.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|---|:---:|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string. |
| `BETTER_AUTH_SECRET` | ✅ | Random secret used to sign sessions. Generate with `openssl rand -hex 32`. |
| `BETTER_AUTH_URL` | ✅ | Canonical base URL of the app (e.g. `http://localhost:3000`). Used for OAuth callbacks. |
| `NEXT_PUBLIC_APP_URL` | ✅ | Public app URL exposed to the browser. Usually the same as `BETTER_AUTH_URL`. |
| `GH_CLIENT_ID` | ✅ | GitHub OAuth App client ID. |
| `GH_CLIENT_SECRET` | ✅ | GitHub OAuth App client secret. |
| `GROQ_API_KEY` | ✅* | Groq API key (the **default** AI provider). Free key at <https://console.groq.com/keys>. |
| `INNGEST_EVENT_KEY` | ✅** | Inngest event key (for sending events). Required in production; the local Inngest dev server doesn't need it. |
| `INNGEST_SIGNING_KEY` | ✅** | Inngest signing key (for verifying requests). Required in production. |
| `WEBHOOK_PUBLIC_URL` | ⛔ optional | Public HTTPS origin GitHub delivers webhooks to. Use in local dev to point GitHub at a tunnel (e.g. ngrok) while auth stays on `localhost`. Accepts a bare origin or the full `/api/webhooks/github` URL. Leave unset in production. |
| `OPENAI_API_KEY` | ⛔ optional | Only needed when using the `openai` provider. |
| `OPENAI_BASE_URL` | ⛔ optional | Override for OpenAI-compatible endpoints (e.g. OpenRouter). |
| `GH_WEBHOOK_SECRET` | ⛔ optional | Legacy/global webhook secret. Each repo now gets its own per-repo secret automatically; this is only a fallback for hooks configured manually before per-repo secrets existed. |

> \* At least one AI provider key is required. `GROQ_API_KEY` is needed for the default provider; `OPENAI_API_KEY` only if you switch to OpenAI.
> \*\* For **local development** you typically run `pnpm inngest:dev` and don't need the Inngest keys. They are required when deploying.

### Example `.env`

```env
DATABASE_URL="postgresql://user:password@localhost:5432/codereviewai"

BETTER_AUTH_SECRET="replace-with-openssl-rand-hex-32"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Local dev: tunnel GitHub webhooks to your machine while auth stays on localhost
WEBHOOK_PUBLIC_URL="https://your-subdomain.ngrok-free.app"

GH_CLIENT_ID="your-github-oauth-client-id"
GH_CLIENT_SECRET="your-github-oauth-client-secret"

# Default AI provider (free tier)
GROQ_API_KEY="gsk_..."

# Optional: OpenAI or an OpenAI-compatible endpoint (e.g. OpenRouter)
OPENAI_API_KEY=""
OPENAI_BASE_URL=""

# Legacy fallback only — per-repo secrets are generated automatically
GH_WEBHOOK_SECRET="replace-with-a-strong-secret"

# Required in production; not needed with the local Inngest dev server
INNGEST_EVENT_KEY=""
INNGEST_SIGNING_KEY=""
```

> ⚠️ Never commit real secrets. `.env` is gitignored; only `.env.example` (with placeholders) is tracked.

---

## Getting Started (Local Setup)

```bash
# 1. Clone
git clone https://github.com/Lathiya50/aicodereviewer.git
cd aicodereviewer

# 2. Install dependencies
pnpm install

# 3. Configure environment
cp .env.example .env
#   → fill in DATABASE_URL, GH_CLIENT_ID/SECRET, GROQ_API_KEY, BETTER_AUTH_SECRET, etc.

# 4. Generate the Prisma client and push the schema to your DB
pnpm db:generate
pnpm db:push

# 5. Start the dev server
pnpm dev

# 6. In a SECOND terminal, start the Inngest dev server (runs background review jobs)
pnpm inngest:dev
```

Open <http://localhost:3000>.

- App: <http://localhost:3000>
- Inngest dev dashboard: <http://localhost:8288> (started by `pnpm inngest:dev`)

> **Windows note:** stop the `next dev` and `inngest dev` processes before running `pnpm db:generate` / `pnpm db:push` — a running process can lock the Prisma client DLL and cause an `EPERM` error.

---

## Local Webhooks (ngrok / tunnel)

GitHub must reach the webhook endpoint over **public HTTPS** — it cannot deliver to `localhost`. To test auto-review locally:

1. Start a tunnel to your dev server:
   ```bash
   ngrok http 3000
   ```
2. Set `WEBHOOK_PUBLIC_URL` to the tunnel URL (the app appends `/api/webhooks/github` automatically):
   ```env
   WEBHOOK_PUBLIC_URL="https://your-subdomain.ngrok-free.app"
   ```
   Auth (`BETTER_AUTH_URL` / `NEXT_PUBLIC_APP_URL`) can stay on `http://localhost:3000`.
3. Restart `pnpm dev`, then **connect a repo** in the dashboard — the webhook is registered against the tunnel URL.
4. Open a PR (or push a commit to an open PR) in that repo to trigger a review.

If your tunnel URL changes, just re-connect (or use **Reconnect** on the repo) — webhook registration is idempotent and re-points the existing hook.

---

## Available Scripts

| Script | What it does |
|---|---|
| `pnpm dev` | Start the Next.js dev server (Turbopack). |
| `pnpm inngest:dev` | Start the local Inngest dev server (processes background review jobs). |
| `pnpm build` | Build for production. |
| `pnpm build:full` | `prisma generate && next build` — use this when the Prisma client isn't generated yet (e.g. CI/Vercel). |
| `pnpm start` | Start the production server. |
| `pnpm lint` | Run ESLint. |
| `pnpm db:generate` | Generate the Prisma client. |
| `pnpm db:push` | Push the Prisma schema to the database (no migration files). |

---

## Database Schema

PostgreSQL via Prisma. Schema lives in [`prisma/schema.prisma`](prisma/schema.prisma).

### Auth models (Better Auth)

| Model | Purpose |
|---|---|
| **User** | Accounts (name, email, image). Owns repositories and reviews. |
| **Session** | Active sessions (7-day lifetime, token, IP, user agent). |
| **Account** | Linked OAuth/credential accounts — stores the GitHub access token used for API calls. |
| **Verification** | Email/identifier verification tokens. |

### Domain models

**Repository** — a connected GitHub repo and its automation settings.

| Field | Type | Notes |
|---|---|---|
| `githubId` | `Int` (unique) | GitHub repository id. |
| `fullName` | `String` | `owner/repo`. |
| `private`, `htmlUrl`, `name` | | Repo metadata. |
| `webhookId` | `BigInt?` | GitHub hook id (for update/delete). |
| `webhookSecret` | `String?` | Per-repo HMAC secret (never sent to the client). |
| `webhookStatus` | `WebhookStatus` | `NONE` \| `ACTIVE` \| `FAILED`. |
| `autoReviewEnabled` | `Boolean` (default `true`) | Run a review on push? |
| `autoPostEnabled` | `Boolean` (default `true`) | Post results back to the PR? |
| `postEvent` | `PostEvent` | `COMMENT` \| `REQUEST_CHANGES`. |

**Review** — a single AI review of a PR.

| Field | Type | Notes |
|---|---|---|
| `prNumber`, `prTitle`, `prUrl` | | PR identity. |
| `status` | `ReviewStatus` | `PENDING` \| `PROCESSING` \| `COMPLETED` \| `FAILED` \| `CANCELLED`. |
| `summary` | `Text?` | AI summary of the changes. |
| `riskScore` | `Int?` | 0–100. |
| `comments` | `Json?` | Array of inline findings (file, line, severity, category, message, suggestion, old/new code). |
| `error` | `Text?` | Failure / soft-error detail. |
| `postedToGithub` | `Boolean` | Whether comments were posted to the PR. |
| `githubReviewId` | `BigInt?` | The GitHub review id once posted. |

**Enums**

```prisma
enum WebhookStatus { NONE  ACTIVE  FAILED }
enum PostEvent     { COMMENT  REQUEST_CHANGES }
enum ReviewStatus  { PENDING  PROCESSING  COMPLETED  FAILED  CANCELLED }
```

---

## API Surface

### HTTP route handlers (`src/app/api`)

| Route | Purpose |
|---|---|
| `POST /api/webhooks/github` | Receives GitHub `pull_request` events; verifies HMAC, creates a review, enqueues the Inngest job. |
| `/api/auth/[...all]` | Better Auth handler (sign-in/up, OAuth callback, session). |
| `/api/trpc/[trpc]` | tRPC endpoint for all app data. |
| `/api/inngest` | Inngest serve endpoint (`GET`/`POST`/`PUT`) that hosts the `review-pr` function. |

### tRPC routers (`src/server/api/routers`)

| Router | Procedures |
|---|---|
| `health` | `query` — health check. |
| `repository` | `list`, `fetchFromGithub`, `connect`, `disconnect`, `setAutomation`, `reconnectWebhook`. |
| `pullRequest` | `list`, `get`, `files`. |
| `review` | `trigger`, `get`, `list`, `getLatestForPR`, `listForPR`, `cancel`, `postToGithub`. |
| `analytics` | `stats`, `reviewTrend`, `riskDistribution`, `topIssues`, `activityHeatmap`, `repoLeaderboard`. |

### Inngest events

| Event | Triggered by | Effect |
|---|---|---|
| `review/pr.requested` | Webhook (auto) or `review.trigger` (manual) | Runs the `review-pr` function. Webhook-originated events carry `autoPost` + `postEvent`. |
| `review/pr.cancelled` | `review.cancel` | Cancels an in-flight review (matched on `reviewId`). |

---

## AI Providers

The review engine is provider-agnostic. Configs live in [`src/constant/ai.ts`](src/constant/ai.ts).

| Provider | Primary model | Fallback model | API key | Notes |
|---|---|---|---|---|
| **groq** (default) | `llama-3.3-70b-versatile` | `llama-3.1-8b-instant` | `GROQ_API_KEY` | Generous free tier. |
| **openai** | `gpt-4o-mini` | `gpt-3.5-turbo` | `OPENAI_API_KEY` | Supports OpenAI-compatible endpoints (OpenRouter, Azure) via `OPENAI_BASE_URL`. |

The orchestrator (`review.ts`):
- **Chunks** large PRs so each request stays under the token budget, then merges results (max risk score wins, comments concatenated).
- **Falls back** from the primary to the cheaper model on rate/size limits, and **retries** transient errors (413/429/503) with exponential backoff.
- **Validates** the model's JSON output against a Zod schema, normalizing loose severity/category strings into the canonical set.

**Review output schema** — each comment carries: `file`, `line`, `severity` (`critical`/`high`/`medium`/`low`), `category` (`bug`/`security`/`performance`/`style`/`suggestion`), `message`, an optional `suggestion`, and optional `oldCode`/`newCode` for the code-comparison view.

**Adding a provider:** add a config to `PROVIDER_CONFIGS`, implement the `AiProvider` interface in `src/server/services/ai/providers/`, and register it in `registry.ts`.

---

## Project Structure

```
aicodereviewer/
├── prisma/
│   └── schema.prisma              # DB models + enums
├── src/
│   ├── app/
│   │   ├── (auth)/                # sign-in, sign-up (split-screen layouts)
│   │   ├── (dashboard)/           # analytics, repos, repos/[id], PR pages, reviews
│   │   ├── api/
│   │   │   ├── auth/[...all]/      # Better Auth handler
│   │   │   ├── trpc/[trpc]/        # tRPC endpoint
│   │   │   ├── inngest/            # Inngest serve endpoint
│   │   │   └── webhooks/github/    # GitHub webhook receiver
│   │   ├── layout.tsx             # root layout (dark-first theme)
│   │   └── page.tsx               # landing page (metadata) + landing-page.tsx (animations)
│   ├── components/
│   │   ├── analytics/             # stats cards, charts, heatmap, leaderboard
│   │   ├── ui/                    # ShadCN/Radix primitives
│   │   └── *.tsx                  # diff/code viewers, review result, header, etc.
│   ├── constant/
│   │   └── ai.ts                  # AI provider configs + default provider
│   ├── lib/                       # trpc client/provider, auth client, utils, motion
│   └── server/
│       ├── api/                   # tRPC root + routers + context
│       ├── auth/                  # Better Auth config (GitHub OAuth, sessions)
│       ├── db/                    # Prisma client
│       ├── inngest/               # client + functions (review-pr)
│       └── services/
│           ├── ai/                # provider registry, providers, review orchestrator, types
│           └── github.ts          # GitHub REST helpers + webhook + PR review posting
├── .env.example
├── next.config.ts                 # serverExternalPackages for Prisma/Auth/Inngest
└── package.json
```

---

## Deployment (Vercel)

1. Provision a **PostgreSQL** database (e.g. Neon) and an **Inngest** app (for `INNGEST_EVENT_KEY` / `INNGEST_SIGNING_KEY`).
2. In your Vercel project, set **all** required environment variables from the table above. In production:
   - `BETTER_AUTH_URL` / `NEXT_PUBLIC_APP_URL` → your production HTTPS URL.
   - Leave `WEBHOOK_PUBLIC_URL` **unset** — the app uses the app URL automatically.
   - Set `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY`.
3. Update the **GitHub OAuth App** callback URL to `https://<your-domain>/api/auth/callback/github`.
4. Set the build command to **`pnpm build:full`** (it runs `prisma generate` before `next build`).
5. Register the Inngest serve endpoint (`https://<your-domain>/api/inngest`) in the Inngest dashboard.

> `next.config.ts` marks `@prisma/client`, `prisma`, `better-auth`, and `inngest` as `serverExternalPackages` so Vercel's build-time page-data collection doesn't crash on these modules.

---

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Connecting a repo shows `FAILED` webhook status | The GitHub account isn't an admin of the repo, or the token lacks `admin:repo_hook`. Reconnect GitHub to grant the scope, then use **Reconnect** on the repo. |
| PRs aren't being reviewed | (1) Webhook can't reach `localhost` — set up a tunnel + `WEBHOOK_PUBLIC_URL`. (2) The change wasn't a PR event (a plain branch push doesn't trigger). (3) `autoReviewEnabled` is off. (4) The PR is a draft. |
| Reviews stay `PENDING` | The Inngest dev server isn't running locally — start `pnpm inngest:dev`. In prod, check the Inngest serve endpoint + keys. |
| `EPERM` during `pnpm db:generate` (Windows) | Stop `next dev` and `inngest dev` first — they lock the Prisma client DLL. |
| Auto-post recorded a soft error but review is `COMPLETED` | Expected behavior. The AI result is saved regardless; the post failed (e.g. comments fell outside the diff range, or `REQUEST_CHANGES` on your own PR — which auto-downgrades to `COMMENT`). The reason is stored on the review's `error` field. |
| No inline comments posted | All findings referenced lines outside the PR diff range. GitHub only accepts comments on changed lines. |

---

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feat/your-feature`.
3. Commit your changes (Husky runs lint on commit).
4. Push and open a pull request.
