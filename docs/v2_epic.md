# 🚀 CodeReviewAI — UI/UX Overhaul & Feature Enhancement Epic

> **Goal:** Transform CodeReviewAI from a functional MVP into a polished, visually stunning, and feature-rich product that stands out in the market.

---

## 📦 Current Tech Stack

| Layer        | Technology                                                  |
| ------------ | ----------------------------------------------------------- |
| Framework    | Next.js 16 (App Router, React 19)                          |
| Styling      | Tailwind CSS v4, shadcn/ui (Radix primitives)              |
| State        | tRPC + TanStack React Query                                |
| Auth         | better-auth (GitHub OAuth + email/password)                |
| DB           | PostgreSQL + Prisma ORM                                    |
| AI           | OpenAI GPT-4o-mini                                         |
| Background   | Inngest (event-driven functions)                           |
| Icons        | Lucide React, React Icons                                  |
| Theme        | next-themes (light/dark)                                   |

---

## 🎨 PHASE 1 — Animation & Motion Library Integration

### 1.1 Install Motion Libraries

| Library                  | Purpose                                         | Install Command                              |
| ------------------------ | ----------------------------------------------- | -------------------------------------------- |
| **Framer Motion**        | Page transitions, layout animations, gestures   | `pnpm add motion`                            |
| **@formkit/auto-animate**| Zero-config list/mount animations               | `pnpm add @formkit/auto-animate`             |
| **Lottie React**         | High-quality animated illustrations (loading, success, error) | `pnpm add lottie-react`          |

### 1.2 Landing Page (`src/app/page.tsx`)

#### Current State
- Static hero, feature cards, steps, and CTA sections
- No scroll-based animations, no entrance effects
- Basic gradient blur background circle

#### Improvements

| Area               | Enhancement                                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| **Hero Section**   | Staggered text reveal with `motion.div` (words slide up + fade). Animated gradient orb background using CSS `@keyframes` with slow drift. Typing animation for tagline using a lightweight typewriter component. |
| **Feature Cards**  | Scroll-triggered `fadeInUp` stagger using `motion.div` + `whileInView`. Icon micro-animation on hover (scale bounce). Glassmorphism card style: `backdrop-blur-xl bg-white/5 border border-white/10`. |
| **How It Works**   | Animated step connector lines that draw on scroll (SVG path animation via Framer Motion `pathLength`). Step numbers with counting animation. |
| **CTA Section**    | Floating particles or subtle grid background animation (CSS-only). Pulse glow effect on "Get started" button. |
| **Navigation**     | Blur-on-scroll header with dynamic opacity. Smooth scroll spy for section links (if anchor nav added). |

#### Code Pattern — Scroll Reveal
```tsx
import { motion } from "motion/react";

<motion.div
  initial={{ opacity: 0, y: 30 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-100px" }}
  transition={{ duration: 0.5, ease: "easeOut" }}
>
  {/* card content */}
</motion.div>
```

---

### 1.3 Auth Pages (`sign-in`, `sign-up`)

#### Current State
- Basic centered card with form inputs
- No animations, minimal visual polish

#### Improvements

| Area                    | Enhancement                                                              |
| ----------------------- | ------------------------------------------------------------------------ |
| **Page Transition**     | Card slides in from bottom with spring physics                           |
| **Background**          | Animated gradient mesh (CSS animation rotating hue) or subtle dot grid   |
| **Form Fields**         | Sequential stagger animation on mount (each field fades in 100ms apart)  |
| **Button States**       | Loading spinner inside button with smooth width transition               |
| **Error Messages**      | Shake animation on error + red border pulse                              |
| **Social Login Button** | GitHub icon animated on hover (slight rotate + scale)                    |
| **Success**             | Lottie checkmark animation before redirect                              |

---

### 1.4 Dashboard Layout & Header (`src/components/header.tsx`)

#### Improvements

| Area                    | Enhancement                                                              |
| ----------------------- | ------------------------------------------------------------------------ |
| **Page Transitions**    | Use `AnimatePresence` + `motion.div` in layout for smooth page swaps     |
| **Active Nav Indicator**| Animated underline/pill that slides between nav items (layout animation) |
| **User Menu**           | Dropdown enters with scale + fade spring animation                       |
| **Breadcrumbs**         | Add animated breadcrumb trail for nested routes (`/repos/[id]/pr/[prNumber]`) |
| **Command Palette**     | `Cmd+K` shortcut to search repos, PRs, reviews (see Phase 2)            |

#### Code Pattern — Sliding Nav Indicator
```tsx
{isActive && (
  <motion.div
    layoutId="activeNav"
    className="absolute inset-0 rounded-md bg-muted"
    transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
  />
)}
```

---

### 1.5 Repos Page (`src/app/(dashboard)/repos/page.tsx`)

#### Current State (560 lines)
- List of connected repos with GitHub import panel
- Static cards, checkbox selection, search filter

#### Improvements

| Area                       | Enhancement                                                              |
| -------------------------- | ------------------------------------------------------------------------ |
| **Repo Cards**             | `@formkit/auto-animate` on the list container for smooth add/remove/reorder. Hover lift effect with subtle shadow transition. |
| **Import Panel**           | Slide-down expand animation using `AnimatePresence` + `motion.div` with height auto-animate. |
| **Selection**              | Checkbox has spring scale animation. Selected count badge pops in with scale. |
| **Search**                 | Real-time filter with items fading out/in smoothly via `auto-animate`.   |
| **Empty State**            | Lottie illustration (folder/robot) instead of plain icon.                |
| **Skeleton Loading**       | Shimmer gradient animation on skeleton cards (already possible with Tailwind `animate-pulse`, upgrade to shimmer). |
| **Language Badges**        | Subtle gradient backgrounds matching language brand colors.              |

---

### 1.6 Reviews Page (`src/app/(dashboard)/reviews/page.tsx`)

#### Current State (436 lines)
- Status filter tabs, review cards with metadata
- Auto-refetch while processing

#### Improvements

| Area                | Enhancement                                                                    |
| ------------------- | ------------------------------------------------------------------------------ |
| **Status Tabs**     | Animated pill indicator sliding between tabs (Framer `layoutId`).              |
| **Review Cards**    | Entrance animation stagger. Status icon animated (spinning for processing, bounce-in for completed). |
| **Risk Score**      | Animated circular progress ring (SVG stroke-dasharray animation). Color transitions from green→yellow→red based on score. |
| **Processing State**| Pulsing glow border on card. Animated progress dots replacement with Lottie loader. |
| **Real-time Badge** | "Live" indicator dot with ping animation for auto-refreshing reviews.          |

---

### 1.7 PR Detail Page (`src/app/(dashboard)/repos/[id]/pr/[prNumber]/page.tsx`)

#### Current State (567 lines)
- PR metadata, tab toggle (review/files), trigger review button
- DiffViewer and ReviewResult components

#### Improvements

| Area                  | Enhancement                                                                  |
| --------------------- | ---------------------------------------------------------------------------- |
| **Tab Switching**     | Content cross-fades with `AnimatePresence` + exit/enter animations.          |
| **Trigger Button**    | Animated state transitions: idle → loading(spinning) → success(checkmark).   |
| **Branch Indicator**  | Animated arrow between base ← head branch labels.                            |
| **PR Stats Bar**      | Numbers count up on mount (additions/deletions/files).                       |

---

### 1.8 Diff Viewer Component (`src/components/diff-viewer.tsx`)

#### Current State (429 lines)
- Collapsible file diffs, line numbers, syntax coloring via CSS classes
- Copy button, expand/collapse all

#### Improvements

| Area                   | Enhancement                                                                 |
| ---------------------- | --------------------------------------------------------------------------- |
| **File Expand/Collapse** | Smooth height animation with `motion.div` + `AnimatePresence`.            |
| **Syntax Highlighting** | Integrate `shiki` or `react-syntax-highlighter` for real syntax colors.    |
| **Line Highlighting**  | Hover glow on diff lines. Click-to-comment line highlight.                  |
| **File Tree Sidebar**  | Optional mini file tree with icons for quick navigation.                    |
| **Copy Feedback**      | Toast notification or animated checkmark on copy.                           |

---

### 1.9 Review Result Component (`src/components/review-result.tsx`)

#### Current State (618 lines)
- Status-based renders (pending, processing, completed, failed)
- Risk score circle, severity-grouped comments

#### Improvements

| Area                  | Enhancement                                                                  |
| --------------------- | ---------------------------------------------------------------------------- |
| **Risk Score Ring**    | Animated SVG circle draw-on with `motion` + `pathLength`. Number counter.    |
| **Severity Sections** | Accordion expand/collapse with smooth animation.                             |
| **Comment Cards**     | Code suggestion blocks with proper syntax highlighting (shiki).              |
| **Overall Sentiment** | Animated emoji/icon that reflects review health (happy → worried → alert).   |
| **Print/Export**      | PDF export button for review results.                                        |

---

## 🎨 PHASE 2 — UI Component & Design System Upgrades

### 2.1 New Libraries to Install

| Library                        | Purpose                                                    | Install Command                                  |
| ------------------------------ | ---------------------------------------------------------- | ------------------------------------------------ |
| **sonner**                     | Beautiful toast notifications                              | `pnpm add sonner`                                |
| **cmdk**                       | Command palette (Cmd+K)                                    | `pnpm add cmdk`                                  |
| **@tanstack/react-table**      | Advanced data tables with sorting, pagination              | `pnpm add @tanstack/react-table`                 |
| **recharts**                   | Charts & analytics visualizations                          | `pnpm add recharts`                              |
| **react-hot-toast** or **sonner** | Toast system (sonner recommended for shadcn)            | `pnpm add sonner`                                |
| **vaul**                       | Mobile-friendly drawer component                           | `pnpm add vaul`                                  |
| **nuqs**                       | URL state management for filters                           | `pnpm add nuqs`                                  |
| **shiki**                      | Beautiful code syntax highlighting                         | `pnpm add shiki`                                 |

### 2.2 Design System Improvements

| Area                    | Enhancement                                                                    |
| ----------------------- | ------------------------------------------------------------------------------ |
| **Color Palette**       | Move from grayscale primary to a branded color (indigo/violet primary). Add gradient accents for key CTAs. |
| **Typography**          | Add `Inter` or `Plus Jakarta Sans` as heading font. Increase font hierarchy contrast. |
| **Spacing**             | Increase breathing room — larger padding in cards, sections.                   |
| **Border Radius**       | Larger radius for cards (`rounded-2xl`), pill buttons for filters.             |
| **Shadows**             | Layered shadows: `shadow-sm` → `shadow-lg` on hover for depth.                |
| **Dark Mode**           | Richer dark palette — deeper blacks, subtle blue tint, glowing accents.        |
| **Glass Effect**        | Use `backdrop-blur-xl bg-background/60` for floating elements.                 |

### 2.3 Toast / Notification System

Add `sonner` toasts for all user actions:
- Repo connected/disconnected
- Review triggered/completed/failed
- Copy to clipboard
- Error states

```tsx
// src/app/layout.tsx — add <Toaster /> from sonner
import { Toaster } from "sonner";

// In layout body:
<Toaster richColors position="bottom-right" />
```

### 2.4 Command Palette (Cmd+K)

New component: `src/components/command-palette.tsx`

Features:
- Search across repos, PRs, reviews
- Quick actions: "Trigger review", "Connect repo", "Toggle theme"
- Recent searches
- Keyboard-first navigation

### 2.5 Data Tables

Replace card lists with sortable data tables (optional toggle):
- Reviews list → table view with columns: PR, Repo, Status, Risk, Date
- Sorting, filtering, pagination
- Row click to navigate

---

## ⚡ PHASE 3 — New Features

### 3.1 Analytics Dashboard (NEW PAGE)

**Route:** `/dashboard` or `/analytics`

| Widget                    | Description                                                              |
| ------------------------- | ------------------------------------------------------------------------ |
| **Review Stats**          | Total reviews, avg risk score, pass rate — animated number counters      |
| **Review Trend Chart**    | Line chart of reviews per day/week (recharts)                            |
| **Risk Distribution**     | Donut chart of risk score ranges (0-30, 30-60, 60-100)                   |
| **Top Issues**            | Bar chart of most common issue categories                                |
| **Activity Heatmap**      | GitHub-style contribution heatmap for reviews                            |
| **Repo Leaderboard**      | Which repos have the most reviews/issues                                 |

**Database changes needed:**
- No schema changes needed — aggregate existing `Review` data
- Add tRPC router: `src/server/api/routers/analytics.ts`

### 3.2 Review Comparison (NEW FEATURE)

Compare two reviews of the same PR side-by-side:
- Show which issues were fixed between reviews
- Track improvement over time
- Diff between review comments

**Route:** `/repos/[id]/pr/[prNumber]/compare`

### 3.3 Review Settings / Rules (NEW FEATURE)

**Route:** `/settings` or per-repo settings

| Setting              | Description                                                   |
| -------------------- | ------------------------------------------------------------- |
| **Severity Filter**  | Minimum severity to report (skip `low` issues)                |
| **Custom Rules**     | User-defined review rules in natural language                 |
| **Ignore Patterns**  | Glob patterns for files to skip (e.g., `*.test.ts`, `*.md`)  |
| **AI Model Select**  | Choose between GPT-4o-mini / GPT-4o / Claude                 |
| **Auto-Review**      | Toggle automatic review on PR open/update                     |
| **Language**         | Review output language preference                              |

**Database changes needed:**
```prisma
model ReviewSettings {
  id              String   @id @default(cuid())
  repositoryId    String   @unique
  minSeverity     String   @default("low")
  customRules     String?  @db.Text
  ignorePatterns  String[] @default([])
  aiModel         String   @default("gpt-4o-mini")
  autoReview      Boolean  @default(true)
  language        String   @default("en")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  repository Repository @relation(fields: [repositoryId], references: [id], onDelete: Cascade)
}
```

### 3.4 Inline PR Comments (NEW FEATURE)

Post review comments directly to GitHub PR as inline review comments:
- Map AI comments to GitHub review format
- Submit as GitHub review with "REQUEST_CHANGES" or "COMMENT"
- User can select which comments to post

**API:** `POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews`

### 3.5 Webhook Auto-Review (ENHANCE EXISTING)

Currently webhook route exists at `src/app/api/webhooks/github/route.ts`.

Enhancements:
- Auto-trigger review when PR is opened or updated
- Status check integration (pass/fail based on risk score)
- Configurable risk threshold per repo

### 3.6 Team / Organization Support (NEW FEATURE)

| Feature              | Description                                           |
| -------------------- | ----------------------------------------------------- |
| **Team Workspace**   | Invite team members to shared workspace               |
| **Shared Repos**     | All team members see the same connected repos          |
| **Review Assignment**| Assign reviews to specific team members               |
| **Activity Feed**    | Shared feed of review activity                        |

**Database changes needed:**
```prisma
model Team {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  members   TeamMember[]
  repositories TeamRepository[]
}

model TeamMember {
  id     String @id @default(cuid())
  teamId String
  userId String
  role   TeamRole @default(MEMBER)
  team   Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)
  user   User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([teamId, userId])
}

enum TeamRole {
  OWNER
  ADMIN
  MEMBER
}
```

### 3.7 Real-time Review Updates (ENHANCE)

Replace polling with real-time updates:

| Option               | Library                    | Complexity |
| -------------------- | -------------------------- | ---------- |
| **Server-Sent Events** | Native `EventSource`     | Low        |
| **Pusher/Ably**      | `pusher-js` / `ably`       | Medium     |
| **PartyKit**         | `partykit`                 | Medium     |

Recommendation: **SSE** for simplicity — create `/api/reviews/stream` endpoint.

### 3.8 Export & Reporting (NEW FEATURE)

- **PDF Export** — Download review as formatted PDF (use `@react-pdf/renderer`)
- **Markdown Export** — Copy review as markdown for docs/tickets
- **CSV Export** — Bulk export review data for analytics
- **Slack/Discord Webhook** — Send review notifications to channels

### 3.9 Review History & Diff Timeline (NEW FEATURE)

For each PR, show a timeline of all reviews:
- When each review was triggered
- How the risk score changed over time
- Which issues were resolved

Visual: Vertical timeline component with animated entry.

### 3.10 Keyboard Shortcuts (NEW FEATURE)

| Shortcut        | Action                        |
| --------------- | ----------------------------- |
| `Cmd + K`       | Open command palette          |
| `Cmd + /`       | Toggle theme                  |
| `Cmd + R`       | Trigger review                |
| `J / K`         | Navigate review comments      |
| `E`             | Expand all diffs              |
| `C`             | Collapse all diffs            |
| `Esc`           | Close modals/palettes         |

---

## 🎯 PHASE 4 — Performance & Polish

### 4.1 Optimistic Updates

- Repo connect/disconnect immediately updates UI (rollback on error)
- Review trigger shows processing state instantly

### 4.2 Skeleton & Loading States

Replace all loading states with:
- Shimmer skeletons matching exact layout
- Content-aware skeletons (cards, tables, charts)
- Lottie loading animations for major transitions

### 4.3 Error Boundaries

- Add `error.tsx` for each route segment
- Animated error illustrations
- Retry buttons with loading state

### 4.4 PWA Support

- Add `manifest.json` for installability
- Offline fallback page
- Push notifications for review completion

### 4.5 SEO & Meta

- Dynamic OG images for shared review links
- Proper meta tags per page
- Structured data for landing page

---

## 📋 Implementation Priority (Recommended Order)

### Sprint 1 — Foundation (Week 1)
| # | Task                                        | Effort |
|---|---------------------------------------------|--------|
| 1 | Install `motion`, `sonner`, `cmdk`, `shiki` | 1 hr   |
| 2 | Add `<Toaster />` globally                  | 30 min |
| 3 | Update color palette (branded primary)      | 2 hrs  |
| 4 | Add page transition animations in layout    | 2 hrs  |
| 5 | Animate landing page hero + features        | 3 hrs  |

### Sprint 2 — Core UX (Week 2)
| # | Task                                         | Effort |
|---|----------------------------------------------|--------|
| 6 | Command palette component                    | 4 hrs  |
| 7 | Animate auth pages                           | 2 hrs  |
| 8 | Repos page animations + auto-animate         | 3 hrs  |
| 9 | Reviews page animated tabs + risk score ring | 3 hrs  |
| 10| Syntax highlighting in diff viewer (shiki)   | 4 hrs  |

### Sprint 3 — New Features (Week 3-4)
| # | Task                                             | Effort |
|---|--------------------------------------------------|--------|
| 11| Analytics dashboard page + charts                | 8 hrs  |
| 12| Review settings (per-repo config)                | 6 hrs  |
| 13| Inline GitHub PR comments                        | 6 hrs  |
| 14| Export reviews (PDF/Markdown)                    | 4 hrs  |
| 15| Keyboard shortcuts                               | 3 hrs  |

### Sprint 4 — Advanced (Week 5-6)
| # | Task                                             | Effort |
|---|--------------------------------------------------|--------|
| 16| Webhook auto-review enhancement                  | 4 hrs  |
| 17| Review history timeline                          | 4 hrs  |
| 18| Team/org support (DB + UI)                       | 12 hrs |
| 19| Real-time SSE updates                            | 4 hrs  |
| 20| PWA + Push notifications                         | 4 hrs  |

---

## 📚 Library Install Summary

Run this single command to install all recommended libraries:

```bash
pnpm add motion @formkit/auto-animate lottie-react sonner cmdk recharts vaul nuqs shiki @react-pdf/renderer
```

---

## 🗂️ New Files to Create

```
src/
  app/
    (dashboard)/
      analytics/
        page.tsx                    # Analytics dashboard
      settings/
        page.tsx                    # Global settings
      repos/
        [id]/
          settings/
            page.tsx                # Per-repo settings
          pr/
            [prNumber]/
              compare/
                page.tsx            # Review comparison
    error.tsx                       # Global error boundary
  components/
    command-palette.tsx             # Cmd+K search
    analytics/
      review-chart.tsx              # Review trend chart
      risk-distribution.tsx         # Risk donut chart
      stats-cards.tsx               # Animated stat counters
      activity-heatmap.tsx          # Contribution heatmap
    review-timeline.tsx             # Review history timeline
    export-review.tsx               # PDF/MD export
    animated-counter.tsx            # Reusable number counter
    page-transition.tsx             # AnimatePresence wrapper
    shimmer-skeleton.tsx            # Enhanced skeleton loader
  hooks/
    use-keyboard-shortcuts.ts       # Global keyboard shortcuts
    use-command-palette.ts          # Command palette state
  server/
    api/
      routers/
        analytics.ts                # Analytics tRPC router
        settings.ts                 # Settings tRPC router
```

---

## 🏁 Success Metrics

| Metric                        | Target                              |
| ----------------------------- | ----------------------------------- |
| Lighthouse Performance        | 95+                                 |
| Lighthouse Accessibility      | 100                                 |
| First Contentful Paint        | < 1.2s                              |
| Time to Interactive           | < 2.0s                              |
| Animation frame rate           | 60fps consistently                  |
| User action feedback latency  | < 100ms (toasts, animations)        |
| Mobile responsiveness         | Fully responsive all breakpoints    |

---

> **Note:** All animations should respect `prefers-reduced-motion` media query. Framer Motion handles this automatically with `useReducedMotion()`.
