"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
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
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ReviewTrendData {
  date: string;
  reviews: number;
}

interface ReviewChartProps {
  data: ReviewTrendData[];
  isLoading?: boolean;
}

const chartConfig = {
  reviews: {
    label: "Reviews",
    color: "hsl(221.2 83.2% 53.3%)",
  },
} satisfies ChartConfig;

type DayRange = 7 | 30 | 90;

/**
 * ReviewChart — area chart showing reviews triggered per day.
 * Includes a 7d / 30d / 90d range pill selector.
 * @param data - array of { date, reviews } covering 90 days
 * @param isLoading - whether data is loading
 */
export function ReviewChart({ data, isLoading = false }: ReviewChartProps) {
  const [range, setRange] = useState<DayRange>(30);

  const sliced = data.slice(-range);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const ranges: DayRange[] = [7, 30, 90];

  if (isLoading) {
    return (
      <Card className="rounded-xl">
        <CardHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="h-4 w-28 animate-pulse rounded-md bg-muted" />
              <div className="h-3 w-44 animate-pulse rounded-md bg-muted" />
            </div>
            <div className="h-8 w-28 animate-pulse rounded-lg bg-muted" />
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="h-[280px] animate-pulse rounded-lg bg-muted" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl">
      <CardHeader className="px-6 pt-6 pb-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold">Review Trend</CardTitle>
            <CardDescription className="mt-0.5 text-sm">
              Number of reviews triggered per day
            </CardDescription>
          </div>
          {/* Range selector */}
          <div className="flex gap-0.5 rounded-lg border border-border/60 bg-muted/40 p-0.5">
            {ranges.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150",
                  range === r
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {r}d
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6 pt-2">
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <AreaChart
            data={sliced}
            margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
          >
            <defs>
              <linearGradient id="reviewGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-reviews)"
                  stopOpacity={0.25}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-reviews)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/40" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              tickFormatter={formatDate}
              interval={range === 7 ? 0 : Math.floor(sliced.length / 6)}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              tickMargin={8}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) => {
                    const d = payload?.[0]?.payload?.date as string | undefined;
                    return d ? formatDate(d) : "";
                  }}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="reviews"
              stroke="var(--color-reviews)"
              strokeWidth={2.5}
              fill="url(#reviewGradient)"
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2 }}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
