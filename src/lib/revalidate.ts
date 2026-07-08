import "server-only";
import { revalidatePath } from "next/cache";

// A lead's status/assignment shows up on other already-visited pages too
// (Follow-ups, Bookings). Those pages are dynamic (no server-side Full Route
// Cache), but Next's client-side Router Cache can still serve a stale RSC
// payload for a route visited earlier in the session when navigating back to
// it via <Link>. revalidatePath marks those paths stale so the next visit
// refetches fresh data instead of showing the pre-update snapshot.
export function revalidateLeadDependents() {
  revalidatePath("/dashboard/leads");
  revalidatePath("/dashboard/leads/[id]", "page");
  revalidatePath("/dashboard/follow-ups");
  revalidatePath("/dashboard/bookings");
  revalidatePath("/dashboard/bookings/[id]", "page");
}
