import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-response";
import { enforceRateLimit } from "@/lib/rate-limit";
import { logActivity } from "@/lib/activity";
import { getNextRoundRobinAssignee } from "@/lib/assignment";
import { revalidateLeadDependents } from "@/lib/revalidate";
import { publicWebsiteLeadSchema } from "@/lib/validations/public-lead";
import { generateInvoiceNumber } from "@/lib/invoice";

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
    const invoiceNumber = await generateInvoiceNumber();

    // The website's contact form sends the package as a slug (e.g.
    // "gsb-royal-villa"), not a friendly name — resolve it against the
    // Package table so the lead shows a real name, not a raw slug, and can
    // be joined for earnings reporting. Fall back to the raw value verbatim
    // if it doesn't match any known package (deleted/renamed package, or a
    // free-text "not sure yet" case).
    const matchedPackage = input.package
      ? await db.package.findUnique({ where: { slug: input.package } })
      : null;
    const packageInterest = matchedPackage?.name ?? input.package;

    // The website sends dates as "YYYY-MM-DD" strings and guest counts as
    // numeric strings — parse defensively so a malformed value just leaves
    // the field unset rather than 500ing the whole inquiry.
    const parseDate = (v?: string) => {
      if (!v) return undefined;
      const d = new Date(v);
      return Number.isNaN(d.getTime()) ? undefined : d;
    };
    const parseCount = (v?: string) => {
      if (!v) return undefined;
      const n = Number.parseInt(v, 10);
      return Number.isNaN(n) ? undefined : n;
    };
    const checkInDate = parseDate(input.checkIn);
    const checkOutDate = parseDate(input.checkOut);
    const guestsAdults = parseCount(input.guestsAdults);
    const guestsKids = parseCount(input.guestsKids);
    const guestsInfants = parseCount(input.guestsInfants);

    const lead = await db.lead.create({
      data: {
        fullName: input.name,
        phone: input.phone,
        email: input.email,
        packageId: matchedPackage?.id,
        packageInterest,
        source: "WEBSITE",
        statusId: defaultStatus.id,
        assignedToId,
        invoiceNumber,
        checkInDate,
        checkOutDate,
        guestsAdults,
        guestsKids,
        guestsInfants,
      },
    });

    const guestBreakdown = [
      guestsAdults ? `${guestsAdults} adult${guestsAdults === 1 ? "" : "s"}` : null,
      guestsKids ? `${guestsKids} kid${guestsKids === 1 ? "" : "s"}` : null,
      guestsInfants ? `${guestsInfants} infant${guestsInfants === 1 ? "" : "s"}` : null,
    ]
      .filter(Boolean)
      .join(", ");

    const tripDetails = [
      input.checkIn ? `Check-in: ${input.checkIn}` : null,
      input.checkOut ? `Check-out: ${input.checkOut}` : null,
      guestBreakdown ? `Guests: ${guestBreakdown}` : input.guests ? `Guests: ${input.guests}` : null,
      packageInterest ? `Package: ${packageInterest}` : null,
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
    return NextResponse.json({ success: true, leadId: lead.id, invoiceNumber }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
