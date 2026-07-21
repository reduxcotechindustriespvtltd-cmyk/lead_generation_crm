import Link from "next/link";
import { CalendarCheck2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { BookingStatusBadge } from "@/components/bookings/booking-status-badge";

type BookingSummary = {
  id: string;
  checkInDate: string;
  checkOutDate: string;
  adultCount: number;
  kidsCount: number;
  status: "CONFIRMED" | "CANCELLED";
  totalRevenue: string;
  packageName: string | null;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function LeadBookingHistory({ bookings }: { bookings: BookingSummary[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Booking History</CardTitle>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <EmptyState
            icon={CalendarCheck2}
            title="No bookings yet"
            description="Confirmed stays for this lead will show up here."
            size="sm"
          />
        ) : (
          <div className="flex flex-col divide-y">
            {bookings.map((booking) => (
              <Link
                key={booking.id}
                href={`/dashboard/bookings/${booking.id}`}
                className="hover:bg-muted/50 -mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-3 text-sm"
              >
                <div>
                  <div className="font-medium">
                    {formatDate(booking.checkInDate)} → {formatDate(booking.checkOutDate)}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {booking.packageName ?? "No package"} · {booking.adultCount} Adult
                    {booking.adultCount === 1 ? "" : "s"}
                    {booking.kidsCount > 0 ? ` · ${booking.kidsCount} Kids` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium">
                    ₹{Number(booking.totalRevenue).toLocaleString("en-IN")}
                  </span>
                  <BookingStatusBadge status={booking.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
