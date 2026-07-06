import "server-only";
import { db } from "@/lib/db";
import type { LeadScope } from "@/lib/queries/leads";

export async function getFollowUpsGrouped(scope: LeadScope) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  const leadWhere = scope.forcedAssignedToId ? { assignedToId: scope.forcedAssignedToId } : {};

  const followUps = await db.followUp.findMany({
    where: { status: "PENDING", lead: leadWhere },
    include: {
      lead: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          status: { select: { name: true, color: true } },
          assignedTo: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { dueAt: "asc" },
  });

  const missed = followUps.filter((f) => f.dueAt < startOfToday);
  const today = followUps.filter((f) => f.dueAt >= startOfToday && f.dueAt < startOfTomorrow);
  const upcoming = followUps.filter((f) => f.dueAt >= startOfTomorrow);

  return { missed, today, upcoming };
}
