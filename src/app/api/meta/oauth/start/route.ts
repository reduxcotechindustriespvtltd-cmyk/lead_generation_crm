import { NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/auth/session";
import { GRAPH_API_VERSION } from "@/lib/meta/graph-client";
import {
  signOAuthState,
  OAUTH_STATE_COOKIE_NAME,
  OAUTH_STATE_COOKIE_MAX_AGE,
} from "@/lib/meta/oauth-state";

const SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "leads_retrieval",
  "pages_manage_metadata",
].join(",");

function redirectToIntegrations(errorCode: string) {
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  return NextResponse.redirect(`${appUrl}/dashboard/integrations?meta_oauth_error=${errorCode}`);
}

export async function GET() {
  let session;
  try {
    session = await requireRole("ADMIN");
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.redirect(
        `${process.env.APP_URL ?? "http://localhost:3000"}/login`
      );
    }
    throw error;
  }

  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) {
    return redirectToIntegrations("meta_app_not_configured");
  }

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const redirectUri = `${appUrl}/api/meta/oauth/callback`;
  const state = signOAuthState(session.sub);

  const dialogUrl = new URL(`https://www.facebook.com/${GRAPH_API_VERSION}/dialog/oauth`);
  dialogUrl.searchParams.set("client_id", appId);
  dialogUrl.searchParams.set("redirect_uri", redirectUri);
  dialogUrl.searchParams.set("state", state);
  dialogUrl.searchParams.set("scope", SCOPES);
  dialogUrl.searchParams.set("response_type", "code");

  const response = NextResponse.redirect(dialogUrl.toString());
  response.cookies.set(OAUTH_STATE_COOKIE_NAME, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/meta/oauth",
    maxAge: OAUTH_STATE_COOKIE_MAX_AGE,
  });
  return response;
}
