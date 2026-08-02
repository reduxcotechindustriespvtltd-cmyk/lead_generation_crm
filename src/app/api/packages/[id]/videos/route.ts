import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { handleApiError, jsonError } from "@/lib/api-response";
import { getSupabasePublicUrl, InvalidFileUploadError, saveSupabaseVideo } from "@/lib/storage/supabase-file-storage";

// Adds one or more gallery videos to an existing package, independent of the
// cover image/single videoUrl link — lets the admin UI add videos to an
// already-created package without resubmitting the whole form.
export async function POST(request: Request, ctx: RouteContext<"/api/packages/[id]/videos">) {
  try {
    await requireRole("ADMIN", "MANAGER");
    const { id } = await ctx.params;

    const pkg = await db.package.findUnique({ where: { id } });
    if (!pkg) return jsonError("Package not found", 404);

    const formData = await request.formData();
    const files = formData.getAll("videos").filter((f): f is File => f instanceof File && f.size > 0);
    if (files.length === 0) {
      return jsonError("At least one video is required", 400);
    }

    const maxOrder = await db.packageVideo.aggregate({
      where: { packageId: id },
      _max: { order: true },
    });
    let nextOrder = (maxOrder._max.order ?? -1) + 1;

    const created = [];
    for (const file of files) {
      let uploaded: { path: string };
      try {
        uploaded = await saveSupabaseVideo(file, "packages");
      } catch (error) {
        if (error instanceof InvalidFileUploadError) {
          return jsonError(error.message, 400);
        }
        throw error;
      }
      const video = await db.packageVideo.create({
        data: { packageId: id, videoPath: uploaded.path, order: nextOrder },
      });
      created.push({ ...video, url: getSupabasePublicUrl(video.videoPath) });
      nextOrder += 1;
    }

    return NextResponse.json({ videos: created }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
