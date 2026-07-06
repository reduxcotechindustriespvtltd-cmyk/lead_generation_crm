// Production bootstrap: creates the default lead-status pipeline, an admin
// account, and this instance's white-label branding. Unlike prisma/seed.ts,
// this does NOT create fake demo leads — use it once per new client instance
// against a fresh database.
//
// Required env vars: ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD
// Optional white-label env vars: ORG_NAME, ORG_LOGO_URL, ORG_PRIMARY_COLOR,
// ORG_SECONDARY_COLOR, ORG_SUPPORT_EMAIL — all editable later from
// Settings > Branding, so these just save you the manual step post-deploy.
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/auth/password";
import { safeHexColor } from "../src/lib/hex-color";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const LEAD_STATUSES = [
  { name: "New", color: "#3b82f6", order: 0, isDefault: true },
  { name: "Attempted Contact", color: "#eab308", order: 1 },
  { name: "Contacted", color: "#6366f1", order: 2 },
  { name: "Interested", color: "#a855f7", order: 3 },
  { name: "Follow-up", color: "#f97316", order: 4 },
  { name: "Qualified", color: "#14b8a6", order: 5 },
  { name: "Converted", color: "#22c55e", order: 6, isFinal: true, isWon: true },
  { name: "Lost", color: "#ef4444", order: 7, isFinal: true },
  { name: "Spam", color: "#6b7280", order: 8, isFinal: true },
];

async function main() {
  const name = process.env.ADMIN_NAME;
  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!name || !email || !password) {
    throw new Error(
      "ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD environment variables are required"
    );
  }
  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD must be at least 8 characters");
  }

  console.log("Creating default lead statuses...");
  for (const status of LEAD_STATUSES) {
    await db.leadStatus.upsert({ where: { name: status.name }, update: {}, create: status });
  }

  console.log(`Creating admin user ${email}...`);
  await db.user.upsert({
    where: { email },
    update: {},
    create: {
      name,
      email,
      passwordHash: await hashPassword(password),
      role: "ADMIN",
    },
  });

  console.log("Setting up branding...");
  await db.orgSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      name: process.env.ORG_NAME || name.split(" ")[0] + "'s CRM",
      logoUrl: process.env.ORG_LOGO_URL || null,
      primaryColor: safeHexColor(process.env.ORG_PRIMARY_COLOR ?? "", "#c2410c"),
      secondaryColor: safeHexColor(process.env.ORG_SECONDARY_COLOR ?? "", "#0d9488"),
      supportEmail: process.env.ORG_SUPPORT_EMAIL || null,
    },
  });

  console.log("Bootstrap complete. You can now log in with the admin account you provided.");
  console.log("Branding can be fine-tuned anytime from Settings > Branding in the app.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
