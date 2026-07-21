"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const config: ChartConfig = {
  revenue: { label: "Revenue", color: "var(--chart-2)" },
};

function formatINR(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

export function MonthlyEarningsChart({ data }: { data: { month: string; revenue: number }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Monthly Earnings (last 12 months)</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-64 w-full">
          <BarChart data={data} margin={{ left: 0, right: 12 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={48}
              allowDecimals={false}
              tickFormatter={formatINR}
            />
            <ChartTooltip
              content={<ChartTooltipContent formatter={(value) => formatINR(Number(value))} />}
            />
            <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
