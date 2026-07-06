import type { Metadata } from "next";
import { Building2 } from "lucide-react";
import { SignupWizard } from "@/components/auth/signup-wizard";
import { getOrgSettings } from "@/lib/queries/org-settings";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const org = await getOrgSettings();
  return { title: `Sign up — ${org.name} CRM` };
}

export default async function SignupPage() {
  const org = await getOrgSettings();

  return (
    <div className="flex min-h-screen w-full items-center justify-center px-6 py-12">
      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3">
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
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Start capturing leads with {org.name}
            </p>
          </div>
        </div>
        <SignupWizard />
      </div>
    </div>
  );
}
