import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { handleApiError, jsonError } from "@/lib/api-response";
import { updateTestimonialSchema } from "@/lib/validations/testimonials";

export async function PATCH(request: Request, ctx: RouteContext<"/api/testimonials/[id]">) {
  try {
    await requireRole("ADMIN", "MANAGER");
    const { id } = await ctx.params;

    const existing = await db.testimonial.findUnique({ where: { id } });
    if (!existing) return jsonError("Testimonial not found", 404);

    const input = updateTestimonialSchema.parse(await request.json());
    const updated = await db.testimonial.update({ where: { id }, data: input });

    return NextResponse.json({ testimonial: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/testimonials/[id]">) {
  try {
    await requireRole("ADMIN", "MANAGER");
    const { id } = await ctx.params;

    const existing = await db.testimonial.findUnique({ where: { id } });
    if (!existing) return jsonError("Testimonial not found", 404);

    await db.testimonial.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
