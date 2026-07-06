import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { handleApiError, jsonError } from "@/lib/api-response";
import { logActivity } from "@/lib/activity";
import { createFollowUpSchema } from "@/lib/validations/leads";

export async function POST(request: Request, ctx: RouteContext<"/api/leads/[id]/follow-ups">) {
  try {
    const session = await requireUser();
    const { id } = await ctx.params;
    const input = createFollowUpSchema.parse(await request.json());

    const lead = await db.lead.findUnique({ where: { id } });
    if (!lead) return jsonError("Lead not found", 404);
    if (session.role === "SALES_EXECUTIVE" && lead.assignedToId !== session.sub) {
      return jsonError("You can only schedule follow-ups for leads assigned to you", 403);
    }

    const followUp = await db.followUp.create({
      data: {
        leadId: id,
        dueAt: input.dueAt,
        note: input.note,
        createdById: session.sub,
      },
    });

    await db.lead.update({
      where: { id },
      data: { followUpDate: input.dueAt, lastActivityAt: new Date() },
    });

    await logActivity({
      leadId: id,
      userId: session.sub,
      type: "FOLLOW_UP_SCHEDULED",
      description: `Follow-up scheduled for ${input.dueAt.toLocaleDateString("en-IN")}`,
    });

    return NextResponse.json({ followUp }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
