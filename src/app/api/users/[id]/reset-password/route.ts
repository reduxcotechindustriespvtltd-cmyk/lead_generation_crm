import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api-response";
import { hashPassword } from "@/lib/auth/password";
import { resetPasswordSchema } from "@/lib/validations/users";

export async function POST(request: Request, ctx: RouteContext<"/api/users/[id]/reset-password">) {
  try {
    const session = await requireRole("ADMIN");
    const { id } = await ctx.params;
    const { password } = resetPasswordSchema.parse(await request.json());

    await db.user.update({ where: { id }, data: { passwordHash: await hashPassword(password) } });

    // Revoke all existing sessions so the old password can no longer be used.
    await db.refreshToken.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await db.auditLog.create({
      data: {
        userId: session.sub,
        action: "USER_PASSWORD_RESET",
        entityType: "User",
        entityId: id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
