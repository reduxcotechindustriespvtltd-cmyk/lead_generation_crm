"use client";

import { Pie, PieChart, Cell } from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { EmptyState } from "@/components/ui/empty-state";

const SOURCE_COLORS: Record<string, string> = {
  FACEBOOK: "#1877F2",
  INSTAGRAM: "#E1306C",
  WHATSAPP: "#25D366",
  MANUAL: "#6b7280",
  WEBSITE: "#14b8a6",
  OTHER: "#a855f7",
};

const SOURCE_LABELS: Record<string, string> = {
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  WHATSAPP: "WhatsApp",
  MANUAL: "Manual",
  WEBSITE: "Website",
  OTHER: "Other",
};

export function SourceDistributionChart({ data }: { data: { source: string; count: number }[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const config = Object.fromEntries(
    data.map((d) => [d.source, { label: SOURCE_LABELS[d.source] ?? d.source }])
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Source Distribution</CardTitle>
      </CardHeader>
      <CardContent className={data.length === 0 ? "" : "flex items-center gap-6"}>
        {data.length === 0 ? (
          <EmptyState
            icon={PieChartIcon}
            title="No leads yet"
            description="Once leads start coming in, you'll see the Facebook vs. Instagram split here."
            size="sm"
          />
        ) : (
          <>
            <ChartContainer config={config} className="h-56 w-56 shrink-0">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={data}
                  dataKey="count"
                  nameKey="source"
                  innerRadius={55}
                  outerRadius={85}
                  strokeWidth={2}
                >
                  {data.map((entry) => (
                    <Cell key={entry.source} fill={SOURCE_COLORS[entry.source] ?? "#94a3b8"} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="flex flex-1 flex-col gap-2">
              {data.map((d) => (
                <div key={d.source} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: SOURCE_COLORS[d.source] ?? "#94a3b8" }}
                    />
                    <span>{SOURCE_LABELS[d.source] ?? d.source}</span>
                  </div>
                  <span className="text-muted-foreground tabular-nums">
                    {d.count} ({total > 0 ? Math.round((d.count / total) * 100) : 0}%)
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
