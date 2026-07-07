import { z } from "zod";
import { COUNTRY_CODE_VALUES } from "@/lib/country-codes";

export const signupProfileFields = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(60),
  lastName: z.string().trim().min(1, "Last name is required").max(60),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(5, "Enter a valid email address")
    .max(254)
    .email("Enter a valid email address")
    .refine((v) => !v.includes("..") && !v.startsWith(".") && !v.endsWith("."), {
      message: "Enter a valid email address",
    }),
  countryCode: z.enum(COUNTRY_CODE_VALUES),
  phone: z
    .union([z.literal(""), z.string().trim().regex(/^\d{6,14}$/, "Enter a valid phone number")])
    .optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
});

export const signupProfileSchema = signupProfileFields.refine(
  (data) => data.password === data.confirmPassword,
  { message: "Passwords don't match", path: ["confirmPassword"] }
);
export type SignupProfileInput = z.infer<typeof signupProfileSchema>;

export const signupPlanSchema = z.object({
  plan: z.enum(["FB_ONLY", "FB_WHATSAPP"]),
});
export type SignupPlanInput = z.infer<typeof signupPlanSchema>;

export const signupOtpRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
});
export type SignupOtpRequestInput = z.infer<typeof signupOtpRequestSchema>;

export const signupOtpVerifySchema = z.object({
  otp: z.string().trim().length(6, "Enter the 6-digit code"),
});
export type SignupOtpVerifyInput = z.infer<typeof signupOtpVerifySchema>;
