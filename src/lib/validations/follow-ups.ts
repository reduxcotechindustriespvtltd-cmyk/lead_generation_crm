import { z } from "zod";

export const FOLLOW_UP_SORT_FIELDS = ["dueAt", "createdAt", "fullName"] as const;

export const followUpListQuerySchema = z
  .object({
    q: z.string().trim().optional(),
    status: z.enum(["PENDING", "DONE", "MISSED", "CANCELLED", "ALL"]).optional(),
    enquiredFrom: z.coerce.date().optional(),
    enquiredTo: z.coerce.date().optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    sortBy: z.enum(FOLLOW_UP_SORT_FIELDS).default("dueAt"),
    sortDir: z.enum(["asc", "desc"]).default("asc"),
  })
  .refine((data) => !data.enquiredFrom || !data.enquiredTo || data.enquiredTo >= data.enquiredFrom, {
    message: "End date must be on or after the start date",
    path: ["enquiredTo"],
  });

export type FollowUpListQuery = z.infer<typeof followUpListQuerySchema>;
