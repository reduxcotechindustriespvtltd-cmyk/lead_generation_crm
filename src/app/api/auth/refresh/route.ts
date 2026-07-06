import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clearAuthCookies, setAuthCookies } from "@/lib/auth/session";
import {
  REFRESH_COOKIE_NAME,
  generateRefreshToken,
  hashRefreshToken,
  signAccessToken,
} from "@/lib/auth/tokens";
import { handleApiError, jsonError } from "@/lib/api-response";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = enforceRateLimit(request, "refresh", 30, 5 * 60 * 1000);
    if (rateLimitResponse) return rateLimitResponse;

    const presentedToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;
    if (!presentedToken) {
      return jsonError("No refresh token", 401);
    }

    const tokenHash = hashRefreshToken(presentedToken);
    const existing = await db.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!existing) {
      return jsonError("Invalid refresh token", 401);
    }

    // Reuse of an already-rotated/revoked token indicates possible theft.
    // Revoke the whole session family for this user as a precaution.
    if (existing.revokedAt || existing.expiresAt < new Date()) {
      await db.refreshToken.updateMany({
        where: { userId: existing.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await db.auditLog.create({
        data: {
          userId: existing.userId,
          action: "REFRESH_TOKEN_REUSE_DETECTED",
          entityType: "User",
          entityId: existing.userId,
        },
      });
      const response = jsonError("Session revoked, please log in again", 401);
      clearAuthCookies(response);
      return response;
    }

    if (!existing.user.isActive) {
      return jsonError("Account is inactive", 403);
    }

    await db.refreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date() },
    });

    const { token: newRefreshToken, tokenHash: newHash, expiresAt } = generateRefreshToken();
    await db.refreshToken.create({
      data: {
        userId: existing.userId,
        tokenHash: newHash,
        expiresAt,
        userAgent: request.headers.get("user-agent") ?? undefined,
        ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
      },
    });

    const accessToken = signAccessToken({
      sub: existing.user.id,
      role: existing.user.role,
      name: existing.user.name,
      email: existing.user.email,
    });

    const response = NextResponse.json({ success: true });
    setAuthCookies(response, accessToken, newRefreshToken);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
