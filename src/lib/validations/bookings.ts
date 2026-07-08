import { z } from "zod";

export const BOOKING_SORT_FIELDS = [
  "createdAt",
  "checkInDate",
  "guestName",
  "totalRevenue",
] as const;

export const bookingListQuerySchema = z.object({
  q: z.string().trim().optional(),
  status: z.enum(["CONFIRMED", "CANCELLED"]).optional(),
  leadId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(BOOKING_SORT_FIELDS).default("createdAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});

export type BookingListQuery = z.infer<typeof bookingListQuerySchema>;

// Raw field constraints WITHOUT `.default(...)`. Deliberately kept separate
// from any defaulting: in Zod 4, `.default(x).optional()` still substitutes
// the default for an omitted/undefined field instead of leaving it
// `undefined` — which silently reset kidsCount/vendorAmount/status etc. to
// their create-time defaults on every partial PATCH before this fix. The
// update schema below wraps THESE raw fields in `.optional()` directly (no
// default in the chain) so an omitted field truly stays `undefined`, letting
// the API route's `input.x ?? existing.x` merge work correctly.
const rawBookingFields = {
  guestName: z.string().trim().min(1, "Guest name is required").max(200),
  phone: z.string().trim().min(6, "Enter a valid phone number").max(20),
  checkInDate: z.coerce.date({ message: "Check-in date is required" }),
  checkOutDate: z.coerce.date({ message: "Check-out date is required" }),
  adultCount: z.coerce.number().int().min(1, "At least 1 adult is required"),
  kidsCount: z.coerce.number().int().min(0),
  infantCount: z.coerce.number().int().min(0),
  adultCostPerPerson: z.coerce.number().min(0, "Adult cost cannot be negative"),
  kidsCostPerPerson: z.coerce.number().min(0),
  vendorAmount: z.coerce.number().min(0),
  status: z.enum(["CONFIRMED", "CANCELLED"]),
  leadId: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
};

export const createBookingSchema = z
  .object({
    ...rawBookingFields,
    kidsCount: rawBookingFields.kidsCount.default(0),
    infantCount: rawBookingFields.infantCount.default(0),
    kidsCostPerPerson: rawBookingFields.kidsCostPerPerson.default(0),
    vendorAmount: rawBookingFields.vendorAmount.default(0),
    status: rawBookingFields.status.default("CONFIRMED"),
  })
  .refine((data) => data.checkOutDate > data.checkInDate, {
    message: "Check-out date must be after check-in date",
    path: ["checkOutDate"],
  });

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

// Client-form-only variant: react-hook-form's `valueAsDate`/`valueAsNumber`
// register options already deliver real Date/number values from the DOM, so
// this uses plain z.date()/z.number() (input type === output type) instead
// of the server schema's z.coerce.* (whose input type is `unknown`, which
// breaks zodResolver's generic inference against typed defaultValues).
export const bookingFormSchema = z
  .object({
    guestName: rawBookingFields.guestName,
    phone: rawBookingFields.phone,
    checkInDate: z.date({ message: "Check-in date is required" }),
    checkOutDate: z.date({ message: "Check-out date is required" }),
    adultCount: z.number().int().min(1, "At least 1 adult is required"),
    kidsCount: z.number().int().min(0),
    infantCount: z.number().int().min(0),
    adultCostPerPerson: z.number().min(0, "Adult cost cannot be negative"),
    kidsCostPerPerson: z.number().min(0),
    vendorAmount: z.number().min(0),
    status: z.enum(["CONFIRMED", "CANCELLED"]),
    // Plain required string (not optional/undefined) — "" is the "no lead
    // linked" sentinel, since react-hook-form always supplies a value for
    // every registered field and optional-key typing fights zodResolver's
    // generic inference here.
    leadId: z.string(),
  })
  .refine((data) => data.checkOutDate > data.checkInDate, {
    message: "Check-out date must be after check-in date",
    path: ["checkOutDate"],
  });

export type BookingFormValues = z.infer<typeof bookingFormSchema>;

export const updateBookingSchema = z
  .object({
    guestName: rawBookingFields.guestName.optional(),
    phone: rawBookingFields.phone.optional(),
    checkInDate: rawBookingFields.checkInDate.optional(),
    checkOutDate: rawBookingFields.checkOutDate.optional(),
    adultCount: rawBookingFields.adultCount.optional(),
    kidsCount: rawBookingFields.kidsCount.optional(),
    infantCount: rawBookingFields.infantCount.optional(),
    adultCostPerPerson: rawBookingFields.adultCostPerPerson.optional(),
    kidsCostPerPerson: rawBookingFields.kidsCostPerPerson.optional(),
    vendorAmount: rawBookingFields.vendorAmount.optional(),
    status: rawBookingFields.status.optional(),
    leadId: rawBookingFields.leadId,
    removeAttachment: z.coerce.boolean().optional(),
  })
  .refine(
    (data) =>
      !data.checkInDate || !data.checkOutDate || data.checkOutDate > data.checkInDate,
    { message: "Check-out date must be after check-in date", path: ["checkOutDate"] }
  );

export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
