import { NextRequest, NextResponse } from "next/server";
import { verifySignupSession, SIGNUP_SESSION_COOKIE_NAME } from "@/lib/auth/signup-session";
import { handleApiError, jsonError } from "@/lib/api-response";
import { enforceRateLimit } from "@/lib/rate-limit";

function getOtpServiceBaseUrl(): string {
  const base = process.env.OTP_SERVICE_BASE_URL;
  if (!base) throw new Error("OTP_SERVICE_BASE_URL is not set");
  return base;
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = enforceRateLimit(request, "signup-otp-request", 5, 10 * 60 * 1000);
    if (rateLimitResponse) return rateLimitResponse;

    const sessionToken = request.cookies.get(SIGNUP_SESSION_COOKIE_NAME)?.value;
    const session = sessionToken ? verifySignupSession(sessionToken) : null;
    if (!session) {
      return jsonError("Signup session expired, please start over", 401);
    }

    const res = await fetch(`${getOtpServiceBaseUrl()}/api/auth/v5/request-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: session.email }),
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      return jsonError("Failed to send verification code, please try again", 502);
    }

    return NextResponse.json({ success: true, expiresInSec: data.expiresInSec });
  } catch (error) {
    return handleApiError(error);
  }
}
