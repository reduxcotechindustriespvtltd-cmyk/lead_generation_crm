import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { handleApiError, jsonError } from "@/lib/api-response";
import { deleteSupabaseFile } from "@/lib/storage/supabase-file-storage";
import { updateGallerySchema } from "@/lib/validations/gallery";

export async function PATCH(request: Request, ctx: RouteContext<"/api/gallery/[id]">) {
  try {
    await requireRole("ADMIN", "MANAGER");
    const { id } = await ctx.params;

    const existing = await db.galleryImage.findUnique({ where: { id } });
    if (!existing) return jsonError("Gallery image not found", 404);

    const body = await request.json();
    const input = updateGallerySchema.parse(body);

    const updated = await db.galleryImage.update({ where: { id }, data: input });
    return NextResponse.json({ image: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/gallery/[id]">) {
  try {
    await requireRole("ADMIN", "MANAGER");
    const { id } = await ctx.params;

    const existing = await db.galleryImage.findUnique({ where: { id } });
    if (!existing) return jsonError("Gallery image not found", 404);

    await db.galleryImage.delete({ where: { id } });
    await deleteSupabaseFile(existing.imagePath);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
