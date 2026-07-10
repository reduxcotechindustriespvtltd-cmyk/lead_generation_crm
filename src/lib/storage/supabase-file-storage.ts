import "server-only";
import { createClient } from "@supabase/supabase-js";
import { nanoid } from "nanoid";

// Public marketing images (Packages/Gallery) live in a Supabase Storage
// bucket rather than local disk — unlike Booking attachments (private guest
// documents, deliberately local per local-file-storage.ts), these need to be
// reachable from wherever the CRM is deployed without depending on a
// persistent Docker volume. Objects are still served through this app's own
// /api/public/files route rather than a direct bucket URL, so the read path
// stays identical regardless of storage provider.
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET!;

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export class InvalidFileUploadError extends Error {}
export class SupabaseFileNotFoundError extends Error {}

/** Generic Supabase Storage image upload — pass a `subdir` per feature (e.g. "packages", "gallery"). */
export async function saveSupabaseFile(file: File, subdir: string) {
  const extension = ALLOWED_TYPES[file.type];
  if (!extension) {
    throw new InvalidFileUploadError("File must be a JPEG, PNG, or WebP image");
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new InvalidFileUploadError("File must be under 10MB");
  }

  const key = `${subdir}/${nanoid(16)}.${extension}`;
  const { error } = await supabase.storage.from(BUCKET).upload(key, Buffer.from(await file.arrayBuffer()), {
    contentType: file.type,
  });
  if (error) throw error;

  return { path: key, mimeType: file.type };
}

export async function readSupabaseFile(key: string) {
  const { data, error } = await supabase.storage.from(BUCKET).download(key);
  if (error) {
    if (error.message.toLowerCase().includes("not found")) {
      throw new SupabaseFileNotFoundError(key);
    }
    throw error;
  }

  return { buffer: Buffer.from(await data.arrayBuffer()), contentType: data.type || undefined };
}

/** Best-effort delete — a missing object should never block the DB operation that triggered it. */
export async function deleteSupabaseFile(key: string | null | undefined) {
  if (!key) return;
  try {
    await supabase.storage.from(BUCKET).remove([key]);
  } catch {
    // ignore
  }
}
