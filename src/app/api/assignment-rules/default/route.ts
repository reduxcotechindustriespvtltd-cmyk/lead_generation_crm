import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api-response";
import { getDefaultAssignmentRule, upsertDefaultAssignmentRule } from "@/lib/assignment";
import { assignmentRuleSchema } from "@/lib/validations/lead-statuses";

export async function GET() {
  try {
    await requireRole("ADMIN");
    const rule = await getDefaultAssignmentRule();
    return NextResponse.json({ rule });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    await requireRole("ADMIN");
    const { isActive, memberIds } = assignmentRuleSchema.parse(await request.json());
    const rule = await upsertDefaultAssignmentRule(isActive, memberIds);
    return NextResponse.json({ rule });
  } catch (error) {
    return handleApiError(error);
  }
}
