/*
  Warnings:

  - Added the required column `balanceAmount` to the `bookings` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "StayType" AS ENUM ('VILLA', 'TENT', 'COTTAGE', 'CAMP');

-- CreateEnum
CREATE TYPE "BookingLocation" AS ENUM ('LONAVALA', 'KARJAT', 'ALIBAGH', 'PANVEL');

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "advance" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "assignedToId" TEXT,
ADD COLUMN     "balanceAmount" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "isB2B" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "location" "BookingLocation",
ADD COLUMN     "nights" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "resortName" TEXT,
ADD COLUMN     "source" "LeadSource",
ADD COLUMN     "stayType" "StayType";

-- CreateIndex
CREATE INDEX "bookings_assignedToId_idx" ON "bookings"("assignedToId");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
