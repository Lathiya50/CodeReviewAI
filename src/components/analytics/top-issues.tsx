"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";
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

interface IssueData {
  category: string;
  count: number;
}

interface TopIssuesProps {
  data: IssueData[];
  isLoading?: boolean;
}

const BAR_COLORS = [
  "hsl(221.2 83.2% 53.3%)",
  "hsl(262.1 83.3% 57.8%)",
  "hsl(291.1 63.8% 52%)",
  "hsl(330.4 81.2% 60.4%)",
  "hsl(0 72.2% 50.6%)",
  "hsl(37.7 92.1% 50.2%)",
  "hsl(142.1 76.2% 36.3%)",
  "hsl(198.6 88.7% 48.4%)",
];

const chartConfig = {
  count: {
    label: "Issues",
    color: "hsl(221.2 83.2% 53.3%)",
  },
} satisfies ChartConfig;

/** Row height + top/bottom padding per bar row */
const ROW_HEIGHT = 46;
const CHART_PADDING = 16;

/**
 * TopIssues — horizontal bar chart of most common AI review issue categories.
 * Height grows dynamically based on the number of categories.
 * @param data - array of { category, count } sorted by count desc
 * @param isLoading - whether data is loading
 */
export function TopIssues({ data, isLoading = false }: TopIssuesProps) {
  if (isLoading) {
    return (
      <Card className="rounded-xl">
        <CardHeader className="px-6 pt-6 pb-4">
          <div className="space-y-2">
            <div className="h-4 w-28 animate-pulse rounded-md bg-muted" />
            <div className="h-3 w-48 animate-pulse rounded-md bg-muted" />
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="h-[260px] animate-pulse rounded-lg bg-muted" />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="rounded-xl">
        <CardHeader className="px-6 pt-6 pb-4">
          <CardTitle className="text-base font-semibold">Top Issues</CardTitle>
          <CardDescription className="text-sm">Most common issue categories</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[260px] items-center justify-center px-6 pb-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <span className="text-xl">🔍</span>
            </div>
            <p className="text-sm font-medium text-muted-foreground">No issue data yet</p>
            <p className="text-xs text-muted-foreground/70">Complete some reviews to see patterns</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartHeight = data.length * ROW_HEIGHT + CHART_PADDING;
  // YAxis needs enough width to fit the longest category label
  const maxLabelLen = Math.max(...data.map((d) => d.category.length));
  const yAxisWidth = Math.min(Math.max(maxLabelLen * 6.5, 72), 120);

  return (
    <Card className="rounded-xl">
      <CardHeader className="px-6 pt-6 pb-2">
        <CardTitle className="text-base font-semibold">Top Issues</CardTitle>
        <CardDescription className="mt-0.5 text-sm">
          Most common categories across AI reviews
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6 pt-2">
        <ChartContainer
          config={chartConfig}
          style={{ height: chartHeight, minHeight: 180 }}
          className="w-full [&_.recharts-wrapper]:!overflow-visible"
        >
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 36, left: 0, bottom: 4 }}
            barCategoryGap="25%"
          >
            <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-border/40" />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              tickMargin={8}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              dataKey="category"
              type="category"
              tickLine={false}
              axisLine={false}
              width={yAxisWidth}
              tickMargin={8}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            />
            <ChartTooltip
              content={<ChartTooltipContent />}
              cursor={{ fill: "hsl(var(--muted) / 0.5)", rx: 4 }}
            />
            <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={24}>
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={BAR_COLORS[index % BAR_COLORS.length]}
                  fillOpacity={0.9}
                />
              ))}
              <LabelList
                dataKey="count"
                position="right"
                offset={6}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  fill: "hsl(var(--foreground))",
                }}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
