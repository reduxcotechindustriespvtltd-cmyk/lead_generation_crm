// Client-side helper for Meta's WhatsApp Embedded Signup (Facebook JS SDK).
// NOTE: parameter/event names below match Meta's WhatsApp Embedded Signup docs as of
// this writing (config_id, response_type=code, override_default_response_type, and the
// WA_EMBEDDED_SIGNUP postMessage event carrying waba_id/phone_number_id/business_id).
// Meta revises this API periodically — re-check developers.facebook.com/docs/whatsapp/embedded-signup
// if the popup stops returning the expected fields.

declare global {
  interface Window {
    FB?: {
      init: (params: { appId: string; version: string; xfbml?: boolean }) => void;
      login: (
        callback: (response: FacebookLoginResponse) => void,
        options: {
          config_id: string;
          response_type: "code";
          override_default_response_type: true;
          extras?: { setup?: Record<string, unknown>; sessionInfoVersion?: string };
        }
      ) => void;
    };
    fbAsyncInit?: () => void;
  }
}

export type FacebookLoginResponse = {
  authResponse?: { code?: string };
  status?: string;
};

export type WhatsAppEmbeddedSignupMessage = {
  type: "WA_EMBEDDED_SIGNUP";
  event: "FINISH" | "FINISH_ONLY_WABA" | "CANCEL" | "ERROR";
  data?: {
    waba_id?: string;
    phone_number_id?: string;
    business_id?: string;
    current_step?: string;
    error_message?: string;
  };
};

const SDK_SRC = "https://connect.facebook.net/en_US/sdk.js";
let sdkPromise: Promise<NonNullable<Window["FB"]>> | null = null;

export function loadFacebookSdk(appId: string, version: string) {
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve, reject) => {
    window.fbAsyncInit = () => {
      window.FB!.init({ appId, version, xfbml: false });
      resolve(window.FB!);
    };

    // The SDK loads in two stages (a small stub, which then fetches a much larger
    // bundle) — on a slow or uncached first load that can take a while, so this
    // timeout is generous on purpose to avoid false-positive "blocked" errors.
    const timeout = setTimeout(() => {
      sdkPromise = null;
      reject(
        new Error(
          "Facebook SDK didn't load in time — it may be blocked by an ad blocker or privacy extension."
        )
      );
    }, 30000);

    const clearAndResolve = window.fbAsyncInit;
    window.fbAsyncInit = () => {
      clearTimeout(timeout);
      clearAndResolve();
    };

    if (document.getElementById("facebook-jssdk")) {
      // Script tag already present (e.g. fast re-mount) — fbAsyncInit above will still fire once it loads.
      return;
    }

    const script = document.createElement("script");
    script.id = "facebook-jssdk";
    script.src = SDK_SRC;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      clearTimeout(timeout);
      sdkPromise = null;
      reject(
        new Error(
          "Facebook SDK script failed to load — check for an ad blocker or privacy extension blocking connect.facebook.net."
        )
      );
    };
    document.body.appendChild(script);
  });

  return sdkPromise;
}

export function isWhatsAppEmbeddedSignupMessage(
  data: unknown
): data is WhatsAppEmbeddedSignupMessage {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as { type?: unknown }).type === "WA_EMBEDDED_SIGNUP"
  );
}
