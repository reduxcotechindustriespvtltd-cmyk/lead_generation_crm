import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { handleApiError, jsonError } from "@/lib/api-response";
import { updateDestinationSchema } from "@/lib/validations/destinations";

export async function PATCH(request: Request, ctx: RouteContext<"/api/destinations/[id]">) {
  try {
    await requireRole("ADMIN", "MANAGER");
    const { id } = await ctx.params;
    const input = updateDestinationSchema.parse(await request.json());

    if (input.name) {
      const existing = await db.destination.findFirst({
        where: { name: { equals: input.name, mode: "insensitive" }, id: { not: id } },
      });
      if (existing) {
        return jsonError("A destination with this name already exists", 409);
      }
    }

    const destination = await db.destination.update({ where: { id }, data: input });
    return NextResponse.json({ destination });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/destinations/[id]">) {
  try {
    await requireRole("ADMIN", "MANAGER");
    const { id } = await ctx.params;

    const packageCount = await db.package.count({ where: { destinationId: id } });
    if (packageCount > 0) {
      return jsonError(
        `Cannot delete — ${packageCount} package(s) currently use this destination. Reassign them first.`,
        409
      );
    }

    await db.destination.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
