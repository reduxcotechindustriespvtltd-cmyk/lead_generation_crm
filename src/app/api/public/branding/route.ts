import { NextRequest, NextResponse } from "next/server";
import { getOrgSettings } from "@/lib/queries/org-settings";
import { handleApiError } from "@/lib/api-response";
import { enforceRateLimit } from "@/lib/rate-limit";

// Public, unauthenticated feed of the branding fields the gsb-holidays
// marketing site needs (logo) — everything else on OrgSettings
// (colors, support contacts) stays CRM-internal for now.
export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = enforceRateLimit(request, "public-branding", 120, 60 * 1000);
    if (rateLimitResponse) return rateLimitResponse;

    const settings = await getOrgSettings();
    return NextResponse.json({
      name: settings.name,
      logoUrl: settings.logoUrl,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
