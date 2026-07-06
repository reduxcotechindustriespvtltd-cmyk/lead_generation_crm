import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api-response";

const updateSchema = z.object({ isActive: z.boolean() });

export async function PATCH(request: Request, ctx: RouteContext<"/api/whatsapp-accounts/[id]">) {
  try {
    const session = await requireRole("ADMIN");
    const { id } = await ctx.params;
    const { isActive } = updateSchema.parse(await request.json());

    const account = await db.whatsAppAccount.update({
      where: { id },
      data: { isActive },
      select: { id: true, displayPhoneNumber: true, isActive: true },
    });

    await db.auditLog.create({
      data: {
        userId: session.sub,
        action: isActive ? "WHATSAPP_ACCOUNT_ENABLED" : "WHATSAPP_ACCOUNT_DISABLED",
        entityType: "WhatsAppAccount",
        entityId: id,
      },
    });

    return NextResponse.json({ account });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/whatsapp-accounts/[id]">) {
  try {
    const session = await requireRole("ADMIN");
    const { id } = await ctx.params;

    await db.whatsAppAccount.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        userId: session.sub,
        action: "WHATSAPP_ACCOUNT_DISCONNECTED",
        entityType: "WhatsAppAccount",
        entityId: id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
