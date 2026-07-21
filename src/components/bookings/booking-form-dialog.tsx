"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Paperclip, X } from "lucide-react";

import { bookingFormSchema, type BookingFormValues } from "@/lib/validations/bookings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type LeadOption = { id: string; fullName: string };
type PackageOption = { id: string; name: string; destination: string | null };

export type BookingRow = {
  id: string;
  guestName: string;
  phone: string;
  checkInDate: string;
  checkOutDate: string;
  adultCount: number;
  kidsCount: number;
  infantCount: number;
  adultCostPerPerson: string;
  kidsCostPerPerson: string;
  vendorAmount: string;
  totalRevenue: string;
  profit: string;
  status: "CONFIRMED" | "CANCELLED";
  leadId: string | null;
  packageId: string | null;
  packageName: string | null;
  destination: string | null;
  attachmentPath: string | null;
  attachmentName: string | null;
};

function toDateInputValue(iso: string) {
  return iso.slice(0, 10);
}

function numberOr(value: number, fallback: number) {
  return Number.isFinite(value) ? value : fallback;
}

// Plain-number approximation for the live preview only — the authoritative
// figure is always recomputed server-side with Prisma.Decimal on submit.
// Deliberately does NOT import from @/lib/booking-financials: that helper
// pulls in the generated Prisma client (for Prisma.Decimal), which drags
// Node-only internals into the browser bundle and breaks the client build.
function previewFinancials(input: {
  adultCount: number;
  kidsCount: number;
  adultCostPerPerson: number;
  kidsCostPerPerson: number;
  vendorAmount: number;
}) {
  const totalRevenue = input.adultCount * input.adultCostPerPerson + input.kidsCount * input.kidsCostPerPerson;
  const profit = totalRevenue - input.vendorAmount;
  return { totalRevenue, profit };
}

export function BookingFormDialog({
  mode,
  booking,
  leads,
  packages,
  open,
  onOpenChange,
}: {
  mode: "create" | "edit";
  booking?: BookingRow;
  leads: LeadOption[];
  packages: PackageOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [removeAttachment, setRemoveAttachment] = useState(false);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: booking
      ? {
          guestName: booking.guestName,
          phone: booking.phone,
          checkInDate: new Date(booking.checkInDate),
          checkOutDate: new Date(booking.checkOutDate),
          adultCount: booking.adultCount,
          kidsCount: booking.kidsCount,
          infantCount: booking.infantCount,
          adultCostPerPerson: Number(booking.adultCostPerPerson),
          kidsCostPerPerson: Number(booking.kidsCostPerPerson),
          vendorAmount: Number(booking.vendorAmount),
          status: booking.status,
          leadId: booking.leadId ?? "",
          packageId: booking.packageId ?? "",
        }
      : {
          guestName: "",
          phone: "",
          adultCount: 1,
          kidsCount: 0,
          infantCount: 0,
          adultCostPerPerson: 0,
          kidsCostPerPerson: 0,
          vendorAmount: 0,
          status: "CONFIRMED",
          leadId: "",
          packageId: "",
        },
  });

  const [watchedAdultCount, watchedKidsCount, watchedAdultCost, watchedKidsCost, watchedVendor] =
    form.watch([
      "adultCount",
      "kidsCount",
      "adultCostPerPerson",
      "kidsCostPerPerson",
      "vendorAmount",
    ]);

  const preview = previewFinancials({
    adultCount: numberOr(Number(watchedAdultCount), 0),
    kidsCount: numberOr(Number(watchedKidsCount), 0),
    adultCostPerPerson: numberOr(Number(watchedAdultCost), 0),
    kidsCostPerPerson: numberOr(Number(watchedKidsCost), 0),
    vendorAmount: numberOr(Number(watchedVendor), 0),
  });

  async function onSubmit(values: BookingFormValues) {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("guestName", values.guestName);
      formData.set("phone", values.phone);
      formData.set("checkInDate", values.checkInDate.toISOString());
      formData.set("checkOutDate", values.checkOutDate.toISOString());
      formData.set("adultCount", String(values.adultCount));
      formData.set("kidsCount", String(values.kidsCount));
      formData.set("infantCount", String(values.infantCount));
      formData.set("adultCostPerPerson", String(values.adultCostPerPerson));
      formData.set("kidsCostPerPerson", String(values.kidsCostPerPerson));
      formData.set("vendorAmount", String(values.vendorAmount));
      formData.set("status", values.status);
      if (values.leadId) formData.set("leadId", values.leadId);
      if (values.packageId) formData.set("packageId", values.packageId);
      if (file) formData.set("attachment", file);
      if (mode === "edit" && removeAttachment) formData.set("removeAttachment", "true");

      const res = await fetch(
        mode === "create" ? "/api/bookings" : `/api/bookings/${booking!.id}`,
        { method: mode === "create" ? "POST" : "PATCH", body: formData }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Failed to save booking");
        return;
      }

      toast.success(mode === "create" ? "Booking created" : "Booking updated");
      onOpenChange(false);
      if (mode === "create") {
        form.reset();
        setFile(null);
      }
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add a new booking" : "Edit booking"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Record a confirmed guest stay, optionally linked to a lead."
              : "Update this booking's details."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="guestName"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Guest Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Aarav Sharma" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="9876543210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="checkInDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Check-in Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value ? toDateInputValue(field.value.toISOString()) : ""}
                        onChange={(e) => field.onChange(e.target.valueAsDate)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="checkOutDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Check-out Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value ? toDateInputValue(field.value.toISOString()) : ""}
                        onChange={(e) => field.onChange(e.target.valueAsDate)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="adultCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adults</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="kidsCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kids</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="infantCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Infants</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="adultCostPerPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adult Cost / Person</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="kidsCostPerPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kids Cost / Person</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="vendorAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="packageId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Package</FormLabel>
                    <Select
                      value={field.value || "none"}
                      onValueChange={(v) => field.onChange(v === "none" ? "" : v)}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="None">
                            {(v: string) =>
                              v === "none"
                                ? "None"
                                : (packages.find((p) => p.id === v)?.name ?? "None")
                            }
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {packages.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                            {p.destination ? ` — ${p.destination}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="leadId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Linked Lead</FormLabel>
                    <Select
                      value={field.value || "none"}
                      onValueChange={(v) => field.onChange(v === "none" ? "" : v)}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="None">
                            {(v: string) =>
                              v === "none"
                                ? "None"
                                : (leads.find((l) => l.id === v)?.fullName ?? "None")
                            }
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {leads.map((l) => (
                          <SelectItem key={l.id} value={l.id}>
                            {l.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="bg-muted/50 grid grid-cols-2 gap-3 rounded-lg border px-4 py-3">
              <div>
                <p className="text-muted-foreground text-xs">Total Revenue</p>
                <p className="text-lg font-semibold">₹{preview.totalRevenue.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Profit</p>
                <p
                  className={`text-lg font-semibold ${preview.profit < 0 ? "text-red-600" : "text-green-600"}`}
                >
                  ₹{preview.profit.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Attachment (payment screenshot / ID)</label>
              {booking?.attachmentPath && !removeAttachment && !file && (
                <div className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                  <a
                    href={`/api/files/${booking.attachmentPath}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:underline"
                  >
                    <Paperclip className="size-3.5" />
                    {booking.attachmentName ?? "View attachment"}
                  </a>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    onClick={() => setRemoveAttachment(true)}
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
              )}
              <Input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(e) => {
                  setFile(e.target.files?.[0] ?? null);
                  setRemoveAttachment(false);
                }}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="animate-spin" />}
                {mode === "create" ? "Create Booking" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
