import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { handleApiError, jsonError } from "@/lib/api-response";
import { updateLeadStatusSchema } from "@/lib/validations/lead-statuses";

export async function PATCH(request: Request, ctx: RouteContext<"/api/lead-statuses/[id]">) {
  try {
    await requireRole("ADMIN");
    const { id } = await ctx.params;
    const input = updateLeadStatusSchema.parse(await request.json());

    const status = await db.leadStatus.update({ where: { id }, data: input });
    return NextResponse.json({ status });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/lead-statuses/[id]">) {
  try {
    await requireRole("ADMIN");
    const { id } = await ctx.params;

    const leadCount = await db.lead.count({ where: { statusId: id } });
    if (leadCount > 0) {
      return jsonError(
        `Cannot delete — ${leadCount} lead(s) currently use this status. Reassign them first.`,
        409
      );
    }

    await db.leadStatus.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
