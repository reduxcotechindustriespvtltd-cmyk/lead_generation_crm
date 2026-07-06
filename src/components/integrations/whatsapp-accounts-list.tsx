"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { WhatsAppIcon } from "@/components/icons/social-icons";

type Account = {
  id: string;
  displayPhoneNumber: string;
  displayName: string | null;
  qualityRating?: string | null;
  connectedVia?: "MANUAL_TOKEN" | "EMBEDDED_SIGNUP" | null;
  isActive: boolean;
  lastMessageAt: string | null;
};

const QUALITY_RATING_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  GREEN: "default",
  YELLOW: "secondary",
  RED: "destructive",
};

export function WhatsAppAccountsList({ accounts }: { accounts: Account[] }) {
  const router = useRouter();

  async function toggleActive(id: string, isActive: boolean) {
    const res = await fetch(`/api/whatsapp-accounts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    if (!res.ok) {
      toast.error("Failed to update number");
      return;
    }
    router.refresh();
  }

  async function disconnect(id: string, phone: string) {
    if (!confirm(`Disconnect ${phone}? Leads already captured will be kept.`)) return;
    const res = await fetch(`/api/whatsapp-accounts/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Failed to disconnect number");
      return;
    }
    toast.success("Number disconnected");
    router.refresh();
  }

  if (accounts.length === 0) {
    return (
      <Card>
        <CardContent>
          <EmptyState
            icon={WhatsAppIcon}
            title="No WhatsApp numbers connected"
            description="Connect a Cloud API number to automatically capture leads from click-to-WhatsApp ads."
            size="sm"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {accounts.map((account) => (
        <Card key={account.id}>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-full bg-[#25D366]/10">
                <WhatsAppIcon className="size-4.5 text-[#25D366]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{account.displayPhoneNumber}</p>
                  {account.displayName && (
                    <span className="text-muted-foreground text-sm">{account.displayName}</span>
                  )}
                  {!account.isActive && <Badge variant="secondary">Disabled</Badge>}
                  {account.qualityRating && (
                    <Badge variant={QUALITY_RATING_VARIANT[account.qualityRating] ?? "secondary"}>
                      Quality: {account.qualityRating}
                    </Badge>
                  )}
                  {account.connectedVia === "EMBEDDED_SIGNUP" && (
                    <Badge variant="outline">Connected via WhatsApp Signup</Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-xs">
                  {account.lastMessageAt
                    ? `Last message ${formatDistanceToNow(new Date(account.lastMessageAt), { addSuffix: true })}`
                    : "No messages received yet — waiting on webhook"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={account.isActive}
                onCheckedChange={(v) => toggleActive(account.id, v)}
              />
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => disconnect(account.id, account.displayPhoneNumber)}
              >
                <Trash2 className="text-destructive size-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
