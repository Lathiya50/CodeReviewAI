# EPIC: CodeReviewAI — Complete UI/UX Redesign

> **Status:** Draft — Awaiting Approval
> **Date:** 2026-03-14
> **Scope:** End-to-end frontend redesign of every page, component, and interaction

---

## 1. Executive Summary

A ground-up redesign of the CodeReviewAI frontend to deliver a **modern, premium, and highly animated** user experience. The current UI is functional but visually flat, lacks motion, and feels utilitarian. The redesign will transform it into a polished product that feels on par with tools like Linear, Vercel, and Raycast — clean, fast, and delightful to use.

---

## 2. Design Principles

| Principle | Description |
|-----------|-------------|
| **Dark-first premium** | Rich dark theme as the hero experience; light theme equally polished |
| **Motion with purpose** | Every animation serves a function — entrance, feedback, or continuity |
| **Information density done right** | Show more without feeling crowded; use progressive disclosure |
| **Spatial consistency** | Consistent spacing scale, alignment grid, and visual rhythm |
| **Instant feedback** | Every click, hover, and state change has a visible response |

---

## 3. New Libraries & Packages

| Package | Purpose | Why |
|---------|---------|-----|
| **`@react-spring/web`** | Physics-based animations | Natural spring animations for counters, gauges, and number transitions — more natural feel than keyframes |
| **`react-syntax-highlighter`** | Code syntax highlighting | Professional code rendering in diff viewer and review comments with proper language tokenization |
| **`react-hot-toast`** (or **`sonner`**) | Toast notifications | Elegant, animated toast system for success/error/info feedback across the app |
| **`@radix-ui/react-tooltip`** | Tooltips | Accessible, animated tooltips for icons, truncated text, and contextual help |
| **`react-countup`** | Animated counters | Smooth number animations for analytics stats cards |

> **Note:** Framer Motion is already installed but unused. It will become the primary animation engine.

### Packages to Remove

| Package | Reason |
|---------|--------|
| `react-icons` | Consolidate on Lucide React exclusively for icon consistency |

---

## 4. Color System Overhaul

### 4.1 Brand Accent Color

Introduce a **brand accent** (vibrant indigo/violet) to replace the neutral-only palette:

```
--brand:           oklch(0.65 0.25 270)    /* Vibrant indigo */
--brand-foreground: oklch(0.98 0 0)         /* White on brand */
--brand-muted:     oklch(0.65 0.25 270 / 15%)
```

### 4.2 Enhanced Semantic Colors

- **Success:** Emerald with gradient variants
- **Warning:** Amber with gradient variants
- **Danger:** Rose (shift from pure red for a more refined feel)
- **Info:** Sky blue

### 4.3 Surface Hierarchy (Dark Theme)

```
--surface-0: oklch(0.13 0.005 270)    /* App background — slight blue-ish tint */
--surface-1: oklch(0.17 0.005 270)    /* Cards */
--surface-2: oklch(0.21 0.005 270)    /* Elevated cards, modals */
--surface-3: oklch(0.25 0.005 270)    /* Hover states, active surfaces */
```

### 4.4 Gradient System

```css
.gradient-brand   { background: linear-gradient(135deg, var(--brand), oklch(0.55 0.28 310)); }
.gradient-success { background: linear-gradient(135deg, emerald-500, teal-400); }
.gradient-danger  { background: linear-gradient(135deg, rose-500, red-400); }
.gradient-surface { background: linear-gradient(180deg, var(--surface-1), var(--surface-0)); }
```

---

## 5. Typography Refinements

- **Keep Geist Sans / Geist Mono** — they are excellent
- Add utility classes for the typographic scale:

| Token | Size | Weight | Use |
|-------|------|--------|-----|
| `display` | 3.5rem / 56px | 700 | Landing hero |
| `h1` | 2.25rem / 36px | 600 | Page titles |
| `h2` | 1.5rem / 24px | 600 | Section headings |
| `h3` | 1.125rem / 18px | 500 | Card titles |
| `body` | 0.875rem / 14px | 400 | Default text |
| `caption` | 0.75rem / 12px | 400 | Secondary text, timestamps |
| `code` | 0.8125rem / 13px | 400 (mono) | Code, file paths |

---

## 6. Animation Strategy

### 6.1 Framer Motion — Global Defaults

```ts
const defaultTransition = { type: "spring", stiffness: 400, damping: 30 };
const fadeInUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };
const staggerChildren = { staggerChildren: 0.05 };
```

### 6.2 Animation Catalog

| Interaction | Animation | Library |
|-------------|-----------|---------|
| Page enter | Fade-in + slide up (staggered) | Framer Motion |
| Card hover | Subtle scale (1.01) + shadow lift + border glow | Framer Motion |
| Button press | Scale down (0.97) + release spring | Framer Motion |
| Tab switch | Underline slide with `layoutId` | Framer Motion |
| Modal open/close | Scale from 0.95 + fade + backdrop blur | Framer Motion |
| Number counting | Spring-based counting animation | react-spring / react-countup |
| Risk score gauge | Animated arc fill on mount | Framer Motion SVG |
| Loading states | Skeleton shimmer + pulse + breathing glow | CSS + Framer Motion |
| Toast appear | Slide in from top-right + fade | sonner |
| List items enter | Staggered fade-in | Framer Motion |
| Navigation | Active indicator slides to selected tab | Framer Motion `layoutId` |
| Diff viewer | Accordion expand with spring | Framer Motion |
| Status changes | Color morph with crossfade | Framer Motion |
| Scroll-reveal | Elements fade in as they enter viewport | Framer Motion `whileInView` |

### 6.3 Micro-Interactions

- **Checkboxes:** Bounce-in checkmark SVG animation
- **Buttons:** Ripple effect on click (CSS)
- **Input focus:** Border color transition + subtle glow
- **Hover cards:** Gradient border shimmer on hover
- **Copy button:** Check icon morph on success
- **Badge pulse:** Subtle pulse on "Processing" status

---

## 7. Page-by-Page Redesign Plan

### 7.1 Landing Page (`/`)

**Current:** Simple hero + feature grid + how-it-works + CTA. Flat, no motion.

**Redesigned:**

- **Hero Section:**
  - Animated gradient mesh background (CSS animated gradients, not heavy canvas)
  - Large headline with gradient text and word-by-word stagger animation
  - Animated terminal/code mockup showing a live review happening
  - Floating badge: "Powered by AI" with subtle floating animation
  - CTA buttons with hover glow effect and arrow icon animation

- **Social Proof Bar:**
  - Animated counter: "X reviews completed" with CountUp
  - Logos or trust indicators with fade-in on scroll

- **Features Section:**
  - Bento grid layout (mixed card sizes) instead of uniform grid
  - Each card has an icon with gradient background
  - Cards animate in on scroll (`whileInView`)
  - Hover: subtle tilt/lift with shadow

- **How It Works:**
  - Horizontal stepper with connecting animated line
  - Each step animates in sequence
  - Animated icons per step

- **CTA Section:**
  - Gradient background section
  - Floating particles or subtle animated grid pattern

- **Footer:**
  - Expanded footer with links, brand, and social links
  - Subtle top border gradient

### 7.2 Auth Pages (`/sign-in`, `/sign-up`)

**Current:** Centered card with basic form fields. No animation, no visual flair.

**Redesigned:**

- **Split layout** on desktop: left panel = brand/illustration, right panel = form
- Left panel features an animated abstract illustration or gradient mesh with the brand logo
- Form card enters with spring animation
- Input fields have animated floating labels
- Focus states with glowing brand-colored border
- GitHub button with icon animation on hover
- Password strength indicator (sign-up) with animated progress bar
- Error messages slide in with red accent
- Loading state: button text morphs to spinner
- Mobile: full-width form with gradient header strip

### 7.3 Dashboard Layout

**Current:** Simple header with nav links + theme toggle. No sidebar, mobile nav missing.

**Redesigned:**

- **Top navigation bar** — keep but enhance:
  - Brand logo/wordmark on the left with subtle hover animation
  - Navigation tabs with animated `layoutId` active indicator (sliding pill)
  - Right side: notification bell (future-ready), theme toggle with sun/moon morph animation, user avatar dropdown
  - Glass morphism effect: `backdrop-blur-xl` + border + subtle gradient
  - On scroll: header shrinks slightly with smooth transition

- **Mobile navigation:**
  - Bottom tab bar (iOS-style) for primary nav items
  - Smooth icon + label layout with active state animation
  - No hamburger menu — direct access to all sections

- **Breadcrumbs:**
  - Add breadcrumb navigation for nested pages (repo > PR > review)
  - Animated in/out of individual crumb items

### 7.4 Repositories Page (`/repos`)

**Current:** Grid of basic cards + import panel. Functional but plain.

**Redesigned:**

- **Page header:** Title with description, "Add Repository" button with plus icon animation
- **Connected repos grid:**
  - Cards with gradient left border accent (based on language or custom color)
  - Card shows: repo name, description excerpt, last review time, review count badge
  - Hover: card lifts with shadow + border glow
  - Staggered entrance animation
  - Empty state: illustrated placeholder with CTA

- **Import panel (modal/sheet):**
  - Slide-in sheet from the right (Framer Motion `AnimatePresence`)
  - Search input with debounced filtering and animated results
  - Repo items animate in as a staggered list
  - Select-all with animated checkbox
  - "Connect" button with loading spinner and success checkmark animation

- **Disconnect confirmation:**
  - Custom modal with backdrop blur
  - Warning icon with bounce animation
  - Danger button with confirm interaction

### 7.5 Repository Detail / PR List (`/repos/[id]`)

**Current:** Tabs for Open/Closed/All, cards for each PR. Basic layout.

**Redesigned:**

- **Repository header card:**
  - Full-width card with repo name, description, GitHub link, last synced
  - Stats row: total PRs, reviewed, pending (animated counters)
  - Gradient accent line at top

- **PR list:**
  - Custom tab bar with animated active indicator
  - PR cards as a clean list view (not grid) for better scanability
  - Each card: PR title, author avatar, branch badge, file change stats bar (visual additions/deletions bar), review status badge with color-coded dot
  - Hover: background highlight with smooth transition
  - Staggered entrance for list items
  - Empty state per tab with contextual illustration

### 7.6 PR Detail Page (`/repos/[id]/pr/[prNumber]`)

**Current:** PR metadata + tabbed view (Reviews / Changed Files). Dense and utilitarian.

**Redesigned:**

- **PR header section:**
  - PR title (large), PR number badge, state badge (open/closed/merged) with color
  - Author info: avatar + name + relative time
  - Branch flow: `base` ← `head` with animated arrow
  - Stats: additions (green), deletions (red), files changed — animated counters

- **Action bar:**
  - "Run AI Review" button — prominent, brand gradient, with sparkle/wand icon animation
  - Status: animated processing indicator (pulsing dot + text)
  - Cancel button appears conditionally with slide-in

- **Review Results tab (redesigned ReviewResult component):**
  - **Risk Score:** Animated circular gauge (SVG arc) with gradient fill (green→yellow→red), centered score number with CountUp, severity label underneath
  - **Severity Distribution:** Horizontal stacked bar with animated segment fills + legend
  - **AI Summary:** Styled blockquote card with AI icon
  - **Comments list:**
    - Cards grouped by severity (critical first)
    - Each card: colored left border, severity badge, category icon, file:line monospace link, message text, expandable suggestion with code block
    - Hover: lift + glow matching severity color
    - Staggered entrance
  - **Post to GitHub floating bar:**
    - Fixed bottom bar slides up when comments selected
    - Selected count with animated badge
    - Review type selector (radio pills)
    - Post button with loading state

- **Changed Files tab (redesigned DiffViewer):**
  - File list as collapsible accordion
  - Each file: name, change stats, expand/collapse icon with rotation animation
  - Diff rendering: proper syntax highlighting via `react-syntax-highlighter`
  - Line-by-line diff with green/red backgrounds and line numbers
  - Smooth accordion expand animation

### 7.7 Review Comparison Page (`/repos/[id]/pr/[prNumber]/compare`)

**Current:** Dropdown selectors + summary cards + comment list. Functional but dry.

**Redesigned:**

- **Comparison header:**
  - Two review selectors side-by-side (styled dropdowns)
  - Visual "vs" divider with animated swap icon option
  - Risk score delta: large number with animated trend arrow (up = red, down = green)

- **Summary cards row:**
  - Three cards: Fixed (green), New (amber), Unchanged (gray)
  - Animated count with CountUp
  - Icon per card with matching color

- **Comparison comments list:**
  - Cards with variant backgrounds (green tint = fixed, amber tint = new, neutral = unchanged)
  - Status badge: "Fixed" / "New Issue" / "Unchanged" with icon
  - Staggered list entrance
  - Filter tabs to show only Fixed / New / Unchanged

### 7.8 Reviews List (`/reviews`)

**Current:** Filterable list of all reviews. Basic tab filtering.

**Redesigned:**

- **Page header:** Title, subtitle with total review count
- **Filter tabs:** Animated pill-style tabs with count badges
- **Review cards:**
  - Clean list view with hover highlight
  - Left: colored status dot (animated pulse if processing)
  - Content: repo name, PR title, relative time
  - Right: risk score badge (color-coded), comment count
  - Retry button (failed reviews) with refresh icon animation
- **Auto-polling indicator:** Subtle animated dot in header when live-polling

### 7.9 Analytics Dashboard (`/analytics`)

**Current:** Grid of chart cards with Recharts. Static, loads all at once.

**Redesigned:**

- **KPI Stats Cards row:**
  - Glassmorphism card style
  - Large metric with CountUp animation
  - Trend indicator arrow (up/down) with percentage
  - Subtle gradient icon background
  - Staggered entrance animation

- **Review Trend Chart:**
  - Area chart with gradient fill under the line
  - Animated line drawing on mount
  - Time range selector as pill toggle (7d / 30d / 90d)
  - Hover tooltip redesigned with custom component
  - Smooth data transition when changing ranges

- **Risk Distribution (Donut):**
  - Animated arc segments drawing in on mount
  - Center: animated total count
  - Custom legend with colored dots

- **Top Issues (Bar chart):**
  - Horizontal bars animate from left to right
  - Bars have rounded ends and gradient fills
  - Labels on the left, values on the right

- **Activity Heatmap:**
  - Custom redesigned heatmap with brand-colored gradient (instead of default green)
  - Tooltip on hover showing date and count
  - Smooth fade-in on mount

- **Repo Leaderboard:**
  - Ranked list with medal icons (gold/silver/bronze) for top 3
  - Progress bar with animated fill
  - Risk score badge per repo

- **Overall Health and Review Status cards:**
  - Side-by-side fullwidth cards at bottom
  - Circular progress indicator for pass rate
  - Status breakdown with animated bars

### 7.10 Error Page (`/error.tsx`) and 404 Page (`/not-found.tsx`)

**Current:** Basic error/404 with simple icon and text.

**Redesigned:**

- Centered layout with animated illustration (CSS-only animated icon)
- Error code large and prominent with gradient text
- Friendly copy with personality
- Action buttons: "Go Back" / "Go Home" with animated icons
- Subtle animated background pattern

---

## 8. Shared Component Library Updates

### 8.1 New Components to Create

| Component | Description |
|-----------|-------------|
| `AnimatedPage` | Wrapper for page-level enter/exit animations |
| `AnimatedList` | Staggered children animation wrapper |
| `AnimatedCounter` | Number counting component (wraps CountUp) |
| `GlassCard` | Glassmorphism card variant |
| `GradientButton` | Brand gradient CTA button |
| `AnimatedTabs` | Tab bar with sliding `layoutId` indicator |
| `BottomNav` | Mobile bottom navigation bar |
| `Breadcrumbs` | Animated breadcrumb navigation |
| `CircularGauge` | SVG circular gauge for risk scores |
| `StatusDot` | Animated status indicator dot |
| `EmptyState` | Reusable empty state with illustration |
| `PageHeader` | Consistent page title + description + actions layout |
| `Tooltip` | Radix tooltip with animation |
| `Toast` | Toast notification system (via sonner) |

### 8.2 Existing Components to Update

| Component | Changes |
|-----------|---------|
| `Button` | Add gradient variant, press animation, loading state with spinner |
| `Card` | Add hover lift animation, gradient border variant, glass variant |
| `Badge` | Add pulse variant for processing states, gradient variant |
| `Input` | Animated focus glow, floating label option |
| `Skeleton` | Improved shimmer with gradient sweep |
| `Header` | Complete redesign (see 7.3) |
| `UserMenu` | Enhanced dropdown with animations |
| `ThemeToggle` | Sun/moon morph animation |
| `DiffViewer` | Syntax highlighting, accordion animation |
| `ReviewResult` | Complete redesign (see 7.6) |
| `ShimmerSkeleton` | Enhanced shimmer animation |

---

## 9. Responsive Breakpoints

| Breakpoint | Width | Layout Adaptations |
|------------|-------|--------------------|
| `sm` | 640px+ | Single → two column grids |
| `md` | 768px+ | Show desktop nav, hide bottom nav |
| `lg` | 1024px+ | Full feature layouts, side-by-side panels |
| `xl` | 1280px+ | Max content width containers |

### Mobile-First Approach

- Bottom tab bar navigation (< 768px)
- Cards stack vertically on mobile
- Auth pages: single column (no split layout on mobile)
- Touch-friendly: minimum 44px tap targets
- Swipe gestures: swipeable tabs on mobile
- Pull-to-refresh indicator for live data pages

---

## 10. Performance Considerations

| Concern | Mitigation |
|---------|------------|
| Animation performance | Use `transform` and `opacity` only (GPU-accelerated). Avoid animating layout properties |
| Bundle size | Tree-shake Framer Motion imports. Use dynamic imports for heavy components (charts, diff viewer) |
| Font loading | Keep Geist fonts with `font-display: swap` to avoid FOIT |
| Image/illustration | Use CSS-only illustrations and SVG animations (no heavy image files) |
| Reduced motion | Respect `prefers-reduced-motion` — disable all non-essential animations |
| Code splitting | Dynamic import analytics charts and diff viewer (not needed on initial load) |

---

## 11. Implementation Phases

### Phase 1: Foundation (Estimated: Infrastructure & Global Styles)

1. Install new dependencies (`sonner`, `react-syntax-highlighter`, `react-countup`, `@react-spring/web`)
2. Remove `react-icons` (replace `FaGithub` with Lucide's `Github` icon)
3. Overhaul `globals.css` — new color system, surface tokens, gradients, typography scale
4. Create animation utilities and shared motion variants
5. Create core shared components: `AnimatedPage`, `AnimatedList`, `GlassCard`, `GradientButton`, `AnimatedTabs`, `PageHeader`, `EmptyState`, `StatusDot`, `CircularGauge`, `AnimatedCounter`, `Breadcrumbs`
6. Set up `sonner` toast provider in root layout
7. Add `prefers-reduced-motion` media query handling

### Phase 2: Navigation & Layout

8. Redesign dashboard `Header` component (sliding nav indicator, glass effect, responsive)
9. Create `BottomNav` for mobile
10. Add `Breadcrumbs` to nested dashboard pages
11. Enhance `ThemeToggle` with sun/moon morph animation
12. Enhance `UserMenu` dropdown with animations

### Phase 3: Auth Pages

13. Redesign `/sign-in` page (split layout, animations, enhanced form)
14. Redesign `/sign-up` page (matching design, password strength indicator)

### Phase 4: Landing Page

15. Complete landing page redesign (hero, features bento grid, how-it-works, CTA, footer)

### Phase 5: Core Dashboard Pages

16. Redesign `/repos` page (enhanced cards, import sheet, empty state)
17. Redesign `/repos/[id]` page (repo header, PR list, tabs)
18. Redesign `/repos/[id]/pr/[prNumber]` page (review results, diff viewer, action bar)
19. Redesign `/repos/[id]/pr/[prNumber]/compare` page (comparison UI)
20. Redesign `/reviews` page (filter tabs, review cards, polling indicator)

### Phase 6: Analytics & Misc

21. Redesign `/analytics` page (all chart components, KPI cards, heatmap)
22. Redesign error page and 404 page
23. Responsive QA pass across all pages
24. Final polish: micro-interactions, hover states, edge cases

---

## 12. Files to Modify / Create

### New Files

```
src/components/ui/animated-page.tsx
src/components/ui/animated-list.tsx
src/components/ui/animated-counter.tsx
src/components/ui/animated-tabs.tsx
src/components/ui/glass-card.tsx
src/components/ui/gradient-button.tsx
src/components/ui/circular-gauge.tsx
src/components/ui/status-dot.tsx
src/components/ui/empty-state.tsx
src/components/ui/page-header.tsx
src/components/ui/tooltip.tsx
src/components/bottom-nav.tsx
src/components/breadcrumbs.tsx
src/lib/motion.ts              (shared animation variants & config)
```

### Files to Modify

```
package.json                           (add/remove dependencies)
src/app/globals.css                    (complete color/token overhaul)
src/app/layout.tsx                     (add toast provider)
src/app/page.tsx                       (complete landing page redesign)
src/app/error.tsx                      (redesign)
src/app/not-found.tsx                  (redesign)
src/app/(auth)/layout.tsx              (add split layout wrapper)
src/app/(auth)/sign-in/page.tsx        (complete redesign)
src/app/(auth)/sign-up/page.tsx        (complete redesign)
src/app/(dashboard)/layout.tsx         (add bottom nav, breadcrumbs)
src/app/(dashboard)/repos/page.tsx     (complete redesign)
src/app/(dashboard)/repos/[id]/page.tsx                          (redesign)
src/app/(dashboard)/repos/[id]/pr/[prNumber]/page.tsx            (redesign)
src/app/(dashboard)/repos/[id]/pr/[prNumber]/compare/page.tsx    (redesign)
src/app/(dashboard)/reviews/page.tsx   (redesign)
src/app/(dashboard)/analytics/page.tsx (redesign)
src/components/header.tsx              (complete redesign)
src/components/user-menu.tsx           (enhance with animations)
src/components/theme-toggle.tsx        (sun/moon morph animation)
src/components/diff-viewer.tsx         (syntax highlighting + accordion)
src/components/review-result.tsx       (complete redesign with gauge)
src/components/review-comparison-card.tsx  (redesign)
src/components/shimmer-skeleton.tsx    (enhanced shimmer)
src/components/connect-github.tsx      (redesign import panel)
src/components/analytics/stats-cards.tsx        (glassmorphism + counters)
src/components/analytics/review-chart.tsx       (gradient area chart)
src/components/analytics/risk-distribution.tsx  (animated donut)
src/components/analytics/top-issues.tsx         (animated bars)
src/components/analytics/activity-heatmap.tsx   (brand color restyle)
src/components/analytics/repo-leaderboard.tsx   (redesign)
src/components/ui/button.tsx           (add variants, press animation)
src/components/ui/card.tsx             (add hover/glass variants)
src/components/ui/badge.tsx            (add pulse/gradient variants)
src/components/ui/input.tsx            (focus glow animation)
src/components/ui/skeleton.tsx         (improved shimmer)
```

---

## 13. Acceptance Criteria

- [ ] All pages are visually redesigned with a premium, modern look
- [ ] Smooth animations on all page transitions, card hovers, button presses, and list renders
- [ ] Dark and light themes both look polished
- [ ] Fully responsive: mobile (320px+), tablet (768px+), desktop (1024px+)
- [ ] Mobile bottom navigation works on all dashboard pages
- [ ] Risk score displayed as animated circular gauge
- [ ] Analytics charts have animated entrances
- [ ] Diff viewer uses syntax highlighting
- [ ] Toast notifications replace any raw alert/error text
- [ ] `prefers-reduced-motion` respected
- [ ] No regressions in functionality — all features work as before
- [ ] Lighthouse performance score remains above 90
- [ ] All existing tRPC API integrations continue to work unchanged
- [ ] No changes to backend/server code

---

## 14. Out of Scope

- Backend API changes
- Database schema changes
- New features / new pages
- Authentication flow logic changes
- AI review logic changes
- Third-party integrations beyond what exists

---

## 15. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Bundle size increase from new libraries | Tree-shaking, dynamic imports, monitor with `next build` |
| Animation jank on low-end devices | GPU-only animations, `prefers-reduced-motion` support |
| Breaking existing functionality | No backend changes; test all flows after redesign |
| Inconsistent design between pages | Build shared component library first (Phase 1), use everywhere |

---

**Ready for review.** Once approved, implementation will proceed phase by phase.
