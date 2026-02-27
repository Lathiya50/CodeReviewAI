"use client";

import { Cell, Pie, PieChart } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

interface RiskData {
  range: string;
  count: number;
  fill: string;
}

interface RiskDistributionProps {
  data: RiskData[];
  isLoading?: boolean;
}

const chartConfig = {
  low: {
    label: "Low (0–30)",
    color: "hsl(142.1 76.2% 36.3%)",
  },
  medium: {
    label: "Medium (31–60)",
    color: "hsl(37.7 92.1% 50.2%)",
  },
  high: {
    label: "High (61–100)",
    color: "hsl(0 72.2% 50.6%)",
  },
  count: {
    label: "Reviews",
  },
} satisfies ChartConfig;

/**
 * RiskDistribution — donut PieChart with a centre total label and custom legend.
 * Low = green, Medium = amber, High = red.
 * @param data - array of { range, count, fill } from analytics.riskDistribution
 * @param isLoading - whether data is still loading
 */
export function RiskDistribution({
  data,
  isLoading = false,
}: RiskDistributionProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (isLoading) {
    return (
      <Card className="rounded-xl">
        <CardHeader className="px-6 pt-6 pb-4">
          <div className="space-y-2">
            <div className="h-4 w-36 animate-pulse rounded-md bg-muted" />
            <div className="h-3 w-48 animate-pulse rounded-md bg-muted" />
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="h-[260px] animate-pulse rounded-lg bg-muted" />
        </CardContent>
      </Card>
    );
  }

  if (total === 0) {
    return (
      <Card className="rounded-xl">
        <CardHeader className="px-6 pt-6 pb-4">
          <CardTitle className="text-base font-semibold">Risk Distribution</CardTitle>
          <CardDescription className="text-sm">Risk score breakdown of reviews</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[260px] items-center justify-center px-6 pb-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <span className="text-xl">📊</span>
            </div>
            <p className="text-sm font-medium text-muted-foreground">No completed reviews yet</p>
            <p className="text-xs text-muted-foreground/70">Risk data will appear here once reviews complete</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl">
      <CardHeader className="px-6 pt-6 pb-2">
        <CardTitle className="text-base font-semibold">Risk Distribution</CardTitle>
        <CardDescription className="mt-0.5 text-sm">
          Breakdown across {total} completed review{total !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6 pt-0">
        {/* Donut chart with overlaid centre label */}
        <div className="relative">
          <ChartContainer
            config={chartConfig}
            className="mx-auto h-[220px] w-full max-w-[260px]"
          >
            <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <ChartTooltip
                content={<ChartTooltipContent nameKey="range" hideLabel />}
              />
              <Pie
                data={data}
                dataKey="count"
                nameKey="range"
                cx="50%"
                cy="50%"
                innerRadius="52%"
                outerRadius="72%"
                paddingAngle={3}
                strokeWidth={0}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          {/* Absolutely centred total label */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold leading-none">{total}</span>
            <span className="mt-1 text-[11px] text-muted-foreground">total</span>
          </div>
        </div>

        {/* Legend pills */}
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          {data.map((d) => {
            const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
            return (
              <div
                key={d.range}
                className="flex items-center gap-2 rounded-full border border-border/50 bg-muted/30 px-3 py-1.5"
              >
                <div
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: d.fill }}
                />
                <span className="text-xs text-muted-foreground">{d.range}</span>
                <span className="text-xs font-semibold tabular-nums">
                  {d.count}
                  <span className="ml-1 text-muted-foreground/70">({pct}%)</span>
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
