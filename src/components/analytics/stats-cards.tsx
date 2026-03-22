"use client";

import { motion } from "framer-motion";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { BarChart2, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { StatCardSkeleton } from "@/components/shimmer-skeleton";

interface StatsData {
  total: number;
  avgRiskScore: number;
  passRate: number;
  failed: number;
}

interface StatsCardsProps {
  data: StatsData | undefined;
  isLoading: boolean;
}

export function StatsCards({ data, isLoading }: StatsCardsProps) {
  if (isLoading || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total Reviews",
      value: data.total,
      icon: BarChart2,
      iconColor: "text-primary",
      iconBg: "bg-primary/10 ring-primary/20",
    },
    {
      title: "Avg Risk Score",
      value: data.avgRiskScore,
      decimals: 1,
      icon: AlertTriangle,
      iconColor: data.avgRiskScore <= 30 ? "text-emerald-500" : data.avgRiskScore <= 60 ? "text-amber-500" : "text-red-500",
      iconBg: data.avgRiskScore <= 30 ? "bg-emerald-500/10 ring-emerald-500/20" : data.avgRiskScore <= 60 ? "bg-amber-500/10 ring-amber-500/20" : "bg-red-500/10 ring-red-500/20",
    },
    {
      title: "Pass Rate",
      value: data.passRate,
      suffix: "%",
      decimals: 1,
      icon: CheckCircle,
      iconColor: data.passRate >= 80 ? "text-emerald-500" : data.passRate >= 50 ? "text-amber-500" : "text-red-500",
      iconBg: data.passRate >= 80 ? "bg-emerald-500/10 ring-emerald-500/20" : data.passRate >= 50 ? "bg-amber-500/10 ring-amber-500/20" : "bg-red-500/10 ring-red-500/20",
    },
    {
      title: "Failed Reviews",
      value: data.failed,
      icon: XCircle,
      iconColor: data.failed === 0 ? "text-emerald-500" : "text-red-500",
      iconBg: data.failed === 0 ? "bg-emerald-500/10 ring-emerald-500/20" : "bg-red-500/10 ring-red-500/20",
    },
  ];

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.title}
            variants={staggerItem}
            className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 hover:border-border/70 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground">{card.title}</span>
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.iconBg} ring-1`}>
                <Icon className={`h-4 w-4 ${card.iconColor}`} />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight">
              <AnimatedCounter
                end={card.value}
                decimals={card.decimals || 0}
                suffix={card.suffix || ""}
                duration={1.2}
              />
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
