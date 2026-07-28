import "server-only";
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";

// "Revenue" here means every Booking row's totalRevenue — a Booking already
// represents a real reservation (dates, guest counts, pricing all entered),
// so it counts toward revenue regardless of its status. Status is a free-form
// admin-configurable list shared with leads (see Booking.statusId in
// schema.prisma), not a fixed Confirmed/Cancelled gate. Monthly/yearly
// bucketing uses checkInDate (the stay date), not createdAt (when the row
// was entered) — more meaningful for a stay-booking business.
function startOfYear() {
  const d = new Date();
  d.setMonth(0, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getEarningsSummary() {
  const [totalAgg, monthlyAgg, yearlyAgg, bookingCount] = await Promise.all([
    db.booking.aggregate({ _sum: { totalRevenue: true } }),
    db.booking.aggregate({
      where: { checkInDate: { gte: startOfMonth() } },
      _sum: { totalRevenue: true },
    }),
    db.booking.aggregate({
      where: { checkInDate: { gte: startOfYear() } },
      _sum: { totalRevenue: true },
    }),
    db.booking.count(),
  ]);

  return {
    totalRevenue: Number(totalAgg._sum.totalRevenue ?? 0),
    monthlyRevenue: Number(monthlyAgg._sum.totalRevenue ?? 0),
    yearlyRevenue: Number(yearlyAgg._sum.totalRevenue ?? 0),
    bookingCount,
  };
}

export async function getMonthlyEarnings(months = 12) {
  const rows = await db.$queryRaw<{ month: Date; revenue: string | null }[]>(Prisma.sql`
    SELECT date_trunc('month', "checkInDate") AS month, SUM("totalRevenue") AS revenue
    FROM "bookings"
    WHERE "checkInDate" >= date_trunc('month', NOW()) - INTERVAL '${Prisma.raw(String(months - 1))} months'
    GROUP BY month
    ORDER BY month ASC
  `);

  const byMonth = new Map(
    rows.map((r) => [`${r.month.getFullYear()}-${r.month.getMonth()}`, Number(r.revenue ?? 0)])
  );
  const result: { month: string; revenue: number }[] = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    result.push({
      month: d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
      revenue: byMonth.get(key) ?? 0,
    });
  }
  return result;
}

export async function getRevenueByPackage() {
  const rows = await db.booking.groupBy({
    by: ["packageName"],
    where: { packageName: { not: null } },
    _sum: { totalRevenue: true },
    _count: { _all: true },
  });
  return rows
    .map((r) => ({
      name: r.packageName ?? "Unknown",
      bookings: r._count._all,
      revenue: Number(r._sum.totalRevenue ?? 0),
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

export async function getRevenueByDestination() {
  const rows = await db.booking.groupBy({
    by: ["destination"],
    where: { destination: { not: null } },
    _sum: { totalRevenue: true },
    _count: { _all: true },
  });
  return rows
    .map((r) => ({
      name: r.destination ?? "Unknown",
      bookings: r._count._all,
      revenue: Number(r._sum.totalRevenue ?? 0),
    }))
    .sort((a, b) => b.revenue - a.revenue);
}
