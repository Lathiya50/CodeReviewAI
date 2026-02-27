"use client";

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

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Ordered intensity steps for the legend (count → index) */
const LEGEND_STEPS = [0, 1, 3, 5, 7] as const;

/**
 * Maps a review count to a colour intensity class.
 * @param count - number of reviews on that day
 * @returns Tailwind bg class string
 */
function getIntensityClass(count: number): string {
  if (count === 0) return "bg-muted/60 dark:bg-muted/30";
  if (count <= 1) return "bg-blue-200 dark:bg-blue-900/80";
  if (count <= 3) return "bg-blue-400 dark:bg-blue-700";
  if (count <= 5) return "bg-blue-600 dark:bg-blue-500";
  return "bg-blue-800 dark:bg-blue-400";
}

/**
 * ActivityHeatmap — GitHub-style 12-week contribution grid.
 * Each cell is a day; colour intensity represents review volume.
 * @param data - array of { date, count, week, day } — 84 entries
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

  const numWeeks = 12;

  // Build week × day grid
  const grid: (HeatmapCell | null)[][] = Array.from({ length: numWeeks }, () =>
    Array.from({ length: 7 }, () => null),
  );

  for (const cell of data) {
    if (cell.week < numWeeks && cell.day < 7) {
      grid[cell.week]![cell.day] = cell;
    }
  }

  const totalReviews = data.reduce((sum, d) => sum + d.count, 0);

  // Month labels — only show when month changes
  const monthLabels: string[] = [];
  for (let w = 0; w < numWeeks; w++) {
    const firstCell = grid[w]?.find((c) => c !== null);
    if (firstCell) {
      const d = new Date(firstCell.date);
      const label = d.toLocaleDateString("en-US", { month: "short" });
      monthLabels.push(monthLabels[monthLabels.length - 1] !== label ? label : "");
    } else {
      monthLabels.push("");
    }
  }

  const CELL = "size-[18px]";

  return (
    <Card className="rounded-xl">
      <CardHeader className="px-6 pt-6 pb-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold">Activity Heatmap</CardTitle>
            <CardDescription className="mt-0.5 text-sm">
              {totalReviews} review{totalReviews !== 1 ? "s" : ""} in the last 12 weeks
            </CardDescription>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Less</span>
            {LEGEND_STEPS.map((n) => (
              <div
                key={n}
                className={cn("size-3.5 rounded-sm", getIntensityClass(n))}
              />
            ))}
            <span>More</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6 pt-3">
        <div className="overflow-x-auto pb-1">
          <div className="inline-flex flex-col gap-1.5" style={{ minWidth: "max-content" }}>
            {/* Month labels row */}
            <div className="flex gap-1.5 pl-9">
              {monthLabels.map((label, w) => (
                <div
                  key={w}
                  className={cn(CELL, "flex items-end text-[10px] font-medium text-muted-foreground")}
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Day rows */}
            {DAY_LABELS.map((dayLabel, dayIdx) => (
              <div key={dayIdx} className="flex items-center gap-1.5">
                {/* Day label — only odd indices to avoid crowding */}
                <span className="w-8 text-right text-[10px] text-muted-foreground">
                  {dayIdx % 2 === 1 ? dayLabel : ""}
                </span>

                {grid.map((week, weekIdx) => {
                  const cell = week[dayIdx];

                  if (!cell) {
                    return (
                      <div
                        key={weekIdx}
                        className={cn(CELL, "rounded-sm bg-transparent")}
                      />
                    );
                  }

                  const title = `${cell.date}: ${cell.count} review${cell.count !== 1 ? "s" : ""}`;

                  return (
                    <div
                      key={weekIdx}
                      title={title}
                      className={cn(
                        CELL,
                        "rounded-sm transition-all duration-150 hover:scale-110 hover:ring-2 hover:ring-blue-400/60 cursor-default",
                        getIntensityClass(cell.count),
                      )}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
