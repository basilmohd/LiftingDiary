"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const chartConfig = {
  count: {
    label: "Workouts",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

type Props = {
  data: { month: number; count: number }[];
  year: number;
};

export function MonthlyWorkoutChart({ data, year }: Props) {
  const chartData = data.map((d) => ({
    month: MONTH_NAMES[d.month - 1],
    count: d.count,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Workouts</CardTitle>
        <CardDescription>Workouts logged per month — {year}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={24} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
