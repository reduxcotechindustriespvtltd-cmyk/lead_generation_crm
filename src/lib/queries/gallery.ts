import "server-only";
import { db } from "@/lib/db";

export async function listGalleryImages() {
  return db.galleryImage.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] });
}

/** New uploads default to the end of the current order, not the top. */
export async function nextGalleryOrder() {
  const result = await db.galleryImage.aggregate({ _max: { order: true } });
  return (result._max.order ?? -1) + 1;
}
