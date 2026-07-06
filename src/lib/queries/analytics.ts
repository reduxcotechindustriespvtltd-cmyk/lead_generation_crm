import "server-only";
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";

async function getConvertedStatusId() {
  const status = await db.leadStatus.findUnique({ where: { name: "Converted" } });
  return status?.id ?? null;
}

export async function getLeadsByCampaign() {
  const convertedStatusId = await getConvertedStatusId();

  const rows = await db.lead.groupBy({
    by: ["campaignName"],
    where: { campaignName: { not: null } },
    _count: { _all: true },
  });

  const converted = convertedStatusId
    ? await db.lead.groupBy({
        by: ["campaignName"],
        where: { campaignName: { not: null }, statusId: convertedStatusId },
        _count: { _all: true },
      })
    : [];
  const convertedMap = new Map(converted.map((c) => [c.campaignName, c._count._all]));

  return rows
    .map((r) => ({
      campaignName: r.campaignName ?? "Unknown",
      total: r._count._all,
      converted: convertedMap.get(r.campaignName) ?? 0,
      conversionRate:
        r._count._all > 0
          ? Math.round(((convertedMap.get(r.campaignName) ?? 0) / r._count._all) * 1000) / 10
          : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

export async function getLeadsByAdSet() {
  const rows = await db.lead.groupBy({
    by: ["adSetName"],
    where: { adSetName: { not: null } },
    _count: { _all: true },
  });
  return rows
    .map((r) => ({ name: r.adSetName ?? "Unknown", total: r._count._all }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);
}

export async function getLeadsByAd() {
  const rows = await db.lead.groupBy({
    by: ["adName"],
    where: { adName: { not: null } },
    _count: { _all: true },
  });
  return rows
    .map((r) => ({ name: r.adName ?? "Unknown", total: r._count._all }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);
}

export async function getLeadsBySalesExecutive() {
  const convertedStatusId = await getConvertedStatusId();

  const users = await db.user.findMany({
    where: { role: "SALES_EXECUTIVE" },
    select: { id: true, name: true },
  });

  const [totals, converted] = await Promise.all([
    db.lead.groupBy({ by: ["assignedToId"], _count: { _all: true } }),
    convertedStatusId
      ? db.lead.groupBy({
          by: ["assignedToId"],
          where: { statusId: convertedStatusId },
          _count: { _all: true },
        })
      : Promise.resolve([]),
  ]);

  const totalMap = new Map(totals.map((t) => [t.assignedToId, t._count._all]));
  const convertedMap = new Map(converted.map((c) => [c.assignedToId, c._count._all]));

  return users
    .map((u) => {
      const total = totalMap.get(u.id) ?? 0;
      const won = convertedMap.get(u.id) ?? 0;
      return {
        id: u.id,
        name: u.name,
        total,
        converted: won,
        conversionRate: total > 0 ? Math.round((won / total) * 1000) / 10 : 0,
      };
    })
    .sort((a, b) => b.total - a.total);
}

export async function getResponseTimeStats() {
  const rows = await db.$queryRaw<{ avg_hours: number | null; sample_size: bigint }[]>(Prisma.sql`
    SELECT
      AVG(EXTRACT(EPOCH FROM (first_activity.created_at - l."createdAt")) / 3600) AS avg_hours,
      COUNT(*) AS sample_size
    FROM "leads" l
    JOIN LATERAL (
      SELECT a."createdAt" AS created_at
      FROM "activities" a
      WHERE a."leadId" = l.id AND a.type != 'LEAD_CREATED'
      ORDER BY a."createdAt" ASC
      LIMIT 1
    ) first_activity ON true
  `);

  const row = rows[0];
  return {
    avgResponseHours: row?.avg_hours ? Math.round(row.avg_hours * 10) / 10 : null,
    sampleSize: row ? Number(row.sample_size) : 0,
  };
}

export async function getOverallConversionRate() {
  const convertedStatusId = await getConvertedStatusId();
  const [total, converted] = await Promise.all([
    db.lead.count(),
    convertedStatusId ? db.lead.count({ where: { statusId: convertedStatusId } }) : 0,
  ]);
  return {
    total,
    converted,
    rate: total > 0 ? Math.round((converted / total) * 1000) / 10 : 0,
  };
}
