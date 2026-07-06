import crypto from "crypto";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import type { UserRole } from "@/generated/prisma/client";

const ACCESS_TOKEN_TTL_SECONDS = 30 * 60; // 30 minutes
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export type AccessTokenPayload = {
  sub: string;
  role: UserRole;
  name: string;
  email: string;
};

function getAccessSecret(): string {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET is not set");
  return secret;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, getAccessSecret(), {
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    return jwt.verify(token, getAccessSecret()) as AccessTokenPayload & jwt.JwtPayload;
  } catch {
    return null;
  }
}

export function generateRefreshToken(): { token: string; tokenHash: string; expiresAt: Date } {
  const token = nanoid(48);
  const tokenHash = hashRefreshToken(token);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
  return { token, tokenHash, expiresAt };
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export const ACCESS_COOKIE_NAME = "gsb_at";
export const REFRESH_COOKIE_NAME = "gsb_rt";
export { ACCESS_TOKEN_TTL_SECONDS };
