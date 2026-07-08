import "server-only";
import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";

// Deliberately outside `public/` (baked into the Docker image at build time,
// lost on redeploy) and `.next/` — this path is meant to be backed by a
// mounted Docker volume in production so uploads survive redeploys.
const STORAGE_ROOT = path.join(process.cwd(), "storage", "uploads");

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export class InvalidFileUploadError extends Error {}

/** Generic local-disk file upload — pass a `subdir` per feature (e.g. "bookings") so this is reusable beyond bookings. */
export async function saveLocalFile(file: File, subdir: string) {
  const extension = ALLOWED_TYPES[file.type];
  if (!extension) {
    throw new InvalidFileUploadError("File must be a JPEG, PNG, WebP image, or PDF");
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new InvalidFileUploadError("File must be under 10MB");
  }

  const relativePath = path.posix.join(subdir, `${nanoid(16)}.${extension}`);
  const absolutePath = path.join(STORAGE_ROOT, relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, Buffer.from(await file.arrayBuffer()));

  return { path: relativePath, mimeType: file.type };
}

/** Resolves a stored relative path to an absolute one, rejecting any attempt to escape STORAGE_ROOT. */
export function resolveSafePath(relativePath: string): string {
  const resolved = path.resolve(STORAGE_ROOT, relativePath);
  if (resolved !== STORAGE_ROOT && !resolved.startsWith(STORAGE_ROOT + path.sep)) {
    throw new InvalidFileUploadError("Invalid file path");
  }
  return resolved;
}

export async function readLocalFile(relativePath: string) {
  return readFile(resolveSafePath(relativePath));
}

/** Best-effort delete — a missing file on disk should never block the DB operation that triggered it. */
export async function deleteLocalFile(relativePath: string | null | undefined) {
  if (!relativePath) return;
  try {
    await unlink(resolveSafePath(relativePath));
  } catch {
    // ignore
  }
}

export function mimeTypeForExtension(ext: string): string {
  const normalized = ext.replace(".", "").toLowerCase();
  return (
    Object.entries(ALLOWED_TYPES).find(([, e]) => e === normalized)?.[0] ??
    "application/octet-stream"
  );
}
