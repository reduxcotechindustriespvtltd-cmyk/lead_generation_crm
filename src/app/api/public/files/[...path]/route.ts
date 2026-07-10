import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-response";
import { readS3File } from "@/lib/storage/s3-file-storage";

// Public counterpart of /api/files/[...path]: unauthenticated, but only ever
// serves the subdirs used for public marketing content (stored in Tigris) —
// never bookings' private guest attachments (local disk), even if a caller
// guesses a stored path.
const PUBLIC_SUBDIRS = new Set(["packages", "gallery"]);

export async function GET(_request: Request, ctx: RouteContext<"/api/public/files/[...path]">) {
  const { path: segments } = await ctx.params;
  if (!PUBLIC_SUBDIRS.has(segments[0])) {
    return jsonError("File not found", 404);
  }

  try {
    const key = segments.join("/");
    const { buffer, contentType } = await readS3File(key);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "NoSuchKey") {
      return jsonError("File not found", 404);
    }
    return jsonError("Internal server error", 500);
  }
}
