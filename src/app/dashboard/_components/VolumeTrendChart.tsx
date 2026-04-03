"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const chartConfig = {
  volume: {
    label: "Volume (kg)",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

type Props = {
  data: { month: number; volume: number }[];
  year: number;
  exerciseList: string[];
  selectedExercise: string | null;
};

export function VolumeTrendChart({ data, year, exerciseList, selectedExercise }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const chartData = data.map((d) => ({
    month: MONTH_NAMES[d.month - 1],
    volume: Math.round(d.volume),
  }));

  function handleExerciseChange(exercise: any) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("exercise", exercise);
    router.push(`?${params.toString()}`);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle>Volume Trend</CardTitle>
            <CardDescription>Total kg lifted per month — {year}</CardDescription>
          </div>
          {exerciseList.length > 0 && (
            <Select value={selectedExercise ?? ""} onValueChange={handleExerciseChange}>
              <SelectTrigger className="w-[160px] h-7 text-xs">
                <SelectValue placeholder="Select exercise" />
              </SelectTrigger>
              <SelectContent>
                {exerciseList.map((name) => (
                  <SelectItem key={name} value={name} className="text-xs">
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={40}
              tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey="volume"
              stroke="var(--color-volume)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
