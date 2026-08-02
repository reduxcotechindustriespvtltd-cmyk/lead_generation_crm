import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { handleApiError, jsonError } from "@/lib/api-response";
import { deleteSupabaseFile } from "@/lib/storage/supabase-file-storage";
import { updateGalleryVideoSchema } from "@/lib/validations/gallery-videos";

export async function PATCH(request: Request, ctx: RouteContext<"/api/gallery-videos/[id]">) {
  try {
    await requireRole("ADMIN", "MANAGER");
    const { id } = await ctx.params;

    const existing = await db.galleryVideo.findUnique({ where: { id } });
    if (!existing) return jsonError("Gallery video not found", 404);

    const body = await request.json();
    const input = updateGalleryVideoSchema.parse(body);

    const updated = await db.galleryVideo.update({ where: { id }, data: input });
    return NextResponse.json({ video: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/gallery-videos/[id]">) {
  try {
    await requireRole("ADMIN", "MANAGER");
    const { id } = await ctx.params;

    const existing = await db.galleryVideo.findUnique({ where: { id } });
    if (!existing) return jsonError("Gallery video not found", 404);

    await db.galleryVideo.delete({ where: { id } });
    await deleteSupabaseFile(existing.videoPath);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
