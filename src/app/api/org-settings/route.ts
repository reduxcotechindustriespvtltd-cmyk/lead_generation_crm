import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api-response";
import { getOrgSettings } from "@/lib/queries/org-settings";
import { updateOrgSettingsSchema } from "@/lib/validations/org-settings";

export async function GET() {
  try {
    await requireRole("ADMIN");
    const settings = await getOrgSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireRole("ADMIN");
    const input = updateOrgSettingsSchema.parse(await request.json());

    const settings = await db.orgSettings.upsert({
      where: { id: "singleton" },
      update: {
        name: input.name,
        logoUrl: input.logoUrl || null,
        primaryColor: input.primaryColor,
        secondaryColor: input.secondaryColor,
        supportEmail: input.supportEmail || null,
      },
      create: {
        id: "singleton",
        name: input.name,
        logoUrl: input.logoUrl || null,
        primaryColor: input.primaryColor,
        secondaryColor: input.secondaryColor,
        supportEmail: input.supportEmail || null,
      },
    });

    await db.auditLog.create({
      data: {
        userId: session.sub,
        action: "ORG_SETTINGS_UPDATED",
        entityType: "OrgSettings",
        entityId: settings.id,
        changes: { name: settings.name },
      },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    return handleApiError(error);
  }
}
