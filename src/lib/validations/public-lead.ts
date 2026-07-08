import { z } from "zod";

// Contract for POST /api/public/website-leads — deliberately separate from
// the internal createLeadSchema since this is a public, unauthenticated
// (API-key-gated) surface with its own narrower shape (trip details instead
// of Meta attribution fields).
export const publicWebsiteLeadSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  phone: z.string().trim().min(6, "Enter a valid phone number").max(20),
  email: z
    .string()
    .trim()
    .email()
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
  checkIn: z.string().trim().optional(),
  checkOut: z.string().trim().optional(),
  guests: z.string().trim().optional(),
  package: z.string().trim().max(200).optional(),
  message: z.string().trim().max(2000).optional(),
});

export type PublicWebsiteLeadInput = z.infer<typeof publicWebsiteLeadSchema>;
