import { NextRequest, NextResponse } from "next/server";
import {
  signSignupSession,
  verifySignupSession,
  setSignupSessionCookie,
  SIGNUP_SESSION_COOKIE_NAME,
} from "@/lib/auth/signup-session";
import { signupOtpVerifySchema } from "@/lib/validations/signup";
import { handleApiError, jsonError } from "@/lib/api-response";
import { enforceRateLimit } from "@/lib/rate-limit";

function getOtpServiceBaseUrl(): string {
  const base = process.env.OTP_SERVICE_BASE_URL;
  if (!base) throw new Error("OTP_SERVICE_BASE_URL is not set");
  return base;
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = enforceRateLimit(request, "signup-otp-verify", 5, 10 * 60 * 1000);
    if (rateLimitResponse) return rateLimitResponse;

    const sessionToken = request.cookies.get(SIGNUP_SESSION_COOKIE_NAME)?.value;
    const session = sessionToken ? verifySignupSession(sessionToken) : null;
    if (!session) {
      return jsonError("Signup session expired, please start over", 401);
    }

    const { otp } = signupOtpVerifySchema.parse(await request.json());

    const res = await fetch(`${getOtpServiceBaseUrl()}/api/auth/v5/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: session.email, otp }),
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      return jsonError("Incorrect or expired code", 400);
    }

    const newSessionToken = signSignupSession({ ...session, emailVerified: true });

    const response = NextResponse.json({ success: true });
    setSignupSessionCookie(response, newSessionToken);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
