"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Check, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type Step = "profile" | "plan" | "verify" | "payment";

type Plan = "FB_ONLY" | "FB_WHATSAPP";

const PLANS: { id: Plan; name: string; price: string; description: string }[] = [
  {
    id: "FB_ONLY",
    name: "Facebook Leads",
    price: "₹299/mo",
    description: "Facebook & Instagram Lead Ads, synced automatically.",
  },
  {
    id: "FB_WHATSAPP",
    name: "Facebook + WhatsApp",
    price: "₹499/mo",
    description: "Everything in Facebook Leads, plus WhatsApp lead tracking.",
  },
];

export function SignupWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("profile");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [otp, setOtp] = useState("");

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function submitProfile() {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("firstName", profile.firstName);
      formData.set("lastName", profile.lastName);
      formData.set("email", profile.email);
      if (profile.phone) formData.set("phone", profile.phone);
      formData.set("password", profile.password);
      formData.set("confirmPassword", profile.confirmPassword);
      if (avatarFile) formData.set("avatar", avatarFile);

      const res = await fetch("/api/signup/start", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Something went wrong");
        return;
      }
      setStep("plan");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitPlan() {
    if (!plan) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/signup/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Something went wrong");
        return;
      }
      setStep("verify");
      await requestOtp();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function requestOtp() {
    const res = await fetch("/api/signup/otp/request", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.error ?? "Failed to send verification code");
      return;
    }
    toast.success(`Code sent to ${profile.email}`);
  }

  async function verifyOtp() {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/signup/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Incorrect or expired code");
        return;
      }
      await startPayment();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function startPayment() {
    setStep("payment");
    const res = await fetch("/api/signup/payment/start", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.error ?? "Failed to start payment");
      setStep("verify");
      return;
    }
    router.push(data.redirectUrl);
  }

  return (
    <div className="w-full max-w-sm">
      {step === "profile" && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col items-center gap-3">
            <Avatar className="size-16">
              <AvatarImage src={avatarPreview ?? undefined} />
              <AvatarFallback>
                <Upload className="text-muted-foreground size-5" />
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              className="text-primary text-xs underline-offset-4 hover:underline"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload profile picture
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>First name</Label>
              <Input
                value={profile.firstName}
                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Last name</Label>
              <Input
                value={profile.lastName}
                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Phone (optional)</Label>
            <Input
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Password</Label>
            <Input
              type="password"
              value={profile.password}
              onChange={(e) => setProfile({ ...profile, password: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Confirm password</Label>
            <Input
              type="password"
              value={profile.confirmPassword}
              onChange={(e) => setProfile({ ...profile, confirmPassword: e.target.value })}
            />
          </div>
          <Button size="lg" onClick={submitProfile} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            Continue
          </Button>
        </div>
      )}

      {step === "plan" && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Choose a plan</h2>
          {PLANS.map((p) => (
            <Card
              key={p.id}
              className={cn(
                "cursor-pointer transition-colors",
                plan === p.id && "border-primary ring-primary/30 ring-2"
              )}
              onClick={() => setPlan(p.id)}
            >
              <CardContent className="flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{p.name}</p>
                    {plan === p.id && <Check className="text-primary size-4" />}
                  </div>
                  <p className="text-muted-foreground text-sm">{p.description}</p>
                </div>
                <p className="font-semibold whitespace-nowrap">{p.price}</p>
              </CardContent>
            </Card>
          ))}
          <Button size="lg" onClick={submitPlan} disabled={isSubmitting || !plan}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            Continue
          </Button>
        </div>
      )}

      {step === "verify" && (
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="text-lg font-semibold">Verify your email</h2>
            <p className="text-muted-foreground text-sm">
              Enter the 6-digit code sent to {profile.email}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Verification code</Label>
            <Input
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </div>
          <Button size="lg" onClick={verifyOtp} disabled={isSubmitting || otp.length !== 6}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            Verify & continue to payment
          </Button>
          <button
            type="button"
            className="text-muted-foreground text-xs underline-offset-4 hover:underline"
            onClick={requestOtp}
          >
            Resend code
          </button>
        </div>
      )}

      {step === "payment" && (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <Loader2 className="text-muted-foreground size-6 animate-spin" />
          <p className="text-muted-foreground text-sm">Redirecting you to payment…</p>
        </div>
      )}
    </div>
  );
}
