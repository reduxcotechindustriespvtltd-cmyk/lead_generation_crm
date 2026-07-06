import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function WebhookSetupCard({
  appUrl,
  verifyToken,
  appSecretConfigured,
}: {
  appUrl: string;
  verifyToken: string;
  appSecretConfigured: boolean;
}) {
  const isLocalhost = appUrl.includes("localhost") || appUrl.includes("127.0.0.1");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Real-time Webhook Setup</CardTitle>
        <CardDescription>
          Both Facebook/Instagram Lead Ads and WhatsApp share this one callback URL — subscribe to{" "}
          <code>leadgen</code> on the Page object for Lead Ads, and <code>messages</code> on the
          WhatsApp Business Account object for WhatsApp.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        <div>
          <p className="text-muted-foreground text-xs">Callback URL</p>
          <code className="bg-muted block rounded px-2 py-1 break-all">
            {appUrl}/api/meta/webhook
          </code>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Verify Token</p>
          <code className="bg-muted block rounded px-2 py-1 break-all">{verifyToken}</code>
        </div>
        <p className="text-muted-foreground">
          Facebook/Instagram Lead Ads can also be pulled manually with &quot;Sync Now&quot; without
          this. <span className="font-medium">WhatsApp has no manual fallback</span> — leads only
          arrive through this webhook.
        </p>
        {isLocalhost && (
          <p className="text-amber-600">
            This URL is a localhost address — Meta cannot reach it. Webhooks only work once the CRM
            is deployed behind a public HTTPS domain.
          </p>
        )}
        {!appSecretConfigured && (
          <p className="text-amber-600">
            META_APP_SECRET is not set in your environment — incoming webhook events will be
            rejected until you add it.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
