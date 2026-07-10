import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-response";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = enforceRateLimit(request, "public-testimonials", 120, 60 * 1000);
    if (rateLimitResponse) return rateLimitResponse;

    const testimonials = await db.testimonial.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({
      testimonials: testimonials.map((t) => ({
        name: t.name,
        location: t.location,
        rating: t.rating,
        quote: t.quote,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
