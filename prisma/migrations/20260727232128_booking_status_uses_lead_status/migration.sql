-- DropIndex
DROP INDEX "bookings_status_idx";

-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "status",
ADD COLUMN     "statusId" TEXT NOT NULL;

-- DropEnum
DROP TYPE "BookingStatus";

-- CreateIndex
CREATE INDEX "bookings_statusId_idx" ON "bookings"("statusId");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "lead_statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

