import { getCurrentUser } from "@/lib/auth/session";
import { getFollowUpsGrouped } from "@/lib/queries/follow-ups";
import type { LeadScope } from "@/lib/queries/leads";
import { FollowUpsSection } from "@/components/follow-ups/follow-ups-section";

export default async function FollowUpsPage() {
  const session = await getCurrentUser();
  const scope: LeadScope =
    session?.role === "SALES_EXECUTIVE" ? { forcedAssignedToId: session.sub } : {};

  const { missed, today, upcoming } = await getFollowUpsGrouped(scope);
  const showAssignee = session?.role !== "SALES_EXECUTIVE";

  const serialize = (items: typeof missed) =>
    items.map((f) => ({
      id: f.id,
      dueAt: f.dueAt.toISOString(),
      note: f.note,
      leadId: f.leadId,
      lead: f.lead,
    }));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Follow-ups</h1>
        <p className="text-muted-foreground text-sm">
          {session?.role === "SALES_EXECUTIVE"
            ? "Your scheduled follow-ups"
            : "All scheduled follow-ups"}
        </p>
      </div>

      <FollowUpsSection
        title="Missed"
        variant="missed"
        accent="red"
        items={serialize(missed)}
        emptyLabel="No missed follow-ups. Nice work!"
        showAssignee={showAssignee}
      />
      <FollowUpsSection
        title="Today"
        variant="today"
        accent="blue"
        items={serialize(today)}
        emptyLabel="No follow-ups scheduled for today."
        showAssignee={showAssignee}
      />
      <FollowUpsSection
        title="Upcoming"
        variant="upcoming"
        items={serialize(upcoming)}
        emptyLabel="No upcoming follow-ups."
        showAssignee={showAssignee}
      />
    </div>
  );
}
