import "server-only";
import { put } from "@vercel/blob";
import { nanoid } from "nanoid";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export class InvalidProfilePictureError extends Error {}

export async function uploadProfilePicture(file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new InvalidProfilePictureError("Profile picture must be a JPEG, PNG, or WebP image");
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new InvalidProfilePictureError("Profile picture must be under 5MB");
  }

  const extension = file.type.split("/")[1];
  const pathname = `signup-avatars/${nanoid(16)}.${extension}`;

  const blob = await put(pathname, file, {
    access: "public",
    contentType: file.type,
  });

  return blob.url;
}
