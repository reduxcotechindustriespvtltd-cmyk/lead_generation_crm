import { Prisma } from "@/generated/prisma/client";

type BookingFinancialsInput = {
  nights: number;
  adultCount: number;
  kidsCount: number;
  adultCostPerPerson: Prisma.Decimal | number | string;
  kidsCostPerPerson: Prisma.Decimal | number | string;
  b2bAdultAmount: Prisma.Decimal | number | string;
  b2bKidAmount: Prisma.Decimal | number | string;
  advance: Prisma.Decimal | number | string;
};

/** Single source of truth for booking money math — always recomputed server-side, never trusted from client input. */
export function calculateBookingFinancials(input: BookingFinancialsInput) {
  const adultCost = new Prisma.Decimal(input.adultCostPerPerson);
  const kidsCost = new Prisma.Decimal(input.kidsCostPerPerson);
  const b2bAdultAmount = new Prisma.Decimal(input.b2bAdultAmount);
  const b2bKidAmount = new Prisma.Decimal(input.b2bKidAmount);
  const advance = new Prisma.Decimal(input.advance);

  // Per Person / Per Kid amounts (both customer-facing and B2B) are
  // per-night rates. Total Vendor Amount is derived from the B2B rates the
  // same way Total Amount is derived from the customer-facing rates — not
  // entered directly.
  const totalRevenue = adultCost
    .mul(input.adultCount)
    .plus(kidsCost.mul(input.kidsCount))
    .mul(input.nights);
  const vendorAmount = b2bAdultAmount
    .mul(input.adultCount)
    .plus(b2bKidAmount.mul(input.kidsCount))
    .mul(input.nights);
  const profit = totalRevenue.minus(vendorAmount);
  const balanceAmount = totalRevenue.minus(advance);

  return { totalRevenue, vendorAmount, profit, balanceAmount };
}
