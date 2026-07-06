import { z } from "zod";

export const connectMetaAccountSchema = z.object({
  pageAccessToken: z.string().trim().min(20, "That doesn't look like a valid Page access token"),
});
export type ConnectMetaAccountInput = z.infer<typeof connectMetaAccountSchema>;

export const connectMetaOAuthPageSchema = z.object({
  pageId: z.string().trim().min(1, "pageId is required"),
});
export type ConnectMetaOAuthPageInput = z.infer<typeof connectMetaOAuthPageSchema>;
