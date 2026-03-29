"use client";

import { motion, useInView, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";
import {
  ArrowRight,
  CheckCircle,
  GitMerge,
  GitPullRequest,
  MessageSquare,
  ScanSearch,
  Shield,
  Sparkles,
  Wand2,
  Zap,
  Star,
  Code2,
  ChevronRight,
} from "lucide-react";
import { GitHubIcon } from "@/components/ui/github-icon";
import { Button } from "@/components/ui/button";

/* ─── Animation Variants ─────────────────────────────────────────────────── */
const easeCubic: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: easeCubic, delay },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: (delay = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: easeCubic, delay },
  }),
};

/* ─── Section Wrapper ────────────────────────────────────────────────────── */
function RevealSection({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      variants={stagger}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Floating Orb ───────────────────────────────────────────────────────── */
function Orb({
  className,
  delay = 0,
}: {
  className: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={`absolute rounded-full pointer-events-none ${className}`}
      animate={{
        y: [0, -24, 0],
        scale: [1, 1.06, 1],
        opacity: [0.4, 0.65, 0.4],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
    />
  );
}

/* ─── Features ───────────────────────────────────────────────────────────── */
const features = [
  {
    icon: Zap,
    title: "Instant AI Feedback",
    description:
      "Get comprehensive, actionable code reviews in seconds — not hours. No waiting, no back-and-forth.",
    gradient: "from-yellow-500/20 to-orange-500/20",
    iconColor: "text-yellow-400",
  },
  {
    icon: Shield,
    title: "Security Scanning",
    description:
      "Automatically detect vulnerabilities, secrets, and potential attack vectors before they hit production.",
    gradient: "from-emerald-500/20 to-teal-500/20",
    iconColor: "text-emerald-400",
  },
  {
    icon: MessageSquare,
    title: "Smart Suggestions",
    description:
      "Clear, contextual suggestions you can apply immediately. Inline comments right in your pull requests.",
    gradient: "from-blue-500/20 to-cyan-500/20",
    iconColor: "text-blue-400",
  },
  {
    icon: GitPullRequest,
    title: "GitHub Native",
    description:
      "Reviews appear directly in your pull requests as real GitHub review comments. Zero workflow changes.",
    gradient: "from-purple-500/20 to-violet-500/20",
    iconColor: "text-purple-400",
  },
  {
    icon: ScanSearch,
    title: "Context-Aware AI",
    description:
      "Understands your codebase patterns, naming conventions, and architectural intent at a deep level.",
    gradient: "from-pink-500/20 to-rose-500/20",
    iconColor: "text-pink-400",
  },
  {
    icon: Wand2,
    title: "Latest AI Models",
    description:
      "Powered by Groq's Llama 3.3 70B and OpenAI GPT-4o — always using the best available model.",
    gradient: "from-violet-500/20 to-indigo-500/20",
    iconColor: "text-violet-400",
  },
];

/* ─── Stats ──────────────────────────────────────────────────────────────── */
const stats = [
  { value: "10x", label: "Faster reviews" },
  { value: "99%", label: "Uptime SLA" },
  { value: "50k+", label: "PRs reviewed" },
  { value: "0", label: "Credit card needed" },
];

/* ─── How it works ───────────────────────────────────────────────────────── */
const steps = [
  {
    step: "01",
    icon: GitHubIcon,
    title: "Connect GitHub",
    description:
      "Sign in with GitHub OAuth and select which repositories to enable AI reviews on.",
  },
  {
    step: "02",
    icon: GitPullRequest,
    title: "Open a Pull Request",
    description:
      "CodeReviewAI triggers automatically on every new PR. No manual action needed.",
  },
  {
    step: "03",
    icon: GitMerge,
    title: "Merge with Confidence",
    description:
      "Review AI suggestions, address issues inline, and ship better code faster.",
  },
];

/* ─── Main Component ─────────────────────────────────────────────────────── */
export function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* ─── Nav ──────────────────────────────────────────────────────────── */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: easeCubic }}
        className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5"
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/30 group-hover:ring-primary/60 transition-all duration-300">
              <Code2 className="h-4 w-4 text-primary" />
            </div>
            <span className="font-semibold tracking-tight text-sm">
              CodeReview<span className="text-gradient">AI</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {["Features", "How it works"].map((item) => (
              <button
                key={item}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-white/5"
              >
                {item}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-muted-foreground hover:text-foreground"
            >
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button
              size="sm"
              asChild
              className="bg-primary hover:bg-primary/90 text-primary-foreground glow-primary transition-all duration-300 hover:scale-105"
            >
              <Link href="/sign-up">
                Get started
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </motion.header>

      <main>
        {/* ─── Hero ─────────────────────────────────────────────────────── */}
        <section
          ref={heroRef}
          className="relative min-h-screen flex items-center justify-center overflow-hidden"
        >
          {/* Background grid */}
          <div className="absolute inset-0 bg-grid opacity-100" />

          {/* Radial fade overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,oklch(0.67_0.23_280/18%),transparent)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_80%,oklch(0.72_0.19_200/10%),transparent)]" />

          {/* Floating orbs */}
          <Orb
            className="left-[15%] top-[20%] w-64 h-64 bg-primary/10 blur-3xl"
            delay={0}
          />
          <Orb
            className="right-[15%] top-[30%] w-80 h-80 bg-accent/8 blur-3xl"
            delay={2}
          />
          <Orb
            className="left-[40%] bottom-[15%] w-72 h-72 bg-primary/8 blur-3xl"
            delay={4}
          />

          <motion.div
            style={{ opacity: heroOpacity, y: heroY }}
            className="relative z-10 mx-auto max-w-4xl px-6 pt-24 text-center"
          >
            {/* Badge */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0}
              className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-4 py-1.5 text-xs font-medium text-primary mb-8"
            >
              <Sparkles className="h-3 w-3" />
              AI-Powered Code Review Platform
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.1}
              className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl leading-[1.1]"
            >
              Ship better code,
              <br />
              <span className="text-gradient">faster than ever</span>
            </motion.h1>

            {/* Subtext */}
            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.2}
              className="mx-auto mt-7 max-w-2xl text-lg text-muted-foreground leading-relaxed"
            >
              Automated AI code reviews that catch bugs, security issues, and
              maintainability problems before they reach production. Integrates
              directly into your GitHub workflow.
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.3}
              className="mt-10 flex flex-wrap items-center justify-center gap-3"
            >
              <Button
                size="lg"
                asChild
                className="h-12 px-7 bg-primary hover:bg-primary/90 glow-primary text-primary-foreground font-semibold transition-all duration-300 hover:scale-105"
              >
                <Link href="/sign-up">
                  Start for free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="h-12 px-7 border-white/10 bg-white/5 hover:bg-white/10 text-foreground transition-all duration-300"
              >
                <Link href="/sign-in">
                  <GitHubIcon className="h-4 w-4" />
                  Sign in with GitHub
                </Link>
              </Button>
            </motion.div>

            {/* Trust signals */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.4}
              className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground"
            >
              {[
                "No credit card required",
                "GitHub integration",
                "Private repos supported",
              ].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  {item}
                </span>
              ))}
            </motion.div>

            {/* Code preview card */}
            <motion.div
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              custom={0.5}
              className="mt-16 mx-auto max-w-2xl"
            >
              <div className="glass-card rounded-2xl p-5 sm:p-6 text-left shadow-2xl shadow-black/40 ring-1 ring-white/10">
                {/* Terminal dots */}
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/70" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <span className="rounded-md bg-black/20 px-2.5 py-1 text-[11px] sm:text-xs text-foreground/85 font-mono tracking-wide">
                      AI Review · PR #142 · auth/login.ts
                    </span>
                  </div>
                </div>

                {/* Mock review output */}
                <div className="space-y-4 font-mono text-sm leading-relaxed">
                  <div className="flex items-start gap-3 rounded-lg bg-black/10 p-2.5 sm:p-3">
                    <span className="shrink-0 mt-0.5 px-2 py-0.5 rounded bg-red-500/20 text-red-300 text-[11px] font-semibold">
                      HIGH
                    </span>
                    <div>
                      <div className="text-foreground">
                        SQL injection vulnerability detected
                      </div>
                      <div className="text-muted-foreground mt-1 text-xs sm:text-sm">
                        Line 47 — Use parameterized queries instead of string
                        interpolation
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-lg bg-black/10 p-2.5 sm:p-3">
                    <span className="shrink-0 mt-0.5 px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 text-[11px] font-semibold">
                      MED
                    </span>
                    <div>
                      <div className="text-foreground">
                        Password not hashed before storage
                      </div>
                      <div className="text-muted-foreground mt-1 text-xs sm:text-sm">
                        Line 83 — Use bcrypt with salt rounds ≥ 10
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-lg bg-black/10 p-2.5 sm:p-3">
                    <span className="shrink-0 mt-0.5 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold">
                      INFO
                    </span>
                    <div>
                      <div className="text-foreground">
                        Missing rate limiting on auth endpoint
                      </div>
                      <div className="text-muted-foreground mt-1 text-xs sm:text-sm">
                        Consider adding express-rate-limit middleware
                      </div>
                    </div>
                  </div>
                </div>

                {/* Risk score bar */}
                <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs sm:text-sm text-muted-foreground mb-1.5">
                      <span>Risk Score</span>
                      <span className="text-red-300 font-semibold">78/100</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "78%" }}
                        transition={{ delay: 1, duration: 1.2, ease: "easeOut" }}
                        className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-red-500"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                    <Star className="h-3.5 w-3.5 text-yellow-300" />
                    <span className="font-mono">3 issues</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* ─── Stats ────────────────────────────────────────────────────── */}
        <section className="relative border-y border-white/5 bg-white/2">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <RevealSection className="grid grid-cols-2 gap-8 lg:grid-cols-4">
              {stats.map((stat) => (
                <motion.div
                  key={stat.label}
                  variants={fadeUp}
                  className="text-center"
                >
                  <div className="text-4xl font-bold tracking-tight text-gradient">
                    {stat.value}
                  </div>
                  <div className="mt-1.5 text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </RevealSection>
          </div>
        </section>

        {/* ─── Features ─────────────────────────────────────────────────── */}
        <section id="features" className="relative py-28">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,oklch(0.67_0.23_280/6%),transparent)]" />

          <div className="relative mx-auto max-w-6xl px-6">
            <RevealSection className="text-center mb-16">
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-medium text-primary mb-5">
                <Sparkles className="h-3 w-3" />
                Features
              </motion.div>
              <motion.h2 variants={fadeUp} className="text-3xl font-bold tracking-tight sm:text-4xl">
                Everything you need for
                <br />
                <span className="text-gradient">better code reviews</span>
              </motion.h2>
              <motion.p variants={fadeUp} className="mt-4 text-muted-foreground max-w-xl mx-auto">
                Focus on building great products. Let AI handle the repetitive,
                time-consuming review work.
              </motion.p>
            </RevealSection>

            <RevealSection className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    variants={scaleIn}
                    custom={i * 0.05}
                    whileHover={{ y: -4, scale: 1.01 }}
                    transition={{ duration: 0.25 }}
                    className="group relative rounded-2xl border border-white/6 bg-white/3 p-6 overflow-hidden cursor-default"
                  >
                    {/* Card glow on hover */}
                    <div
                      className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                    />
                    <div className="relative">
                      <div
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} ring-1 ring-white/8 mb-4`}
                      >
                        <Icon className={`h-5 w-5 ${feature.iconColor}`} />
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </RevealSection>
          </div>
        </section>

        {/* ─── How it works ─────────────────────────────────────────────── */}
        <section
          id="how-it-works"
          className="relative py-28 border-t border-white/5"
        >
          <div className="absolute inset-0 bg-grid opacity-40" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_100%,oklch(0.72_0.19_200/8%),transparent)]" />

          <div className="relative mx-auto max-w-6xl px-6">
            <RevealSection className="text-center mb-16">
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-3.5 py-1 text-xs font-medium text-accent mb-5">
                <ChevronRight className="h-3 w-3" />
                How it works
              </motion.div>
              <motion.h2 variants={fadeUp} className="text-3xl font-bold tracking-tight sm:text-4xl">
                Up and running
                <br />
                <span className="text-gradient">in minutes</span>
              </motion.h2>
              <motion.p variants={fadeUp} className="mt-4 text-muted-foreground max-w-md mx-auto">
                Three simple steps to transform your code review process.
              </motion.p>
            </RevealSection>

            <RevealSection className="grid gap-8 lg:grid-cols-3 relative">
              {/* Connecting line */}
              <div className="hidden lg:block absolute top-16 left-[33%] right-[33%] h-px bg-gradient-to-r from-primary/40 via-accent/40 to-primary/40" />

              {steps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.step}
                    variants={fadeUp}
                    custom={i * 0.15}
                    className="relative flex flex-col items-center text-center p-6"
                  >
                    {/* Step number */}
                    <div className="relative mb-6">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl glass-card ring-1 ring-primary/25 glow-primary">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                        {step.step.slice(-1)}
                      </div>
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                      {step.description}
                    </p>
                  </motion.div>
                );
              })}
            </RevealSection>
          </div>
        </section>

        {/* ─── CTA Banner ───────────────────────────────────────────────── */}
        <section className="relative py-28 border-t border-white/5 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_50%_50%,oklch(0.67_0.23_280/12%),transparent)]" />
          <Orb
            className="left-[10%] top-[20%] w-96 h-96 bg-primary/8 blur-3xl"
            delay={0}
          />
          <Orb
            className="right-[10%] bottom-[20%] w-80 h-80 bg-accent/8 blur-3xl"
            delay={3}
          />

          <RevealSection className="relative mx-auto max-w-3xl px-6 text-center">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-4 py-1.5 text-xs font-medium text-primary mb-7">
              <Star className="h-3 w-3" />
              Free to start. No limits on repos.
            </motion.div>
            <motion.h2
              variants={fadeUp}
              className="text-4xl font-bold tracking-tight sm:text-5xl"
            >
              Ready to review smarter?
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="mt-5 text-muted-foreground text-lg max-w-xl mx-auto"
            >
              Join developers shipping better code with AI. Connect your
              GitHub in under 60 seconds.
            </motion.p>
            <motion.div
              variants={fadeUp}
              className="mt-10 flex flex-wrap items-center justify-center gap-3"
            >
              <Button
                size="lg"
                asChild
                className="h-12 px-8 bg-primary hover:bg-primary/90 glow-primary text-primary-foreground font-semibold transition-all duration-300 hover:scale-105"
              >
                <Link href="/sign-up">
                  Get started for free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="ghost"
                asChild
                className="h-12 text-muted-foreground hover:text-foreground"
              >
                <Link href="/sign-in">Already have an account →</Link>
              </Button>
            </motion.div>
          </RevealSection>
        </section>
      </main>

      {/* ─── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-10">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 ring-1 ring-primary/25">
              <Code2 className="h-3 w-3 text-primary" />
            </div>
            <span className="font-medium text-foreground/70">
              CodeReview<span className="text-gradient">AI</span>
            </span>
            <span className="text-muted-foreground/50">·</span>
            <span>© 2025</span>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/sign-in"
              className="hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="hover:text-foreground transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
