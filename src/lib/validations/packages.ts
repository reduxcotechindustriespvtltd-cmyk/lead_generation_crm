import { z } from "zod";

// Amenities travel through multipart FormData as a JSON-encoded string array
// (FormData has no native array support) — parsed leniently so a malformed
// value just yields an empty list instead of failing the whole submission.
const amenitiesField = z.string().transform((value) => {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string" && v.trim().length > 0)
      : [];
  } catch {
    return [];
  }
});

const videoUrlField = z
  .string()
  .trim()
  .max(500)
  .optional()
  .or(z.literal(""))
  .transform((v) => v || undefined);

const rawPackageFields = {
  name: z.string().trim().min(1, "Name is required").max(200),
  type: z.string().trim().min(1, "Type is required").max(100),
  price: z.coerce.number().min(0, "Price cannot be negative"),
  priceUnit: z.string().trim().min(1).max(50),
  maxGuests: z.coerce.number().int().min(1, "At least 1 guest is required"),
  description: z.string().trim().min(1, "Description is required").max(2000),
  amenities: amenitiesField,
  videoUrl: videoUrlField,
  isActive: z.coerce.boolean(),
  order: z.coerce.number().int(),
};

export const createPackageSchema = z.object({
  ...rawPackageFields,
  priceUnit: rawPackageFields.priceUnit.default("per night"),
  isActive: rawPackageFields.isActive.default(true),
  order: rawPackageFields.order.default(0),
});
export type CreatePackageInput = z.infer<typeof createPackageSchema>;

export const updatePackageSchema = z.object({
  name: rawPackageFields.name.optional(),
  type: rawPackageFields.type.optional(),
  price: rawPackageFields.price.optional(),
  priceUnit: rawPackageFields.priceUnit.optional(),
  maxGuests: rawPackageFields.maxGuests.optional(),
  description: rawPackageFields.description.optional(),
  amenities: rawPackageFields.amenities.optional(),
  videoUrl: rawPackageFields.videoUrl,
  isActive: rawPackageFields.isActive.optional(),
  order: rawPackageFields.order.optional(),
});
export type UpdatePackageInput = z.infer<typeof updatePackageSchema>;

// Client-form-only variant — amenities stay as raw newline-separated text
// here and are split/JSON-encoded at submit time in the form dialog.
export const packageFormSchema = z.object({
  name: rawPackageFields.name,
  type: rawPackageFields.type,
  price: z.number().min(0, "Price cannot be negative"),
  priceUnit: rawPackageFields.priceUnit,
  maxGuests: z.number().int().min(1, "At least 1 guest is required"),
  description: rawPackageFields.description,
  amenities: z.string(),
  videoUrl: z.string(),
  isActive: z.boolean(),
  order: z.number().int(),
});
export type PackageFormValues = z.infer<typeof packageFormSchema>;
