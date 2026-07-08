"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Paperclip, Pencil, Phone, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookingStatusBadge } from "@/components/bookings/booking-status-badge";
import { BookingFormDialog, type BookingRow } from "@/components/bookings/booking-form-dialog";
import { LeadStatusBadge } from "@/components/leads/lead-status-badge";

type LeadOption = { id: string; fullName: string };

export function BookingHeader({
  booking,
  leads,
  canDelete,
}: {
  booking: BookingRow & {
    lead: {
      id: string;
      fullName: string;
      phone: string;
      status: { name: string; color: string };
    } | null;
  };
  leads: LeadOption[];
  canDelete: boolean;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  async function handleDelete() {
    if (!confirm(`Delete booking for "${booking.guestName}"? This cannot be undone.`)) return;
    setIsDeleting(true);
    const res = await fetch(`/api/bookings/${booking.id}`, { method: "DELETE" });
    setIsDeleting(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "Delete failed");
      return;
    }
    toast.success("Booking deleted");
    router.push("/dashboard/bookings");
  }

  const nights = Math.max(
    1,
    Math.round(
      (new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );

  return (
    <div className="bg-card flex flex-col gap-4 rounded-lg border p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">{booking.guestName}</h1>
            <Button variant="ghost" size="icon-sm" onClick={() => setEditOpen(true)}>
              <Pencil className="size-3.5" />
            </Button>
          </div>
          <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-3 text-sm">
            <BookingStatusBadge status={booking.status} />
            <span>
              {formatDate(booking.checkInDate)} → {formatDate(booking.checkOutDate)} ({nights}{" "}
              night{nights === 1 ? "" : "s"})
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" nativeButton={false} render={<a href={`tel:${booking.phone}`} />}>
            <Phone className="size-3.5" />
            {booking.phone}
          </Button>
          {canDelete && (
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 className="size-3.5" />}
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t pt-4 text-sm sm:grid-cols-4">
        <div>
          <p className="text-muted-foreground text-xs">Guests</p>
          <p className="font-medium">
            {booking.adultCount} Adult{booking.adultCount === 1 ? "" : "s"}
            {booking.kidsCount > 0 ? ` · ${booking.kidsCount} Kids` : ""}
            {booking.infantCount > 0 ? ` · ${booking.infantCount} Infants` : ""}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Adult Cost / Person</p>
          <p className="font-medium">₹{Number(booking.adultCostPerPerson).toLocaleString("en-IN")}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Kids Cost / Person</p>
          <p className="font-medium">₹{Number(booking.kidsCostPerPerson).toLocaleString("en-IN")}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Vendor Amount</p>
          <p className="font-medium">₹{Number(booking.vendorAmount).toLocaleString("en-IN")}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t pt-4 text-sm sm:grid-cols-4">
        <div>
          <p className="text-muted-foreground text-xs">Total Revenue</p>
          <p className="text-lg font-semibold">
            ₹{Number(booking.totalRevenue).toLocaleString("en-IN")}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Profit</p>
          <p
            className={`text-lg font-semibold ${Number(booking.profit) < 0 ? "text-red-600" : "text-green-600"}`}
          >
            ₹{Number(booking.profit).toLocaleString("en-IN")}
          </p>
        </div>
        {booking.lead && (
          <div>
            <p className="text-muted-foreground text-xs">Linked Lead</p>
            <div className="flex items-center gap-2">
              <button
                className="font-medium text-blue-600 hover:underline"
                onClick={() => router.push(`/dashboard/leads/${booking.lead!.id}`)}
              >
                {booking.lead.fullName}
              </button>
              <LeadStatusBadge name={booking.lead.status.name} color={booking.lead.status.color} />
            </div>
          </div>
        )}
        {booking.attachmentPath && (
          <div>
            <p className="text-muted-foreground text-xs">Attachment</p>
            <a
              href={`/api/files/${booking.attachmentPath}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 font-medium text-blue-600 hover:underline"
            >
              <Paperclip className="size-3.5" />
              {booking.attachmentName ?? "View file"}
            </a>
          </div>
        )}
      </div>

      <BookingFormDialog
        mode="edit"
        booking={booking}
        leads={leads}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </div>
  );
}
