import "server-only";
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";

export type AuditLogListParams = {
  page: number;
  pageSize: number;
  action?: string;
};

export async function listAuditLogs({ page, pageSize, action }: AuditLogListParams) {
  const where: Prisma.AuditLogWhereInput = action ? { action } : {};

  const [logs, total, actions] = await Promise.all([
    db.auditLog.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.auditLog.count({ where }),
    db.auditLog.findMany({
      distinct: ["action"],
      select: { action: true },
      orderBy: { action: "asc" },
    }),
  ]);

  return {
    logs,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    availableActions: actions.map((a) => a.action),
  };
}
