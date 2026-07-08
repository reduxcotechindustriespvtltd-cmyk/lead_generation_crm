-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('CONFIRMED', 'CANCELLED');

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "guestName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "checkInDate" TIMESTAMP(3) NOT NULL,
    "checkOutDate" TIMESTAMP(3) NOT NULL,
    "adultCount" INTEGER NOT NULL DEFAULT 1,
    "kidsCount" INTEGER NOT NULL DEFAULT 0,
    "infantCount" INTEGER NOT NULL DEFAULT 0,
    "adultCostPerPerson" DECIMAL(12,2) NOT NULL,
    "kidsCostPerPerson" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "vendorAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalRevenue" DECIMAL(12,2) NOT NULL,
    "profit" DECIMAL(12,2) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "leadId" TEXT,
    "attachmentPath" TEXT,
    "attachmentName" TEXT,
    "attachmentMimeType" TEXT,
    "attachmentSize" INTEGER,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bookings_leadId_idx" ON "bookings"("leadId");

-- CreateIndex
CREATE INDEX "bookings_checkInDate_idx" ON "bookings"("checkInDate");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "bookings_createdAt_idx" ON "bookings"("createdAt");

-- CreateIndex
CREATE INDEX "bookings_phone_idx" ON "bookings"("phone");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
