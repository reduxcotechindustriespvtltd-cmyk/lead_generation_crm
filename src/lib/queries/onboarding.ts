import "server-only";
import { db } from "@/lib/db";

export async function getOnboardingStatus() {
  const [userCount, metaAccountCount, leadCount] = await Promise.all([
    db.user.count(),
    db.metaAccount.count(),
    db.lead.count(),
  ]);

  const steps = [
    {
      key: "team",
      label: "Add your team",
      description: "Invite managers and sales executives so leads can be assigned.",
      href: "/dashboard/users",
      cta: "Add a user",
      done: userCount > 1,
    },
    {
      key: "meta",
      label: "Connect Facebook or Instagram",
      description: "Link a Page so Lead Ads submissions sync in automatically.",
      href: "/dashboard/integrations",
      cta: "Connect Meta",
      done: metaAccountCount > 0,
    },
    {
      key: "lead",
      label: "Get your first lead in",
      description: "Sync from Meta, or add one manually to try out the pipeline.",
      href: "/dashboard/leads",
      cta: "Add a lead",
      done: leadCount > 0,
    },
  ];

  return {
    steps,
    isComplete: steps.every((s) => s.done),
  };
}
