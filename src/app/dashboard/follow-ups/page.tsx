import { getCurrentUser } from "@/lib/auth/session";
import { listFollowUps } from "@/lib/queries/follow-ups";
import type { LeadScope } from "@/lib/queries/leads";
import { followUpListQuerySchema } from "@/lib/validations/follow-ups";
import { FollowUpsToolbar } from "@/components/follow-ups/follow-ups-toolbar";
import { FollowUpsTable } from "@/components/follow-ups/follow-ups-table";

export default async function FollowUpsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getCurrentUser();
  const sp = await searchParams;
  const query = followUpListQuerySchema.parse(sp);
  const scope: LeadScope =
    session?.role === "SALES_EXECUTIVE" ? { forcedAssignedToId: session.sub } : {};

  const result = await listFollowUps(query, scope);
  const showAssignee = session?.role !== "SALES_EXECUTIVE";

  const items = result.followUps.map((f) => ({
    id: f.id,
    dueAt: f.dueAt.toISOString(),
    note: f.note,
    leadId: f.leadId,
    lead: {
      ...f.lead,
      createdAt: f.lead.createdAt.toISOString(),
    },
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

      <FollowUpsToolbar />

      <FollowUpsTable
        items={items}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        totalPages={result.totalPages}
        sortBy={query.sortBy}
        sortDir={query.sortDir}
        showAssignee={showAssignee}
      />
    </div>
  );
}
