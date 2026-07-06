import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { handleApiError, jsonError } from "@/lib/api-response";
import { exchangeEmbeddedSignupCode, MetaGraphError } from "@/lib/meta/graph-client";
import {
  getPhoneNumberInfo,
  subscribeWabaToWebhook,
  registerPhoneNumber,
  isDuplicateNumberError,
} from "@/lib/whatsapp/graph-client";
import { createOrUpdateWhatsAppAccountFromEmbeddedSignup } from "@/lib/whatsapp/connect";
import { exchangeWhatsAppEmbeddedSignupSchema } from "@/lib/validations/whatsapp";

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole("ADMIN");
    const { code, wabaId, phoneNumberId, businessId } = exchangeWhatsAppEmbeddedSignupSchema.parse(
      await request.json()
    );

    let accessToken: string;
    try {
      const token = await exchangeEmbeddedSignupCode(code);
      accessToken = token.access_token;
    } catch (error) {
      if (error instanceof MetaGraphError) {
        return jsonError(`Meta rejected the connection: ${error.message}`, 400);
      }
      throw error;
    }

    // Numbers migrated from the WhatsApp Business App may already be registered —
    // only a genuine "registered elsewhere" conflict should abort the flow.
    try {
      await registerPhoneNumber(phoneNumberId, accessToken);
    } catch (error) {
      if (error instanceof MetaGraphError) {
        if (isDuplicateNumberError(error)) {
          return jsonError(
            "This number is already registered with another WhatsApp Business API app — deregister it there first, or choose a different number.",
            409
          );
        }
        console.error("WhatsApp phone number registration failed (continuing):", error.message);
      } else {
        throw error;
      }
    }

    let phoneInfo;
    try {
      phoneInfo = await getPhoneNumberInfo(phoneNumberId, accessToken);
    } catch (error) {
      if (error instanceof MetaGraphError) {
        return jsonError(`Meta rejected the connection: ${error.message}`, 400);
      }
      throw error;
    }

    const account = await createOrUpdateWhatsAppAccountFromEmbeddedSignup({
      phoneNumberId,
      wabaId,
      businessId,
      displayPhoneNumber: phoneInfo.display_phone_number,
      displayName: phoneInfo.verified_name,
      qualityRating: phoneInfo.quality_rating,
      accessToken,
      connectedById: session.sub,
    });

    let webhookSubscribed = true;
    let warning: string | undefined;
    try {
      await subscribeWabaToWebhook(wabaId, accessToken);
    } catch (error) {
      webhookSubscribed = false;
      warning =
        "Number connected, but automatic webhook subscription failed — messages may not sync until this is fixed. Check the Meta App webhook config.";
      console.error("Failed to subscribe WABA to webhook:", error);
    }

    return NextResponse.json({ account, webhookSubscribed, warning }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
