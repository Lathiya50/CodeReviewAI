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
      iconColor: data.avgRiskScore <= 30 ? "text-success" : data.avgRiskScore <= 60 ? "text-warning" : "text-danger",
      iconBg: data.avgRiskScore <= 30 ? "bg-success/10 ring-success/20" : data.avgRiskScore <= 60 ? "bg-warning/10 ring-warning/20" : "bg-danger/10 ring-danger/20",
    },
    {
      title: "Pass Rate",
      value: data.passRate,
      suffix: "%",
      decimals: 1,
      icon: CheckCircle,
      iconColor: data.passRate >= 80 ? "text-success" : data.passRate >= 50 ? "text-warning" : "text-danger",
      iconBg: data.passRate >= 80 ? "bg-success/10 ring-success/20" : data.passRate >= 50 ? "bg-warning/10 ring-warning/20" : "bg-danger/10 ring-danger/20",
    },
    {
      title: "Failed Reviews",
      value: data.failed,
      icon: XCircle,
      iconColor: data.failed === 0 ? "text-success" : "text-danger",
      iconBg: data.failed === 0 ? "bg-success/10 ring-success/20" : "bg-danger/10 ring-danger/20",
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
            className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-all"
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
