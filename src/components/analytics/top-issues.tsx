"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ChartSkeleton } from "@/components/shimmer-skeleton";

interface TopIssuesProps {
  data: { category: string; count: number }[] | undefined;
  isLoading: boolean;
}

const BAR_COLORS = [
  "oklch(0.67 0.23 280)",
  "oklch(0.72 0.19 200)",
  "oklch(0.65 0.2 240)",
  "oklch(0.62 0.2 310)",
  "oklch(0.75 0.16 160)",
];

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/60 bg-card/95 backdrop-blur-xl px-3 py-2 shadow-xl">
      <p className="text-xs text-muted-foreground capitalize">{label}</p>
      <p className="text-sm font-semibold">{payload[0].value} issues</p>
    </div>
  );
}

export function TopIssues({ data, isLoading }: TopIssuesProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5">
        <ChartSkeleton />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5">
      <h3 className="text-sm font-semibold mb-4">Top Issues</h3>

      {!data || data.length === 0 ? (
        <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
          No issue data available.
        </div>
      ) : (
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 0, right: 5, left: 0, bottom: 0 }}
            >
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="oklch(0.5 0.02 268)" allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="category"
                tick={{ fontSize: 11 }}
                stroke="oklch(0.5 0.02 268)"
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                {data.map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
