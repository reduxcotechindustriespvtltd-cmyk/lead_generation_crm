import "server-only";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { getNextRoundRobinAssignee } from "@/lib/assignment";
import type { WhatsAppAccount } from "@/generated/prisma/client";

export type WhatsAppReferral = {
  source_url?: string;
  source_type?: string;
  source_id?: string;
  headline?: string;
  body?: string;
  media_type?: string;
  ctwa_clid?: string;
};

export type WhatsAppInboundMessage = {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  referral?: WhatsAppReferral;
  [key: string]: unknown;
};

export type WhatsAppWebhookValue = {
  messaging_product: string;
  metadata: { display_phone_number: string; phone_number_id: string };
  contacts?: { profile: { name: string }; wa_id: string }[];
  messages?: WhatsAppInboundMessage[];
  statuses?: unknown[];
};

function extractMessageText(message: WhatsAppInboundMessage): string {
  switch (message.type) {
    case "text":
      return message.text?.body ?? "";
    case "image":
    case "video":
    case "document": {
      const media = message[message.type] as { caption?: string } | undefined;
      return media?.caption ? media.caption : `[${message.type}]`;
    }
    case "button": {
      const button = message.button as { text?: string } | undefined;
      return button?.text ?? "[button reply]";
    }
    case "interactive": {
      const interactive = message.interactive as
        { button_reply?: { title?: string }; list_reply?: { title?: string } } | undefined;
      return (
        interactive?.button_reply?.title ?? interactive?.list_reply?.title ?? "[interactive reply]"
      );
    }
    case "location":
      return "[shared a location]";
    default:
      return `[${message.type}]`;
  }
}

/** Finds an existing lead by exact phone match, falling back to a last-10-digit match to tolerate country-code formatting differences. */
async function findExistingLeadByPhone(phone: string) {
  const exact = await db.lead.findFirst({ where: { phone } });
  if (exact) return exact;

  const last10 = phone.replace(/\D/g, "").slice(-10);
  if (last10.length < 10) return null;
  return db.lead.findFirst({ where: { phone: { endsWith: last10 } } });
}

export async function processWhatsAppWebhookValue(
  account: WhatsAppAccount,
  value: WhatsAppWebhookValue
) {
  if (!value.messages || value.messages.length === 0) return;

  const defaultStatus =
    (await db.leadStatus.findFirst({ where: { isDefault: true } })) ??
    (await db.leadStatus.findFirst({ orderBy: { order: "asc" } }));
  if (!defaultStatus) return;

  for (const message of value.messages) {
    // Meta retries webhook deliveries; without this guard a retry would
    // re-run the whole branch below, creating a duplicate lead for a
    // first-time sender or double-logging activity for a returning one.
    const alreadyProcessed = await db.whatsAppMessage.findUnique({
      where: { whatsAppMessageId: message.id },
    });
    if (alreadyProcessed) continue;

    const contactName = value.contacts?.find((c) => c.wa_id === message.from)?.profile.name;
    const text = extractMessageText(message);
    const messageTimestamp = new Date(Number(message.timestamp) * 1000);
    const existing = await findExistingLeadByPhone(message.from);

    if (!existing) {
      const assignedToId = await getNextRoundRobinAssignee();
      const referral = message.referral;

      const lead = await db.lead.create({
        data: {
          fullName: contactName || "WhatsApp Lead",
          phone: message.from,
          source: "WHATSAPP",
          rawPayload: message as unknown as object,
          campaignName: referral?.headline,
          adName: referral?.body,
          statusId: defaultStatus.id,
          assignedToId,
          createdAt: messageTimestamp,
          lastActivityAt: messageTimestamp,
        },
      });

      await logActivity({
        leadId: lead.id,
        userId: null,
        type: "LEAD_CREATED",
        description: referral
          ? `Lead captured from WhatsApp — clicked ad "${referral.headline ?? referral.source_id}"`
          : "Lead captured from an inbound WhatsApp message",
      });
      await logActivity({
        leadId: lead.id,
        userId: null,
        type: "WHATSAPP_SENT",
        description: `Customer said: "${text}"`,
      });
      await db.whatsAppMessage.create({
        data: {
          leadId: lead.id,
          whatsAppAccountId: account.id,
          direction: "INBOUND",
          content: text,
          messageType: message.type,
          whatsAppMessageId: message.id,
          status: "RECEIVED",
          createdAt: messageTimestamp,
        },
      });

      if (assignedToId) {
        await logActivity({
          leadId: lead.id,
          userId: null,
          type: "ASSIGNED",
          description: "Auto-assigned via round robin",
        });
        await db.notification.create({
          data: {
            userId: assignedToId,
            type: "LEAD_ASSIGNED",
            title: "New WhatsApp lead",
            message: `${lead.fullName} messaged in on WhatsApp`,
            link: `/dashboard/leads/${lead.id}`,
          },
        });
      }
    } else {
      await logActivity({
        leadId: existing.id,
        userId: null,
        type: "WHATSAPP_SENT",
        description: `Customer said: "${text}"`,
      });
      await db.whatsAppMessage.create({
        data: {
          leadId: existing.id,
          whatsAppAccountId: account.id,
          direction: "INBOUND",
          content: text,
          messageType: message.type,
          whatsAppMessageId: message.id,
          status: "RECEIVED",
          createdAt: messageTimestamp,
        },
      });
      await db.lead.update({
        where: { id: existing.id },
        data: { lastActivityAt: messageTimestamp },
      });
    }
  }

  await db.whatsAppAccount.update({
    where: { id: account.id },
    data: { lastMessageAt: new Date() },
  });
}
