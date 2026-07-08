import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { handleApiError, jsonError } from "@/lib/api-response";
import { calculateBookingFinancials } from "@/lib/booking-financials";
import { listBookings } from "@/lib/queries/bookings";
import { InvalidFileUploadError, saveLocalFile } from "@/lib/storage/local-file-storage";
import { bookingListQuerySchema, createBookingSchema } from "@/lib/validations/bookings";

export async function GET(request: NextRequest) {
  try {
    await requireUser();
    const query = bookingListQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams.entries())
    );
    const result = await listBookings(query);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireUser();
    const formData = await request.formData();

    const input = createBookingSchema.parse({
      guestName: formData.get("guestName"),
      phone: formData.get("phone"),
      checkInDate: formData.get("checkInDate"),
      checkOutDate: formData.get("checkOutDate"),
      adultCount: formData.get("adultCount"),
      kidsCount: formData.get("kidsCount") || undefined,
      infantCount: formData.get("infantCount") || undefined,
      adultCostPerPerson: formData.get("adultCostPerPerson"),
      kidsCostPerPerson: formData.get("kidsCostPerPerson") || undefined,
      vendorAmount: formData.get("vendorAmount") || undefined,
      status: formData.get("status") || undefined,
      leadId: formData.get("leadId") || undefined,
    });

    const { totalRevenue, profit } = calculateBookingFinancials(input);

    let attachment: { path: string; mimeType: string } | null = null;
    const file = formData.get("attachment");
    if (file instanceof File && file.size > 0) {
      try {
        attachment = await saveLocalFile(file, "bookings");
      } catch (error) {
        if (error instanceof InvalidFileUploadError) {
          return jsonError(error.message, 400);
        }
        throw error;
      }
    }

    const booking = await db.booking.create({
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
        totalRevenue,
        profit,
        status: input.status,
        leadId: input.leadId,
        createdById: session.sub,
        attachmentPath: attachment?.path,
        attachmentName: file instanceof File ? file.name : undefined,
        attachmentMimeType: attachment?.mimeType,
        attachmentSize: file instanceof File ? file.size : undefined,
      },
    });

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
