import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { handleApiError, jsonError } from "@/lib/api-response";
import { syncMetaAccount } from "@/lib/meta/sync";
import { MetaGraphError } from "@/lib/meta/graph-client";

export async function POST(_request: Request, ctx: RouteContext<"/api/meta-accounts/[id]/sync">) {
  try {
    const session = await requireRole("ADMIN");
    const { id } = await ctx.params;

    const account = await db.metaAccount.findUnique({ where: { id } });
    if (!account) return jsonError("Meta account not found", 404);
    if (!account.isActive) return jsonError("This account is disabled — enable it first", 400);

    const summary = await syncMetaAccount(id);

    await db.auditLog.create({
      data: {
        userId: session.sub,
        action: "META_ACCOUNT_SYNCED",
        entityType: "MetaAccount",
        entityId: id,
        changes: summary,
      },
    });

    return NextResponse.json({ summary });
  } catch (error) {
    if (error instanceof MetaGraphError) {
      return jsonError(`Meta sync failed: ${error.message}`, 502);
    }
    return handleApiError(error);
  }
}
