import "server-only";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";

const STATE_TTL_SECONDS = 10 * 60; // 10 minutes
const AUDIENCE = "meta-oauth-state";

export type OAuthStatePayload = {
  sub: string;
  nonce: string;
};

function getStateSecret(): string {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET is not set");
  return secret;
}

export function signOAuthState(sub: string): string {
  const payload: OAuthStatePayload = { sub, nonce: nanoid(16) };
  return jwt.sign(payload, getStateSecret(), {
    expiresIn: STATE_TTL_SECONDS,
    audience: AUDIENCE,
  });
}

export function verifyOAuthState(token: string): OAuthStatePayload | null {
  try {
    const decoded = jwt.verify(token, getStateSecret(), { audience: AUDIENCE }) as OAuthStatePayload &
      jwt.JwtPayload;
    return { sub: decoded.sub, nonce: decoded.nonce };
  } catch {
    return null;
  }
}

export const OAUTH_STATE_COOKIE_NAME = "meta_oauth_state";
export const OAUTH_STATE_COOKIE_MAX_AGE = STATE_TTL_SECONDS;

export const OAUTH_USER_TOKEN_COOKIE_NAME = "meta_oauth_user_token";
export const OAUTH_USER_TOKEN_COOKIE_MAX_AGE = STATE_TTL_SECONDS;
