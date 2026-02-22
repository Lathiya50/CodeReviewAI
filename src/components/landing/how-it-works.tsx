"use client";

import { motion } from "framer-motion";
import { Github, GitPullRequest, GitMerge, ArrowRight } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Github,
    title: "Connect GitHub",
    description:
      "Sign in with GitHub and select which repositories you want to enable. Takes less than a minute.",
  },
  {
    number: "02",
    icon: GitPullRequest,
    title: "Open a Pull Request",
    description:
      "Push your code and open a PR as usual. CodeReviewAI automatically triggers on every pull request.",
  },
  {
    number: "03",
    icon: GitMerge,
    title: "Merge with Confidence",
    description:
      "Review AI suggestions, address issues, and ship knowing your code has been thoroughly checked.",
  },
];

/**
 * How it works section with visual timeline.
 * Shows the 3-step process to get started.
 * @returns JSX.Element - How it works section component
 */
export function HowItWorks() {
  return (
    <section className="border-t border-border/40 bg-muted/30 py-24">
      <div className="mx-auto max-w-6xl px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary mb-4">
            <ArrowRight className="h-4 w-4" />
            How it works
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Up and running in{" "}
            <span className="text-gradient-animated">minutes</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Three simple steps to better code reviews. No complex setup
            required.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="mt-16 relative">
          {/* Connection line */}
          <div className="absolute top-24 left-0 right-0 hidden lg:block">
            <div className="mx-auto max-w-3xl">
              <div className="h-0.5 bg-gradient-to-r from-transparent via-border to-transparent" />
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative text-center"
              >
                {/* Step number badge */}
                <div className="inline-block mb-6">
                  <div className="relative">
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                    {/* Icon circle */}
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-background border-2 border-primary/30 shadow-lg">
                      <step.icon className="h-8 w-8 text-primary" />
                    </div>
                    {/* Step number */}
                    <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      {index + 1}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold">{step.title}</h3>
                <p className="mt-3 text-muted-foreground leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>

                {/* Arrow connector for mobile */}
                {index < steps.length - 1 && (
                  <div className="flex justify-center mt-6 lg:hidden">
                    <ArrowRight className="h-6 w-6 text-muted-foreground/30 rotate-90" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
