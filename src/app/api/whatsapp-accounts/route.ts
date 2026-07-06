import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { handleApiError, jsonError } from "@/lib/api-response";
import { encryptToken } from "@/lib/meta/crypto";
import { MetaGraphError } from "@/lib/meta/graph-client";
import { getPhoneNumberInfo } from "@/lib/whatsapp/graph-client";
import { connectWhatsAppAccountSchema } from "@/lib/validations/whatsapp";

export async function GET() {
  try {
    await requireRole("ADMIN");
    const accounts = await db.whatsAppAccount.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        phoneNumberId: true,
        wabaId: true,
        displayPhoneNumber: true,
        displayName: true,
        isActive: true,
        lastMessageAt: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ accounts });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole("ADMIN");
    const { phoneNumberId, wabaId, accessToken } = connectWhatsAppAccountSchema.parse(
      await request.json()
    );

    let phoneInfo;
    try {
      phoneInfo = await getPhoneNumberInfo(phoneNumberId, accessToken);
    } catch (error) {
      if (error instanceof MetaGraphError) {
        return jsonError(`Meta rejected this token: ${error.message}`, 400);
      }
      throw error;
    }

    const existing = await db.whatsAppAccount.findUnique({ where: { phoneNumberId } });
    if (existing) {
      return jsonError("This WhatsApp number is already connected", 409);
    }

    const account = await db.whatsAppAccount.create({
      data: {
        phoneNumberId,
        wabaId,
        displayPhoneNumber: phoneInfo.display_phone_number,
        displayName: phoneInfo.verified_name,
        accessToken: encryptToken(accessToken),
        connectedById: session.sub,
      },
      select: {
        id: true,
        phoneNumberId: true,
        wabaId: true,
        displayPhoneNumber: true,
        displayName: true,
        isActive: true,
        lastMessageAt: true,
        createdAt: true,
      },
    });

    await db.auditLog.create({
      data: {
        userId: session.sub,
        action: "WHATSAPP_ACCOUNT_CONNECTED",
        entityType: "WhatsAppAccount",
        entityId: account.id,
        changes: { displayPhoneNumber: account.displayPhoneNumber },
      },
    });

    return NextResponse.json({ account }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
