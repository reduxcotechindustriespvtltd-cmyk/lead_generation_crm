import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { handleApiError, jsonError } from "@/lib/api-response";
import { deleteSupabaseFile } from "@/lib/storage/supabase-file-storage";

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/packages/[id]/videos/[videoId]">
) {
  try {
    await requireRole("ADMIN", "MANAGER");
    const { id, videoId } = await ctx.params;

    const video = await db.packageVideo.findUnique({ where: { id: videoId } });
    if (!video || video.packageId !== id) return jsonError("Video not found", 404);

    await db.packageVideo.delete({ where: { id: videoId } });
    await deleteSupabaseFile(video.videoPath);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
