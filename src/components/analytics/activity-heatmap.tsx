"use client";

import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import "@/components/analytics/activity-heatmap.css";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface HeatmapCell {
  date: string;
  count: number;
  week: number;
  day: number;
}

interface ActivityHeatmapProps {
  data: HeatmapCell[];
  isLoading?: boolean;
}

/** Value shape passed by react-calendar-heatmap to classForValue / titleForValue */
type HeatmapDayValue = { date: string; count?: number } | undefined;

/** Ordered intensity steps for the legend (count → level 0–4) */
const LEGEND_STEPS = [0, 1, 3, 5, 7] as const;

/**
 * Maps a contribution count to GitHub-style level (0–4) for CSS class heatmap-0 … heatmap-4.
 * @param count - number of contributions on that day
 * @returns level 0 (empty) through 4 (most)
 */
function getHeatmapLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0;
  if (count <= 1) return 1;
  if (count <= 3) return 2;
  if (count <= 5) return 3;
  return 4;
}

/**
 * Formats a date string (YYYY-MM-DD) for GitHub-style tooltip: "Month Day" (e.g. "Jan 15").
 */
function formatTooltipDate(dateStr: string): string {
  const d = new Date(dateStr + "Z");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * ActivityHeatmap — GitHub profile–style contribution graph (last 52 weeks).
 * Layout: weeks as columns, days as rows; tooltips and colors match GitHub.
 * @param data - array of { date, count, week, day } — 364 entries (52 weeks)
 * @param isLoading - whether data is loading
 */
export function ActivityHeatmap({
  data,
  isLoading = false,
}: ActivityHeatmapProps) {
  if (isLoading) {
    return (
      <Card className="rounded-xl">
        <CardHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="h-4 w-36 animate-pulse rounded-md bg-muted" />
              <div className="h-3 w-48 animate-pulse rounded-md bg-muted" />
            </div>
            <div className="h-6 w-36 animate-pulse rounded-md bg-muted" />
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="h-[120px] animate-pulse rounded-lg bg-muted" />
        </CardContent>
      </Card>
    );
  }

  const values = data.map((d) => ({ date: d.date, count: d.count }));
  const totalReviews = data.reduce((sum, d) => sum + d.count, 0);
  const startDate = data[0]?.date ?? new Date().toISOString().split("T")[0];
  const endDate =
    data[data.length - 1]?.date ?? new Date().toISOString().split("T")[0];

  return (
    <Card className="rounded-xl">
      <CardHeader className="px-6 pt-6 pb-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold">
              Contributions
            </CardTitle>
            <CardDescription className="mt-0.5 text-sm">
              {totalReviews} contribution{totalReviews !== 1 ? "s" : ""} in the
              last year
            </CardDescription>
          </div>
          {/* Legend — GitHub style: Less [squares] More */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Less</span>
            {LEGEND_STEPS.map((n) => {
              const level = getHeatmapLevel(n);
              return (
                <div
                  key={n}
                  className={cn(
                    "size-3 rounded-sm",
                    level === 0 && "bg-[#ebedf0] dark:bg-[#161b22]",
                    level === 1 && "bg-[#9be9a8] dark:bg-[#0e4429]",
                    level === 2 && "bg-[#40c463] dark:bg-[#006d32]",
                    level === 3 && "bg-[#30a14e] dark:bg-[#26a641]",
                    level === 4 && "bg-[#216e39] dark:bg-[#39d353]",
                  )}
                />
              );
            })}
            <span>More</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6 pt-3">
        <div className="activity-heatmap activity-heatmap-container overflow-x-auto">
          <CalendarHeatmap
            startDate={startDate}
            endDate={endDate}
            values={values}
            horizontal
            showMonthLabels
            showWeekdayLabels
            gutterSize={2}
            classForValue={(value: HeatmapDayValue) => {
              if (!value || value.count === 0) return "heatmap-0";
              return `heatmap-${getHeatmapLevel(value.count ?? 0)}`;
            }}
            titleForValue={(value: HeatmapDayValue) => {
              if (!value) return "";
              const count = value.count ?? 0;
              const dateLabel = formatTooltipDate(value.date);
              if (count === 0) {
                return `No contributions on ${dateLabel}`;
              }
              return `${count} contribution${count !== 1 ? "s" : ""} on ${dateLabel}`;
            }}
            monthLabels={[
              "Jan", "Feb", "Mar", "Apr", "May", "Jun",
              "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
            ]}
            weekdayLabels={["", "Mon", "", "Wed", "", "Fri", ""]}
          />
        </div>
      </CardContent>
    </Card>
  );
}
