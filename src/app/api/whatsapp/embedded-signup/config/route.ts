import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { GRAPH_API_VERSION } from "@/lib/meta/graph-client";
import { handleApiError } from "@/lib/api-response";

export async function GET() {
  try {
    await requireRole("ADMIN");

    const appId = process.env.META_APP_ID;
    const configId = process.env.WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID;

    return NextResponse.json({
      appId: appId ?? null,
      configId: configId ?? null,
      graphApiVersion: GRAPH_API_VERSION,
      configured: Boolean(appId && configId),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
