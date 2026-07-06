import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { verifySignupSession, SIGNUP_SESSION_COOKIE_NAME } from "@/lib/auth/signup-session";
import { createSubscriptionCheckout, ORG_PLAN_AMOUNT_PAISE, PhonePeError } from "@/lib/phonepe/client";
import { handleApiError, jsonError } from "@/lib/api-response";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = enforceRateLimit(request, "signup-payment-start", 10, 15 * 60 * 1000);
    if (rateLimitResponse) return rateLimitResponse;

    const sessionToken = request.cookies.get(SIGNUP_SESSION_COOKIE_NAME)?.value;
    const session = sessionToken ? verifySignupSession(sessionToken) : null;
    if (!session) {
      return jsonError("Signup session expired, please start over", 401);
    }
    if (!session.emailVerified) {
      return jsonError("Please verify your email first", 400);
    }
    if (!session.plan) {
      return jsonError("Please select a plan first", 400);
    }

    const existingUser = await db.user.findUnique({ where: { email: session.email } });
    if (existingUser) {
      return jsonError("An account with this email already exists", 409);
    }

    const merchantOrderId = `signup_${nanoid(24)}`;
    const merchantSubscriptionId = `sub_${nanoid(24)}`;

    await db.pendingSignup.create({
      data: {
        merchantOrderId,
        merchantSubscriptionId,
        name: session.name,
        email: session.email,
        phone: session.phone,
        passwordHash: session.passwordHash,
        avatarUrl: session.avatarUrl,
        plan: session.plan,
      },
    });

    const appUrl = process.env.APP_URL ?? "http://localhost:3000";
    const redirectUrl = `${appUrl}/signup/complete?orderId=${merchantOrderId}`;

    try {
      const checkout = await createSubscriptionCheckout({
        merchantOrderId,
        merchantSubscriptionId,
        amountPaise: ORG_PLAN_AMOUNT_PAISE[session.plan],
        redirectUrl,
      });
      return NextResponse.json({ redirectUrl: checkout.redirectUrl, orderId: checkout.orderId });
    } catch (error) {
      await db.pendingSignup.delete({ where: { merchantOrderId } }).catch(() => {});
      if (error instanceof PhonePeError) {
        return jsonError(`Payment setup failed: ${error.message}`, 502);
      }
      throw error;
    }
  } catch (error) {
    return handleApiError(error);
  }
}
