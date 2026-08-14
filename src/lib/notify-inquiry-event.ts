import "server-only";
import type { Lead } from "@/generated/prisma/client";
import { mailServiceAdminRecipients, notifyMailService } from "@/lib/mail-service";

export type InquiryEventPayload = {
  event: "INQUIRY_RECEIVED";
  leadId: string;
  invoiceNumber: string | null;

  fullName: string;
  phone: string;
  email: string | null;

  checkInDate: string | null;
  checkOutDate: string | null;
  guestsAdults: number | null;
  guestsKids: number | null;
  guestsInfants: number | null;

  packageInterest: string | null;
  message: string | null;

  crmLeadUrl: string | null;
  adminRecipients: string[];
};

// `message` isn't a persisted Lead column (see the Activity log for that
// audit trail) — it's only available in-memory at the point the inquiry is
// received, so callers must pass it in explicitly rather than reading it
// off `lead`.
export function buildInquiryEventPayload(lead: Lead, message: string | null): InquiryEventPayload {
  const appUrl = process.env.APP_URL?.replace(/\/$/, "");

  return {
    event: "INQUIRY_RECEIVED",
    leadId: lead.id,
    invoiceNumber: lead.invoiceNumber,

    fullName: lead.fullName,
    phone: lead.phone,
    email: lead.email,

    checkInDate: lead.checkInDate?.toISOString() ?? null,
    checkOutDate: lead.checkOutDate?.toISOString() ?? null,
    guestsAdults: lead.guestsAdults,
    guestsKids: lead.guestsKids,
    guestsInfants: lead.guestsInfants,

    packageInterest: lead.packageInterest,
    message,

    crmLeadUrl: appUrl ? `${appUrl}/dashboard/leads/${lead.id}` : null,
    adminRecipients: mailServiceAdminRecipients(),
  };
}

export async function notifyInquiryEvent(payload: InquiryEventPayload): Promise<void> {
  await notifyMailService("/api/webhooks/inquiry-event", payload);
}
