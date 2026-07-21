"use client";

import { Pie, PieChart, Cell } from "recharts";
import { MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { EmptyState } from "@/components/ui/empty-state";

const PALETTE = ["#14b8a6", "#1877F2", "#a855f7", "#f59e0b", "#e11d48", "#6b7280", "#22c55e"];

function formatINR(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

export function DestinationEarningsChart({
  data,
}: {
  data: { name: string; bookings: number; revenue: number }[];
}) {
  const total = data.reduce((sum, d) => sum + d.revenue, 0);
  const config = Object.fromEntries(data.map((d) => [d.name, { label: d.name }]));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Revenue by Destination</CardTitle>
      </CardHeader>
      <CardContent className={data.length === 0 ? "" : "flex items-center gap-6"}>
        {data.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="No revenue yet"
            description="Confirmed bookings linked to a package with a destination will show up here."
            size="sm"
          />
        ) : (
          <>
            <ChartContainer config={config} className="h-56 w-56 shrink-0">
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent hideLabel formatter={(value) => formatINR(Number(value))} />
                  }
                />
                <Pie
                  data={data}
                  dataKey="revenue"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={85}
                  strokeWidth={2}
                >
                  {data.map((entry, i) => (
                    <Cell key={entry.name} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="flex flex-1 flex-col gap-2">
              {data.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
                    />
                    <span>{d.name}</span>
                  </div>
                  <span className="text-muted-foreground tabular-nums">
                    {formatINR(d.revenue)} ({total > 0 ? Math.round((d.revenue / total) * 100) : 0}%)
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
