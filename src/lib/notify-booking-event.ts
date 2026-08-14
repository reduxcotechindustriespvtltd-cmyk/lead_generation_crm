import "server-only";
import type { Booking } from "@/generated/prisma/client";
import { mailServiceAdminRecipients, notifyMailService } from "@/lib/mail-service";

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

    adminRecipients: mailServiceAdminRecipients(),
  };
}

export async function notifyBookingEvent(payload: BookingEventPayload): Promise<void> {
  await notifyMailService("/api/webhooks/booking-event", payload);
}
