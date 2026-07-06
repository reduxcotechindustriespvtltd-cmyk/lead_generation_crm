"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { FacebookIcon } from "@/components/icons/social-icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ConnectAccountDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [token, setToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit() {
    if (token.trim().length < 20) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/meta-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageAccessToken: token.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Failed to connect account");
        return;
      }
      toast.success("Facebook Page connected");
      setOpen(false);
      setToken("");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>
        <Plus />
        Connect Page
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect a Facebook Page</DialogTitle>
          <DialogDescription>
            Connect a Page you manage to start pulling in Lead Ads. If the Page has a linked
            Instagram professional account, its leads sync automatically too.
          </DialogDescription>
        </DialogHeader>

        <a
          href="/api/meta/oauth/start"
          className={cn(buttonVariants(), "w-full gap-2")}
        >
          <FacebookIcon className="size-4" />
          Continue with Facebook
        </a>

        <button
          type="button"
          className="text-muted-foreground w-fit text-xs underline-offset-4 hover:underline"
          onClick={() => setShowManual((v) => !v)}
        >
          {showManual ? "Hide manual option" : "Or paste a Page access token manually"}
        </button>

        {showManual && (
          <>
            <div className="space-y-1.5">
              <Label>Page Access Token</Label>
              <Textarea
                rows={4}
                placeholder="EAAG..."
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
              <p className="text-muted-foreground text-xs">
                Needs <code>pages_show_list</code> and <code>leads_retrieval</code> permissions.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={submit} disabled={isSubmitting || token.trim().length < 20}>
                {isSubmitting && <Loader2 className="animate-spin" />}
                Connect
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
