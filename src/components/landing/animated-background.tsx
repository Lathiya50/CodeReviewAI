"use client";

import { motion } from "framer-motion";

/**
 * Animated gradient background with floating orbs.
 * Creates a subtle, dynamic backdrop for the hero section.
 * @returns JSX.Element - Animated background component
 */
export function AnimatedBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      {/* Primary gradient orb */}
      <motion.div
        className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-purple-500/20 via-pink-500/10 to-transparent blur-3xl"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Secondary gradient orb */}
      <motion.div
        className="absolute right-0 top-1/4 h-[400px] w-[400px] translate-x-1/2 rounded-full bg-gradient-to-bl from-blue-500/15 via-cyan-500/10 to-transparent blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          x: [0, -20, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Tertiary accent orb */}
      <motion.div
        className="absolute bottom-0 left-1/4 h-[300px] w-[300px] -translate-x-1/2 translate-y-1/2 rounded-full bg-gradient-to-tr from-emerald-500/10 via-teal-500/5 to-transparent blur-3xl"
        animate={{
          scale: [1, 1.15, 1],
          y: [0, -15, 0],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
}
