"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle, Sparkles, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedBackground } from "./animated-background";
import { CodeReviewMockup } from "./code-review-mockup";

/**
 * Hero section with animated gradient text, floating code mockup, and CTAs.
 * @returns JSX.Element - Hero section component
 */
export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      <AnimatedBackground />

      <div className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          {/* Left column - Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            {/* Trust badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground mb-6"
            >
              <Sparkles className="h-4 w-4 text-yellow-500" />
              <span>Trusted by 10,000+ developers</span>
            </motion.div>

            {/* Headline */}
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Ship better code,
              <br />
              <span className="text-gradient-animated">faster</span>
            </h1>

            {/* Subheadline */}
            <p className="mt-6 max-w-lg text-lg text-muted-foreground leading-relaxed mx-auto lg:mx-0">
              AI-powered code reviews that catch bugs, security vulnerabilities,
              and maintainability issues before they reach production.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Button size="lg" className="w-full sm:w-auto group" asChild>
                <Link href="/sign-up">
                  Start for free
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto"
                asChild
              >
                <Link href="/sign-in">
                  <Play className="mr-2 h-4 w-4" />
                  Watch demo
                </Link>
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-3 text-sm text-muted-foreground">
              {[
                "Free forever plan",
                "No credit card required",
                "5 minute setup",
              ].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  {item}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Right column - Code mockup */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative hidden lg:block"
          >
            <CodeReviewMockup />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
