# 🚀 CodeReviewAI — Vercel Deployment Epic

> **Goal:** Deploy the CodeReviewAI project to Vercel with full CI/CD via GitHub, ensuring all features — OAuth sign-in, webhook-triggered PR reviews, Inngest background jobs, tRPC API, and PostgreSQL persistence — work flawlessly in production.

---

## 📋 Table of Contents

1. [Architecture Overview](#1--architecture-overview)
2. [Prerequisites](#2--prerequisites)
3. [Phase 1 — Provision a Managed PostgreSQL Database](#phase-1--provision-a-managed-postgresql-database)
4. [Phase 2 — GitHub OAuth App Configuration](#phase-2--github-oauth-app-configuration)
5. [Phase 3 — Import Project into Vercel](#phase-3--import-project-into-vercel)
6. [Phase 4 — Environment Variables on Vercel](#phase-4--environment-variables-on-vercel)
7. [Phase 5 — Prisma on Vercel (Serverless)](#phase-5--prisma-on-vercel-serverless)
8. [Phase 6 — Inngest Setup for Vercel](#phase-6--inngest-setup-for-vercel)
9. [Phase 7 — GitHub Webhook for Automatic PR Reviews](#phase-7--github-webhook-for-automatic-pr-reviews)
10. [Phase 8 — CI/CD Pipeline with GitHub Actions](#phase-8--cicd-pipeline-with-github-actions)
11. [Phase 9 — Custom Domain (Optional)](#phase-9--custom-domain-optional)
12. [Phase 10 — Post-Deployment Verification Checklist](#phase-10--post-deployment-verification-checklist)
13. [Troubleshooting](#troubleshooting)
14. [Environment Variable Reference](#environment-variable-reference)

---

## 1 — Architecture Overview

```
┌─────────────┐       PR opened/synced        ┌──────────────────────┐
│   GitHub     │ ──── webhook POST ──────────▶ │  Vercel (Next.js)    │
│   Repos      │                               │                      │
│              │ ◀── review comments (API) ─── │  /api/webhooks/      │
└─────────────┘                               │       github         │
                                               │                      │
┌──────────────┐                               │  /api/inngest    ───▶│──▶ Inngest Cloud
│  Browser     │ ──── HTTPS ──────────────────▶│  /api/trpc/[trpc]    │      (background jobs)
│  (User)      │                               │  /api/auth/[...all]  │
└──────────────┘                               └──────────┬───────────┘
                                                          │
                                                          ▼
                                               ┌──────────────────────┐
                                               │  PostgreSQL (Neon /  │
                                               │  Supabase / Railway) │
                                               └──────────────────────┘
                                                          │
                                               ┌──────────────────────┐
                                               │  AI Provider         │
                                               │  (Groq / OpenAI)     │
                                               └──────────────────────┘
```

### Key Differences from Docker Deployment

| Concern          | Docker (current)                     | Vercel (target)                               |
| ---------------- | ------------------------------------ | --------------------------------------------- |
| Runtime          | Long-running Node.js server          | Serverless functions (cold starts)            |
| Database         | Self-hosted PostgreSQL               | Managed PostgreSQL (Neon / Supabase / Railway)|
| Background Jobs  | Inngest Dev Server (local)           | Inngest Cloud (managed)                       |
| TLS / Domain     | Caddy reverse proxy                  | Vercel Edge Network (automatic HTTPS)         |
| Build            | `Dockerfile` + `docker-compose`      | `vercel build` (auto-detected Next.js)        |
| CI/CD            | Manual `docker compose up`           | Git push → auto deploy via Vercel GitHub App  |

---

## 2 — Prerequisites

Before you begin, ensure you have:

- [ ] A [GitHub](https://github.com) account with admin access to the repo
- [ ] A [Vercel](https://vercel.com) account (free Hobby plan works)
- [ ] A managed PostgreSQL database (see Phase 1)
- [ ] An [Inngest Cloud](https://www.inngest.com) account (free tier available)
- [ ] An AI provider API key:
  - **Groq** (default, free tier): [https://console.groq.com/keys](https://console.groq.com/keys)
  - **OpenAI** (optional): [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- [ ] `pnpm` installed locally (for testing): `npm i -g pnpm`

---

## Phase 1 — Provision a Managed PostgreSQL Database

Vercel serverless functions **cannot** run a local PostgreSQL container. You need an external managed database. Here are the recommended options:

### Option A: Neon (Recommended for Vercel — free tier)

1. Go to [https://neon.tech](https://neon.tech) and sign up.
2. Create a new project (e.g., `codereviewai`).
3. Neon gives you a connection string:
   ```
   postgresql://<user>:<password>@<host>.neon.tech/<dbname>?sslmode=require
   ```
4. Copy this — you'll use it as `DATABASE_URL`.

> **Tip:** Neon has a Vercel integration — install it from the Vercel Integrations Marketplace to auto-inject `DATABASE_URL`.

### Option B: Supabase (free tier)

1. Go to [https://supabase.com](https://supabase.com) and create a project.
2. Navigate to **Settings → Database → Connection string → URI**.
3. Copy the connection string (use the **connection pooler** URI for serverless — port `6543`).

### Option C: Railway

1. Go to [https://railway.app](https://railway.app) and create a PostgreSQL service.
2. Copy the `DATABASE_URL` from the service variables.

### Apply the Schema

After obtaining your `DATABASE_URL`, push the Prisma schema to the remote database:

```bash
# Set the DATABASE_URL locally (one-time)
$env:DATABASE_URL = "postgresql://user:password@host/dbname?sslmode=require"

# Push the schema
pnpm db:push
```

This creates all tables (`user`, `session`, `account`, `verification`, `Repository`, `Review`).

---

## Phase 2 — GitHub OAuth App Configuration

The app uses **better-auth** with GitHub as a social provider (scopes: `read:user`, `user:email`, `repo`). You need a GitHub OAuth App.

### Step-by-Step

1. Go to **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**.
2. Fill in:

   | Field                        | Value                                                  |
   | ---------------------------- | ------------------------------------------------------ |
   | **Application name**         | `CodeReviewAI`                                         |
   | **Homepage URL**             | `https://your-app.vercel.app`                          |
   | **Authorization callback URL** | `https://your-app.vercel.app/api/auth/callback/github` |

3. Click **Register application**.
4. Copy the **Client ID** → this becomes `GH_CLIENT_ID`.
5. Click **Generate a new client secret** → copy it → this becomes `GH_CLIENT_SECRET`.

> **Important:** After your first deployment, you'll know your actual Vercel URL (e.g., `https://aicodereviewer.vercel.app`). Come back and update the callback URL if needed.

---

## Phase 3 — Import Project into Vercel

### 3.1 Push Code to GitHub

If not already done:

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/<your-username>/aicodereviewer.git
git branch -M main
git push -u origin main
```

### 3.2 Import into Vercel

1. Go to [https://vercel.com/new](https://vercel.com/new).
2. Click **Import Git Repository** and select your `aicodereviewer` repo.
3. Vercel auto-detects **Next.js** as the framework.
4. **Framework Preset:** `Next.js` (auto-detected).
5. **Build Command:** Leave as default — Vercel runs `pnpm build` which executes `prisma generate && next build`.
6. **Output Directory:** Leave as default (`.next`).
7. **Install Command:** Vercel auto-detects `pnpm` from `pnpm-lock.yaml`.
8. **Before adding environment variables** (see Phase 4), click **Deploy** — the first build may fail, **that's OK**. We'll fix it next.

### 3.3 Vercel Project Settings to Verify

After import, go to **Project Settings → General** and confirm:

| Setting              | Value                  |
| -------------------- | ---------------------- |
| Framework Preset     | Next.js                |
| Node.js Version      | 20.x                   |
| Package Manager      | pnpm                   |
| Root Directory       | `./` (default)         |
| Build Command        | `prisma generate && next build` (from `package.json`) |

---

## Phase 4 — Environment Variables on Vercel

Go to **Project Settings → Environment Variables** and add each variable below.

### Required Variables

| Variable                  | Description                              | Example Value                                          | Environments        |
| ------------------------- | ---------------------------------------- | ------------------------------------------------------ | -------------------- |
| `DATABASE_URL`            | PostgreSQL connection string             | `postgresql://user:pass@host.neon.tech/db?sslmode=require` | Production, Preview, Development |
| `BETTER_AUTH_SECRET`      | Random secret for session encryption     | Generate with: `openssl rand -base64 32`               | Production, Preview |
| `BETTER_AUTH_URL`         | Canonical app URL                        | `https://your-app.vercel.app`                          | Production           |
| `NEXT_PUBLIC_APP_URL`     | Public-facing app URL (client-side)      | `https://your-app.vercel.app`                          | Production, Preview |
| `GH_CLIENT_ID`        | GitHub OAuth App Client ID               | `Iv1.abc123...`                                        | Production, Preview |
| `GH_CLIENT_SECRET`    | GitHub OAuth App Client Secret           | `gho_xxxx...`                                          | Production, Preview |
| `GH_WEBHOOK_SECRET`   | Secret for verifying GitHub webhook payloads | Generate with: `openssl rand -hex 20`              | Production, Preview |
| `GROQ_API_KEY`            | Groq API key (default AI provider)       | `gsk_xxxx...`                                          | Production, Preview |
| `INNGEST_EVENT_KEY`       | Inngest event key                        | From Inngest Cloud dashboard                           | Production, Preview |
| `INNGEST_SIGNING_KEY`     | Inngest signing key                      | From Inngest Cloud dashboard                           | Production, Preview |

### Optional Variables

| Variable                  | Description                              | Example Value              |
| ------------------------- | ---------------------------------------- | -------------------------- |
| `OPENAI_API_KEY`          | OpenAI API key (if using OpenAI provider)| `sk-xxxx...`               |
| `GOOGLE_AI_API_KEY`       | Google Gemini API key (if configured)    | `AIza...`                  |

### How to Generate Secrets

```bash
# For BETTER_AUTH_SECRET (32 bytes, base64)
openssl rand -base64 32

# For GH_WEBHOOK_SECRET (20 bytes, hex)
openssl rand -hex 20
```

> **Preview Deployments:** For preview/PR deployments, set `NEXT_PUBLIC_APP_URL` to use Vercel's automatic preview URL. You can use Vercel's `VERCEL_URL` system variable — the auth config already handles this:
> ```ts
> const appUrl = process.env.BETTER_AUTH_URL
>   || process.env.NEXT_PUBLIC_APP_URL
>   || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
> ```

---

## Phase 5 — Prisma on Vercel (Serverless)

### 5.1 Why This Matters

Vercel serverless functions have a **read-only filesystem** after build. Prisma Client must be generated at build time. The project already handles this:

- **Build command** in `package.json`: `"build": "prisma generate && next build"`
- **`serverExternalPackages`** in `next.config.ts` already includes `@prisma/client` and `prisma`

### 5.2 Connection Pooling (Important for Serverless)

Serverless functions create many short-lived connections. Without pooling, you'll exhaust your database connection limit.

**If using Neon:**
- Use the **pooled connection string** (already uses PgBouncer):
  ```
  postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/db?sslmode=require
  ```
- Neon's serverless driver works out of the box.

**If using Supabase:**
- Use the **connection pooler** string (port `6543`):
  ```
  postgresql://user:pass@host.supabase.co:6543/postgres?pgbouncer=true
  ```

### 5.3 Prisma Caching on Vercel

The project uses a global singleton pattern for Prisma Client (see `src/server/db/index.ts`), which is the correct approach for serverless:

```ts
const globalPrismaClient = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};
export const db = globalPrismaClient.prisma ?? createPrismaClient();
```

No changes needed here.

---

## Phase 6 — Inngest Setup for Vercel

Inngest handles background processing (the `review/pr.requested` event that triggers AI code reviews). In production on Vercel, you must use **Inngest Cloud** (the local dev server won't work).

### 6.1 Create Inngest Cloud Account

1. Go to [https://www.inngest.com](https://www.inngest.com) and sign up.
2. Create a new **App** (e.g., `codereviewai`).
3. From the dashboard, copy:
   - **Event Key** → `INNGEST_EVENT_KEY`
   - **Signing Key** → `INNGEST_SIGNING_KEY`
4. Add both to Vercel environment variables (Phase 4).

### 6.2 Sync Inngest with Your Vercel App

After your first successful deployment:

1. In the Inngest Cloud dashboard, go to **Apps → Syncs**.
2. Click **Sync New App** and enter your serve endpoint:
   ```
   https://your-app.vercel.app/api/inngest
   ```
3. Inngest will discover your registered functions (`review-pr`).
4. You should see the function listed in the **Functions** tab.

> **Important:** The serve endpoint (`/api/inngest`) is already configured in `src/app/api/inngest/route.ts`:
> ```ts
> export const { GET, POST, PUT } = serve({
>   client: inngest,
>   functions,
> });
> ```

### 6.3 Vercel-Inngest Integration (Alternative)

Instead of manual sync, install the **Inngest Vercel Integration**:

1. Go to [Vercel Integrations → Inngest](https://vercel.com/integrations/inngest).
2. Click **Add Integration** → select your project.
3. This auto-syncs on every deployment and sets `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` automatically.

### 6.4 Function Timeout Considerations

Vercel Hobby plan has a **10-second** function timeout. Vercel Pro has **60 seconds**. The `review-pr` function calls AI APIs and may take longer.

**Solutions:**
- Inngest handles long-running functions by breaking them into **steps** — each step is a separate invocation with its own timeout. The `review-pr` function already uses steps correctly (`step.run(...)` pattern).
- Each `step.run()` gets its own 10s/60s timeout window, so even a multi-step review with AI calls will work within limits.
- If AI calls are slow (>10s per step), upgrade to Vercel **Pro** plan.

---

## Phase 7 — GitHub Webhook for Automatic PR Reviews

The webhook endpoint at `/api/webhooks/github` receives `pull_request` events and triggers the Inngest review pipeline.

### 7.1 Create the Webhook

1. Go to **GitHub → Your Repo → Settings → Webhooks → Add webhook**.
2. Configure:

   | Field            | Value                                                  |
   | ---------------- | ------------------------------------------------------ |
   | **Payload URL**  | `https://your-app.vercel.app/api/webhooks/github`      |
   | **Content type** | `application/json`                                     |
   | **Secret**       | Same value as `GH_WEBHOOK_SECRET` env var           |
   | **Events**       | Select **"Let me select individual events"** → check only **Pull requests** |
   | **Active**       | ✅ checked                                              |

3. Click **Add webhook**.

### 7.2 Organization-Wide Webhook (Optional)

If you want automatic reviews for **all repos** in a GitHub organization:

1. Go to **Organization → Settings → Webhooks → Add webhook**.
2. Use the same configuration as above.
3. All repos in the org will send PR events to your app.

### 7.3 Webhook Flow

```
GitHub PR opened → POST /api/webhooks/github
  → Verify HMAC signature (GH_WEBHOOK_SECRET)
  → Find repository in DB
  → Create Review record (status: PENDING)
  → Send Inngest event "review/pr.requested"
  → Inngest Cloud invokes review-pr function
    → Fetch PR files from GitHub API
    → Send to AI provider (Groq/OpenAI)
    → Save review result to DB (status: COMPLETED)
```

---

## Phase 8 — CI/CD Pipeline with GitHub Actions

Vercel's GitHub integration provides automatic deployments on push/PR. For additional CI (linting, type-checking), add a GitHub Actions workflow.

### 8.1 Create the Workflow File

Create `.github/workflows/ci.yml`:

```yaml
name: CI / CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  # Build-time placeholders (same idea as Dockerfile)
  DATABASE_URL: "postgresql://build:build@localhost:5432/codereviewai"
  BETTER_AUTH_SECRET: "ci-placeholder-secret"
  BETTER_AUTH_URL: "https://example.com"
  NEXT_PUBLIC_APP_URL: "https://example.com"
  GH_CLIENT_ID: "ci-github-client-id"
  GH_CLIENT_SECRET: "ci-github-client-secret"
  OPENAI_API_KEY: "sk-ci-placeholder"
  GH_WEBHOOK_SECRET: "ci-webhook-secret"
  INNGEST_EVENT_KEY: "ci-inngest-event-key"
  INNGEST_SIGNING_KEY: "ci-inngest-signing-key"
  GROQ_API_KEY: "gsk-ci-placeholder"

jobs:
  ci:
    name: Lint, Type-check & Build
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Install pnpm
        uses: pnpm/action-setup@v4
        with:
          run_install: false

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Generate Prisma Client
        run: pnpm db:generate

      - name: Lint
        run: pnpm lint

      - name: Build
        run: pnpm build
```

### 8.2 Vercel Auto-Deploy (Already Built-In)

When you connect your GitHub repo to Vercel:

- **Every push to `main`** → triggers a **Production** deployment.
- **Every pull request** → triggers a **Preview** deployment with a unique URL.
- Preview URLs are posted as a comment on the PR automatically.

No additional configuration needed — this is handled by the Vercel GitHub App.

### 8.3 Branch Protection Rules (Recommended)

Go to **GitHub → Repo → Settings → Branches → Branch protection rules → Add rule** for `main`:

- [x] Require a pull request before merging
- [x] Require status checks to pass before merging
  - Add: `ci` (from the GitHub Actions workflow)
  - Add: `Vercel` (from Vercel's deployment check)
- [x] Require branches to be up to date before merging

---

## Phase 9 — Custom Domain (Optional)

### 9.1 Add Domain in Vercel

1. Go to **Project Settings → Domains**.
2. Click **Add Domain** and enter your domain (e.g., `codereview.yourdomain.com`).
3. Vercel provides DNS records to configure.

### 9.2 Update DNS

Add the DNS records at your registrar:

| Type  | Name                    | Value                          |
| ----- | ----------------------- | ------------------------------ |
| CNAME | `codereview`            | `cname.vercel-dns.com`         |

Or for apex domain:
| Type  | Name | Value              |
| ----- | ---- | ------------------ |
| A     | `@`  | `76.76.21.21`      |

### 9.3 Update Environment Variables

After adding a custom domain, update:
- `BETTER_AUTH_URL` → `https://codereview.yourdomain.com`
- `NEXT_PUBLIC_APP_URL` → `https://codereview.yourdomain.com`
- GitHub OAuth App callback URL → `https://codereview.yourdomain.com/api/auth/callback/github`
- GitHub Webhook Payload URL → `https://codereview.yourdomain.com/api/webhooks/github`

Trigger a redeployment after updating env vars.

---

## Phase 10 — Post-Deployment Verification Checklist

After your first successful deployment, verify each feature:

### ✅ Basic

- [ ] App loads at `https://your-app.vercel.app` without errors
- [ ] Landing page renders correctly
- [ ] Light/dark theme toggle works

### ✅ Authentication

- [ ] Sign up with email/password works
- [ ] Sign in with GitHub OAuth works
- [ ] GitHub OAuth redirects back correctly (no callback URL mismatch)
- [ ] Session persists after page refresh
- [ ] Sign out works

### ✅ Repository Management

- [ ] Connect GitHub button appears after sign-in
- [ ] GitHub repos are listed after connecting
- [ ] Can add a repo to the dashboard
- [ ] Repo detail page loads at `/repos/[id]`

### ✅ Pull Request Reviews

- [ ] Open a PR on a connected repo
- [ ] Webhook delivery shows `200` in GitHub webhook settings → Recent Deliveries
- [ ] Review record appears in the database (status: PENDING → PROCESSING → COMPLETED)
- [ ] Inngest Cloud dashboard shows the function execution
- [ ] Review result appears on the PR detail page
- [ ] AI-generated summary, risk score, and comments are populated

### ✅ Analytics

- [ ] Analytics page loads with chart data
- [ ] Stats cards show correct counts
- [ ] Activity heatmap renders

### ✅ API

- [ ] tRPC endpoints respond (`/api/trpc/*`)
- [ ] Auth endpoints respond (`/api/auth/*`)
- [ ] Inngest endpoint responds (`/api/inngest` — returns registration info on GET)

---

## Troubleshooting

### Build Fails with "Module evaluation error"

**Cause:** Next.js evaluates server modules at build time, and environment variables are missing.

**Fix:** The `next.config.ts` already marks these as `serverExternalPackages`:
```ts
serverExternalPackages: ["@prisma/client", "prisma", "better-auth", "inngest"],
```
Ensure all required env vars are set in Vercel **before** building. Vercel injects env vars at build time.

---

### `PrismaClientInitializationError: Can't reach database server`

**Cause:** `DATABASE_URL` is wrong or the database is not accessible from Vercel's network.

**Fix:**
1. Verify `DATABASE_URL` is correct in Vercel env vars.
2. Ensure SSL is enabled (`?sslmode=require` in the URL).
3. Check that your database provider allows connections from any IP (Vercel uses dynamic IPs).
4. Neon/Supabase/Railway allow this by default.

---

### GitHub OAuth Callback Fails (redirect_uri_mismatch)

**Cause:** The OAuth callback URL in GitHub doesn't match the actual Vercel deployment URL.

**Fix:**
1. Go to GitHub → Developer settings → OAuth Apps → your app.
2. Update **Authorization callback URL** to: `https://your-actual-vercel-url.vercel.app/api/auth/callback/github`
3. Ensure `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` match the same URL.

---

### Inngest Functions Not Triggering

**Cause:** Inngest Cloud not synced with your app.

**Fix:**
1. Visit `https://your-app.vercel.app/api/inngest` in a browser — you should see a JSON response with registered functions.
2. In Inngest Cloud dashboard → Apps → click **Sync** and enter the URL above.
3. Verify `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` are set correctly.

---

### Webhook Returns 401 (Invalid Signature)

**Cause:** `GH_WEBHOOK_SECRET` in Vercel doesn't match the secret configured in GitHub webhook settings.

**Fix:** Ensure the exact same secret string is used in both places. Regenerate if unsure:
```bash
openssl rand -hex 20
```
Update both GitHub webhook settings and Vercel env var, then redeploy.

---

### Function Timeout on Vercel Hobby Plan

**Cause:** AI API calls exceed 10-second limit.

**Fix:**
- The `review-pr` function uses Inngest steps, which retry individually. Each step gets its own timeout window.
- If single AI calls exceed 10s, upgrade to Vercel Pro (60s timeout) or switch to a faster AI model (e.g., Groq `llama-3.1-8b-instant` instead of `llama-3.3-70b-versatile`).

---

### Preview Deployments: Auth Doesn't Work

**Cause:** Preview URLs are dynamic, and `BETTER_AUTH_URL` points to production.

**Fix:** The auth config already handles this by falling back to `VERCEL_URL`:
```ts
const appUrl = process.env.BETTER_AUTH_URL
  || process.env.NEXT_PUBLIC_APP_URL
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
```
Make sure `BETTER_AUTH_URL` is only set for the **Production** environment in Vercel (not Preview).

---

## Environment Variable Reference

### Complete `.env.example`

```env
# ─── Database ─────────────────────────────────────────────
DATABASE_URL="postgresql://user:password@host.neon.tech/codereviewai?sslmode=require"

# ─── Auth (better-auth) ──────────────────────────────────
BETTER_AUTH_SECRET="generate-with-openssl-rand-base64-32"
BETTER_AUTH_URL="https://your-app.vercel.app"
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"

# ─── GitHub OAuth ─────────────────────────────────────────
GH_CLIENT_ID="your-github-oauth-client-id"
GH_CLIENT_SECRET="your-github-oauth-client-secret"

# ─── GitHub Webhook ───────────────────────────────────────
GH_WEBHOOK_SECRET="generate-with-openssl-rand-hex-20"

# ─── AI Providers ─────────────────────────────────────────
GROQ_API_KEY="gsk_your_groq_api_key"
# OPENAI_API_KEY="sk-your-openai-key"        # optional
# GOOGLE_AI_API_KEY="AIza..."                 # optional

# ─── Inngest ──────────────────────────────────────────────
INNGEST_EVENT_KEY="your-inngest-event-key"
INNGEST_SIGNING_KEY="your-inngest-signing-key"
```

---

## Quick-Start Summary (TL;DR)

```bash
# 1. Provision database (Neon recommended)
#    Copy DATABASE_URL

# 2. Push schema to database
pnpm db:push

# 3. Create GitHub OAuth App
#    Callback URL: https://your-app.vercel.app/api/auth/callback/github

# 4. Import repo into Vercel (vercel.com/new)

# 5. Set all env vars in Vercel dashboard

# 6. Trigger redeploy
#    Vercel → Deployments → Redeploy

# 7. Create Inngest Cloud account
#    Sync app: https://your-app.vercel.app/api/inngest

# 8. Add GitHub webhook
#    Payload URL: https://your-app.vercel.app/api/webhooks/github
#    Events: Pull requests only

# 9. Open a PR on a connected repo → review happens automatically! 🎉
```

---

## CI/CD Flow Diagram

```
Developer pushes code
        │
        ▼
┌─────────────────────┐
│  GitHub Actions CI   │
│  - pnpm install      │
│  - prisma generate   │
│  - pnpm lint         │
│  - pnpm build        │
└────────┬────────────┘
         │ ✅ Pass
         ▼
┌─────────────────────┐
│  Vercel Auto-Deploy  │
│  - Install deps      │
│  - prisma generate   │
│  - next build        │
│  - Deploy to Edge    │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Production Live     │
│  - Inngest synced    │
│  - Webhooks active   │
│  - Auth working      │
└─────────────────────┘
```

---

*Last updated: March 2026*
