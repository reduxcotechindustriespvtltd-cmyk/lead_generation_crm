"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CalendarCheck2,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  SearchX,
  Trash2,
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { BookingStatusBadge } from "@/components/bookings/booking-status-badge";
import { BookingFormDialog, type BookingRow } from "@/components/bookings/booking-form-dialog";
import { LeadStatusBadge } from "@/components/leads/lead-status-badge";
import { cn } from "@/lib/utils";

type LeadOption = { id: string; fullName: string };

function SortHeader({
  field,
  label,
  sortBy,
  sortDir,
  onToggle,
}: {
  field: string;
  label: string;
  sortBy: string;
  sortDir: "asc" | "desc";
  onToggle: (field: string) => void;
}) {
  const Icon = sortBy !== field ? ArrowUpDown : sortDir === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs font-medium"
      onClick={() => onToggle(field)}
    >
      {label}
      <Icon className="size-3" />
    </button>
  );
}

type BookingTableRow = BookingRow & {
  lead: { id: string; fullName: string; status: { name: string; color: string } } | null;
};

export function BookingsTable({
  bookings,
  leads,
  total,
  page,
  pageSize,
  totalPages,
  sortBy,
  sortDir,
  canDelete,
}: {
  bookings: BookingTableRow[];
  leads: LeadOption[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  sortBy: string;
  sortDir: "asc" | "desc";
  canDelete: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState<BookingTableRow | null>(null);
  const hasActiveFilters = ["q", "status"].some((key) => searchParams.get(key));

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) params.delete(key);
      else params.set(key, value);
    }
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  function toggleSort(field: string) {
    if (sortBy === field) {
      updateParams({ sortBy: field, sortDir: sortDir === "asc" ? "desc" : "asc" });
    } else {
      updateParams({ sortBy: field, sortDir: "desc" });
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete booking for "${name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/bookings/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "Delete failed");
      return;
    }
    toast.success("Booking deleted");
    router.refresh();
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className={cn("overflow-x-auto rounded-lg border", isPending && "opacity-60")}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <SortHeader
                  field="guestName"
                  label="Guest"
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onToggle={toggleSort}
                />
              </TableHead>
              <TableHead>
                <SortHeader
                  field="checkInDate"
                  label="Check-in"
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onToggle={toggleSort}
                />
              </TableHead>
              <TableHead>Check-out</TableHead>
              <TableHead>Guests</TableHead>
              <TableHead>
                <SortHeader
                  field="totalRevenue"
                  label="Total Revenue"
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onToggle={toggleSort}
                />
              </TableHead>
              <TableHead>Profit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Linked Lead</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-40 text-center">
                  {hasActiveFilters ? (
                    <EmptyState
                      icon={SearchX}
                      title="No bookings match your filters"
                      description="Try clearing a filter or searching for something else."
                      size="sm"
                    />
                  ) : (
                    <EmptyState
                      icon={CalendarCheck2}
                      title="No bookings yet"
                      description="Confirmed guest stays will show up here."
                      size="sm"
                    />
                  )}
                </TableCell>
              </TableRow>
            ) : (
              bookings.map((booking) => {
                const profit = Number(booking.profit ?? 0);
                return (
                  <TableRow key={booking.id} className="group">
                    <TableCell
                      className="cursor-pointer"
                      onClick={() => router.push(`/dashboard/bookings/${booking.id}`)}
                    >
                      <div className="font-medium">{booking.guestName}</div>
                      <div className="text-muted-foreground text-xs">{booking.phone}</div>
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(booking.checkInDate)}</TableCell>
                    <TableCell className="text-sm">{formatDate(booking.checkOutDate)}</TableCell>
                    <TableCell className="text-sm">
                      {booking.adultCount}A
                      {booking.kidsCount > 0 ? ` · ${booking.kidsCount}K` : ""}
                      {booking.infantCount > 0 ? ` · ${booking.infantCount}I` : ""}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      ₹{Number(booking.totalRevenue ?? 0).toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-sm font-medium",
                        profit < 0 ? "text-red-600" : "text-green-600"
                      )}
                    >
                      ₹{profit.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell>
                      <BookingStatusBadge status={booking.status} />
                    </TableCell>
                    <TableCell className="text-sm">
                      {booking.lead ? (
                        <div className="flex items-center gap-2">
                          <button
                            className="text-blue-600 hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/dashboard/leads/${booking.lead!.id}`);
                            }}
                          >
                            {booking.lead.fullName}
                          </button>
                          <LeadStatusBadge
                            name={booking.lead.status.name}
                            color={booking.lead.status.color}
                          />
                        </div>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={<Button variant="ghost" size="icon" className="size-7" />}
                        >
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditing(booking)}>
                            Edit booking
                          </DropdownMenuItem>
                          {canDelete && (
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => handleDelete(booking.id, booking.guestName)}
                            >
                              <Trash2 />
                              Delete booking
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-muted-foreground flex items-center justify-between text-sm">
        <span>
          Showing {bookings.length === 0 ? 0 : (page - 1) * pageSize + 1}–
          {Math.min(page * pageSize, total)} of {total} bookings
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => updateParams({ page: String(page - 1) })}
          >
            <ChevronLeft className="size-4" />
            Previous
          </Button>
          <span>
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => updateParams({ page: String(page + 1) })}
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {editing && (
        <BookingFormDialog
          mode="edit"
          booking={editing}
          leads={leads}
          open={!!editing}
          onOpenChange={(v) => !v && setEditing(null)}
        />
      )}
    </div>
  );
}
