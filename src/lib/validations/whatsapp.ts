import { z } from "zod";

export const connectWhatsAppAccountSchema = z.object({
  phoneNumberId: z.string().trim().min(5, "Enter a valid phone_number_id"),
  wabaId: z.string().trim().min(5, "Enter a valid WhatsApp Business Account ID"),
  accessToken: z.string().trim().min(20, "That doesn't look like a valid access token"),
});
export type ConnectWhatsAppAccountInput = z.infer<typeof connectWhatsAppAccountSchema>;

export const sendWhatsAppMessageSchema = z.object({
  content: z.string().trim().min(1, "Message cannot be empty").max(4096),
});
export type SendWhatsAppMessageInput = z.infer<typeof sendWhatsAppMessageSchema>;

export const exchangeWhatsAppEmbeddedSignupSchema = z.object({
  code: z.string().trim().min(10, "Missing or invalid authorization code"),
  wabaId: z.string().trim().min(3, "Missing WhatsApp Business Account ID"),
  phoneNumberId: z.string().trim().min(3, "Missing phone number ID"),
  businessId: z.string().trim().min(1).optional(),
});
export type ExchangeWhatsAppEmbeddedSignupInput = z.infer<
  typeof exchangeWhatsAppEmbeddedSignupSchema
>;
