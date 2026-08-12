import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-response";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getSupabasePublicUrl } from "@/lib/storage/supabase-file-storage";

// Public, unauthenticated content feed for the gsb-holidays marketing site's
// Packages page — this is the same data any visitor already sees rendered on
// the live site, so no API key is required, only rate limiting against abuse
// (mirrors the guard on POST /api/public/website-leads).
export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = enforceRateLimit(request, "public-packages", 120, 60 * 1000);
    if (rateLimitResponse) return rateLimitResponse;

    const packages = await db.package.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      include: {
        images: { orderBy: { order: "asc" } },
        videos: { orderBy: { order: "asc" } },
        destinationRef: true,
      },
    });

    const origin = request.nextUrl.origin;
    return NextResponse.json({
      packages: packages.map((pkg) => ({
        slug: pkg.slug,
        name: pkg.name,
        type: pkg.type,
        destination: pkg.destinationRef?.slug ?? pkg.destination ?? null,
        price: Number(pkg.price),
        priceKid: Number(pkg.priceKid),
        priceInfant: Number(pkg.priceInfant),
        priceUnit: pkg.priceUnit,
        maxGuests: pkg.maxGuests,
        description: pkg.description,
        amenities: pkg.amenities,
        note: pkg.note,
        timings: pkg.timings,
        mealOptions: pkg.mealOptions,
        activities: pkg.activities,
        highlights: pkg.highlights,
        extraTitle: pkg.extraTitle ?? null,
        extraContent: pkg.extraContent ?? null,
        image: `${origin}/api/public/files/${pkg.imagePath}`,
        images: pkg.images.map((img) => `${origin}/api/public/files/${img.imagePath}`),
        video: pkg.videoUrl ?? null,
        videos: pkg.videos.map((vid) => getSupabasePublicUrl(vid.videoPath)),
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
