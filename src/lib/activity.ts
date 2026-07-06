import "server-only";
import { db } from "@/lib/db";
import { Prisma, type ActivityType } from "@/generated/prisma/client";

export function logActivity(params: {
  leadId: string;
  userId?: string | null;
  type: ActivityType;
  description: string;
  metadata?: Record<string, unknown>;
}) {
  return db.activity.create({
    data: {
      leadId: params.leadId,
      userId: params.userId ?? null,
      type: params.type,
      description: params.description,
      metadata: params.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}
