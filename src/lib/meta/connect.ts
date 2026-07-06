import "server-only";
import { db } from "@/lib/db";
import { encryptToken } from "@/lib/meta/crypto";

export class MetaAccountAlreadyConnectedError extends Error {
  constructor() {
    super("This Facebook Page is already connected");
  }
}

export async function createMetaAccountFromToken(input: {
  pageId: string;
  name: string;
  instagramBusinessId?: string;
  accessToken: string;
  tokenExpiresAt?: Date;
  connectedById: string;
}) {
  const existing = await db.metaAccount.findUnique({ where: { metaPageId: input.pageId } });
  if (existing) {
    throw new MetaAccountAlreadyConnectedError();
  }

  const account = await db.metaAccount.create({
    data: {
      type: "FACEBOOK_PAGE",
      metaPageId: input.pageId,
      name: input.name,
      instagramBusinessId: input.instagramBusinessId,
      accessToken: encryptToken(input.accessToken),
      tokenExpiresAt: input.tokenExpiresAt,
      connectedById: input.connectedById,
    },
    select: {
      id: true,
      type: true,
      metaPageId: true,
      name: true,
      instagramBusinessId: true,
      isActive: true,
      lastSyncedAt: true,
      createdAt: true,
    },
  });

  await db.auditLog.create({
    data: {
      userId: input.connectedById,
      action: "META_ACCOUNT_CONNECTED",
      entityType: "MetaAccount",
      entityId: account.id,
      changes: { name: account.name, metaPageId: account.metaPageId },
    },
  });

  return account;
}
