import { NextResponse } from "next/server";
import path from "path";
import { requireUser } from "@/lib/auth/session";
import { handleApiError, jsonError } from "@/lib/api-response";
import { mimeTypeForExtension, readLocalFile } from "@/lib/storage/local-file-storage";

// Auth-gated, unlike Vercel Blob's public avatar URLs — these are private
// guest documents (payment screenshots / ID proofs).
export async function GET(_request: Request, ctx: RouteContext<"/api/files/[...path]">) {
  try {
    await requireUser();
    const { path: segments } = await ctx.params;
    const relativePath = segments.join("/");
    const buffer = await readLocalFile(relativePath);
    const ext = path.extname(relativePath);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": mimeTypeForExtension(ext),
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    if (error instanceof Error && "code" in error && (error as NodeJS.ErrnoException).code === "ENOENT") {
      return jsonError("File not found", 404);
    }
    return handleApiError(error);
  }
}
