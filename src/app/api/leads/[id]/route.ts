import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { handleApiError, jsonError } from "@/lib/api-response";
import { can } from "@/lib/auth/rbac";
import { logActivity } from "@/lib/activity";
import { getLeadDetail } from "@/lib/queries/leads";
import { revalidateLeadDependents } from "@/lib/revalidate";
import { updateLeadSchema } from "@/lib/validations/leads";

function scopeFor(role: string, userId: string) {
  return role === "SALES_EXECUTIVE" ? { forcedAssignedToId: userId } : {};
}

export async function GET(_request: Request, ctx: RouteContext<"/api/leads/[id]">) {
  try {
    const session = await requireUser();
    const { id } = await ctx.params;
    const lead = await getLeadDetail(id, scopeFor(session.role, session.sub));
    if (!lead) return jsonError("Lead not found", 404);
    return NextResponse.json({ lead });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, ctx: RouteContext<"/api/leads/[id]">) {
  try {
    const session = await requireUser();
    const { id } = await ctx.params;
    const input = updateLeadSchema.parse(await request.json());

    const existing = await db.lead.findUnique({ where: { id }, include: { status: true } });
    if (!existing) return jsonError("Lead not found", 404);

    const isOwnLead = existing.assignedToId === session.sub;
    if (session.role === "SALES_EXECUTIVE" && !isOwnLead) {
      return jsonError("You can only edit leads assigned to you", 403);
    }

    if (
      input.assignedToId !== undefined &&
      input.assignedToId !== existing.assignedToId &&
      !can(session.role, "reassignLeads")
    ) {
      return jsonError("You are not allowed to reassign leads", 403);
    }

    const data: Record<string, unknown> = { ...input, lastActivityAt: new Date() };

    const updated = await db.lead.update({ where: { id }, data });

    if (input.statusId && input.statusId !== existing.statusId) {
      const newStatus = await db.leadStatus.findUnique({ where: { id: input.statusId } });
      await logActivity({
        leadId: id,
        userId: session.sub,
        type:
          newStatus?.name === "Converted"
            ? "CONVERTED"
            : newStatus?.name === "Lost"
              ? "MARKED_LOST"
              : newStatus?.name === "Spam"
                ? "MARKED_SPAM"
                : "STATUS_CHANGED",
        description: `Status changed from ${existing.status.name} to ${newStatus?.name ?? "Unknown"}`,
      });
    }

    if (input.assignedToId !== undefined && input.assignedToId !== existing.assignedToId) {
      const assignee = input.assignedToId
        ? await db.user.findUnique({ where: { id: input.assignedToId } })
        : null;
      await logActivity({
        leadId: id,
        userId: session.sub,
        type: existing.assignedToId ? "REASSIGNED" : "ASSIGNED",
        description: assignee ? `Assigned to ${assignee.name}` : "Unassigned",
      });

      if (assignee) {
        await db.notification.create({
          data: {
            userId: assignee.id,
            type: "LEAD_ASSIGNED",
            title: "New lead assigned",
            message: `${existing.fullName} has been assigned to you`,
            link: `/dashboard/leads/${id}`,
          },
        });
      }
    }

    if (
      input.followUpDate !== undefined &&
      input.followUpDate?.getTime() !== existing.followUpDate?.getTime()
    ) {
      await logActivity({
        leadId: id,
        userId: session.sub,
        type: "FOLLOW_UP_SCHEDULED",
        description: input.followUpDate
          ? `Follow-up scheduled for ${input.followUpDate.toLocaleDateString("en-IN")}`
          : "Follow-up cleared",
      });
    }

    revalidateLeadDependents();
    return NextResponse.json({ lead: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/leads/[id]">) {
  try {
    const session = await requireUser();
    if (!can(session.role, "deleteLead")) {
      return jsonError("You are not allowed to delete leads", 403);
    }
    const { id } = await ctx.params;
    await db.lead.delete({ where: { id } });
    revalidateLeadDependents();
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
