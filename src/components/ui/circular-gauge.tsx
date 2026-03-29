"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CircularGaugeProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  label?: string;
}

function getGaugeColor(value: number): string {
  if (value <= 30) return "stroke-emerald-500";
  if (value <= 60) return "stroke-amber-500";
  return "stroke-red-500";
}

function getGaugeBg(value: number): string {
  if (value <= 30) return "text-emerald-500";
  if (value <= 60) return "text-amber-500";
  return "text-red-500";
}

export function CircularGauge({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  className,
  label,
}: CircularGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min(value / max, 1);
  const offset = circumference - percentage * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          className="stroke-muted/40"
        />
        {/* Animated fill */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          className={getGaugeColor(value)}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <motion.span
          className={cn("text-2xl font-bold tabular-nums", getGaugeBg(value))}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          {value}
        </motion.span>
        {label && (
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
