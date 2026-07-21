import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { listBookings } from "@/lib/queries/bookings";
import { bookingListQuerySchema } from "@/lib/validations/bookings";
import { BookingsToolbar } from "@/components/bookings/bookings-toolbar";
import { BookingsTable } from "@/components/bookings/bookings-table";

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getCurrentUser();
  const sp = await searchParams;
  const query = bookingListQuerySchema.parse(sp);

  const [result, leads, packages] = await Promise.all([
    listBookings(query),
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

  const role = session?.role ?? "SALES_EXECUTIVE";

  const bookings = result.bookings.map((booking) => ({
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
  }));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Bookings</h1>
        <p className="text-muted-foreground text-sm">
          {result.total} booking{result.total === 1 ? "" : "s"} in total
        </p>
      </div>

      <BookingsToolbar leads={leads} packages={packages} />

      <BookingsTable
        bookings={bookings}
        leads={leads}
        packages={packages}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        totalPages={result.totalPages}
        sortBy={query.sortBy}
        sortDir={query.sortDir}
        canDelete={can(role, "deleteBooking")}
      />
    </div>
  );
}
