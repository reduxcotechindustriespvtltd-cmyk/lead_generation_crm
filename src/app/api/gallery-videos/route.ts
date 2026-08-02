import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { handleApiError, jsonError } from "@/lib/api-response";
import { listGalleryVideos, nextGalleryVideoOrder } from "@/lib/queries/gallery-videos";
import { getSupabasePublicUrl, InvalidFileUploadError, saveSupabaseVideo } from "@/lib/storage/supabase-file-storage";
import { createGalleryVideoSchema } from "@/lib/validations/gallery-videos";

export async function GET() {
  try {
    await requireRole("ADMIN", "MANAGER");
    const videos = await listGalleryVideos();
    return NextResponse.json({
      videos: videos.map((video) => ({ ...video, url: getSupabasePublicUrl(video.videoPath) })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole("ADMIN", "MANAGER");
    const formData = await request.formData();

    const input = createGalleryVideoSchema.parse({
      caption: formData.get("caption") || undefined,
      order: formData.get("order") || undefined,
    });

    const file = formData.get("video");
    if (!(file instanceof File) || file.size === 0) {
      return jsonError("A video is required", 400);
    }

    let video: { path: string; mimeType: string };
    try {
      video = await saveSupabaseVideo(file, "gallery");
    } catch (error) {
      if (error instanceof InvalidFileUploadError) {
        return jsonError(error.message, 400);
      }
      throw error;
    }

    const order = input.order ?? (await nextGalleryVideoOrder());

    const galleryVideo = await db.galleryVideo.create({
      data: {
        videoPath: video.path,
        caption: input.caption,
        order,
      },
    });

    return NextResponse.json(
      { video: { ...galleryVideo, url: getSupabasePublicUrl(galleryVideo.videoPath) } },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
