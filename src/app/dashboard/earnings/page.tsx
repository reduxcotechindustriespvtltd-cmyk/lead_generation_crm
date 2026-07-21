import { redirect } from "next/navigation";
import { IndianRupee, CalendarDays, CalendarRange, CalendarCheck2 } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getEarningsSummary,
  getMonthlyEarnings,
  getRevenueByPackage,
  getRevenueByDestination,
} from "@/lib/queries/earnings";
import { StatCard } from "@/components/dashboard/stat-card";
import { MonthlyEarningsChart } from "@/components/dashboard/monthly-earnings-chart";
import { PackageEarningsChart } from "@/components/dashboard/package-earnings-chart";
import { DestinationEarningsChart } from "@/components/dashboard/destination-earnings-chart";
import { EarningsBreakdownTable } from "@/components/dashboard/earnings-breakdown-table";

function formatINR(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

export default async function EarningsPage() {
  const session = await getCurrentUser();
  if (!session || session.role === "SALES_EXECUTIVE") {
    redirect("/dashboard");
  }

  const [summary, monthlyEarnings, byPackage, byDestination] = await Promise.all([
    getEarningsSummary(),
    getMonthlyEarnings(),
    getRevenueByPackage(),
    getRevenueByDestination(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Earnings</h1>
        <p className="text-muted-foreground text-sm">
          Revenue from confirmed bookings, by month, package, and destination
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Revenue"
          value={formatINR(summary.totalRevenue)}
          icon={IndianRupee}
          accent="green"
        />
        <StatCard
          label="This Month"
          value={formatINR(summary.monthlyRevenue)}
          icon={CalendarDays}
          accent="blue"
        />
        <StatCard
          label="This Year"
          value={formatINR(summary.yearlyRevenue)}
          icon={CalendarRange}
          accent="purple"
        />
        <StatCard
          label="Confirmed Bookings"
          value={summary.bookingCount}
          icon={CalendarCheck2}
          accent="teal"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <MonthlyEarningsChart data={monthlyEarnings} />
        <DestinationEarningsChart data={byDestination} />
        <PackageEarningsChart data={byPackage} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <EarningsBreakdownTable title="Revenue by Package" nameLabel="Package" rows={byPackage} />
        <EarningsBreakdownTable
          title="Revenue by Destination"
          nameLabel="Destination"
          rows={byDestination}
        />
      </div>
    </div>
  );
}
