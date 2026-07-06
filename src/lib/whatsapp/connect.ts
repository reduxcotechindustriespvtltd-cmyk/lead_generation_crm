import "server-only";
import { db } from "@/lib/db";
import { encryptToken } from "@/lib/meta/crypto";

export async function createOrUpdateWhatsAppAccountFromEmbeddedSignup(input: {
  phoneNumberId: string;
  wabaId: string;
  businessId?: string;
  displayPhoneNumber: string;
  displayName?: string;
  qualityRating?: string;
  accessToken: string;
  tokenExpiresAt?: Date;
  connectedById: string;
}) {
  const existing = await db.whatsAppAccount.findUnique({
    where: { phoneNumberId: input.phoneNumberId },
    select: { id: true },
  });

  const account = await db.whatsAppAccount.upsert({
    where: { phoneNumberId: input.phoneNumberId },
    create: {
      phoneNumberId: input.phoneNumberId,
      wabaId: input.wabaId,
      businessId: input.businessId,
      displayPhoneNumber: input.displayPhoneNumber,
      displayName: input.displayName,
      qualityRating: input.qualityRating,
      accessToken: encryptToken(input.accessToken),
      tokenExpiresAt: input.tokenExpiresAt,
      connectedVia: "EMBEDDED_SIGNUP",
      connectedById: input.connectedById,
    },
    update: {
      wabaId: input.wabaId,
      businessId: input.businessId,
      displayPhoneNumber: input.displayPhoneNumber,
      displayName: input.displayName,
      qualityRating: input.qualityRating,
      accessToken: encryptToken(input.accessToken),
      tokenExpiresAt: input.tokenExpiresAt,
      connectedVia: "EMBEDDED_SIGNUP",
      connectedById: input.connectedById,
    },
    select: {
      id: true,
      phoneNumberId: true,
      wabaId: true,
      businessId: true,
      displayPhoneNumber: true,
      displayName: true,
      qualityRating: true,
      connectedVia: true,
      isActive: true,
      lastMessageAt: true,
      createdAt: true,
    },
  });

  await db.auditLog.create({
    data: {
      userId: input.connectedById,
      action: existing ? "WHATSAPP_ACCOUNT_RECONNECTED" : "WHATSAPP_ACCOUNT_CONNECTED",
      entityType: "WhatsAppAccount",
      entityId: account.id,
      changes: { displayPhoneNumber: account.displayPhoneNumber, connectedVia: account.connectedVia },
    },
  });

  return account;
}
