import "server-only";
import crypto from "crypto";

export class PhonePeError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.code = code;
  }
}

function isProduction(): boolean {
  return process.env.PHONEPE_ENV === "production";
}

function getTokenUrl(): string {
  return isProduction()
    ? "https://api.phonepe.com/apis/identity-manager/v1/oauth/token"
    : "https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token";
}

function getPgBaseUrl(): string {
  return isProduction()
    ? "https://api.phonepe.com/apis/pg"
    : "https://api-preprod.phonepe.com/apis/pg-sandbox";
}

function getCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.PHONEPE_CLIENT_ID;
  const clientSecret = process.env.PHONEPE_CLIENT_SECRET;
  if (!clientId) throw new Error("PHONEPE_CLIENT_ID is not set");
  if (!clientSecret) throw new Error("PHONEPE_CLIENT_SECRET is not set");
  return { clientId, clientSecret };
}

type TokenCache = { accessToken: string; expiresAtMs: number };
let tokenCache: TokenCache | null = null;

async function getAccessToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAtMs > Date.now() + 30_000) {
    return tokenCache.accessToken;
  }

  const { clientId, clientSecret } = getCredentials();
  const body = new URLSearchParams({
    client_id: clientId,
    client_version: "1",
    client_secret: clientSecret,
    grant_type: "client_credentials",
  });

  const res = await fetch(getTokenUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await res.json();

  if (!res.ok || !data.access_token) {
    throw new PhonePeError(data.message ?? `PhonePe token request failed (${res.status})`);
  }

  tokenCache = {
    accessToken: data.access_token,
    expiresAtMs: (data.expires_at ?? Date.now() / 1000 + 3600) * 1000,
  };
  return tokenCache.accessToken;
}

async function pgFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const accessToken = await getAccessToken();
  const res = await fetch(`${getPgBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `O-Bearer ${accessToken}`,
      ...init.headers,
    },
  });
  const data = await res.json();

  if (!res.ok) {
    throw new PhonePeError(data.message ?? `PhonePe API request failed (${res.status})`, data.code);
  }

  return data as T;
}

export const ORG_PLAN_AMOUNT_PAISE = {
  FB_ONLY: 29900,
  FB_WHATSAPP: 49900,
} as const;

export type CreateSubscriptionCheckoutInput = {
  merchantOrderId: string;
  merchantSubscriptionId: string;
  amountPaise: number;
  redirectUrl: string;
};

export type CreateSubscriptionCheckoutResponse = {
  orderId: string;
  state: string;
  redirectUrl: string;
  expireAt: number;
};

/** Sets up a recurring UPI Autopay mandate — this authorizes the mandate only, it does not charge immediately. */
export function createSubscriptionCheckout(
  input: CreateSubscriptionCheckoutInput
): Promise<CreateSubscriptionCheckoutResponse> {
  return pgFetch<CreateSubscriptionCheckoutResponse>("/checkout/v2/pay", {
    method: "POST",
    body: JSON.stringify({
      merchantOrderId: input.merchantOrderId,
      amount: input.amountPaise,
      expireAfter: 1200,
      paymentFlow: {
        type: "SUBSCRIPTION_CHECKOUT_SETUP",
        merchantUrls: { redirectUrl: input.redirectUrl },
        subscriptionDetails: {
          subscriptionType: "RECURRING",
          merchantSubscriptionId: input.merchantSubscriptionId,
          authWorkflowType: "TRANSACTION",
          amountType: "FIXED",
          maxAmount: input.amountPaise,
          frequency: "MONTHLY",
        },
      },
    }),
  });
}

export type OrderStatusResponse = {
  orderId: string;
  state: "PENDING" | "FAILED" | "COMPLETED";
  amount: number;
  expireAt: number;
};

export function getOrderStatus(merchantOrderId: string): Promise<OrderStatusResponse> {
  return pgFetch<OrderStatusResponse>(`/checkout/v2/order/${merchantOrderId}/status`);
}

/** Verifies the `Authorization` header PhonePe sends on webhook callbacks: SHA256("username:password"). */
export function verifyPhonePeWebhookSignature(authorizationHeader: string | null): boolean {
  const username = process.env.PHONEPE_WEBHOOK_USERNAME;
  const password = process.env.PHONEPE_WEBHOOK_PASSWORD;
  if (!username || !password || !authorizationHeader) return false;

  const expected = crypto.createHash("sha256").update(`${username}:${password}`).digest("hex");
  const expectedBuf = Buffer.from(expected, "hex");
  const providedBuf = Buffer.from(authorizationHeader, "hex");
  if (expectedBuf.length !== providedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, providedBuf);
}

export type PhonePeWebhookPayload = {
  event: string;
  payload: {
    orderId: string;
    merchantOrderId: string;
    state: string;
    amount: number;
  };
};
