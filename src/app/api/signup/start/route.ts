import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { signSignupSession, setSignupSessionCookie } from "@/lib/auth/signup-session";
import { uploadProfilePicture, InvalidProfilePictureError } from "@/lib/storage/upload-profile-picture";
import { signupProfileSchema } from "@/lib/validations/signup";
import { handleApiError, jsonError } from "@/lib/api-response";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = enforceRateLimit(request, "signup-start", 10, 15 * 60 * 1000);
    if (rateLimitResponse) return rateLimitResponse;

    const formData = await request.formData();
    const { firstName, lastName, email, countryCode, phone, password } = signupProfileSchema.parse({
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      email: formData.get("email"),
      countryCode: formData.get("countryCode") || undefined,
      phone: formData.get("phone") || undefined,
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });
    const fullPhone = phone ? `${countryCode} ${phone}` : undefined;

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return jsonError("An account with this email already exists", 409);
    }

    let avatarUrl: string | undefined;
    const avatarFile = formData.get("avatar");
    if (avatarFile instanceof File && avatarFile.size > 0) {
      try {
        avatarUrl = await uploadProfilePicture(avatarFile);
      } catch (error) {
        if (error instanceof InvalidProfilePictureError) {
          return jsonError(error.message, 400);
        }
        throw error;
      }
    }

    const passwordHash = await hashPassword(password);

    const sessionToken = signSignupSession({
      name: `${firstName} ${lastName}`,
      email,
      phone: fullPhone,
      passwordHash,
      avatarUrl,
      emailVerified: false,
    });

    const response = NextResponse.json({ success: true });
    setSignupSessionCookie(response, sessionToken);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
