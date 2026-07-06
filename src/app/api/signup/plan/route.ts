import { NextRequest, NextResponse } from "next/server";
import {
  signSignupSession,
  verifySignupSession,
  setSignupSessionCookie,
  SIGNUP_SESSION_COOKIE_NAME,
} from "@/lib/auth/signup-session";
import { signupPlanSchema } from "@/lib/validations/signup";
import { handleApiError, jsonError } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get(SIGNUP_SESSION_COOKIE_NAME)?.value;
    const session = sessionToken ? verifySignupSession(sessionToken) : null;
    if (!session) {
      return jsonError("Signup session expired, please start over", 401);
    }

    const { plan } = signupPlanSchema.parse(await request.json());

    const newSessionToken = signSignupSession({ ...session, plan });

    const response = NextResponse.json({ success: true });
    setSignupSessionCookie(response, newSessionToken);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
