import "server-only";
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";

export type DashboardScope = { assignedToId?: string };

function scopeFilter(scope: DashboardScope) {
  return scope.assignedToId ? Prisma.sql`AND "assignedToId" = ${scope.assignedToId}` : Prisma.empty;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek() {
  const d = startOfToday();
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? 6 : day - 1; // Monday as start of week
  d.setDate(d.getDate() - diff);
  return d;
}

function startOfMonth() {
  const d = startOfToday();
  d.setDate(1);
  return d;
}

export async function getLeadCounts(scope: DashboardScope) {
  const where = scope.assignedToId ? { assignedToId: scope.assignedToId } : {};

  const [total, today, thisWeek, thisMonth, statuses] = await Promise.all([
    db.lead.count({ where }),
    db.lead.count({ where: { ...where, createdAt: { gte: startOfToday() } } }),
    db.lead.count({ where: { ...where, createdAt: { gte: startOfWeek() } } }),
    db.lead.count({ where: { ...where, createdAt: { gte: startOfMonth() } } }),
    db.lead.groupBy({
      by: ["statusId"],
      where,
      _count: { _all: true },
    }),
  ]);

  const statusRows = await db.leadStatus.findMany();
  const countByStatusId = new Map(statuses.map((s) => [s.statusId, s._count._all]));
  const countByStatusName = (name: string) => {
    const status = statusRows.find((s) => s.name === name);
    if (!status) return 0;
    return countByStatusId.get(status.id) ?? 0;
  };

  return {
    total,
    today,
    thisWeek,
    thisMonth,
    newLeads: countByStatusName("New"),
    contacted: countByStatusName("Contacted"),
    qualified: countByStatusName("Qualified"),
    converted: countByStatusName("Converted"),
    lost: countByStatusName("Lost"),
  };
}

export async function getLeadsByDay(scope: DashboardScope, days = 30) {
  const rows = await db.$queryRaw<{ day: Date; count: bigint }[]>(Prisma.sql`
    SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::bigint AS count
    FROM "leads"
    WHERE "createdAt" >= NOW() - INTERVAL '${Prisma.raw(String(days))} days'
    ${scopeFilter(scope)}
    GROUP BY day
    ORDER BY day ASC
  `);

  const byDay = new Map(rows.map((r) => [r.day.toISOString().slice(0, 10), Number(r.count)]));
  const result: { date: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    result.push({ date: key, count: byDay.get(key) ?? 0 });
  }
  return result;
}

export async function getLeadsByMonth(scope: DashboardScope, months = 12) {
  const rows = await db.$queryRaw<{ month: Date; count: bigint }[]>(Prisma.sql`
    SELECT date_trunc('month', "createdAt") AS month, COUNT(*)::bigint AS count
    FROM "leads"
    WHERE "createdAt" >= date_trunc('month', NOW()) - INTERVAL '${Prisma.raw(String(months - 1))} months'
    ${scopeFilter(scope)}
    GROUP BY month
    ORDER BY month ASC
  `);

  const byMonth = new Map(
    rows.map((r) => [`${r.month.getFullYear()}-${r.month.getMonth()}`, Number(r.count)])
  );
  const result: { month: string; count: number }[] = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    result.push({
      month: d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
      count: byMonth.get(key) ?? 0,
    });
  }
  return result;
}

export async function getSourceDistribution(scope: DashboardScope) {
  const where = scope.assignedToId ? { assignedToId: scope.assignedToId } : {};
  const rows = await db.lead.groupBy({
    by: ["source"],
    where,
    _count: { _all: true },
  });
  return rows
    .map((r) => ({ source: r.source, count: r._count._all }))
    .sort((a, b) => b.count - a.count);
}

export async function getConversionRateByMonth(scope: DashboardScope, months = 6) {
  const where = scope.assignedToId ? { assignedToId: scope.assignedToId } : {};
  const convertedStatus = await db.leadStatus.findUnique({ where: { name: "Converted" } });

  const result: { month: string; rate: number; total: number; converted: number }[] = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const [total, converted] = await Promise.all([
      db.lead.count({ where: { ...where, createdAt: { gte: start, lt: end } } }),
      convertedStatus
        ? db.lead.count({
            where: { ...where, createdAt: { gte: start, lt: end }, statusId: convertedStatus.id },
          })
        : Promise.resolve(0),
    ]);
    result.push({
      month: start.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
      rate: total > 0 ? Math.round((converted / total) * 1000) / 10 : 0,
      total,
      converted,
    });
  }
  return result;
}

export async function getRecentActivity(scope: DashboardScope, limit = 8) {
  return db.activity.findMany({
    where: scope.assignedToId ? { lead: { assignedToId: scope.assignedToId } } : {},
    include: {
      user: { select: { id: true, name: true } },
      lead: { select: { id: true, fullName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
