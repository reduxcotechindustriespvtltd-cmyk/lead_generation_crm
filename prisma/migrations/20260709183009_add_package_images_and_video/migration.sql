-- AlterTable
ALTER TABLE "packages" ADD COLUMN     "videoUrl" TEXT;

-- CreateTable
CREATE TABLE "package_images" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "imagePath" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "package_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "package_images_packageId_idx" ON "package_images"("packageId");

-- AddForeignKey
ALTER TABLE "package_images" ADD CONSTRAINT "package_images_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
