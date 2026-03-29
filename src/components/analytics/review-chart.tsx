"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartSkeleton } from "@/components/shimmer-skeleton";

interface ReviewChartProps {
  data: { date: string; reviews: number }[] | undefined;
  isLoading: boolean;
  range: "7d" | "30d" | "90d";
  onRangeChange: (range: "7d" | "30d" | "90d") => void;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/60 bg-card/95 backdrop-blur-xl px-3 py-2 shadow-xl">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{payload[0].value} reviews</p>
    </div>
  );
}

export function ReviewChart({ data, isLoading, range, onRangeChange }: ReviewChartProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5">
        <ChartSkeleton />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Review Trend</h3>
        <div className="flex items-center gap-1 rounded-lg bg-muted/50 p-0.5">
          {(["7d", "30d", "90d"] as const).map((r) => (
            <button
              key={r}
              onClick={() => onRangeChange(r)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${r === range ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[250px]">
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.67 0.23 280)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="oklch(0.67 0.23 280)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.02 268 / 30%)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="oklch(0.5 0.02 268)" />
              <YAxis tick={{ fontSize: 11 }} stroke="oklch(0.5 0.02 268)" allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="reviews"
                stroke="oklch(0.67 0.23 280)"
                strokeWidth={2}
                fill="url(#chartGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            No review data for this period.
          </div>
        )}
      </div>
    </div>
  );
}
