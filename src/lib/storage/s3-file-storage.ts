import "server-only";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { nanoid } from "nanoid";

// Public marketing images (Packages/Gallery) live in Tigris (S3-compatible)
// rather than local disk — unlike Booking attachments (private guest
// documents, deliberately local per local-file-storage.ts), these need to be
// reachable from wherever the CRM is deployed without depending on a
// persistent Docker volume. Objects are still served through this app's own
// /api/public/files route rather than a direct bucket URL, since bucket
// public-read isn't guaranteed to be configured.
const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.TIGRIS_ENDPOINT_URL ?? "https://t3.storage.dev",
  credentials: {
    accessKeyId: process.env.TIGRIS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.TIGRIS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.TIGRIS_BUCKET_NAME!;

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export class InvalidFileUploadError extends Error {}

/** Generic S3 image upload — pass a `subdir` per feature (e.g. "packages", "gallery"). */
export async function saveS3File(file: File, subdir: string) {
  const extension = ALLOWED_TYPES[file.type];
  if (!extension) {
    throw new InvalidFileUploadError("File must be a JPEG, PNG, or WebP image");
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new InvalidFileUploadError("File must be under 10MB");
  }

  const key = `${subdir}/${nanoid(16)}.${extension}`;
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: Buffer.from(await file.arrayBuffer()),
      ContentType: file.type,
    })
  );

  return { path: key, mimeType: file.type };
}

export async function readS3File(key: string) {
  const result = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  const bytes = await result.Body!.transformToByteArray();
  return { buffer: Buffer.from(bytes), contentType: result.ContentType };
}

/** Best-effort delete — a missing object should never block the DB operation that triggered it. */
export async function deleteS3File(key: string | null | undefined) {
  if (!key) return;
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  } catch {
    // ignore
  }
}
