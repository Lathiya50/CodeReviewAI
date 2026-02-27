"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  GitPullRequest,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatItem {
  label: string;
  value: number;
  suffix?: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

interface StatsCardsProps {
  total: number;
  completed: number;
  avgRiskScore: number;
  passRate: number;
  failed: number;
  isLoading?: boolean;
}

/**
 * AnimatedCounter — counts from 0 to target with ease-out cubic animation.
 * @param target - final numeric value
 * @param suffix - optional string appended after the number (e.g. "%")
 * @param duration - animation duration in ms (default 900)
 */
function AnimatedCounter({
  target,
  suffix = "",
  duration = 900,
}: {
  target: number;
  suffix?: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    startRef.current = null;

    const animate = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setCount(Math.round(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return (
    <>
      {count}
      {suffix}
    </>
  );
}

/**
 * StatsCards — four animated KPI cards displayed in a responsive 2×2 → 4-column grid.
 * @param total - total number of reviews
 * @param completed - number of completed reviews
 * @param avgRiskScore - average risk score (0–100)
 * @param passRate - percentage of passing reviews
 * @param failed - number of failed reviews
 * @param isLoading - whether data is still loading
 */
export function StatsCards({
  total,
  completed,
  avgRiskScore,
  passRate,
  failed,
  isLoading = false,
}: StatsCardsProps) {
  const stats: StatItem[] = [
    {
      label: "Total Reviews",
      value: total,
      description: `${completed} completed`,
      icon: GitPullRequest,
      colorClass: "text-blue-600 dark:text-blue-400",
      bgClass: "bg-blue-50 dark:bg-blue-950/50",
      borderClass: "border-blue-100 dark:border-blue-900/40",
    },
    {
      label: "Avg Risk Score",
      value: avgRiskScore,
      suffix: "/100",
      description: "across completed reviews",
      icon: ShieldCheck,
      colorClass:
        avgRiskScore > 60
          ? "text-red-600 dark:text-red-400"
          : avgRiskScore > 30
            ? "text-yellow-600 dark:text-yellow-400"
            : "text-emerald-600 dark:text-emerald-400",
      bgClass:
        avgRiskScore > 60
          ? "bg-red-50 dark:bg-red-950/50"
          : avgRiskScore > 30
            ? "bg-yellow-50 dark:bg-yellow-950/50"
            : "bg-emerald-50 dark:bg-emerald-950/50",
      borderClass:
        avgRiskScore > 60
          ? "border-red-100 dark:border-red-900/40"
          : avgRiskScore > 30
            ? "border-yellow-100 dark:border-yellow-900/40"
            : "border-emerald-100 dark:border-emerald-900/40",
    },
    {
      label: "Pass Rate",
      value: passRate,
      suffix: "%",
      description: "reviews with risk ≤ 60",
      icon: TrendingUp,
      colorClass:
        passRate >= 70
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-yellow-600 dark:text-yellow-400",
      bgClass:
        passRate >= 70
          ? "bg-emerald-50 dark:bg-emerald-950/50"
          : "bg-yellow-50 dark:bg-yellow-950/50",
      borderClass:
        passRate >= 70
          ? "border-emerald-100 dark:border-emerald-900/40"
          : "border-yellow-100 dark:border-yellow-900/40",
    },
    {
      label: "Failed Reviews",
      value: failed,
      description: "processing errors",
      icon: AlertTriangle,
      colorClass:
        failed > 0
          ? "text-red-600 dark:text-red-400"
          : "text-muted-foreground",
      bgClass: failed > 0 ? "bg-red-50 dark:bg-red-950/50" : "bg-muted/30",
      borderClass:
        failed > 0
          ? "border-red-100 dark:border-red-900/40"
          : "border-border/40",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse rounded-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="h-3.5 w-24 rounded-md bg-muted" />
                <div className="size-9 rounded-lg bg-muted" />
              </div>
            </CardHeader>
            <CardContent className="pb-6">
              <div className="h-9 w-20 rounded-md bg-muted" />
              <div className="mt-2 h-3 w-28 rounded-md bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.label}
            className={cn(
              "group rounded-xl border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
              stat.borderClass,
            )}
          >
            <CardHeader className="pb-3 pt-5 px-5">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-sm font-medium text-muted-foreground leading-snug">
                  {stat.label}
                </CardTitle>
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg",
                    stat.bgClass,
                  )}
                >
                  <Icon className={cn("size-4", stat.colorClass)} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className={cn("text-3xl font-bold tracking-tight", stat.colorClass)}>
                <AnimatedCounter
                  target={stat.value}
                  suffix={stat.suffix}
                  duration={900}
                />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
