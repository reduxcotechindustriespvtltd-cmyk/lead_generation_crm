import "server-only";
import { db } from "@/lib/db";

export async function listTestimonials() {
  return db.testimonial.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] });
}
