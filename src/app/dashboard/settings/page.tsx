import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getDefaultAssignmentRule } from "@/lib/assignment";
import { getOrgSettings } from "@/lib/queries/org-settings";
import { BrandingSettings } from "@/components/settings/branding-settings";
import { LeadStatusesManager } from "@/components/settings/lead-statuses-manager";
import { RoundRobinSettings } from "@/components/settings/round-robin-settings";
import { ChangePasswordForm } from "@/components/settings/change-password-form";

export default async function SettingsPage() {
  const session = await getCurrentUser();
  const isAdmin = session?.role === "ADMIN";

  const [statuses, users, rule, org] = await Promise.all([
    isAdmin ? db.leadStatus.findMany({ orderBy: { order: "asc" } }) : Promise.resolve([]),
    isAdmin
      ? db.user.findMany({
          where: { isActive: true },
          select: { id: true, name: true, role: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
    isAdmin ? getDefaultAssignmentRule() : Promise.resolve(null),
    isAdmin ? getOrgSettings() : Promise.resolve(null),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">
          {isAdmin ? "Configure your CRM and manage your account" : "Manage your account"}
        </p>
      </div>

      {isAdmin && org && (
        <>
          <BrandingSettings settings={org} />
          <LeadStatusesManager statuses={statuses} />
          <RoundRobinSettings
            users={users}
            initialActive={rule?.isActive ?? false}
            initialMemberIds={rule?.members.map((m) => m.userId) ?? []}
          />
        </>
      )}

      <ChangePasswordForm />
    </div>
  );
}
