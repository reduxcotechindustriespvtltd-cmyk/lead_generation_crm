import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { setAuthCookies } from "@/lib/auth/session";
import { generateRefreshToken, signAccessToken } from "@/lib/auth/tokens";
import { clearSignupSessionCookie } from "@/lib/auth/signup-session";
import { handleApiError, jsonError } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();
    if (!orderId || typeof orderId !== "string") return jsonError("Missing orderId", 400);

    const pending = await db.pendingSignup.findUnique({ where: { merchantOrderId: orderId } });
    if (!pending) return jsonError("Signup not found", 404);

    const user = await db.user.findUnique({ where: { email: pending.email } });
    if (!user || !user.isActive) {
      return jsonError("Payment not confirmed yet, please wait", 409);
    }

    const accessToken = signAccessToken({
      sub: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
    });
    const { token: refreshToken, tokenHash, expiresAt } = generateRefreshToken();

    await db.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
        userAgent: request.headers.get("user-agent") ?? undefined,
        ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
      },
    });

    await db.pendingSignup.delete({ where: { merchantOrderId: orderId } }).catch(() => {});

    const response = NextResponse.json({ success: true });
    setAuthCookies(response, accessToken, refreshToken);
    clearSignupSessionCookie(response);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
