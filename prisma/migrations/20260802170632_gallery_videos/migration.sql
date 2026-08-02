-- CreateTable
CREATE TABLE "gallery_videos" (
    "id" TEXT NOT NULL,
    "videoPath" TEXT NOT NULL,
    "caption" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gallery_videos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "gallery_videos_isActive_idx" ON "gallery_videos"("isActive");
