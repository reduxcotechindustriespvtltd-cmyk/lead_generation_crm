import type { Metadata } from "next";
import { getOrgSettings } from "@/lib/queries/org-settings";

// Branding is editable at runtime from Settings — re-read on every request.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const org = await getOrgSettings();
  return { title: `Data Deletion — ${org.name}` };
}

export default async function DataDeletionPage() {
  const org = await getOrgSettings();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-16">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Data Deletion Instructions</h1>
        <p className="text-muted-foreground mt-2 text-sm">{org.name}</p>
      </div>

      <div className="flex flex-col gap-8 text-sm leading-6 [&_h2]:mt-2 [&_h2]:text-lg [&_h2]:font-semibold [&_p]:text-muted-foreground [&_li]:text-muted-foreground [&_ul]:list-disc [&_ul]:pl-5">
        <section>
          <p>
            If you have submitted a lead form on Facebook or Instagram, or messaged us on
            WhatsApp, some information about you (such as your name, phone number, or email
            address) may be stored in our internal CRM so our team can follow up with you.
          </p>
          <p>
            If you would like this information deleted, you can request that at any time — there
            is no need to remove or reconfigure anything on Facebook, Instagram, or WhatsApp
            yourself.
          </p>
        </section>

        <section>
          <h2>How to request deletion</h2>
          <p>
            Send an email to{" "}
            {org.supportEmail ? (
              <a href={`mailto:${org.supportEmail}`} className="text-primary underline">
                {org.supportEmail}
              </a>
            ) : (
              "the team that manages this CRM"
            )}{" "}
            with the subject line &quot;Data Deletion Request&quot;, including the name, phone
            number, or email address associated with your inquiry so we can locate your record.
          </p>
        </section>

        <section>
          <h2>What happens next</h2>
          <ul>
            <li>We will locate and permanently delete your lead and message records from our CRM.</li>
            <li>
              We will confirm by email once the deletion is complete, typically within a few
              business days.
            </li>
            <li>
              We may retain minimal information where required for legal, accounting, or fraud
              -prevention purposes, even after a deletion request.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
