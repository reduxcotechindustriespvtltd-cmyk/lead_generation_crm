import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityIcon } from "@/components/activity-icon";
import { EmptyState } from "@/components/ui/empty-state";

type ActivityRow = {
  id: string;
  type: string;
  description: string;
  createdAt: string;
  user: { id: string; name: string } | null;
  lead: { id: string; fullName: string };
};

export function RecentActivity({ activities }: { activities: ActivityRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="Nothing yet"
            description="Activity across all your leads will show up here."
            size="sm"
          />
        ) : (
          <div className="flex flex-col gap-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="bg-muted mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full">
                  <ActivityIcon type={activity.type} className="size-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm">
                    <Link
                      href={`/dashboard/leads/${activity.lead.id}`}
                      className="font-medium hover:underline"
                    >
                      {activity.lead.fullName}
                    </Link>{" "}
                    <span className="text-muted-foreground">{activity.description}</span>
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {activity.user?.name ?? "System"} ·{" "}
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
