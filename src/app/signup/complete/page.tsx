"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 2 * 60 * 1000;

function CompleteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;

    let cancelled = false;
    const startedAt = Date.now();

    async function poll() {
      if (cancelled) return;

      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        setError(
          "This is taking longer than expected. If your payment succeeded, refresh this page in a minute."
        );
        return;
      }

      const statusRes = await fetch(`/api/signup/status?orderId=${orderId}`);
      const statusData = await statusRes.json().catch(() => ({}));

      if (statusRes.ok && statusData.status === "ACTIVE") {
        const finishRes = await fetch("/api/signup/finish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });
        if (finishRes.ok) {
          router.push("/dashboard");
          router.refresh();
          return;
        }
      }

      setTimeout(poll, POLL_INTERVAL_MS);
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [orderId, router]);

  if (!orderId || error) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <AlertCircle className="text-destructive size-6" />
        <p className="text-muted-foreground text-sm">
          {error ?? "Missing order reference."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <Loader2 className="text-muted-foreground size-6 animate-spin" />
      <p className="font-medium">Finalizing your account…</p>
      <p className="text-muted-foreground text-sm">This usually takes a few seconds.</p>
    </div>
  );
}

export default function SignupCompletePage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center px-6 py-12">
      <Suspense>
        <CompleteContent />
      </Suspense>
    </div>
  );
}
