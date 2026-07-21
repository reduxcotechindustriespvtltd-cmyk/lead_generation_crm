import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { getBookingDetail } from "@/lib/queries/bookings";
import { BookingHeader } from "@/components/bookings/booking-header";

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getCurrentUser();

  const [booking, leads, packages] = await Promise.all([
    getBookingDetail(id),
    db.lead.findMany({
      select: { id: true, fullName: true },
      orderBy: { fullName: "asc" },
      take: 500,
    }),
    db.package.findMany({
      where: { isActive: true },
      select: { id: true, name: true, destination: true },
      orderBy: { order: "asc" },
    }),
  ]);

  if (!booking || !session) notFound();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <BookingHeader
        booking={{
          id: booking.id,
          guestName: booking.guestName,
          phone: booking.phone,
          checkInDate: booking.checkInDate.toISOString(),
          checkOutDate: booking.checkOutDate.toISOString(),
          adultCount: booking.adultCount,
          kidsCount: booking.kidsCount,
          infantCount: booking.infantCount,
          adultCostPerPerson: booking.adultCostPerPerson.toString(),
          kidsCostPerPerson: booking.kidsCostPerPerson.toString(),
          vendorAmount: booking.vendorAmount.toString(),
          totalRevenue: booking.totalRevenue.toString(),
          profit: booking.profit.toString(),
          status: booking.status,
          leadId: booking.leadId,
          packageId: booking.packageId,
          packageName: booking.packageName,
          destination: booking.destination,
          attachmentPath: booking.attachmentPath,
          attachmentName: booking.attachmentName,
          lead: booking.lead,
        }}
        leads={leads}
        packages={packages}
        canDelete={can(session.role, "deleteBooking")}
      />
    </div>
  );
}
