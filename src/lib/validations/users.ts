import { z } from "zod";

const passwordSchema = z.string().min(8, "Password must be at least 8 characters").max(100);

export const createUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: passwordSchema,
  role: z.enum(["ADMIN", "MANAGER", "SALES_EXECUTIVE"]),
  phone: z.string().trim().max(20).optional(),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  role: z.enum(["ADMIN", "MANAGER", "SALES_EXECUTIVE"]).optional(),
  isActive: z.boolean().optional(),
  phone: z.string().trim().max(20).optional(),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const resetPasswordSchema = z.object({
  password: passwordSchema,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
});
