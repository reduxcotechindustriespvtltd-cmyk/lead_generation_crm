import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole, requireUser } from "@/lib/auth/session";
import { handleApiError, jsonError } from "@/lib/api-response";
import { createDestinationSchema } from "@/lib/validations/destinations";
import { generateUniqueDestinationSlug } from "@/lib/queries/destinations";

export async function GET() {
  try {
    await requireUser();
    const destinations = await db.destination.findMany({ orderBy: { order: "asc" } });
    return NextResponse.json({ destinations });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireRole("ADMIN", "MANAGER");
    const input = createDestinationSchema.parse(await request.json());

    const existing = await db.destination.findFirst({
      where: { name: { equals: input.name, mode: "insensitive" } },
    });
    if (existing) {
      return jsonError("A destination with this name already exists", 409);
    }

    const slug = await generateUniqueDestinationSlug(input.name);
    const destination = await db.destination.create({ data: { ...input, slug } });
    return NextResponse.json({ destination }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
