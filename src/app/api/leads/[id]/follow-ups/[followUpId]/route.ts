import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { handleApiError, jsonError } from "@/lib/api-response";
import { logActivity } from "@/lib/activity";
import { updateFollowUpSchema } from "@/lib/validations/leads";

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/leads/[id]/follow-ups/[followUpId]">
) {
  try {
    const session = await requireUser();
    const { id, followUpId } = await ctx.params;
    const input = updateFollowUpSchema.parse(await request.json());

    const followUp = await db.followUp.findUnique({ where: { id: followUpId } });
    if (!followUp || followUp.leadId !== id) return jsonError("Follow-up not found", 404);

    const updated = await db.followUp.update({
      where: { id: followUpId },
      data: {
        status: input.status,
        completedAt: input.status === "DONE" ? new Date() : null,
        completedById: input.status === "DONE" ? session.sub : null,
      },
    });

    await logActivity({
      leadId: id,
      userId: session.sub,
      type: input.status === "DONE" ? "FOLLOW_UP_COMPLETED" : "FOLLOW_UP_MISSED",
      description:
        input.status === "DONE"
          ? "Follow-up marked as done"
          : `Follow-up marked as ${input.status.toLowerCase()}`,
    });

    return NextResponse.json({ followUp: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
