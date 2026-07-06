import {
  Users,
  CalendarDays,
  CalendarRange,
  Calendar,
  Sparkles,
  PhoneCall,
  BadgeCheck,
  Trophy,
  XCircle,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getConversionRateByMonth,
  getLeadCounts,
  getLeadsByDay,
  getLeadsByMonth,
  getRecentActivity,
  getSourceDistribution,
} from "@/lib/queries/dashboard";
import { getFollowUpsGrouped } from "@/lib/queries/follow-ups";
import { getOnboardingStatus } from "@/lib/queries/onboarding";
import { StatCard } from "@/components/dashboard/stat-card";
import { LeadsByDayChart } from "@/components/dashboard/leads-by-day-chart";
import { LeadsByMonthChart } from "@/components/dashboard/leads-by-month-chart";
import { SourceDistributionChart } from "@/components/dashboard/source-distribution-chart";
import { ConversionRateChart } from "@/components/dashboard/conversion-rate-chart";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { TodaysFollowUps } from "@/components/dashboard/todays-follow-ups";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const session = await getCurrentUser();
  const scope = session?.role === "SALES_EXECUTIVE" ? { assignedToId: session.sub } : {};
  const leadScope = session?.role === "SALES_EXECUTIVE" ? { forcedAssignedToId: session.sub } : {};
  const firstName = session?.name.split(" ")[0];

  const [
    counts,
    leadsByDay,
    leadsByMonth,
    sourceDistribution,
    conversionRate,
    recentActivity,
    followUps,
    onboarding,
  ] = await Promise.all([
    getLeadCounts(scope),
    getLeadsByDay(scope),
    getLeadsByMonth(scope),
    getSourceDistribution(scope),
    getConversionRateByMonth(scope),
    getRecentActivity(scope),
    getFollowUpsGrouped(leadScope),
    session?.role === "ADMIN" ? getOnboardingStatus() : Promise.resolve(null),
  ]);

  const dueTodayAndOverdue = [
    ...followUps.missed.map((f) => ({ ...f, isOverdue: true })),
    ...followUps.today.map((f) => ({ ...f, isOverdue: false })),
  ]
    .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime())
    .slice(0, 6);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {greeting()}
          {firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="text-muted-foreground text-sm">
          {session?.role === "SALES_EXECUTIVE"
            ? "Here's what's happening with your leads"
            : "Here's what's happening across the business"}
        </p>
      </div>

      {onboarding && !onboarding.isComplete && <OnboardingChecklist steps={onboarding.steps} />}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total Leads" value={counts.total} icon={Users} accent="blue" />
        <StatCard label="Today" value={counts.today} icon={CalendarDays} accent="purple" />
        <StatCard label="This Week" value={counts.thisWeek} icon={CalendarRange} accent="purple" />
        <StatCard label="This Month" value={counts.thisMonth} icon={Calendar} accent="purple" />
        <StatCard label="New" value={counts.newLeads} icon={Sparkles} accent="blue" />
        <StatCard label="Contacted" value={counts.contacted} icon={PhoneCall} accent="amber" />
        <StatCard label="Qualified" value={counts.qualified} icon={BadgeCheck} accent="teal" />
        <StatCard label="Converted" value={counts.converted} icon={Trophy} accent="green" />
        <StatCard label="Lost" value={counts.lost} icon={XCircle} accent="red" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <LeadsByDayChart data={leadsByDay} />
        <LeadsByMonthChart data={leadsByMonth} />
        <SourceDistributionChart data={sourceDistribution} />
        <ConversionRateChart data={conversionRate} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RecentActivity
          activities={recentActivity.map((a) => ({
            id: a.id,
            type: a.type,
            description: a.description,
            createdAt: a.createdAt.toISOString(),
            user: a.user,
            lead: a.lead,
          }))}
        />
        <TodaysFollowUps
          items={dueTodayAndOverdue.map((f) => ({
            id: f.id,
            dueAt: f.dueAt.toISOString(),
            isOverdue: f.isOverdue,
            lead: f.lead,
          }))}
        />
      </div>
    </div>
  );
}
