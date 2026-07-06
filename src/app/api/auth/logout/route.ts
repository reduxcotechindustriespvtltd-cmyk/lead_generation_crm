import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clearAuthCookies, getCurrentUser } from "@/lib/auth/session";
import { REFRESH_COOKIE_NAME, hashRefreshToken } from "@/lib/auth/tokens";
import { handleApiError } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;
    if (refreshToken) {
      await db.refreshToken.updateMany({
        where: { tokenHash: hashRefreshToken(refreshToken), revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    const user = await getCurrentUser();
    if (user) {
      await db.auditLog.create({
        data: { userId: user.sub, action: "LOGOUT", entityType: "User", entityId: user.sub },
      });
    }

    const response = NextResponse.json({ success: true });
    clearAuthCookies(response);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
