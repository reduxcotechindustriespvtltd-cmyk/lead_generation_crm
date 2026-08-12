import { z } from "zod";

export const createDestinationSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});
export type CreateDestinationInput = z.infer<typeof createDestinationSchema>;

export const updateDestinationSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateDestinationInput = z.infer<typeof updateDestinationSchema>;
