import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RankList({
  title,
  items,
}: {
  title: string;
  items: { name: string; total: number }[];
}) {
  const max = Math.max(1, ...items.map((i) => i.total));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5">
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">No data yet.</p>
        ) : (
          items.map((item) => (
            <div key={item.name} className="flex items-center gap-3 text-sm">
              <span className="w-32 shrink-0 truncate" title={item.name}>
                {item.name}
              </span>
              <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full rounded-full"
                  style={{ width: `${(item.total / max) * 100}%` }}
                />
              </div>
              <span className="text-muted-foreground w-8 shrink-0 text-right tabular-nums">
                {item.total}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
