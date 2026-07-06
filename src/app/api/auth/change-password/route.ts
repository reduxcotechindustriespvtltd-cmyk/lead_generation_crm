import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { handleApiError, jsonError } from "@/lib/api-response";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { changePasswordSchema } from "@/lib/validations/users";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const rateLimitResponse = enforceRateLimit(request, "change-password", 10, 5 * 60 * 1000);
    if (rateLimitResponse) return rateLimitResponse;

    const session = await requireUser();
    const { currentPassword, newPassword } = changePasswordSchema.parse(await request.json());

    const user = await db.user.findUnique({ where: { id: session.sub } });
    if (!user) return jsonError("User not found", 404);

    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) return jsonError("Current password is incorrect", 400);

    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(newPassword) },
    });

    await db.auditLog.create({
      data: { userId: user.id, action: "PASSWORD_CHANGED", entityType: "User", entityId: user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
