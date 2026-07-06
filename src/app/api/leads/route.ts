import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api-response";
import { logActivity } from "@/lib/activity";
import { getNextRoundRobinAssignee } from "@/lib/assignment";
import { listLeads, type LeadScope } from "@/lib/queries/leads";
import { createLeadSchema, leadListQuerySchema } from "@/lib/validations/leads";

function scopeFor(role: string, userId: string): LeadScope {
  return role === "SALES_EXECUTIVE" ? { forcedAssignedToId: userId } : {};
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireUser();
    const query = leadListQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams.entries())
    );
    const result = await listLeads(query, scopeFor(session.role, session.sub));
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireUser();
    const body = await request.json();
    const input = createLeadSchema.parse(body);

    let assignedToId: string | null = null;
    let assignedByRoundRobin = false;
    if (session.role === "SALES_EXECUTIVE") {
      assignedToId = session.sub;
    } else if (input.assignedToId) {
      assignedToId = input.assignedToId;
    } else {
      const nextAssignee = await getNextRoundRobinAssignee();
      if (nextAssignee) {
        assignedToId = nextAssignee;
        assignedByRoundRobin = true;
      }
    }

    const lead = await db.lead.create({
      data: {
        ...input,
        source: input.source,
        createdById: session.sub,
        assignedToId,
      },
    });

    await logActivity({
      leadId: lead.id,
      userId: session.sub,
      type: "LEAD_CREATED",
      description: `Lead manually created by ${session.name}`,
    });

    if (lead.assignedToId) {
      await logActivity({
        leadId: lead.id,
        userId: assignedByRoundRobin ? null : session.sub,
        type: "ASSIGNED",
        description: assignedByRoundRobin
          ? "Auto-assigned via round robin"
          : "Assigned on creation",
      });
    }

    return NextResponse.json({ lead }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
