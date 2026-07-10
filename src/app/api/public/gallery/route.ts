import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-response";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = enforceRateLimit(request, "public-gallery", 120, 60 * 1000);
    if (rateLimitResponse) return rateLimitResponse;

    const images = await db.galleryImage.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });

    const origin = request.nextUrl.origin;
    return NextResponse.json({
      images: images.map((img) => `${origin}/api/public/files/${img.imagePath}`),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
