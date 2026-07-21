import { z } from "zod";

const hexColor = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color like #c2410c");

// Accepts either a full external URL or a local path (e.g. a logo dropped
// into public/branding/) — both are valid <img src> values.
const logoUrl = z.union([
  z.string().trim().url(),
  z.string().trim().regex(/^\//, "Must be a full URL or a path starting with /"),
  z.literal(""),
]);

const displayPhone = z.union([z.string().trim().max(30), z.literal("")]);

export const updateOrgSettingsSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
  logoUrl,
  primaryColor: hexColor,
  secondaryColor: hexColor,
  supportEmail: z.union([z.string().trim().email("Must be a valid email"), z.literal("")]),
  // Two independent public contact numbers shown on the gsb-holidays site —
  // separate fields end-to-end (schema, DB columns, form inputs) so editing
  // one can never overwrite the other.
  primaryPhone: displayPhone,
  secondaryPhone: displayPhone,
});
export type UpdateOrgSettingsInput = z.infer<typeof updateOrgSettingsSchema>;
