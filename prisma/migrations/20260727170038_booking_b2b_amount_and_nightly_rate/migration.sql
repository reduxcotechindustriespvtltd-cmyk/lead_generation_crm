/*
  Warnings:

  - You are about to drop the column `isB2B` on the `bookings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "isB2B",
ADD COLUMN     "b2bAmount" DECIMAL(12,2) NOT NULL DEFAULT 0;
