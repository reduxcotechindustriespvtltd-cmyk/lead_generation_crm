import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { handleApiError, jsonError } from "@/lib/api-response";
import { deleteSupabaseFile } from "@/lib/storage/supabase-file-storage";

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/packages/[id]/images/[imageId]">
) {
  try {
    await requireRole("ADMIN", "MANAGER");
    const { id, imageId } = await ctx.params;

    const image = await db.packageImage.findUnique({ where: { id: imageId } });
    if (!image || image.packageId !== id) return jsonError("Image not found", 404);

    await db.packageImage.delete({ where: { id: imageId } });
    await deleteSupabaseFile(image.imagePath);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
