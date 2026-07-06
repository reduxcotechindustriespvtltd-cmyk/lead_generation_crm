import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api-response";
import { logActivity } from "@/lib/activity";
import { bulkAssignSchema } from "@/lib/validations/leads";

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole("ADMIN", "MANAGER");
    const { leadIds, assignedToId } = bulkAssignSchema.parse(await request.json());

    const assignee = await db.user.findUnique({ where: { id: assignedToId } });
    if (!assignee) return NextResponse.json({ error: "Assignee not found" }, { status: 404 });

    await db.lead.updateMany({
      where: { id: { in: leadIds } },
      data: { assignedToId, lastActivityAt: new Date() },
    });

    await Promise.all(
      leadIds.map((leadId) =>
        Promise.all([
          logActivity({
            leadId,
            userId: session.sub,
            type: "REASSIGNED",
            description: `Bulk assigned to ${assignee.name}`,
          }),
          db.notification.create({
            data: {
              userId: assignedToId,
              type: "LEAD_ASSIGNED",
              title: "New lead assigned",
              message: `A lead has been assigned to you`,
              link: `/dashboard/leads/${leadId}`,
            },
          }),
        ])
      )
    );

    return NextResponse.json({ success: true, count: leadIds.length });
  } catch (error) {
    return handleApiError(error);
  }
}
