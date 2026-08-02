import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-response";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getSupabasePublicUrl } from "@/lib/storage/supabase-file-storage";

export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = enforceRateLimit(request, "public-gallery-videos", 120, 60 * 1000);
    if (rateLimitResponse) return rateLimitResponse;

    const videos = await db.galleryVideo.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({
      videos: videos.map((video) => getSupabasePublicUrl(video.videoPath)),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
