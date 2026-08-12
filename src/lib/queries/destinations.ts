import "server-only";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";

export async function listDestinations() {
  return db.destination.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });
}

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "destination"
  );
}

/** Slug is derived from the name and must stay unique/stable for gsb-holidays' /packages?location=<slug> links. */
export async function generateUniqueDestinationSlug(name: string) {
  const base = slugify(name);
  const existing = await db.destination.findUnique({ where: { slug: base } });
  return existing ? `${base}-${nanoid(6).toLowerCase()}` : base;
}
