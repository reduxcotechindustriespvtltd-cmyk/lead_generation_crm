import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { handleApiError, jsonError } from "@/lib/api-response";

export async function POST(_request: Request, ctx: RouteContext<"/api/notifications/[id]/read">) {
  try {
    const session = await requireUser();
    const { id } = await ctx.params;

    const notification = await db.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== session.sub) {
      return jsonError("Notification not found", 404);
    }

    await db.notification.update({ where: { id }, data: { isRead: true } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
