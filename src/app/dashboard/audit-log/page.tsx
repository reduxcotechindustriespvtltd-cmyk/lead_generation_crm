import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { listAuditLogs } from "@/lib/queries/audit-logs";
import { AuditLogTable } from "@/components/audit-log/audit-log-table";

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getCurrentUser();
  if (!session || session.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const action = typeof sp.action === "string" ? sp.action : undefined;

  const result = await listAuditLogs({ page, pageSize: 25, action });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit Log</h1>
        <p className="text-muted-foreground text-sm">
          Security-relevant activity — logins, permission changes, integration events
        </p>
      </div>

      <AuditLogTable
        logs={result.logs.map((log) => ({
          id: log.id,
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId,
          changes: log.changes,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          createdAt: log.createdAt.toISOString(),
          user: log.user,
        }))}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        totalPages={result.totalPages}
        availableActions={result.availableActions}
      />
    </div>
  );
}
