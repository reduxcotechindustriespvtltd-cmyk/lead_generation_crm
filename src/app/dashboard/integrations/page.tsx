import { redirect } from "next/navigation";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { ConnectAccountDialog } from "@/components/integrations/connect-account-dialog";
import { MetaAccountsList } from "@/components/integrations/meta-accounts-list";
import { ConnectWhatsAppDialog } from "@/components/integrations/connect-whatsapp-dialog";
import { ConnectWhatsAppEmbeddedButton } from "@/components/integrations/connect-whatsapp-embedded-button";
import { WhatsAppAccountsList } from "@/components/integrations/whatsapp-accounts-list";
import { WebhookSetupCard } from "@/components/integrations/webhook-setup-card";
import { OAuthErrorToast } from "@/components/integrations/oauth-error-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FacebookIcon, WhatsAppIcon } from "@/components/icons/social-icons";

export default async function IntegrationsPage() {
  const session = await getCurrentUser();
  if (!session || session.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [metaAccounts, whatsAppAccounts] = await Promise.all([
    db.metaAccount.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        metaPageId: true,
        instagramBusinessId: true,
        isActive: true,
        lastSyncedAt: true,
      },
    }),
    db.whatsAppAccount.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        displayPhoneNumber: true,
        displayName: true,
        qualityRating: true,
        connectedVia: true,
        isActive: true,
        lastMessageAt: true,
      },
    }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <Suspense fallback={null}>
        <OAuthErrorToast />
      </Suspense>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Meta Integration</h1>
        <p className="text-muted-foreground text-sm">
          Connect Facebook, Instagram, and WhatsApp so leads flow in automatically
        </p>
      </div>

      <Tabs defaultValue="meta">
        <TabsList>
          <TabsTrigger value="meta">
            <FacebookIcon className="size-4" />
            Facebook &amp; Instagram
          </TabsTrigger>
          <TabsTrigger value="whatsapp">
            <WhatsAppIcon className="size-4" />
            WhatsApp
          </TabsTrigger>
        </TabsList>

        <TabsContent value="meta" className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              For ads using Instant Forms — where the lead form opens inside Facebook/Instagram.
            </p>
            <ConnectAccountDialog />
          </div>
          <MetaAccountsList
            accounts={metaAccounts.map((a) => ({
              ...a,
              lastSyncedAt: a.lastSyncedAt ? a.lastSyncedAt.toISOString() : null,
            }))}
          />
        </TabsContent>

        <TabsContent value="whatsapp" className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              For click-to-WhatsApp ads — requires the number to be on the WhatsApp Business
              Platform (Cloud API), not the regular WhatsApp Business App.
            </p>
            <div className="flex flex-col items-end gap-1.5">
              <ConnectWhatsAppEmbeddedButton />
              {/* <ConnectWhatsAppDialog /> */}
            </div>
          </div>
          <WhatsAppAccountsList
            accounts={whatsAppAccounts.map((a) => ({
              ...a,
              lastMessageAt: a.lastMessageAt ? a.lastMessageAt.toISOString() : null,
            }))}
          />
        </TabsContent>
      </Tabs>

      <WebhookSetupCard
        appUrl={process.env.APP_URL ?? "http://localhost:3000"}
        verifyToken={process.env.META_WEBHOOK_VERIFY_TOKEN ?? "(not set)"}
        appSecretConfigured={!!process.env.META_APP_SECRET}
      />
    </div>
  );
}
