import "server-only";
import jwt from "jsonwebtoken";
import type { NextResponse } from "next/server";
import type { OrgPlan } from "@/generated/prisma/client";

const SIGNUP_SESSION_TTL_SECONDS = 30 * 60; // 30 minutes
const AUDIENCE = "signup-session";

export type SignupSessionPayload = {
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  avatarUrl?: string;
  plan?: OrgPlan;
  emailVerified: boolean;
  merchantOrderId?: string;
};

function getSignupSessionSecret(): string {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET is not set");
  return secret;
}

export function signSignupSession(payload: SignupSessionPayload): string {
  return jwt.sign(payload, getSignupSessionSecret(), {
    expiresIn: SIGNUP_SESSION_TTL_SECONDS,
    audience: AUDIENCE,
  });
}

export function verifySignupSession(token: string): SignupSessionPayload | null {
  try {
    const decoded = jwt.verify(token, getSignupSessionSecret(), {
      audience: AUDIENCE,
    }) as SignupSessionPayload & jwt.JwtPayload;
    return {
      name: decoded.name,
      email: decoded.email,
      phone: decoded.phone,
      passwordHash: decoded.passwordHash,
      avatarUrl: decoded.avatarUrl,
      plan: decoded.plan,
      emailVerified: decoded.emailVerified,
      merchantOrderId: decoded.merchantOrderId,
    };
  } catch {
    return null;
  }
}

export const SIGNUP_SESSION_COOKIE_NAME = "signup_session";
export const SIGNUP_SESSION_COOKIE_MAX_AGE = SIGNUP_SESSION_TTL_SECONDS;

export function setSignupSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(SIGNUP_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SIGNUP_SESSION_COOKIE_MAX_AGE,
  });
}

export function clearSignupSessionCookie(response: NextResponse) {
  response.cookies.set(SIGNUP_SESSION_COOKIE_NAME, "", { path: "/", maxAge: 0 });
}
