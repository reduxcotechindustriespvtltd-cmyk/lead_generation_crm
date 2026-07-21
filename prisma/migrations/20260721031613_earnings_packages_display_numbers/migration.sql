-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "destination" TEXT,
ADD COLUMN     "packageId" TEXT,
ADD COLUMN     "packageName" TEXT;

-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "packageId" TEXT,
ADD COLUMN     "packageInterest" TEXT;

-- AlterTable
ALTER TABLE "org_settings" ADD COLUMN     "primaryPhone" TEXT,
ADD COLUMN     "secondaryPhone" TEXT;

-- AlterTable
ALTER TABLE "packages" ADD COLUMN     "destination" TEXT;

-- CreateIndex
CREATE INDEX "bookings_packageId_idx" ON "bookings"("packageId");

-- CreateIndex
CREATE INDEX "leads_packageId_idx" ON "leads"("packageId");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
