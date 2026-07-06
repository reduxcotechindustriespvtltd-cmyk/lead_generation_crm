"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ConnectWhatsAppDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ phoneNumberId: "", wabaId: "", accessToken: "" });

  const canSubmit =
    form.phoneNumberId.length > 4 && form.wabaId.length > 4 && form.accessToken.length > 20;

  async function submit() {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/whatsapp-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Failed to connect number");
        return;
      }
      toast.success("WhatsApp number connected");
      setOpen(false);
      setForm({ phoneNumberId: "", wabaId: "", accessToken: "" });
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  // return (
  //   <Dialog open={open} onOpenChange={setOpen}>
  //     <button
  //       type="button"
  //       className="text-muted-foreground w-fit text-xs underline-offset-4 hover:underline"
  //       onClick={() => setOpen(true)}
  //     >
  //       Or enter Phone Number ID / WABA ID / token manually
  //     </button>
  //     <DialogContent>
  //       <DialogHeader>
  //         <DialogTitle>Connect a WhatsApp number</DialogTitle>
  //         <DialogDescription>
  //           From your Meta App&apos;s WhatsApp product setup — a System User access token with{" "}
  //           <code>whatsapp_business_messaging</code> permission, and the Phone Number ID / WABA ID
  //           shown on that page.
  //         </DialogDescription>
  //       </DialogHeader>
  //       <div className="flex flex-col gap-3">
  //         <div className="space-y-1.5">
  //           <Label>Phone Number ID</Label>
  //           <Input
  //             placeholder="1029384756"
  //             value={form.phoneNumberId}
  //             onChange={(e) => setForm({ ...form, phoneNumberId: e.target.value })}
  //           />
  //         </div>
  //         <div className="space-y-1.5">
  //           <Label>WhatsApp Business Account ID</Label>
  //           <Input
  //             placeholder="5647382910"
  //             value={form.wabaId}
  //             onChange={(e) => setForm({ ...form, wabaId: e.target.value })}
  //           />
  //         </div>
  //         <div className="space-y-1.5">
  //           <Label>Access Token</Label>
  //           <Input
  //             type="password"
  //             placeholder="EAAG..."
  //             value={form.accessToken}
  //             onChange={(e) => setForm({ ...form, accessToken: e.target.value })}
  //           />
  //         </div>
  //       </div>
  //       <DialogFooter>
  //         <Button variant="outline" onClick={() => setOpen(false)}>
  //           Cancel
  //         </Button>
  //         <Button onClick={submit} disabled={isSubmitting || !canSubmit}>
  //           {isSubmitting && <Loader2 className="animate-spin" />}
  //           Connect
  //         </Button>
  //       </DialogFooter>
  //     </DialogContent>
  //   </Dialog>
  // );
}
