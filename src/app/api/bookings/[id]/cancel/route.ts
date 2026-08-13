import { NextResponse, after } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { handleApiError, jsonError } from "@/lib/api-response";
import { can } from "@/lib/auth/rbac";
import { generateInvoiceNumber } from "@/lib/invoice";
import { buildBookingEventPayload, notifyBookingEvent } from "@/lib/notify-booking-event";

export async function POST(_request: Request, ctx: RouteContext<"/api/bookings/[id]/cancel">) {
  try {
    const session = await requireUser();
    if (!can(session.role, "cancelBooking")) {
      return jsonError("You are not allowed to cancel bookings", 403);
    }
    const { id } = await ctx.params;

    const existing = await db.booking.findUnique({ where: { id } });
    if (!existing) return jsonError("Booking not found", 404);

    // Idempotent: a double-click or retry just returns the already-cancelled
    // booking rather than erroring or sending a second cancellation email.
    if (existing.isCancelled) {
      return NextResponse.json({ booking: existing });
    }

    const updated = await db.booking.update({
      where: { id },
      data: {
        isCancelled: true,
        cancelledAt: new Date(),
        cancelledById: session.sub,
        invoiceNumber: existing.invoiceNumber ?? (await generateInvoiceNumber()),
      },
    });

    after(() => notifyBookingEvent(buildBookingEventPayload(updated, "BOOKING_CANCELLED")));

    return NextResponse.json({ booking: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
