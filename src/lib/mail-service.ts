import "server-only";

export function mailServiceAdminRecipients(): string[] {
  return (process.env.ADMIN_NOTIFICATION_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
}

/**
 * Fire-and-forget POST to the standalone mail/invoice service. Never throws
 * and never blocks the caller — callers must still succeed even if the mail
 * service is unreachable or unconfigured.
 */
export async function notifyMailService(path: string, payload: unknown): Promise<void> {
  const url = process.env.MAIL_SERVICE_URL;
  const apiKey = process.env.MAIL_SERVICE_API_KEY;
  if (!url || !apiKey) return;

  try {
    const res = await fetch(`${url.replace(/\/$/, "")}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify(payload),
      // The mail service renders templates/PDFs and sends real SMTP mail
      // synchronously before responding — every caller wraps this in
      // next/server's after(), so it's guaranteed to actually finish even
      // though the caller's own response already went out. A generous
      // timeout costs nothing here and avoids false-negative error logs for
      // a slow-but-successful send.
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) {
      console.error(`notifyMailService(${path}) failed`, res.status, await res.text().catch(() => ""));
    }
  } catch (error) {
    console.error(`notifyMailService(${path}) error`, error);
  }
}
