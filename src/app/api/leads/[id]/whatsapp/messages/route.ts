import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { handleApiError, jsonError } from "@/lib/api-response";
import { logActivity } from "@/lib/activity";
import { decryptToken } from "@/lib/meta/crypto";
import { MetaGraphError } from "@/lib/meta/graph-client";
import { sendTextMessage, isWindowClosedError } from "@/lib/whatsapp/graph-client";
import { sendWhatsAppMessageSchema } from "@/lib/validations/whatsapp";

export async function GET(_request: Request, ctx: RouteContext<"/api/leads/[id]/whatsapp/messages">) {
  try {
    const session = await requireUser();
    const { id } = await ctx.params;

    const lead = await db.lead.findUnique({ where: { id } });
    if (!lead) return jsonError("Lead not found", 404);

    if (session.role === "SALES_EXECUTIVE" && lead.assignedToId !== session.sub) {
      return jsonError("You can only view WhatsApp messages for leads assigned to you", 403);
    }

    const messages = await db.whatsAppMessage.findMany({
      where: { leadId: id },
      orderBy: { createdAt: "asc" },
      include: { sentBy: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request, ctx: RouteContext<"/api/leads/[id]/whatsapp/messages">) {
  try {
    const session = await requireUser();
    const { id } = await ctx.params;
    const input = sendWhatsAppMessageSchema.parse(await request.json());

    const lead = await db.lead.findUnique({ where: { id } });
    if (!lead) return jsonError("Lead not found", 404);

    if (session.role === "SALES_EXECUTIVE" && lead.assignedToId !== session.sub) {
      return jsonError("You can only send WhatsApp messages to leads assigned to you", 403);
    }

    // Prefer the number the customer actually messaged in on; fall back to
    // whichever active number was connected first for a cold outbound send.
    const lastInbound = await db.whatsAppMessage.findFirst({
      where: { leadId: id, direction: "INBOUND" },
      orderBy: { createdAt: "desc" },
    });
    const account = lastInbound
      ? await db.whatsAppAccount.findUnique({ where: { id: lastInbound.whatsAppAccountId } })
      : await db.whatsAppAccount.findFirst({
          where: { isActive: true },
          orderBy: { createdAt: "asc" },
        });
    if (!account) return jsonError("No WhatsApp number is connected.", 400);

    const accessToken = decryptToken(account.accessToken);
    const to = lead.phone.replace(/\D/g, "");

    try {
      const result = await sendTextMessage(account.phoneNumberId, accessToken, to, input.content);

      const message = await db.whatsAppMessage.create({
        data: {
          leadId: id,
          whatsAppAccountId: account.id,
          direction: "OUTBOUND",
          content: input.content,
          messageType: "text",
          status: "SENT",
          whatsAppMessageId: result.messages[0]?.id,
          sentById: session.sub,
        },
        include: { sentBy: { select: { id: true, name: true } } },
      });

      await logActivity({
        leadId: id,
        userId: session.sub,
        type: "WHATSAPP_REPLIED",
        description: `${session.name} replied via WhatsApp: "${input.content}"`,
      });
      await db.lead.update({ where: { id }, data: { lastActivityAt: new Date() } });

      return NextResponse.json({ message }, { status: 201 });
    } catch (error) {
      if (!(error instanceof MetaGraphError)) throw error;

      const errorMessage = isWindowClosedError(error)
        ? "This customer hasn't messaged in the last 24 hours, so WhatsApp only allows pre-approved template messages (not supported yet). Ask them to message you first."
        : `WhatsApp couldn't send this message: ${error.message}`;

      await db.whatsAppMessage.create({
        data: {
          leadId: id,
          whatsAppAccountId: account.id,
          direction: "OUTBOUND",
          content: input.content,
          messageType: "text",
          status: "FAILED",
          errorMessage,
          sentById: session.sub,
        },
      });

      return jsonError(errorMessage, 422);
    }
  } catch (error) {
    return handleApiError(error);
  }
}
