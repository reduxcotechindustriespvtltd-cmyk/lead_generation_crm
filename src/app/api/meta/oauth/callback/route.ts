import { NextRequest, NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/auth/session";
import { exchangeCodeForToken, exchangeForLongLivedToken, MetaGraphError } from "@/lib/meta/graph-client";
import { encryptToken } from "@/lib/meta/crypto";
import {
  verifyOAuthState,
  OAUTH_STATE_COOKIE_NAME,
  OAUTH_USER_TOKEN_COOKIE_NAME,
  OAUTH_USER_TOKEN_COOKIE_MAX_AGE,
} from "@/lib/meta/oauth-state";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

function redirectToIntegrations(errorCode: string, clearStateCookie: boolean) {
  const response = NextResponse.redirect(
    `${APP_URL}/dashboard/integrations?meta_oauth_error=${errorCode}`
  );
  if (clearStateCookie) {
    response.cookies.set(OAUTH_STATE_COOKIE_NAME, "", { path: "/api/meta/oauth", maxAge: 0 });
  }
  return response;
}

export async function GET(request: NextRequest) {
  let session;
  try {
    session = await requireRole("ADMIN");
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.redirect(`${APP_URL}/login`);
    }
    throw error;
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  if (oauthError) {
    return redirectToIntegrations("denied", true);
  }

  const stateCookie = request.cookies.get(OAUTH_STATE_COOKIE_NAME)?.value;
  const statePayload = state ? verifyOAuthState(state) : null;

  if (
    !state ||
    !code ||
    !stateCookie ||
    stateCookie !== state ||
    !statePayload ||
    statePayload.sub !== session.sub
  ) {
    return redirectToIntegrations("state_mismatch", true);
  }

  let longLivedToken: string;
  try {
    const shortLived = await exchangeCodeForToken(code, `${APP_URL}/api/meta/oauth/callback`);
    const longLived = await exchangeForLongLivedToken(shortLived.access_token);
    longLivedToken = longLived.access_token;
  } catch (error) {
    if (error instanceof MetaGraphError) {
      console.error("Meta OAuth token exchange failed:", error.message);
      return redirectToIntegrations("token_exchange_failed", true);
    }
    throw error;
  }

  const response = NextResponse.redirect(`${APP_URL}/dashboard/integrations/connect-facebook`);
  response.cookies.set(OAUTH_STATE_COOKIE_NAME, "", { path: "/api/meta/oauth", maxAge: 0 });
  response.cookies.set(OAUTH_USER_TOKEN_COOKIE_NAME, encryptToken(longLivedToken), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/meta/oauth",
    maxAge: OAUTH_USER_TOKEN_COOKIE_MAX_AGE,
  });
  return response;
}
