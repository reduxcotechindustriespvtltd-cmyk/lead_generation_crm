"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const config: ChartConfig = {
  rate: { label: "Conversion Rate (%)", color: "var(--chart-3)" },
};

export function ConversionRateChart({
  data,
}: {
  data: { month: string; rate: number; total: number; converted: number }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Conversion Rate Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-64 w-full">
          <LineChart data={data} margin={{ left: 0, right: 12 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} width={36} tickFormatter={(v) => `${v}%`} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, _name, item) => (
                    <div className="flex w-full flex-col gap-0.5">
                      <span className="font-medium">{value}%</span>
                      <span className="text-muted-foreground text-xs">
                        {item.payload.converted} of {item.payload.total} leads converted
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Line
              dataKey="rate"
              type="monotone"
              stroke="var(--color-rate)"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
