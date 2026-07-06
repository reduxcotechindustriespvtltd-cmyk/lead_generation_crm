import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api-response";

export async function GET() {
  try {
    const session = await requireUser();
    const [notifications, unreadCount] = await Promise.all([
      db.notification.findMany({
        where: { userId: session.sub },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      db.notification.count({ where: { userId: session.sub, isRead: false } }),
    ]);
    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    return handleApiError(error);
  }
}
