import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-response";
import { enforceRateLimit } from "@/lib/rate-limit";
import { logActivity } from "@/lib/activity";
import { getNextRoundRobinAssignee } from "@/lib/assignment";
import { revalidateLeadDependents } from "@/lib/revalidate";
import { publicWebsiteLeadSchema } from "@/lib/validations/public-lead";

// Public, unauthenticated-by-session intake endpoint for the gsb-holidays
// marketing site's contact form. Guarded by a shared API key (not JWT
// session auth — there is no logged-in user on the public website) plus
// rate limiting. Mirrors the manual-lead-creation logic in
// POST /api/leads (default status, round-robin assignment, activity log,
// notification) so website inquiries behave exactly like a manually added
// lead once they land in the CRM.
export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = enforceRateLimit(request, "public-website-lead", 20, 15 * 60 * 1000);
    if (rateLimitResponse) return rateLimitResponse;

    const apiKey = request.headers.get("x-api-key");
    if (!process.env.WEBSITE_LEAD_API_KEY || apiKey !== process.env.WEBSITE_LEAD_API_KEY) {
      return jsonError("Unauthorized", 401);
    }

    const input = publicWebsiteLeadSchema.parse(await request.json());

    const defaultStatus = await db.leadStatus.findFirst({ where: { isDefault: true } });
    if (!defaultStatus) {
      return jsonError("No default lead status configured", 500);
    }

    const assignedToId = await getNextRoundRobinAssignee();

    const lead = await db.lead.create({
      data: {
        fullName: input.name,
        phone: input.phone,
        email: input.email,
        campaignName: input.package,
        source: "WEBSITE",
        statusId: defaultStatus.id,
        assignedToId,
      },
    });

    const tripDetails = [
      input.checkIn ? `Check-in: ${input.checkIn}` : null,
      input.checkOut ? `Check-out: ${input.checkOut}` : null,
      input.guests ? `Guests: ${input.guests}` : null,
      input.package ? `Package: ${input.package}` : null,
    ]
      .filter(Boolean)
      .join(", ");

    const description = [
      "New inquiry from the GSB Holidays website",
      tripDetails,
      input.message ? `Message: "${input.message}"` : null,
    ]
      .filter(Boolean)
      .join(" — ");

    await logActivity({
      leadId: lead.id,
      userId: null,
      type: "LEAD_CREATED",
      description,
    });

    if (assignedToId) {
      await logActivity({
        leadId: lead.id,
        userId: null,
        type: "ASSIGNED",
        description: "Auto-assigned via round robin",
      });

      await db.notification.create({
        data: {
          userId: assignedToId,
          type: "LEAD_ASSIGNED",
          title: "New website inquiry",
          message: `${lead.fullName} submitted an inquiry on the website`,
          link: `/dashboard/leads/${lead.id}`,
        },
      });
    }

    revalidateLeadDependents();
    return NextResponse.json({ success: true, leadId: lead.id }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
