import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Building2, BarChart3, CalendarClock, Users2 } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { getOrgSettings } from "@/lib/queries/org-settings";

// Branding is editable at runtime from Settings — this page must re-read it
// on every request, not bake in whatever was current at build time.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const org = await getOrgSettings();
  return { title: `Sign in — ${org.name} CRM` };
}

const FEATURES = [
  {
    icon: Users2,
    title: "Every lead, organized",
    description:
      "Facebook, Instagram, and WhatsApp leads land here automatically, assigned to your team.",
  },
  {
    icon: CalendarClock,
    title: "Never miss a follow-up",
    description: "Reminders for today, upcoming, and missed follow-ups — right where you work.",
  },
  {
    icon: BarChart3,
    title: "See what's actually working",
    description: "Conversion rates by campaign, ad, and sales rep, in real time.",
  },
];

export default async function LoginPage() {
  const org = await getOrgSettings();

  return (
    <div className="flex min-h-screen w-full">
      {/* Brand panel */}
      <div
        className="relative hidden w-full max-w-xl flex-col justify-between overflow-hidden p-10 text-white lg:flex"
        style={{
          background: `linear-gradient(135deg, var(--brand-orange-dark), var(--brand-orange), var(--brand-teal))`,
        }}
      >
        <div
          className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-white/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-16 size-80 rounded-full bg-black/10 blur-3xl"
          aria-hidden
        />

        <div className="relative flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-white shadow-lg">
            {org.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- logo URL is arbitrary/external
              <img src={org.logoUrl} alt={org.name} className="size-10 rounded-xl object-contain" />
            ) : (
              <Building2 className="text-foreground size-6" />
            )}
          </div>
          <div className="leading-tight">
            <p className="font-semibold">{org.name}</p>
            <p className="text-xs text-white/80">CRM</p>
          </div>
        </div>

        <div className="relative flex flex-col gap-8">
          <h1 className="text-3xl leading-tight font-semibold text-balance">
            Turn every ad click into a customer.
          </h1>
          <div className="flex flex-col gap-5">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="flex items-start gap-3">
                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm">
                  <feature.icon className="size-4.5" />
                </div>
                <div>
                  <p className="text-sm font-medium">{feature.title}</p>
                  <p className="text-sm text-white/75">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/60">
          Internal tool — built for the {org.name} team
        </p>
      </div>

      {/* Form panel */}
      <div className="bg-background flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-3 lg:hidden">
            {org.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- logo URL is arbitrary/external
              <img
                src={org.logoUrl}
                alt={org.name}
                className="size-14 rounded-xl object-contain shadow-sm"
              />
            ) : (
              <div className="bg-muted flex size-14 items-center justify-center rounded-xl shadow-sm">
                <Building2 className="text-muted-foreground size-6" />
              </div>
            )}
            <p className="font-semibold">{org.name} CRM</p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Sign in to your {org.name} CRM account
            </p>
          </div>

          <Suspense>
            <LoginForm />
          </Suspense>

          <p className="text-muted-foreground mt-6 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-primary underline-offset-4 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
