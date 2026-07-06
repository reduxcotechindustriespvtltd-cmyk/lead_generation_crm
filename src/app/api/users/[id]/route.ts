import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { handleApiError, jsonError } from "@/lib/api-response";
import { updateUserSchema } from "@/lib/validations/users";

export async function PATCH(request: Request, ctx: RouteContext<"/api/users/[id]">) {
  try {
    const session = await requireRole("ADMIN");
    const { id } = await ctx.params;
    const input = updateUserSchema.parse(await request.json());

    if (id === session.sub && (input.isActive === false || input.role !== undefined)) {
      return jsonError("You cannot change your own role or deactivate your own account", 400);
    }

    const user = await db.user.update({
      where: { id },
      data: input,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });

    await db.auditLog.create({
      data: {
        userId: session.sub,
        action: "USER_UPDATED",
        entityType: "User",
        entityId: id,
        changes: input,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    return handleApiError(error);
  }
}
