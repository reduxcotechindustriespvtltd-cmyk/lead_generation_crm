import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { getSingleLead } from "@/lib/meta/graph-client";
import { decryptToken } from "@/lib/meta/crypto";
import { processMetaLead } from "@/lib/meta/sync";
import {
  processWhatsAppWebhookValue,
  type WhatsAppWebhookValue,
} from "@/lib/whatsapp/process-message";

// Meta's webhook verification handshake — called once when you subscribe the webhook URL.
export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("hub.mode");
  const token = request.nextUrl.searchParams.get("hub.verify_token");
  const challenge = request.nextUrl.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.META_WEBHOOK_VERIFY_TOKEN && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

function isValidSignature(rawBody: string, signatureHeader: string | null): boolean {
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret || !signatureHeader?.startsWith("sha256=")) return false;

  const expected = crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");
  const provided = signatureHeader.slice("sha256=".length);

  const expectedBuf = Buffer.from(expected, "hex");
  const providedBuf = Buffer.from(provided, "hex");
  if (expectedBuf.length !== providedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, providedBuf);
}

type WebhookLeadgenChange = {
  field: "leadgen";
  value: {
    leadgen_id: string;
    page_id: string;
    form_id: string;
    created_time: number;
  };
};

type WebhookMessagesChange = {
  field: "messages";
  value: WhatsAppWebhookValue;
};

type WebhookPayload = {
  object: string;
  entry: { id: string; changes: (WebhookLeadgenChange | WebhookMessagesChange)[] }[];
};

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  if (!isValidSignature(rawBody, request.headers.get("x-hub-signature-256"))) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  // Always ack quickly — Meta retries aggressively on non-200s. Process best-effort.
  let payload: WebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ success: true });
  }

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (payload.object === "page" && change.field === "leadgen") {
        await handleLeadgenEvent(change.value).catch((err) => {
          console.error("Failed to process Meta webhook lead:", err);
        });
      } else if (payload.object === "whatsapp_business_account" && change.field === "messages") {
        await handleWhatsAppEvent(change.value).catch((err) => {
          console.error("Failed to process WhatsApp webhook message:", err);
        });
      }
    }
  }

  return NextResponse.json({ success: true });
}

async function handleLeadgenEvent(value: WebhookLeadgenChange["value"]) {
  const account = await db.metaAccount.findUnique({ where: { metaPageId: value.page_id } });
  if (!account || !account.isActive) return;

  const accessToken = decryptToken(account.accessToken);
  const metaLead = await getSingleLead(value.leadgen_id, accessToken);

  const form = await db.leadForm.findUnique({ where: { metaFormId: value.form_id } });

  const defaultStatus =
    (await db.leadStatus.findFirst({ where: { isDefault: true } })) ??
    (await db.leadStatus.findFirst({ orderBy: { order: "asc" } }));
  if (!defaultStatus) return;

  await processMetaLead(account, form, metaLead, defaultStatus.id);
}

async function handleWhatsAppEvent(value: WhatsAppWebhookValue) {
  const account = await db.whatsAppAccount.findUnique({
    where: { phoneNumberId: value.metadata.phone_number_id },
  });
  if (!account || !account.isActive) return;

  await processWhatsAppWebhookValue(account, value);
}
