"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { InstagramIcon } from "@/components/icons/social-icons";

type PickerPage = {
  id: string;
  name: string;
  hasInstagram: boolean;
  alreadyConnected: boolean;
};

export function FacebookPagePicker() {
  const router = useRouter();
  const [pages, setPages] = useState<PickerPage[] | null>(null);
  const [expired, setExpired] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    fetch("/api/meta/oauth/pages")
      .then(async (res) => {
        if (res.status === 401) {
          setExpired(true);
          return;
        }
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error ?? "Failed to load your Facebook Pages");
          return;
        }
        setPages(data.pages);
      })
      .catch(() => toast.error("Failed to load your Facebook Pages"));
  }, []);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function connectSelected() {
    setConnecting(true);
    let successCount = 0;
    try {
      for (const pageId of selected) {
        const res = await fetch("/api/meta/oauth/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pageId }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.error(data.error ?? `Failed to connect page ${pageId}`);
          continue;
        }
        successCount += 1;
        if (data.warning) toast.warning(data.warning);
      }
      if (successCount > 0) {
        toast.success(`Connected ${successCount} Page${successCount > 1 ? "s" : ""}`);
        router.push("/dashboard/integrations");
        router.refresh();
      }
    } finally {
      setConnecting(false);
    }
  }

  if (expired) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center text-sm">
          <p className="text-muted-foreground">
            This session expired — reconnect with Facebook to continue.
          </p>
          <a href="/api/meta/oauth/start" className={cn(buttonVariants())}>
            Reconnect with Facebook
          </a>
        </CardContent>
      </Card>
    );
  }

  if (!pages) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-2 py-10 text-sm">
          <Loader2 className="animate-spin" />
          Loading your Facebook Pages…
        </CardContent>
      </Card>
    );
  }

  if (pages.length === 0) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-10 text-center text-sm">
          No Facebook Pages found for your account.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {pages.map((page) => (
        <Card key={page.id}>
          <CardContent className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-3">
              <Checkbox
                checked={selected.has(page.id)}
                disabled={page.alreadyConnected}
                onCheckedChange={() => toggle(page.id)}
              />
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{page.name}</p>
                  {page.hasInstagram && (
                    <Badge variant="secondary" className="gap-1">
                      <InstagramIcon className="size-3" />
                      Linked
                    </Badge>
                  )}
                  {page.alreadyConnected && <Badge variant="secondary">Already connected</Badge>}
                </div>
                <p className="text-muted-foreground text-xs">Page ID: {page.id}</p>
              </div>
            </label>
          </CardContent>
        </Card>
      ))}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.push("/dashboard/integrations")}>
          Cancel
        </Button>
        <Button onClick={connectSelected} disabled={selected.size === 0 || connecting}>
          {connecting && <Loader2 className="animate-spin" />}
          Connect selected
        </Button>
      </div>
    </div>
  );
}
