"use client";

import { motion } from "framer-motion";
import {
  Zap,
  Shield,
  MessageSquare,
  GitPullRequest,
  ScanSearch,
  Wand2,
  Code2,
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Instant Feedback",
    description:
      "Get comprehensive code reviews in seconds, not hours. Ship faster without sacrificing quality.",
    gradient: "from-yellow-500 to-orange-500",
  },
  {
    icon: Shield,
    title: "Security Scanning",
    description:
      "Automatically detect vulnerabilities, exposed secrets, and security anti-patterns in your code.",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: MessageSquare,
    title: "Clear Suggestions",
    description:
      "Receive actionable, contextual feedback you can understand and apply immediately.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: GitPullRequest,
    title: "PR Integration",
    description:
      "Reviews appear directly in your pull requests. No context switching needed.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: ScanSearch,
    title: "Context Aware",
    description:
      "Understands your codebase patterns, coding style, and project-specific conventions.",
    gradient: "from-rose-500 to-red-500",
  },
  {
    icon: Wand2,
    title: "Always Improving",
    description:
      "Powered by the latest AI models. Gets smarter and more accurate over time.",
    gradient: "from-indigo-500 to-violet-500",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

/**
 * Features section with glass-effect cards and hover animations.
 * Showcases the main product features.
 * @returns JSX.Element - Features section component
 */
export function FeaturesSection() {
  return (
    <section className="border-t border-border/40 py-24">
      <div className="mx-auto max-w-6xl px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary mb-4">
            <Code2 className="h-4 w-4" />
            Features
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need for{" "}
            <span className="text-gradient-animated">better reviews</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Focus on building amazing products. Let AI handle the repetitive
            code review work.
          </p>
        </motion.div>

        {/* Features grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="group relative"
            >
              {/* Card */}
              <div className="glass-card h-full rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:border-primary/30">
                {/* Icon with gradient background */}
                <div
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient}`}
                >
                  <feature.icon className="h-6 w-6 text-white" />
                </div>

                {/* Content */}
                <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover gradient overlay */}
                <div
                  className={`absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-10`}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
