import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api-response";
import { listTestimonials } from "@/lib/queries/testimonials";
import { createTestimonialSchema } from "@/lib/validations/testimonials";

export async function GET() {
  try {
    await requireRole("ADMIN", "MANAGER");
    const testimonials = await listTestimonials();
    return NextResponse.json({ testimonials });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireRole("ADMIN", "MANAGER");
    const input = createTestimonialSchema.parse(await request.json());

    const testimonial = await db.testimonial.create({ data: input });
    return NextResponse.json({ testimonial }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
