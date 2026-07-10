import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { handleApiError, jsonError } from "@/lib/api-response";
import { deleteS3File, InvalidFileUploadError, saveS3File } from "@/lib/storage/s3-file-storage";
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
      price: formData.get("price") || undefined,
      priceUnit: formData.get("priceUnit") || undefined,
      maxGuests: formData.get("maxGuests") || undefined,
      description: formData.get("description") || undefined,
      amenities: formData.get("amenities") || undefined,
      videoUrl: formData.has("videoUrl") ? formData.get("videoUrl") : undefined,
      isActive: formData.has("isActive") ? formData.get("isActive") : undefined,
      order: formData.get("order") || undefined,
    });

    let imageFields: { imagePath?: string } = {};
    const file = formData.get("image");
    if (file instanceof File && file.size > 0) {
      try {
        const image = await saveS3File(file, "packages");
        await deleteS3File(existing.imagePath);
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
      include: { images: { orderBy: { order: "asc" } } },
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

    const existing = await db.package.findUnique({ where: { id }, include: { images: true } });
    if (!existing) return jsonError("Package not found", 404);

    await db.package.delete({ where: { id } });
    await deleteS3File(existing.imagePath);
    await Promise.all(existing.images.map((img) => deleteS3File(img.imagePath)));

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
