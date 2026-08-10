import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { handleApiError, jsonError } from "@/lib/api-response";
import { deleteSupabaseFile, InvalidFileUploadError, saveSupabaseFile } from "@/lib/storage/supabase-file-storage";
import { updatePackageSchema } from "@/lib/validations/packages";

export async function PATCH(request: Request, ctx: RouteContext<"/api/packages/[id]">) {
  try {
    await requireRole("ADMIN", "MANAGER");
    const { id } = await ctx.params;

    const existing = await db.package.findUnique({ where: { id } });
    if (!existing) return jsonError("Package not found", 404);

    const formData = await request.formData();
    const input = updatePackageSchema.parse({
      name: formData.get("name") || undefined,
      type: formData.get("type") || undefined,
      destination: formData.has("destination") ? formData.get("destination") : undefined,
      price: formData.get("price") || undefined,
      priceKid: formData.get("priceKid") || undefined,
      priceInfant: formData.get("priceInfant") || undefined,
      priceUnit: formData.get("priceUnit") || undefined,
      maxGuests: formData.get("maxGuests") || undefined,
      description: formData.get("description") || undefined,
      amenities: formData.get("amenities") || undefined,
      note: formData.get("note") || undefined,
      timings: formData.get("timings") || undefined,
      mealOptions: formData.get("mealOptions") || undefined,
      activities: formData.get("activities") || undefined,
      highlights: formData.get("highlights") || undefined,
      extraTitle: formData.has("extraTitle") ? formData.get("extraTitle") : undefined,
      extraContent: formData.has("extraContent") ? formData.get("extraContent") : undefined,
      videoUrl: formData.has("videoUrl") ? formData.get("videoUrl") : undefined,
      isActive: formData.has("isActive") ? formData.get("isActive") : undefined,
      order: formData.get("order") || undefined,
    });

    let imageFields: { imagePath?: string } = {};
    const file = formData.get("image");
    if (file instanceof File && file.size > 0) {
      try {
        const image = await saveSupabaseFile(file, "packages");
        await deleteSupabaseFile(existing.imagePath);
        imageFields = { imagePath: image.path };
      } catch (error) {
        if (error instanceof InvalidFileUploadError) {
          return jsonError(error.message, 400);
        }
        throw error;
      }
    }

    const updated = await db.package.update({
      where: { id },
      data: { ...input, ...imageFields },
      include: {
        images: { orderBy: { order: "asc" } },
        videos: { orderBy: { order: "asc" } },
      },
    });

    return NextResponse.json({ package: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/packages/[id]">) {
  try {
    await requireRole("ADMIN", "MANAGER");
    const { id } = await ctx.params;

    const existing = await db.package.findUnique({ where: { id }, include: { images: true, videos: true } });
    if (!existing) return jsonError("Package not found", 404);

    await db.package.delete({ where: { id } });
    await deleteSupabaseFile(existing.imagePath);
    await Promise.all(existing.images.map((img) => deleteSupabaseFile(img.imagePath)));
    await Promise.all(existing.videos.map((vid) => deleteSupabaseFile(vid.videoPath)));

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
