import "server-only";
import type { Booking } from "@/generated/prisma/client";

export type BookingEventType = "BOOKING_CREATED" | "BOOKING_UPDATED" | "BOOKING_CANCELLED";

export type BookingEventPayload = {
  event: BookingEventType;
  bookingId: string;
  invoiceNumber: string | null;

  guestName: string;
  phone: string;
  email: string | null;

  checkInDate: string;
  checkOutDate: string;
  nights: number;
  stayType: string | null;

  adultCount: number;
  kidsCount: number;
  infantCount: number;

  adultCostPerPerson: string;
  kidsCostPerPerson: string;
  totalRevenue: string;
  advance: string;
  balanceAmount: string;
  includesFood: boolean;

  packageName: string | null;
  destination: string | null;
  resortName: string | null;
  location: string | null;
  notes: string | null;

  cancelledAt: string | null;

  adminRecipients: string[];
};

function adminRecipients(): string[] {
  return (process.env.ADMIN_NOTIFICATION_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
}

export function buildBookingEventPayload(booking: Booking, event: BookingEventType): BookingEventPayload {
  return {
    event,
    bookingId: booking.id,
    invoiceNumber: booking.invoiceNumber,

    guestName: booking.guestName,
    phone: booking.phone,
    email: booking.email,

    checkInDate: booking.checkInDate.toISOString(),
    checkOutDate: booking.checkOutDate.toISOString(),
    nights: booking.nights,
    stayType: booking.stayType,

    adultCount: booking.adultCount,
    kidsCount: booking.kidsCount,
    infantCount: booking.infantCount,

    adultCostPerPerson: booking.adultCostPerPerson.toString(),
    kidsCostPerPerson: booking.kidsCostPerPerson.toString(),
    totalRevenue: booking.totalRevenue.toString(),
    advance: booking.advance.toString(),
    balanceAmount: booking.balanceAmount.toString(),
    includesFood: booking.includesFood,

    packageName: booking.packageName,
    destination: booking.destination,
    resortName: booking.resortName,
    location: booking.location,
    notes: booking.notes,

    cancelledAt: booking.cancelledAt?.toISOString() ?? null,

    adminRecipients: adminRecipients(),
  };
}

/**
 * Fire-and-forget notification to the standalone mail/invoice service. Never
 * throws and never blocks the caller — a booking create/update/cancel must
 * still succeed even if the mail service is unreachable or unconfigured.
 */
export async function notifyBookingEvent(payload: BookingEventPayload): Promise<void> {
  const url = process.env.MAIL_SERVICE_URL;
  const apiKey = process.env.MAIL_SERVICE_API_KEY;
  if (!url || !apiKey) return;

  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/api/webhooks/booking-event`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify(payload),
      // The mail service generates a PDF and sends real SMTP mail
      // synchronously before responding — this is fire-and-forget from the
      // caller's perspective (never awaited before the booking API
      // responds), so a generous timeout costs nothing and avoids logging
      // false-negative errors for a slow-but-successful send.
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      console.error("notifyBookingEvent failed", res.status, await res.text().catch(() => ""));
    }
  } catch (error) {
    console.error("notifyBookingEvent error", error);
  }
}
