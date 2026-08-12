import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-response";
import { enforceRateLimit } from "@/lib/rate-limit";

// Public, unauthenticated feed for the gsb-holidays marketing site's nav
// "Destinations" dropdown and /packages?location= filtering — mirrors
// /api/public/packages (same rate-limit shape, no API key required).
export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = enforceRateLimit(request, "public-destinations", 120, 60 * 1000);
    if (rateLimitResponse) return rateLimitResponse;

    const destinations = await db.destination.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({
      destinations: destinations.map((d) => ({ slug: d.slug, name: d.name })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
