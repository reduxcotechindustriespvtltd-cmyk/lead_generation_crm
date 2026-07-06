import "server-only";
import { MetaGraphError } from "@/lib/meta/graph-client";

const GRAPH_API_VERSION = process.env.META_GRAPH_API_VERSION || "v21.0";
const GRAPH_BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

async function graphFetch<T>(path: string, accessToken: string): Promise<T> {
  const res = await fetch(`${GRAPH_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();

  if (!res.ok || data.error) {
    throw new MetaGraphError(
      data.error?.message ?? `WhatsApp Graph API request failed (${res.status})`,
      data.error?.code,
      data.error?.type
    );
  }

  return data as T;
}

async function graphPost<T>(
  path: string,
  accessToken: string,
  body: Record<string, unknown>
): Promise<T> {
  const res = await fetch(`${GRAPH_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();

  if (!res.ok || data.error) {
    throw new MetaGraphError(
      data.error?.message ?? `WhatsApp Graph API request failed (${res.status})`,
      data.error?.code,
      data.error?.type
    );
  }

  return data as T;
}

export type WhatsAppPhoneNumberInfo = {
  id: string;
  display_phone_number: string;
  verified_name: string;
  quality_rating?: string;
};

export function getPhoneNumberInfo(phoneNumberId: string, accessToken: string) {
  return graphFetch<WhatsAppPhoneNumberInfo>(
    `/${phoneNumberId}?fields=id,display_phone_number,verified_name,quality_rating`,
    accessToken
  );
}

export type WhatsAppSendTextResponse = {
  messaging_product: string;
  contacts: { input: string; wa_id: string }[];
  messages: { id: string }[];
};

export function sendTextMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  body: string
) {
  return graphPost<WhatsAppSendTextResponse>(`/${phoneNumberId}/messages`, accessToken, {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body },
  });
}

// https://developers.facebook.com/docs/whatsapp/cloud-api/support/error-codes — "Re-engagement message":
// the 24h customer-service window has closed and only a pre-approved template may be sent.
export const WHATSAPP_WINDOW_CLOSED_ERROR_CODE = 131047;

export function isWindowClosedError(error: MetaGraphError): boolean {
  return error.code === WHATSAPP_WINDOW_CLOSED_ERROR_CODE;
}

/** Subscribes this app to receive webhook events (e.g. `messages`) for a WhatsApp Business Account. */
export function subscribeWabaToWebhook(wabaId: string, accessToken: string) {
  return graphPost<{ success: boolean }>(`/${wabaId}/subscribed_apps`, accessToken, {});
}

export type WhatsAppRegisterPhoneNumberResponse = { success: boolean };

/**
 * Registers a phone number on the Cloud API. Numbers coming from Embedded Signup's
 * migration-from-WhatsApp-Business-App path may already be registered — callers should
 * treat "already registered" style errors from Meta as non-fatal.
 */
export function registerPhoneNumber(phoneNumberId: string, accessToken: string, pin?: string) {
  return graphPost<WhatsAppRegisterPhoneNumberResponse>(`/${phoneNumberId}/register`, accessToken, {
    messaging_product: "whatsapp",
    ...(pin ? { pin } : {}),
  });
}

// Meta error code surfaced when a phone number is already registered to another
// WhatsApp account/app (e.g. #2655122 seen when a number is still active elsewhere).
export const WHATSAPP_DUPLICATE_NUMBER_ERROR_CODE = 2655122;

export function isDuplicateNumberError(error: MetaGraphError): boolean {
  return error.code === WHATSAPP_DUPLICATE_NUMBER_ERROR_CODE;
}
