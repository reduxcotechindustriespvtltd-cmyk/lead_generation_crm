"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { AlertTriangle, Check, CalendarClock, CalendarDays, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LeadStatusBadge } from "@/components/leads/lead-status-badge";
import { cn } from "@/lib/utils";

type FollowUpItem = {
  id: string;
  dueAt: string;
  note: string | null;
  leadId: string;
  lead: {
    id: string;
    fullName: string;
    phone: string;
    status: { name: string; color: string };
    assignedTo: { id: string; name: string } | null;
  };
};

const ICONS = { missed: AlertTriangle, today: CalendarDays, upcoming: CalendarClock } as const;

export function FollowUpsSection({
  title,
  variant,
  items,
  accent,
  emptyLabel,
  showAssignee,
}: {
  title: string;
  variant: keyof typeof ICONS;
  items: FollowUpItem[];
  accent?: "red" | "blue" | "default";
  emptyLabel: string;
  showAssignee: boolean;
}) {
  const router = useRouter();

  async function updateStatus(id: string, status: "DONE" | "CANCELLED") {
    const res = await fetch(
      `/api/leads/${items.find((i) => i.id === id)?.leadId}/follow-ups/${id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }
    );
    if (!res.ok) {
      toast.error("Failed to update follow-up");
      return;
    }
    router.refresh();
  }

  const accentClasses: Record<string, string> = {
    red: "text-red-600",
    blue: "text-blue-600",
    default: "text-muted-foreground",
  };
  const Icon = ICONS[variant];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className={cn("size-4", accentClasses[accent ?? "default"])} />
          {title}
          <span className="text-muted-foreground text-sm font-normal">({items.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">{emptyLabel}</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3 text-sm"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/leads/${item.lead.id}`}
                    className="font-medium hover:underline"
                  >
                    {item.lead.fullName}
                  </Link>
                  <LeadStatusBadge name={item.lead.status.name} color={item.lead.status.color} />
                </div>
                <p className="text-muted-foreground text-xs">
                  {item.lead.phone}
                  {showAssignee && item.lead.assignedTo
                    ? ` · ${item.lead.assignedTo.name}`
                    : showAssignee
                      ? " · Unassigned"
                      : ""}
                </p>
                {item.note && <p className="text-muted-foreground mt-1">{item.note}</p>}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium whitespace-nowrap">
                  {format(new Date(item.dueAt), "d MMM, h:mm a")}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="Mark done"
                    onClick={() => updateStatus(item.id, "DONE")}
                  >
                    <Check className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="Cancel"
                    onClick={() => updateStatus(item.id, "CANCELLED")}
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
