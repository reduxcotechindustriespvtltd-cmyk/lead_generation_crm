"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Loader2, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { InstagramIcon } from "@/components/icons/social-icons";
import { Card, CardContent } from "@/components/ui/card";

type Account = {
  id: string;
  name: string;
  metaPageId: string;
  instagramBusinessId: string | null;
  isActive: boolean;
  lastSyncedAt: string | null;
};

export function MetaAccountsList({ accounts }: { accounts: Account[] }) {
  const router = useRouter();
  const [syncingId, setSyncingId] = useState<string | null>(null);

  async function toggleActive(id: string, isActive: boolean) {
    const res = await fetch(`/api/meta-accounts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    if (!res.ok) {
      toast.error("Failed to update account");
      return;
    }
    router.refresh();
  }

  async function disconnect(id: string, name: string) {
    if (!confirm(`Disconnect "${name}"? Leads already synced will be kept.`)) return;
    const res = await fetch(`/api/meta-accounts/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Failed to disconnect account");
      return;
    }
    toast.success("Account disconnected");
    router.refresh();
  }

  async function syncNow(id: string) {
    setSyncingId(id);
    try {
      const res = await fetch(`/api/meta-accounts/${id}/sync`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Sync failed");
        return;
      }
      const { summary } = data;
      toast.success(
        `Synced ${summary.formsFound} form(s): ${summary.leadsCreated} new lead(s), ${summary.leadsSkippedDuplicate} already known`
      );
      if (summary.errors?.length) {
        toast.error(`${summary.errors.length} form(s) failed to sync — see server logs`);
      }
      router.refresh();
    } finally {
      setSyncingId(null);
    }
  }

  if (accounts.length === 0) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-10 text-center text-sm">
          No Meta accounts connected yet. Connect a Facebook Page to start pulling in leads.
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
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{account.name}</p>
                  {account.instagramBusinessId && (
                    <Badge variant="secondary" className="gap-1">
                      <InstagramIcon className="size-3" />
                      Linked
                    </Badge>
                  )}
                  {!account.isActive && <Badge variant="secondary">Disabled</Badge>}
                </div>
                <p className="text-muted-foreground text-xs">
                  Page ID: {account.metaPageId} ·{" "}
                  {account.lastSyncedAt
                    ? `Last synced ${formatDistanceToNow(new Date(account.lastSyncedAt), { addSuffix: true })}`
                    : "Never synced"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={account.isActive}
                onCheckedChange={(v) => toggleActive(account.id, v)}
              />
              <Button
                variant="outline"
                size="sm"
                disabled={!account.isActive || syncingId === account.id}
                onClick={() => syncNow(account.id)}
              >
                {syncingId === account.id ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                Sync Now
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => disconnect(account.id, account.name)}
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
