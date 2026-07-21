"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { PackageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { EmptyState } from "@/components/ui/empty-state";

const config: ChartConfig = {
  revenue: { label: "Revenue", color: "var(--chart-3)" },
};

function formatINR(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

export function PackageEarningsChart({
  data,
}: {
  data: { name: string; bookings: number; revenue: number }[];
}) {
  const top = data.slice(0, 8);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Revenue by Package</CardTitle>
      </CardHeader>
      <CardContent>
        {top.length === 0 ? (
          <EmptyState
            icon={PackageIcon}
            title="No revenue yet"
            description="Confirmed bookings linked to a package will show up here."
            size="sm"
          />
        ) : (
          <ChartContainer config={config} className="h-64 w-full">
            <BarChart data={top} layout="vertical" margin={{ left: 0, right: 12 }}>
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={formatINR} />
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                axisLine={false}
                width={120}
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip
                content={<ChartTooltipContent formatter={(value) => formatINR(Number(value))} />}
              />
              <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
