import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { handleApiError, jsonError } from "@/lib/api-response";
import { can } from "@/lib/auth/rbac";
import { calculateBookingFinancials } from "@/lib/booking-financials";
import { getBookingDetail } from "@/lib/queries/bookings";
import {
  deleteLocalFile,
  InvalidFileUploadError,
  saveLocalFile,
} from "@/lib/storage/local-file-storage";
import { updateBookingSchema } from "@/lib/validations/bookings";

export async function GET(_request: Request, ctx: RouteContext<"/api/bookings/[id]">) {
  try {
    await requireUser();
    const { id } = await ctx.params;
    const booking = await getBookingDetail(id);
    if (!booking) return jsonError("Booking not found", 404);
    return NextResponse.json({ booking });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, ctx: RouteContext<"/api/bookings/[id]">) {
  try {
    await requireUser();
    const { id } = await ctx.params;

    const existing = await db.booking.findUnique({ where: { id } });
    if (!existing) return jsonError("Booking not found", 404);

    const formData = await request.formData();
    const input = updateBookingSchema.parse({
      guestName: formData.get("guestName") || undefined,
      phone: formData.get("phone") || undefined,
      checkInDate: formData.get("checkInDate") || undefined,
      checkOutDate: formData.get("checkOutDate") || undefined,
      adultCount: formData.get("adultCount") || undefined,
      kidsCount: formData.get("kidsCount") || undefined,
      infantCount: formData.get("infantCount") || undefined,
      adultCostPerPerson: formData.get("adultCostPerPerson") || undefined,
      kidsCostPerPerson: formData.get("kidsCostPerPerson") || undefined,
      vendorAmount: formData.get("vendorAmount") || undefined,
      status: formData.get("status") || undefined,
      leadId: formData.has("leadId") ? formData.get("leadId") || "" : undefined,
      removeAttachment: formData.get("removeAttachment") || undefined,
    });

    // Recompute from the merged existing+incoming values so a partial update
    // (e.g. only vendorAmount changing) still recalculates correctly.
    const { totalRevenue, profit } = calculateBookingFinancials({
      adultCount: input.adultCount ?? existing.adultCount,
      kidsCount: input.kidsCount ?? existing.kidsCount,
      adultCostPerPerson: input.adultCostPerPerson ?? existing.adultCostPerPerson,
      kidsCostPerPerson: input.kidsCostPerPerson ?? existing.kidsCostPerPerson,
      vendorAmount: input.vendorAmount ?? existing.vendorAmount,
    });

    let attachmentFields: Record<string, unknown> = {};
    const file = formData.get("attachment");
    if (file instanceof File && file.size > 0) {
      try {
        const attachment = await saveLocalFile(file, "bookings");
        await deleteLocalFile(existing.attachmentPath);
        attachmentFields = {
          attachmentPath: attachment.path,
          attachmentName: file.name,
          attachmentMimeType: attachment.mimeType,
          attachmentSize: file.size,
        };
      } catch (error) {
        if (error instanceof InvalidFileUploadError) {
          return jsonError(error.message, 400);
        }
        throw error;
      }
    } else if (input.removeAttachment) {
      await deleteLocalFile(existing.attachmentPath);
      attachmentFields = {
        attachmentPath: null,
        attachmentName: null,
        attachmentMimeType: null,
        attachmentSize: null,
      };
    }

    const updated = await db.booking.update({
      where: { id },
      data: {
        guestName: input.guestName,
        phone: input.phone,
        checkInDate: input.checkInDate,
        checkOutDate: input.checkOutDate,
        adultCount: input.adultCount,
        kidsCount: input.kidsCount,
        infantCount: input.infantCount,
        adultCostPerPerson: input.adultCostPerPerson,
        kidsCostPerPerson: input.kidsCostPerPerson,
        vendorAmount: input.vendorAmount,
        status: input.status,
        leadId: input.leadId === "" ? null : input.leadId,
        totalRevenue,
        profit,
        ...attachmentFields,
      },
    });

    return NextResponse.json({ booking: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/bookings/[id]">) {
  try {
    const session = await requireUser();
    if (!can(session.role, "deleteBooking")) {
      return jsonError("You are not allowed to delete bookings", 403);
    }
    const { id } = await ctx.params;

    const existing = await db.booking.findUnique({ where: { id } });
    if (!existing) return jsonError("Booking not found", 404);

    await db.booking.delete({ where: { id } });
    await deleteLocalFile(existing.attachmentPath);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
