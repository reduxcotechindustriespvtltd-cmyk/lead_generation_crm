import { z } from "zod";

const captionField = z
  .string()
  .trim()
  .max(200)
  .optional()
  .or(z.literal(""))
  .transform((v) => v || undefined);

export const createGallerySchema = z.object({
  caption: captionField,
  order: z.coerce.number().int().optional(),
});
export type CreateGalleryInput = z.infer<typeof createGallerySchema>;

export const updateGallerySchema = z.object({
  caption: captionField,
  isActive: z.coerce.boolean().optional(),
  order: z.coerce.number().int().optional(),
});
export type UpdateGalleryInput = z.infer<typeof updateGallerySchema>;
