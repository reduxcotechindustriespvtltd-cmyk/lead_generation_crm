import { db } from "@/lib/db";

/**
 * Issues the next sequential invoice number as GSB<DDMMYYYY><counter>, e.g.
 * GSB08082026001. The counter is a single global sequence that never resets
 * (the date is just a timestamp of when the invoice was issued, not a
 * per-day reset key) — backed by the InvoiceCounter singleton row, updated
 * with an atomic upsert so concurrent submissions never collide.
 */
export async function generateInvoiceNumber(): Promise<string> {
  const counter = await db.invoiceCounter.upsert({
    where: { id: "global" },
    create: { id: "global", lastNumber: 1 },
    update: { lastNumber: { increment: 1 } },
  });

  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = String(now.getFullYear());

  return `GSB${dd}${mm}${yyyy}${String(counter.lastNumber).padStart(3, "0")}`;
}
