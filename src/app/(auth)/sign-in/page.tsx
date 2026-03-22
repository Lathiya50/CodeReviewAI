"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  AlertCircle,
} from "lucide-react";
import { GitHubIcon } from "@/components/ui/github-icon";

const brandPoints = [
  { icon: Sparkles, text: "AI reviews in seconds, not hours" },
  { icon: ShieldCheck, text: "Security vulnerabilities caught automatically" },
  { icon: GitPullRequest, text: "Inline comments right in GitHub PRs" },
];

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/repos";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEmailSignIn = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn.email({ email, password, rememberMe });

    if (result.error) {
      setError(result.error.message || "Invalid credentials. Please try again.");
      setLoading(false);
    } else {
      router.push(callbackUrl);
    }
  };

  const handleGithubSignIn = async () => {
    setError("");
    setLoading(true);
    await signOut();
    await signIn.social({ provider: "github", callbackURL: callbackUrl });
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
                  Trusted by engineering teams
                </p>
                <h1 className="max-w-xl text-4xl font-semibold leading-tight tracking-tight text-foreground">
                  Review every pull request with confidence, speed, and less manual effort.
                </h1>
                <p className="max-w-lg text-base leading-relaxed text-muted-foreground">
                  Keep your delivery velocity high while AI scans for bugs, risky patterns, and
                  security issues before merge.
                </p>
              </div>

              <div className="space-y-4">
                {brandPoints.map((point, index) => {
                  const Icon = point.icon;
                  return (
                    <motion.div
                      key={point.text}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + index * 0.08, duration: 0.45 }}
                      className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/60 px-4 py-3"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm text-foreground/85">{point.text}</span>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-xl border border-border/60 bg-background/65 p-4">
                <p className="text-xl font-semibold text-foreground">42%</p>
                <p className="mt-1 text-xs text-muted-foreground">Less review turnaround</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/65 p-4">
                <p className="text-xl font-semibold text-foreground">2.3x</p>
                <p className="mt-1 text-xs text-muted-foreground">Higher issue detection</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/65 p-4">
                <p className="text-xl font-semibold text-foreground">99.9%</p>
                <p className="mt-1 text-xs text-muted-foreground">Webhook reliability</p>
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
                  <span className="rounded-full bg-background px-3 py-1 text-foreground shadow-sm">Sign in</span>
                  <Link href="/sign-up" className="px-3 py-1 text-muted-foreground transition hover:text-foreground">
                    Sign up
                  </Link>
                </div>
              </div>

              <div className="mb-6 space-y-2">
                <h2 className="text-3xl font-semibold tracking-tight text-foreground">Welcome back</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Continue to your workspace and review incoming pull requests.
                </p>
              </div>

              <Button
                variant="outline"
                className="h-11 w-full border-border/60 bg-background/70 font-medium text-foreground hover:bg-muted/70"
                onClick={handleGithubSignIn}
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

              <form onSubmit={handleEmailSignIn} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground/90">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
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
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    className="h-11 border-border/60 bg-background/70 placeholder:text-muted-foreground/70 focus-visible:border-primary/55 focus-visible:ring-primary/35"
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="rememberMe" className="flex cursor-pointer items-center gap-2 text-sm font-normal text-muted-foreground">
                    <Checkbox
                      id="rememberMe"
                      checked={rememberMe}
                      onCheckedChange={(value) => setRememberMe(Boolean(value))}
                      disabled={loading}
                      className="border-border/80 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                    />
                    Keep me signed in
                  </Label>
                  <span className="text-xs text-muted-foreground">7-day session</span>
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
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Sign in
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>

              <div className="mt-6 rounded-xl border border-border/60 bg-background/65 p-3 text-xs text-muted-foreground">
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  You can connect repositories and run your first review in under 2 minutes.
                </p>
              </div>

              <p className="mt-5 text-center text-sm text-muted-foreground">
                New to CodeReviewAI?{" "}
                <Link href="/sign-up" className="font-medium text-foreground transition hover:text-primary">
                  Create account
                </Link>
              </p>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
