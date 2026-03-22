"use client";

import CalendarHeatmap from "react-calendar-heatmap";
import "./activity-heatmap.css";
import { ChartSkeleton } from "@/components/shimmer-skeleton";

interface HeatmapValue {
  date: string;
  count: number;
  week: number;
  day: number;
}

interface ActivityHeatmapProps {
  data: HeatmapValue[] | undefined;
  isLoading: boolean;
}

function getHeatmapLevel(count: number): number {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 10) return 3;
  return 4;
}

export function ActivityHeatmap({ data, isLoading }: ActivityHeatmapProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5">
        <ChartSkeleton />
      </div>
    );
  }

  const today = new Date();
  const startDate = new Date(today);
  startDate.setFullYear(startDate.getFullYear() - 1);

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Review Activity</h3>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <span
              key={level}
              className={`heatmap-legend-${level} h-2.5 w-2.5 rounded-sm`}
            />
          ))}
          <span>More</span>
        </div>
      </div>

      <div className="heatmap-container overflow-x-auto">
        <CalendarHeatmap
          startDate={startDate}
          endDate={today}
          values={data || []}
          classForValue={(value) => {
            if (!value || !value.count) return "heatmap-day-0";
            return `heatmap-day-${getHeatmapLevel(value.count)}`;
          }}
          titleForValue={(value) => {
            if (!value) return "No reviews";
            return `${value.count} review${value.count !== 1 ? "s" : ""} on ${value.date}`;
          }}
          gutterSize={3}
        />
      </div>
    </div>
  );
}
