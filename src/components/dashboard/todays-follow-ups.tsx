import Link from "next/link";
import { format } from "date-fns";
import { CalendarCheck2, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

type FollowUpRow = {
  id: string;
  dueAt: string;
  isOverdue: boolean;
  lead: { id: string; fullName: string; phone: string };
};

export function TodaysFollowUps({ items }: { items: FollowUpRow[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Due Today &amp; Overdue</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href="/dashboard/follow-ups" />}
        >
          View all
          <ChevronRight className="size-3.5" />
        </Button>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState
            icon={CalendarCheck2}
            title="All caught up"
            description="No follow-ups are due today or overdue."
            size="sm"
          />
        ) : (
          <div className="flex flex-col gap-1">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/dashboard/leads/${item.lead.id}`}
                className="hover:bg-muted/60 -mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.lead.fullName}</p>
                  <p className="text-muted-foreground text-xs">{item.lead.phone}</p>
                </div>
                <span
                  className={cn(
                    "shrink-0 text-xs font-medium",
                    item.isOverdue ? "text-red-600" : "text-muted-foreground"
                  )}
                >
                  {format(new Date(item.dueAt), "h:mm a")}
                </span>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
