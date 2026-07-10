import "server-only";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";

export async function listPackages() {
  return db.package.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: { images: { orderBy: { order: "asc" } } },
  });
}

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "package"
  );
}

/** Slug is derived from the name and must stay unique for gsb-holidays' /contact?package=<slug> links. */
export async function generateUniquePackageSlug(name: string) {
  const base = slugify(name);
  const existing = await db.package.findUnique({ where: { slug: base } });
  return existing ? `${base}-${nanoid(6).toLowerCase()}` : base;
}
