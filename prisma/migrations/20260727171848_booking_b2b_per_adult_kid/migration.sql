/*
  Warnings:

  - You are about to drop the column `b2bAmount` on the `bookings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "b2bAmount",
ADD COLUMN     "b2bAdultAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "b2bKidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0;
