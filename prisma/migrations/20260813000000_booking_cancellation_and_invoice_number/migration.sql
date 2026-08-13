-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "isCancelled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "cancelledById" TEXT,
ADD COLUMN     "invoiceNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "bookings_invoiceNumber_key" ON "bookings"("invoiceNumber");

-- CreateIndex
CREATE INDEX "bookings_isCancelled_idx" ON "bookings"("isCancelled");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_cancelledById_fkey" FOREIGN KEY ("cancelledById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
