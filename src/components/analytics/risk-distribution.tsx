"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { ChartSkeleton } from "@/components/shimmer-skeleton";

interface RiskItem {
  range: string;
  count: number;
  fill: string;
}

interface RiskDistributionProps {
  data: RiskItem[] | undefined;
  isLoading: boolean;
}

export function RiskDistribution({ data, isLoading }: RiskDistributionProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5">
        <ChartSkeleton />
      </div>
    );
  }

  const chartData = data
    ? data.filter((d) => d.count > 0).map((d) => ({ name: d.range, value: d.count, fill: d.fill }))
    : [];

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5">
      <h3 className="text-sm font-semibold mb-4">Risk Distribution</h3>

      {total === 0 ? (
        <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
          No risk data available.
        </div>
      ) : (
        <>
          <div className="relative h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={entry.fill}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold">{total}</span>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Total</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 mt-3">
            {chartData.map((entry) => (
              <span key={entry.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: entry.fill }}
                />
                {entry.name} ({entry.value})
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
