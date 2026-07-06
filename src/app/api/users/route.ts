import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole, requireUser } from "@/lib/auth/session";
import { handleApiError, jsonError } from "@/lib/api-response";
import { hashPassword } from "@/lib/auth/password";
import { createUserSchema } from "@/lib/validations/users";

export async function GET(request: NextRequest) {
  try {
    const session = await requireUser();
    const includeAll =
      request.nextUrl.searchParams.get("all") === "true" && session.role === "ADMIN";

    const users = await db.user.findMany({
      where: includeAll ? {} : { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ users });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole("ADMIN");
    const input = createUserSchema.parse(await request.json());

    const existing = await db.user.findUnique({ where: { email: input.email } });
    if (existing) {
      return jsonError("A user with this email already exists", 409);
    }

    const user = await db.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash: await hashPassword(input.password),
        role: input.role,
        phone: input.phone,
      },
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
        action: "USER_CREATED",
        entityType: "User",
        entityId: user.id,
        changes: { name: user.name, email: user.email, role: user.role },
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
