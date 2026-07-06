"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/icons/social-icons";
import {
  loadFacebookSdk,
  isWhatsAppEmbeddedSignupMessage,
  type WhatsAppEmbeddedSignupMessage,
} from "@/lib/whatsapp/fb-sdk";

type SignupConfig = {
  appId: string | null;
  configId: string | null;
  graphApiVersion: string;
  configured: boolean;
};

export function ConnectWhatsAppEmbeddedButton() {
  const router = useRouter();
  const [config, setConfig] = useState<SignupConfig | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const sessionInfoRef = useRef<WhatsAppEmbeddedSignupMessage["data"] | null>(null);

  useEffect(() => {
    fetch("/api/whatsapp/embedded-signup/config")
      .then((res) => res.json())
      .then(setConfig)
      .catch(() => setConfig({ appId: null, configId: null, graphApiVersion: "v21.0", configured: false }));
  }, []);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== "https://www.facebook.com" && event.origin !== "https://web.facebook.com") {
        return;
      }
      let data: unknown;
      try {
        data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      } catch {
        return;
      }
      if (!isWhatsAppEmbeddedSignupMessage(data)) return;

      if (data.event === "FINISH" || data.event === "FINISH_ONLY_WABA") {
        sessionInfoRef.current = data.data;
      } else if (data.event === "CANCEL") {
        sessionInfoRef.current = null;
        setIsConnecting(false);
      } else if (data.event === "ERROR") {
        sessionInfoRef.current = null;
        setIsConnecting(false);
        toast.error(data.data?.error_message ?? "WhatsApp signup failed");
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  async function startSignup() {
    if (!config?.configured || !config.appId || !config.configId) return;
    setIsConnecting(true);
    sessionInfoRef.current = null;

    try {
      const FB = await loadFacebookSdk(config.appId, config.graphApiVersion);

      FB.login(
        async (response) => {
          const code = response.authResponse?.code;
          const sessionInfo = sessionInfoRef.current;

          if (!code || !sessionInfo?.waba_id || !sessionInfo?.phone_number_id) {
            setIsConnecting(false);
            // A closed/cancelled popup with no code is a silent no-op, not an error.
            if (code) toast.error("WhatsApp signup didn't return the expected account details");
            return;
          }

          try {
            const res = await fetch("/api/whatsapp/embedded-signup/exchange", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                code,
                wabaId: sessionInfo.waba_id,
                phoneNumberId: sessionInfo.phone_number_id,
                businessId: sessionInfo.business_id,
              }),
            });
            const result = await res.json().catch(() => ({}));
            if (!res.ok) {
              toast.error(result.error ?? "Failed to connect WhatsApp number");
              return;
            }
            if (result.warning) toast.warning(result.warning);
            toast.success("WhatsApp number connected");
            router.refresh();
          } finally {
            setIsConnecting(false);
          }
        },
        {
          config_id: config.configId,
          response_type: "code",
          override_default_response_type: true,
          extras: { setup: {} },
        }
      );
    } catch {
      setIsConnecting(false);
      toast.error("Failed to load Facebook SDK");
    }
  }

  if (!config) return null;
  if (!config.configured) return null;

  return (
    <Button onClick={startSignup} disabled={isConnecting} className="gap-2">
      {isConnecting ? <Loader2 className="size-4 animate-spin" /> : <WhatsAppIcon className="size-4" />}
      Continue with WhatsApp
    </Button>
  );
}
