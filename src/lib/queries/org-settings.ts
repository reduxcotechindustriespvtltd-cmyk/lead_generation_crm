import "server-only";
import { db } from "@/lib/db";

const SINGLETON_ID = "singleton";

export async function getOrgSettings() {
  const existing = await db.orgSettings.findUnique({ where: { id: SINGLETON_ID } });
  if (existing) return existing;

  // Self-healing: first read on a fresh instance creates the default row,
  // seeded from env vars if the operator set them before first boot.
  return db.orgSettings.create({
    data: {
      id: SINGLETON_ID,
      name: process.env.ORG_NAME || "CRM",
      logoUrl: process.env.ORG_LOGO_URL || null,
      primaryColor: process.env.ORG_PRIMARY_COLOR || "#c2410c",
      secondaryColor: process.env.ORG_SECONDARY_COLOR || "#0d9488",
      supportEmail: process.env.ORG_SUPPORT_EMAIL || null,
      primaryPhone: process.env.ORG_PRIMARY_PHONE || null,
      secondaryPhone: process.env.ORG_SECONDARY_PHONE || null,
    },
  });
}
