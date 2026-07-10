import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { handleApiError, jsonError } from "@/lib/api-response";
import { listPackages, generateUniquePackageSlug } from "@/lib/queries/packages";
import { InvalidFileUploadError, saveS3File } from "@/lib/storage/s3-file-storage";
import { createPackageSchema } from "@/lib/validations/packages";

export async function GET() {
  try {
    await requireRole("ADMIN", "MANAGER");
    const packages = await listPackages();
    return NextResponse.json({ packages });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole("ADMIN", "MANAGER");
    const formData = await request.formData();

    const input = createPackageSchema.parse({
      name: formData.get("name"),
      type: formData.get("type"),
      price: formData.get("price"),
      priceUnit: formData.get("priceUnit") || undefined,
      maxGuests: formData.get("maxGuests"),
      description: formData.get("description"),
      amenities: formData.get("amenities") || "[]",
      videoUrl: formData.get("videoUrl") || undefined,
      isActive: formData.get("isActive") || undefined,
      order: formData.get("order") || undefined,
    });

    const file = formData.get("image");
    if (!(file instanceof File) || file.size === 0) {
      return jsonError("An image is required", 400);
    }

    let image: { path: string; mimeType: string };
    try {
      image = await saveS3File(file, "packages");
    } catch (error) {
      if (error instanceof InvalidFileUploadError) {
        return jsonError(error.message, 400);
      }
      throw error;
    }

    // Additional gallery images beyond the cover — optional, any number.
    const galleryFiles = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
    const galleryImages: { path: string }[] = [];
    try {
      for (const galleryFile of galleryFiles) {
        galleryImages.push(await saveS3File(galleryFile, "packages"));
      }
    } catch (error) {
      if (error instanceof InvalidFileUploadError) {
        return jsonError(error.message, 400);
      }
      throw error;
    }

    const slug = await generateUniquePackageSlug(input.name);

    const pkg = await db.package.create({
      data: {
        slug,
        name: input.name,
        type: input.type,
        price: input.price,
        priceUnit: input.priceUnit,
        maxGuests: input.maxGuests,
        description: input.description,
        amenities: input.amenities,
        imagePath: image.path,
        videoUrl: input.videoUrl,
        isActive: input.isActive,
        order: input.order,
        images: {
          create: galleryImages.map((img, i) => ({ imagePath: img.path, order: i })),
        },
      },
      include: { images: { orderBy: { order: "asc" } } },
    });

    return NextResponse.json({ package: pkg }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
