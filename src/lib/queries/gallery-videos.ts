import "server-only";
import { db } from "@/lib/db";

export async function listGalleryVideos() {
  return db.galleryVideo.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] });
}

/** New uploads default to the end of the current order, not the top. */
export async function nextGalleryVideoOrder() {
  const result = await db.galleryVideo.aggregate({ _max: { order: true } });
  return (result._max.order ?? -1) + 1;
}
