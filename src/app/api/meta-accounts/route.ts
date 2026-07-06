import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { handleApiError, jsonError } from "@/lib/api-response";
import { getPageInfo, MetaGraphError } from "@/lib/meta/graph-client";
import { createMetaAccountFromToken, MetaAccountAlreadyConnectedError } from "@/lib/meta/connect";
import { connectMetaAccountSchema } from "@/lib/validations/meta";

export async function GET() {
  try {
    await requireRole("ADMIN");
    const accounts = await db.metaAccount.findMany({
      orderBy: { createdAt: "desc" },
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
    return NextResponse.json({ accounts });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole("ADMIN");
    const { pageAccessToken } = connectMetaAccountSchema.parse(await request.json());

    let pageInfo;
    try {
      pageInfo = await getPageInfo(pageAccessToken);
    } catch (error) {
      if (error instanceof MetaGraphError) {
        return jsonError(`Meta rejected this token: ${error.message}`, 400);
      }
      throw error;
    }

    let account;
    try {
      account = await createMetaAccountFromToken({
        pageId: pageInfo.id,
        name: pageInfo.name,
        instagramBusinessId: pageInfo.instagram_business_account?.id,
        accessToken: pageAccessToken,
        connectedById: session.sub,
      });
    } catch (error) {
      if (error instanceof MetaAccountAlreadyConnectedError) {
        return jsonError(error.message, 409);
      }
      throw error;
    }

    return NextResponse.json({ account }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
