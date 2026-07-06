"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

const ERROR_MESSAGES: Record<string, string> = {
  denied: "Facebook connection cancelled — no changes made.",
  state_mismatch: "That connection link expired or was invalid — please try again.",
  token_exchange_failed: "Facebook rejected the connection — please try again.",
  meta_app_not_configured:
    "META_APP_ID / META_APP_SECRET aren't configured on this server yet — ask an admin to set them up, or use the manual token option.",
};

export function OAuthErrorToast() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorCode = searchParams.get("meta_oauth_error");

  useEffect(() => {
    if (!errorCode) return;
    toast.error(ERROR_MESSAGES[errorCode] ?? "Failed to connect Facebook account");
    const params = new URLSearchParams(searchParams);
    params.delete("meta_oauth_error");
    router.replace(params.size ? `?${params.toString()}` : ".", { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorCode]);

  return null;
}
