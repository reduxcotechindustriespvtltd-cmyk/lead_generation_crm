import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type LeadSource } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/auth/password";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

// Call-disposition statuses matching how the sales team actually works leads
// over the phone — not a generic New/Contacted/Qualified/Converted pipeline.
// "New Lead" is the entry point for every freshly captured lead (isDefault:
// true — see src/app/api/public/website-leads/route.ts, src/lib/meta/sync.ts,
// src/app/api/meta/webhook/route.ts, src/lib/whatsapp/process-message.ts,
// all of which look up isDefault to stamp new leads). There's no "Converted"
// status here — an actual conversion is now tracked via a confirmed Booking
// (see src/lib/queries/dashboard.ts, src/lib/queries/analytics.ts), not a
// lead status, so nothing in this list is isWon.
const LEAD_STATUSES = [
  { name: "New Lead", color: "#6b7280", order: 0, isDefault: true },
  { name: "Assigned", color: "#3b82f6", order: 1 },
  { name: "Follow-up", color: "#f97316", order: 2, requiresFollowUp: true },
  { name: "Call Back", color: "#eab308", order: 3, requiresFollowUp: true },
  { name: "Ringing", color: "#06b6d4", order: 4 },
  { name: "Busy", color: "#f59e0b", order: 5 },
  { name: "Switch Off", color: "#64748b", order: 6 },
  { name: "Out of Service", color: "#78716c", order: 7 },
  { name: "Postponed", color: "#a855f7", order: 8 },
  { name: "Booked Other", color: "#ec4899", order: 9, isFinal: true },
  { name: "Low Budget", color: "#ef4444", order: 10, isFinal: true },
  { name: "Not Required", color: "#dc2626", order: 11, isFinal: true },
  { name: "Plan Cancelled", color: "#b91c1c", order: 12, isFinal: true },
  { name: "High Amount", color: "#f43f5e", order: 13, isFinal: true },
  { name: "No Response", color: "#737373", order: 14, isFinal: true },
  { name: "Late Connected", color: "#92400e", order: 15, isFinal: true },
  { name: "Wrong Number", color: "#7c2d12", order: 16, isFinal: true },
  { name: "Date Not Available", color: "#57534e", order: 17, isFinal: true },
];

// Demo-data-only weighting (heavier at the top of funnel) — keyed by name so
// it stays valid regardless of how LEAD_STATUSES is reordered/resized.
const STATUS_DEMO_WEIGHTS: Record<string, number> = {
  "New Lead": 20,
  Assigned: 20,
  "Follow-up": 14,
  "Call Back": 12,
  Ringing: 10,
  Busy: 10,
  "Switch Off": 8,
  "Out of Service": 6,
  Postponed: 8,
  "Booked Other": 6,
  "Low Budget": 6,
  "Not Required": 6,
  "Plan Cancelled": 5,
  "High Amount": 5,
  "No Response": 6,
  "Late Connected": 5,
  "Wrong Number": 4,
  "Date Not Available": 4,
};

const CAMPAIGNS = [
  {
    campaignName: "Bali Honeymoon Package - July Sale",
    adSetName: "18-45 Interested in Travel - Tier 1 Cities",
    adName: "Bali Video Ad 5N/6D",
    formName: "Get Bali Package Quote",
  },
  {
    campaignName: "Kashmir Group Tour 2026",
    adSetName: "Lookalike - Past Customers",
    adName: "Carousel - Kashmir Packages",
    formName: "Kashmir Tour Enquiry",
  },
  {
    campaignName: "Thailand Family Package",
    adSetName: "25-55 Parents - Tier 1 & 2 Cities",
    adName: "Thailand Family Deal Static",
    formName: "Thailand Package Enquiry",
  },
  {
    campaignName: "Dubai Visa + Flight Combo",
    adSetName: "Retargeting - Website Visitors",
    adName: "Dubai Visa Static Ad",
    formName: "Dubai Visa Enquiry Form",
  },
  {
    campaignName: "Manali Weekend Getaway",
    adSetName: "18-35 Weekend Travelers",
    adName: "Manali Reel Ad",
    formName: "Manali Getaway Quote",
  },
  {
    campaignName: "Andaman Islands Honeymoon Special",
    adSetName: "Newly Engaged - Interest Targeting",
    adName: "Andaman Honeymoon Video",
    formName: "Andaman Package Enquiry",
  },
  {
    campaignName: "Europe Multi-Country Tour",
    adSetName: "Lookalike - High Value Customers",
    adName: "Europe Tour Carousel",
    formName: "Europe Tour Enquiry",
  },
  {
    campaignName: "Goa Monsoon Special",
    adSetName: "18-40 Tier 1 Cities",
    adName: "Goa Monsoon Static Ad",
    formName: "Goa Package Quote",
  },
];

const CITY_STATE: [string, string][] = [
  ["Mumbai", "Maharashtra"],
  ["Delhi", "Delhi"],
  ["Bangalore", "Karnataka"],
  ["Pune", "Maharashtra"],
  ["Ahmedabad", "Gujarat"],
  ["Surat", "Gujarat"],
  ["Jaipur", "Rajasthan"],
  ["Hyderabad", "Telangana"],
  ["Chennai", "Tamil Nadu"],
  ["Kolkata", "West Bengal"],
  ["Lucknow", "Uttar Pradesh"],
  ["Indore", "Madhya Pradesh"],
];

const FIRST_NAMES = [
  "Aarav",
  "Vivaan",
  "Aditya",
  "Vihaan",
  "Arjun",
  "Reyansh",
  "Krishna",
  "Ishaan",
  "Rohan",
  "Karan",
  "Priya",
  "Ananya",
  "Diya",
  "Saanvi",
  "Isha",
  "Kavya",
  "Neha",
  "Pooja",
  "Riya",
  "Sneha",
  "Rahul",
  "Amit",
  "Vikram",
  "Sanjay",
  "Deepak",
  "Manish",
  "Nikita",
  "Shreya",
  "Meera",
  "Anjali",
];
const LAST_NAMES = [
  "Sharma",
  "Verma",
  "Gupta",
  "Patel",
  "Shah",
  "Mehta",
  "Joshi",
  "Iyer",
  "Nair",
  "Reddy",
  "Rao",
  "Malhotra",
  "Kapoor",
  "Chopra",
  "Bhatia",
  "Agarwal",
  "Desai",
  "Pillai",
  "Menon",
  "Saxena",
];

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function daysAgo(n: number, hour = 10): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, (n * 7) % 60, 0, 0);
  return d;
}

async function main() {
  console.log("Seeding lead statuses...");
  const statuses = new Map<string, string>();
  for (const s of LEAD_STATUSES) {
    const row = await db.leadStatus.upsert({
      where: { name: s.name },
      update: {},
      create: s,
    });
    statuses.set(s.name, row.id);
  }

  console.log("Seeding users...");
  const [admin, manager, sales1, sales2, sales3] = await Promise.all([
    db.user.upsert({
      where: { email: "admin@gsbholidays.com" },
      update: {},
      create: {
        name: "Admin",
        email: "admin@gsbholidays.com",
        passwordHash: await hashPassword("Admin@12345"),
        role: "ADMIN",
        phone: "8452989850",
      },
    }),
    db.user.upsert({
      where: { email: "priya@gsbholidays.com" },
      update: {},
      create: {
        name: "Priya Sharma",
        email: "priya@gsbholidays.com",
        passwordHash: await hashPassword("Manager@12345"),
        role: "MANAGER",
        phone: "9812345601",
      },
    }),
    db.user.upsert({
      where: { email: "rahul@gsbholidays.com" },
      update: {},
      create: {
        name: "Rahul Verma",
        email: "rahul@gsbholidays.com",
        passwordHash: await hashPassword("Sales@12345"),
        role: "SALES_EXECUTIVE",
        phone: "9812345602",
      },
    }),
    db.user.upsert({
      where: { email: "ankita@gsbholidays.com" },
      update: {},
      create: {
        name: "Ankita Joshi",
        email: "ankita@gsbholidays.com",
        passwordHash: await hashPassword("Sales@12345"),
        role: "SALES_EXECUTIVE",
        phone: "9812345603",
      },
    }),
    db.user.upsert({
      where: { email: "karan@gsbholidays.com" },
      update: {},
      create: {
        name: "Karan Mehta",
        email: "karan@gsbholidays.com",
        passwordHash: await hashPassword("Sales@12345"),
        role: "SALES_EXECUTIVE",
        phone: "9812345604",
      },
    }),
  ]);

  const salesTeam = [sales1, sales2, sales3];

  console.log("Seeding leads with activity history...");
  const statusMeta = new Map(LEAD_STATUSES.map((s) => [s.name, s]));
  // Weighted distribution across the pipeline (more at top of funnel).
  const weightedStatuses: string[] = [];
  for (const s of LEAD_STATUSES) {
    const weight = STATUS_DEMO_WEIGHTS[s.name] ?? 1;
    for (let k = 0; k < weight; k++) weightedStatuses.push(s.name);
  }

  const LEAD_COUNT = 160;
  let seed = 1;

  for (let i = 0; i < LEAD_COUNT; i++) {
    seed = (seed * 9301 + 49297) % 233280;
    const rand = seed / 233280;

    const daysBack = Math.floor(rand * 60);
    const createdAt = daysAgo(daysBack, 9 + (i % 9));
    const firstName = pick(FIRST_NAMES, i * 3 + 1);
    const lastName = pick(LAST_NAMES, i * 5 + 2);
    const [city, state] = pick(CITY_STATE, i * 2 + 3);
    const campaign = pick(CAMPAIGNS, i * 7 + 1);
    const source: LeadSource = i % 10 < 7 ? "FACEBOOK" : i % 10 < 9 ? "INSTAGRAM" : "MANUAL";
    const statusName = pick(weightedStatuses, i * 11 + 5);
    const statusId = statuses.get(statusName)!;
    const meta = statusMeta.get(statusName)!;
    const isFinal = meta.isFinal ?? false;
    const assignedTo = meta.isDefault && rand > 0.6 ? null : pick(salesTeam, i);
    const phone = `9${(700000000 + i * 137 + 1000).toString().slice(0, 9)}`;

    const lead = await db.lead.create({
      data: {
        fullName: `${firstName} ${lastName}`,
        phone,
        email:
          rand > 0.3
            ? `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`
            : null,
        city,
        state,
        campaignName: campaign.campaignName,
        adSetName: campaign.adSetName,
        adName: campaign.adName,
        formName: source === "MANUAL" ? null : campaign.formName,
        source,
        statusId,
        assignedToId: assignedTo?.id ?? null,
        createdById: source === "MANUAL" ? pick(salesTeam, i + 2).id : null,
        followUpDate:
          !isFinal && rand > 0.4
            ? new Date(Date.now() + (Math.floor(rand * 14) - 5) * 24 * 60 * 60 * 1000)
            : null,
        createdAt,
        updatedAt: createdAt,
        lastActivityAt: createdAt,
      },
    });

    await db.activity.create({
      data: {
        leadId: lead.id,
        userId: null,
        type: "LEAD_CREATED",
        description: `Lead captured from ${source === "MANUAL" ? "manual entry" : `${source} Lead Ad`} — ${campaign.campaignName}`,
        createdAt,
      },
    });

    if (assignedTo) {
      await db.activity.create({
        data: {
          leadId: lead.id,
          userId: manager.id,
          type: "ASSIGNED",
          description: `Assigned to ${assignedTo.name}`,
          createdAt: new Date(createdAt.getTime() + 30 * 60 * 1000),
        },
      });
    }

    if (!meta.isDefault) {
      await db.activity.create({
        data: {
          leadId: lead.id,
          userId: assignedTo?.id ?? manager.id,
          type: isFinal ? "MARKED_LOST" : "STATUS_CHANGED",
          description: `Status changed to ${statusName}`,
          createdAt: new Date(createdAt.getTime() + 2 * 60 * 60 * 1000),
        },
      });

      await db.note.create({
        data: {
          leadId: lead.id,
          userId: assignedTo?.id ?? manager.id,
          content: isFinal
            ? `Didn't convert — marked as "${statusName}".`
            : "Spoke with the customer, sharing package details over WhatsApp.",
          createdAt: new Date(createdAt.getTime() + 2.5 * 60 * 60 * 1000),
        },
      });
    }

    if (lead.followUpDate) {
      const isPast = lead.followUpDate.getTime() < Date.now();
      await db.followUp.create({
        data: {
          leadId: lead.id,
          dueAt: lead.followUpDate,
          note: "Follow up on package interest and pricing questions.",
          status: isPast ? (rand > 0.5 ? "MISSED" : "DONE") : "PENDING",
          createdById: assignedTo?.id ?? manager.id,
          completedAt: isPast && rand <= 0.5 ? lead.followUpDate : null,
          completedById: isPast && rand <= 0.5 ? (assignedTo?.id ?? manager.id) : null,
        },
      });
    }
  }

  console.log(`Seeded ${LEAD_COUNT} leads, ${LEAD_STATUSES.length} statuses, 5 users.`);
  console.log("\nLogin credentials:");
  console.log("  Admin:   admin@gsbholidays.com   / Admin@12345");
  console.log("  Manager: priya@gsbholidays.com   / Manager@12345");
  console.log("  Sales:   rahul@gsbholidays.com   / Sales@12345");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
