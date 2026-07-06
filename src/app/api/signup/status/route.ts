import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const orderId = request.nextUrl.searchParams.get("orderId");
    if (!orderId) return jsonError("Missing orderId", 400);

    const pending = await db.pendingSignup.findUnique({ where: { merchantOrderId: orderId } });
    if (!pending) return jsonError("Signup not found", 404);

    const user = await db.user.findUnique({ where: { email: pending.email } });
    if (!user) return NextResponse.json({ status: "PENDING" });

    return NextResponse.json({ status: "ACTIVE" });
  } catch (error) {
    return handleApiError(error);
  }
}
