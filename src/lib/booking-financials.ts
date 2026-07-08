import { Prisma } from "@/generated/prisma/client";

type BookingFinancialsInput = {
  adultCount: number;
  kidsCount: number;
  adultCostPerPerson: Prisma.Decimal | number | string;
  kidsCostPerPerson: Prisma.Decimal | number | string;
  vendorAmount: Prisma.Decimal | number | string;
};

/** Single source of truth for booking money math — always recomputed server-side, never trusted from client input. */
export function calculateBookingFinancials(input: BookingFinancialsInput) {
  const adultCost = new Prisma.Decimal(input.adultCostPerPerson);
  const kidsCost = new Prisma.Decimal(input.kidsCostPerPerson);
  const vendorAmount = new Prisma.Decimal(input.vendorAmount);

  const totalRevenue = adultCost.mul(input.adultCount).plus(kidsCost.mul(input.kidsCount));
  const profit = totalRevenue.minus(vendorAmount);

  return { totalRevenue, profit };
}
