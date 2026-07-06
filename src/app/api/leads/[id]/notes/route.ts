import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { handleApiError, jsonError } from "@/lib/api-response";
import { logActivity } from "@/lib/activity";
import { createNoteSchema } from "@/lib/validations/leads";

export async function POST(request: Request, ctx: RouteContext<"/api/leads/[id]/notes">) {
  try {
    const session = await requireUser();
    const { id } = await ctx.params;
    const input = createNoteSchema.parse(await request.json());

    const lead = await db.lead.findUnique({ where: { id } });
    if (!lead) return jsonError("Lead not found", 404);

    if (session.role === "SALES_EXECUTIVE" && lead.assignedToId !== session.sub) {
      return jsonError("You can only add notes to leads assigned to you", 403);
    }

    const note = await db.note.create({
      data: {
        leadId: id,
        userId: session.sub,
        content: input.content,
        mentionedUserIds: input.mentionedUserIds,
      },
      include: { user: { select: { id: true, name: true } } },
    });

    await logActivity({
      leadId: id,
      userId: session.sub,
      type: "NOTE_ADDED",
      description: `${session.name} added a note`,
    });

    await Promise.all(
      input.mentionedUserIds
        .filter((uid) => uid !== session.sub)
        .map((uid) =>
          db.notification.create({
            data: {
              userId: uid,
              type: "MENTION",
              title: "You were mentioned",
              message: `${session.name} mentioned you on ${lead.fullName}'s lead`,
              link: `/dashboard/leads/${id}`,
            },
          })
        )
    );

    await db.lead.update({ where: { id }, data: { lastActivityAt: new Date() } });

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
