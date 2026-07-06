import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole, requireUser } from "@/lib/auth/session";
import { handleApiError, jsonError } from "@/lib/api-response";
import { createLeadStatusSchema } from "@/lib/validations/lead-statuses";

export async function GET() {
  try {
    await requireUser();
    const statuses = await db.leadStatus.findMany({ orderBy: { order: "asc" } });
    return NextResponse.json({ statuses });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireRole("ADMIN");
    const input = createLeadStatusSchema.parse(await request.json());

    const existing = await db.leadStatus.findUnique({ where: { name: input.name } });
    if (existing) {
      return jsonError("A status with this name already exists", 409);
    }

    const status = await db.leadStatus.create({ data: input });
    return NextResponse.json({ status }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
