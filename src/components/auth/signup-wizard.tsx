"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Check, Upload, Mail, Lock, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { signupProfileSchema, type SignupProfileInput } from "@/lib/validations/signup";
import { COUNTRY_CODES, DEFAULT_COUNTRY_CODE } from "@/lib/country-codes";

type Step = "profile" | "password" | "verify" | "plan" | "payment";
type Plan = "FB_ONLY" | "FB_WHATSAPP";

const STEPS: { id: Step; label: string }[] = [
  { id: "profile", label: "Your details" },
  { id: "password", label: "Password" },
  { id: "verify", label: "Verify email" },
  { id: "plan", label: "Choose plan" },
  { id: "payment", label: "Payment" },
];

const PLANS: {
  id: Plan;
  name: string;
  price: string;
  description: string;
  features: string[];
  recommended?: boolean;
}[] = [
  {
    id: "FB_ONLY",
    name: "Facebook Leads",
    price: "₹299",
    description: "For teams running Facebook & Instagram Lead Ads.",
    features: ["Facebook & Instagram Lead Ads sync", "Automatic lead assignment", "Follow-up reminders"],
  },
  {
    id: "FB_WHATSAPP",
    name: "Facebook + WhatsApp",
    price: "₹499",
    description: "Everything in Facebook Leads, plus click-to-WhatsApp.",
    features: [
      "Everything in Facebook Leads",
      "WhatsApp lead tracking",
      "Reply to leads from the CRM",
    ],
    recommended: true,
  },
];

function StepIndicator({ current }: { current: Step }) {
  const currentIndex = STEPS.findIndex((s) => s.id === current);
  return (
    <div className="mb-8 flex items-center gap-1.5">
      {STEPS.map((s, i) => (
        <div key={s.id} className="flex flex-1 items-center gap-1.5">
          <div
            className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors",
              i <= currentIndex ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}
          >
            {i < currentIndex ? <Check className="size-3.5" /> : i + 1}
          </div>
          {i < STEPS.length - 1 && (
            <div className={cn("h-px flex-1", i < currentIndex ? "bg-primary" : "bg-muted")} />
          )}
        </div>
      ))}
    </div>
  );
}

export function SignupWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("profile");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [otp, setOtp] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const form = useForm<SignupProfileInput>({
    resolver: zodResolver(signupProfileSchema),
    mode: "onBlur",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      countryCode: DEFAULT_COUNTRY_CODE,
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleProfileContinue() {
    const valid = await form.trigger(["firstName", "lastName", "email", "countryCode", "phone"]);
    if (valid) setStep("password");
  }

  async function submitProfile(values: SignupProfileInput) {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("firstName", values.firstName);
      formData.set("lastName", values.lastName);
      formData.set("email", values.email);
      formData.set("countryCode", values.countryCode);
      if (values.phone) formData.set("phone", values.phone);
      formData.set("password", values.password);
      formData.set("confirmPassword", values.confirmPassword);
      if (avatarFile) formData.set("avatar", avatarFile);

      const res = await fetch("/api/signup/start", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Something went wrong");
        return;
      }
      setEmail(values.email);
      setStep("verify");
      await requestOtp(values.email);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function requestOtp(forEmail?: string) {
    setResendCooldown(60);
    const res = await fetch("/api/signup/otp/request", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.error ?? "Failed to send verification code");
      return;
    }
    toast.success(`Code sent to ${forEmail ?? email}`);
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
      setStep("plan");
      return;
    }
    router.push(data.redirectUrl);
  }

  return (
    <div className="w-full">
      <StepIndicator current={step} />

      {(step === "profile" || step === "password") && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submitProfile)} className="flex flex-col gap-5">
            {step === "profile" && (
              <>
                <div className="flex flex-col items-center gap-2">
                  <Avatar className="border-border size-16 border">
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
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First name</FormLabel>
                        <FormControl>
                          <Input autoComplete="given-name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last name</FormLabel>
                        <FormControl>
                          <Input autoComplete="family-name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                          <Input type="email" autoComplete="email" className="pl-9" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-1.5">
                  <Label>Phone (optional)</Label>
                  <div className="flex gap-2">
                    <FormField
                      control={form.control}
                      name="countryCode"
                      render={({ field }) => (
                        <FormItem className="w-28 shrink-0">
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {COUNTRY_CODES.map((c) => (
                                <SelectItem key={c.code} value={c.code}>
                                  {c.code}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              type="tel"
                              inputMode="numeric"
                              autoComplete="tel-national"
                              placeholder="9876543210"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Button type="button" size="lg" onClick={handleProfileContinue}>
                  Continue
                </Button>
              </>
            )}

            {step === "password" && (
              <>
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                          <Input
                            type="password"
                            autoComplete="new-password"
                            className="pl-9"
                            autoFocus
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                          <Input
                            type="password"
                            autoComplete="new-password"
                            className="pl-9"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => setStep("profile")}
                  >
                    Back
                  </Button>
                  <Button type="submit" size="lg" className="flex-1" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="animate-spin" />}
                    Continue
                  </Button>
                </div>
              </>
            )}
          </form>
        </Form>
      )}

      {step === "verify" && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="bg-primary/10 flex size-12 items-center justify-center rounded-full">
              <MessageCircle className="text-primary size-5" />
            </div>
            <h2 className="text-lg font-semibold">Verify your email</h2>
            <p className="text-muted-foreground text-sm">
              Enter the 6-digit code sent to <span className="font-medium">{email}</span>
            </p>
          </div>
          <Input
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            className="text-center text-lg tracking-[0.5em]"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          />
          <Button size="lg" onClick={verifyOtp} disabled={isSubmitting || otp.length !== 6}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            Verify & continue
          </Button>
          <button
            type="button"
            disabled={resendCooldown > 0}
            className="text-muted-foreground text-center text-xs underline-offset-4 hover:underline disabled:no-underline disabled:opacity-50"
            onClick={() => requestOtp()}
          >
            {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
          </button>
        </div>
      )}

      {step === "plan" && (
        <div className="flex flex-col gap-4">
          <div className="text-center">
            <h2 className="text-lg font-semibold">Choose your plan</h2>
            <p className="text-muted-foreground text-sm">Cancel anytime, no lock-in.</p>
          </div>
          {PLANS.map((p) => (
            <Card
              key={p.id}
              className={cn(
                "relative cursor-pointer py-4 transition-colors",
                plan === p.id ? "border-primary ring-primary/30 ring-2" : "hover:border-primary/50"
              )}
              onClick={() => setPlan(p.id)}
            >
              {p.recommended && (
                <Badge className="absolute -top-2.5 left-4" variant="default">
                  Most popular
                </Badge>
              )}
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{p.name}</p>
                      {plan === p.id && <Check className="text-primary size-4" />}
                    </div>
                    <p className="text-muted-foreground text-sm">{p.description}</p>
                  </div>
                  <p className="text-right leading-tight font-semibold whitespace-nowrap">
                    {p.price}
                    <span className="text-muted-foreground block text-xs font-normal">/month</span>
                  </p>
                </div>
                <ul className="flex flex-col gap-1.5">
                  {p.features.map((f) => (
                    <li key={f} className="text-muted-foreground flex items-center gap-2 text-xs">
                      <Check className="text-primary size-3.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
          <Button size="lg" onClick={submitPlan} disabled={isSubmitting || !plan}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            Continue to payment
          </Button>
        </div>
      )}

      {step === "payment" && (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <Loader2 className="text-muted-foreground size-6 animate-spin" />
          <p className="font-medium">Redirecting you to payment…</p>
          <p className="text-muted-foreground text-sm">Please don&apos;t close this tab.</p>
        </div>
      )}
    </div>
  );
}
