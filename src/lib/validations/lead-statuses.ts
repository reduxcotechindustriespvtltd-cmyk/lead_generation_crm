import { z } from "zod";

export const createLeadStatusSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(50),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color like #22c55e"),
  order: z.number().int().min(0),
  isFinal: z.boolean(),
  isWon: z.boolean(),
});
export type CreateLeadStatusInput = z.infer<typeof createLeadStatusSchema>;

export const updateLeadStatusSchema = z.object({
  name: z.string().trim().min(1).max(50).optional(),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  order: z.number().int().min(0).optional(),
  isFinal: z.boolean().optional(),
  isWon: z.boolean().optional(),
});
export type UpdateLeadStatusInput = z.infer<typeof updateLeadStatusSchema>;

export const assignmentRuleSchema = z.object({
  isActive: z.boolean(),
  memberIds: z.array(z.string()),
});
