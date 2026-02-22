"use client";

import { motion } from "framer-motion";
import { GitPullRequest, Users, Star, Zap } from "lucide-react";

const stats = [
  {
    icon: Users,
    value: "10,000+",
    label: "Developers",
  },
  {
    icon: GitPullRequest,
    value: "500K+",
    label: "PRs Reviewed",
  },
  {
    icon: Zap,
    value: "< 30s",
    label: "Avg Review Time",
  },
  {
    icon: Star,
    value: "4.9/5",
    label: "User Rating",
  },
];

/**
 * Social proof section with stats and company logos.
 * Builds credibility and trust with potential users.
 * @returns JSX.Element - Social proof section component
 */
export function SocialProof() {
  return (
    <section className="border-t border-border/40 bg-muted/20">
      <div className="mx-auto max-w-6xl px-6 py-16">
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="text-2xl font-bold tracking-tight sm:text-3xl">
                {stat.value}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
