import { redirect } from "next/navigation";
import { Trophy, Clock, Users } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getConversionRateByMonth,
  getLeadsByDay,
  getLeadsByMonth,
  getSourceDistribution,
} from "@/lib/queries/dashboard";
import {
  getLeadsByAd,
  getLeadsByAdSet,
  getLeadsByCampaign,
  getLeadsBySalesExecutive,
  getOverallConversionRate,
  getResponseTimeStats,
} from "@/lib/queries/analytics";
import { StatCard } from "@/components/dashboard/stat-card";
import { LeadsByDayChart } from "@/components/dashboard/leads-by-day-chart";
import { LeadsByMonthChart } from "@/components/dashboard/leads-by-month-chart";
import { SourceDistributionChart } from "@/components/dashboard/source-distribution-chart";
import { ConversionRateChart } from "@/components/dashboard/conversion-rate-chart";
import { BreakdownTable } from "@/components/analytics/breakdown-table";
import { RankList } from "@/components/analytics/rank-list";

export default async function AnalyticsPage() {
  const session = await getCurrentUser();
  if (!session || session.role === "SALES_EXECUTIVE") {
    redirect("/dashboard");
  }

  const scope = {};

  const [
    leadsByDay,
    leadsByMonth,
    sourceDistribution,
    conversionRate,
    campaigns,
    adSets,
    ads,
    salesExecs,
    responseTime,
    overallConversion,
  ] = await Promise.all([
    getLeadsByDay(scope),
    getLeadsByMonth(scope),
    getSourceDistribution(scope),
    getConversionRateByMonth(scope),
    getLeadsByCampaign(),
    getLeadsByAdSet(),
    getLeadsByAd(),
    getLeadsBySalesExecutive(),
    getResponseTimeStats(),
    getOverallConversionRate(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground text-sm">
          Performance across campaigns, sources, and team
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="Overall Conversion Rate"
          value={`${overallConversion.rate}%`}
          icon={Trophy}
          accent="green"
        />
        <StatCard
          label="Avg. Response Time"
          value={responseTime.avgResponseHours != null ? `${responseTime.avgResponseHours}h` : "—"}
          icon={Clock}
          accent="blue"
        />
        <StatCard
          label="Active Sales Executives"
          value={salesExecs.length}
          icon={Users}
          accent="purple"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <LeadsByDayChart data={leadsByDay} />
        <LeadsByMonthChart data={leadsByMonth} />
        <SourceDistributionChart data={sourceDistribution} />
        <ConversionRateChart data={conversionRate} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <BreakdownTable
          title="Leads by Campaign"
          nameLabel="Campaign"
          rows={campaigns.map((c) => ({
            key: c.campaignName,
            name: c.campaignName,
            total: c.total,
            converted: c.converted,
            conversionRate: c.conversionRate,
          }))}
        />
        <BreakdownTable
          title="Leads by Sales Executive"
          nameLabel="Sales Executive"
          rows={salesExecs.map((s) => ({
            key: s.id,
            name: s.name,
            total: s.total,
            converted: s.converted,
            conversionRate: s.conversionRate,
          }))}
        />
        <RankList title="Top Ad Sets" items={adSets} />
        <RankList title="Top Ads" items={ads} />
      </div>
    </div>
  );
}
