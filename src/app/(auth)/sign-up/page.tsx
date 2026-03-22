"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, signUp } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Code2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  GitPullRequest,
  ChartLine,
  AlertCircle,
} from "lucide-react";
import { GitHubIcon } from "@/components/ui/github-icon";

const perks = [
  { icon: Sparkles, text: "Instant AI-powered code reviews" },
  { icon: ShieldCheck, text: "Automatic security vulnerability detection" },
  { icon: GitPullRequest, text: "Seamless GitHub PR integration" },
  { icon: ChartLine, text: "Analytics dashboard and risk scoring" },
];

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailSignUp = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    const result = await signUp.email({
      name,
      email,
      password,
    });

    if (result.error) {
      setError(result.error.message || "Something went wrong. Please try again.");
      setLoading(false);
    } else {
      router.push("/repos");
    }
  };

  const handleGithubSignUp = async () => {
    setError("");
    setLoading(true);
    await signIn.social({
      provider: "github",
      callbackURL: "/repos",
    });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-dot opacity-25" />
      <div className="pointer-events-none absolute -top-24 left-1/2 h-[540px] w-[760px] -translate-x-1/2 rounded-full bg-primary/[0.05] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-20 h-[420px] w-[420px] rounded-full bg-accent/[0.06] blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
          <motion.section
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="hidden lg:flex flex-col justify-between rounded-[2rem] border border-border/60 bg-gradient-to-br from-card via-card/95 to-primary/10 p-10 shadow-xl backdrop-blur-xl"
          >
            <div className="space-y-10">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 ring-1 ring-primary/25">
                  <Code2 className="h-5 w-5 text-primary" />
                </div>
                <span className="text-lg font-semibold tracking-tight text-foreground">
                  CodeReview<span className="text-gradient">AI</span>
                </span>
              </div>

              <div className="space-y-4">
                <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  Get started in minutes
                </p>
                <h1 className="max-w-xl text-4xl font-semibold leading-tight tracking-tight text-foreground">
                  Ship cleaner code from your very first merged pull request.
                </h1>
                <p className="max-w-lg text-base leading-relaxed text-muted-foreground">
                  Create your account, connect GitHub, and let AI generate structured,
                  actionable feedback before your reviewers even open the diff.
                </p>
              </div>

              <div className="grid gap-3">
                {perks.map((perk, index) => {
                  const Icon = perk.icon;
                  return (
                    <motion.div
                      key={perk.text}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + index * 0.08, duration: 0.45 }}
                      className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/60 px-4 py-3"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm text-foreground/85">{perk.text}</span>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-xl border border-border/60 bg-background/65 p-4">
                <p className="text-xl font-semibold text-foreground">5 min</p>
                <p className="mt-1 text-xs text-muted-foreground">Average onboarding</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/65 p-4">
                <p className="text-xl font-semibold text-foreground">24/7</p>
                <p className="mt-1 text-xs text-muted-foreground">Automated PR checks</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/65 p-4">
                <p className="text-xl font-semibold text-foreground">0$</p>
                <p className="mt-1 text-xs text-muted-foreground">Free to start</p>
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
            className="w-full"
          >
            <div className="mx-auto w-full max-w-md rounded-[2rem] border border-border/60 bg-card/90 p-6 shadow-2xl backdrop-blur-2xl sm:p-8">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2 lg:hidden">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
                    <Code2 className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-base font-semibold text-foreground">
                    CodeReview<span className="text-gradient">AI</span>
                  </span>
                </div>
                <div className="ml-auto inline-flex rounded-full border border-border/60 bg-muted/60 p-1 text-xs font-medium">
                  <Link href="/sign-in" className="px-3 py-1 text-muted-foreground transition hover:text-foreground">
                    Sign in
                  </Link>
                  <span className="rounded-full bg-background px-3 py-1 text-foreground shadow-sm">Sign up</span>
                </div>
              </div>

              <div className="mb-6 space-y-2">
                <h2 className="text-3xl font-semibold tracking-tight text-foreground">Create account</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Set up your workspace and start reviewing repositories with AI.
                </p>
              </div>

              <Button
                variant="outline"
                className="h-11 w-full border-border/60 bg-background/70 font-medium text-foreground hover:bg-muted/70"
                onClick={handleGithubSignUp}
                disabled={loading}
              >
                <GitHubIcon className="h-4 w-4" />
                Continue with GitHub
              </Button>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full opacity-25" />
                </div>
                <div className="relative flex justify-center">
                  <span className="rounded-full bg-card px-3 text-xs text-muted-foreground">or use email</span>
                </div>
              </div>

              <form onSubmit={handleEmailSignUp} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-sm font-medium text-foreground/90">
                    Full name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Alex Carter"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    required
                    className="h-11 border-border/60 bg-background/70 placeholder:text-muted-foreground/70 focus-visible:border-primary/55 focus-visible:ring-primary/35"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground/90">
                    Work email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                    className="h-11 border-border/60 bg-background/70 placeholder:text-muted-foreground/70 focus-visible:border-primary/55 focus-visible:ring-primary/35"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground/90">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimum 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    minLength={8}
                    className="h-11 border-border/60 bg-background/70 placeholder:text-muted-foreground/70 focus-visible:border-primary/55 focus-visible:ring-primary/35"
                  />
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/15 px-3 py-2.5 text-sm text-red-200"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}

                <Button
                  type="submit"
                  className="h-11 w-full bg-gradient-to-r from-primary to-accent text-primary-foreground transition hover:opacity-90"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Creating account...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Create account
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>

              <div className="mt-6 rounded-xl border border-border/60 bg-background/65 p-3 text-xs text-muted-foreground">
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  No credit card required. You can switch to GitHub auth anytime.
                </p>
              </div>

              <p className="mt-5 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/sign-in" className="font-medium text-foreground transition hover:text-primary">
                  Sign in
                </Link>
              </p>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
