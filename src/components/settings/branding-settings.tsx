"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type OrgSettings = {
  name: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  supportEmail: string | null;
};

export function BrandingSettings({ settings }: { settings: OrgSettings }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: settings.name,
    logoUrl: settings.logoUrl ?? "",
    primaryColor: settings.primaryColor,
    secondaryColor: settings.secondaryColor,
    supportEmail: settings.supportEmail ?? "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function save() {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/org-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Failed to save branding");
        return;
      }
      toast.success("Branding updated");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Branding</CardTitle>
        <CardDescription>
          Customize the name, logo, and colors shown across this CRM — no code changes or redeploy
          needed.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-muted flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border">
            {form.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- previewing an arbitrary external URL
              <img
                src={form.logoUrl}
                alt="Logo preview"
                className="size-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <Building2 className="text-muted-foreground size-6" />
            )}
          </div>
          <div className="flex-1 space-y-1.5">
            <Label>Logo URL</Label>
            <Input
              placeholder="https://yourcompany.com/logo.png"
              value={form.logoUrl}
              onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Organization Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Support Email (optional)</Label>
            <Input
              type="email"
              placeholder="support@yourcompany.com"
              value={form.supportEmail}
              onChange={(e) => setForm({ ...form, supportEmail: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Primary Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.primaryColor}
                onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                className="h-9 w-14 cursor-pointer rounded border"
              />
              <Input
                value={form.primaryColor}
                onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                className="font-mono"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Secondary Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.secondaryColor}
                onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })}
                className="h-9 w-14 cursor-pointer rounded border"
              />
              <Input
                value={form.secondaryColor}
                onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })}
                className="font-mono"
              />
            </div>
          </div>
        </div>

        <Button onClick={save} disabled={isSubmitting} className="w-fit">
          {isSubmitting && <Loader2 className="animate-spin" />}
          Save Branding
        </Button>
      </CardContent>
    </Card>
  );
}
