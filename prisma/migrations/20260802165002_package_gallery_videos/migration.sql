-- CreateTable
CREATE TABLE "package_videos" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "videoPath" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "package_videos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "package_videos_packageId_idx" ON "package_videos"("packageId");

-- AddForeignKey
ALTER TABLE "package_videos" ADD CONSTRAINT "package_videos_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
