import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api-response";

export async function POST() {
  try {
    const session = await requireUser();
    await db.notification.updateMany({
      where: { userId: session.sub, isRead: false },
      data: { isRead: true },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
