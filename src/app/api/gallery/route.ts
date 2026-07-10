import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { handleApiError, jsonError } from "@/lib/api-response";
import { listGalleryImages, nextGalleryOrder } from "@/lib/queries/gallery";
import { InvalidFileUploadError, saveS3File } from "@/lib/storage/s3-file-storage";
import { createGallerySchema } from "@/lib/validations/gallery";

export async function GET() {
  try {
    await requireRole("ADMIN", "MANAGER");
    const images = await listGalleryImages();
    return NextResponse.json({ images });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole("ADMIN", "MANAGER");
    const formData = await request.formData();

    const input = createGallerySchema.parse({
      caption: formData.get("caption") || undefined,
      order: formData.get("order") || undefined,
    });

    const file = formData.get("image");
    if (!(file instanceof File) || file.size === 0) {
      return jsonError("An image is required", 400);
    }

    let image: { path: string; mimeType: string };
    try {
      image = await saveS3File(file, "gallery");
    } catch (error) {
      if (error instanceof InvalidFileUploadError) {
        return jsonError(error.message, 400);
      }
      throw error;
    }

    const order = input.order ?? (await nextGalleryOrder());

    const galleryImage = await db.galleryImage.create({
      data: {
        imagePath: image.path,
        caption: input.caption,
        order,
      },
    });

    return NextResponse.json({ image: galleryImage }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
