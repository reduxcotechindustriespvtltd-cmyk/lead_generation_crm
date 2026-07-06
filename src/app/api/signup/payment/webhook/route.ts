import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPhonePeWebhookSignature, type PhonePeWebhookPayload } from "@/lib/phonepe/client";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  if (!verifyPhonePeWebhookSignature(request.headers.get("authorization"))) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  let payload: PhonePeWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ success: true });
  }

  if (payload.event === "checkout.order.completed" && payload.payload.state === "COMPLETED") {
    await handleOrderCompleted(payload.payload.merchantOrderId).catch((err) => {
      console.error("Failed to provision signup after payment:", err);
    });
  }

  return NextResponse.json({ success: true });
}

async function handleOrderCompleted(merchantOrderId: string) {
  const pending = await db.pendingSignup.findUnique({ where: { merchantOrderId } });
  if (!pending) return;

  const existingUser = await db.user.findUnique({ where: { email: pending.email } });
  if (existingUser) return; // already provisioned (webhook retry)

  const organization = await db.organization.create({
    data: {
      name: pending.name,
      plan: pending.plan,
      subscriptionStatus: "ACTIVE",
      phonePeMerchantSubId: pending.merchantSubscriptionId,
    },
  });

  const user = await db.user.create({
    data: {
      name: pending.name,
      email: pending.email,
      passwordHash: pending.passwordHash,
      phone: pending.phone,
      avatarUrl: pending.avatarUrl,
      role: "ADMIN",
      organizationId: organization.id,
    },
  });

  await db.auditLog.create({
    data: {
      userId: user.id,
      action: "SIGNUP_COMPLETED",
      entityType: "Organization",
      entityId: organization.id,
      changes: { plan: pending.plan },
    },
  });
}
