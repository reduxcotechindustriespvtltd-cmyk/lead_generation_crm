import type { Metadata } from "next";
import { getOrgSettings } from "@/lib/queries/org-settings";

// Branding is editable at runtime from Settings — re-read on every request.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const org = await getOrgSettings();
  return { title: `Terms of Service — ${org.name}` };
}

export default async function TermsPage() {
  const org = await getOrgSettings();
  const lastUpdated = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-16">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Terms of Service</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {org.name} · Last updated {lastUpdated}
        </p>
      </div>

      <div className="flex flex-col gap-8 text-sm leading-6 [&_h2]:mt-2 [&_h2]:text-lg [&_h2]:font-semibold [&_p]:text-muted-foreground [&_li]:text-muted-foreground [&_ul]:list-disc [&_ul]:pl-5">
        <section>
          <h2>What this is</h2>
          <p>
            This CRM ({org.name}) is an internal tool used by our sales and support team to
            manage leads generated from Facebook, Instagram, and WhatsApp advertising. It is not
            a public product or service offered to customers — leads and contacts interact with
            our team through Facebook, Instagram, and WhatsApp as usual; this CRM is simply the
            internal system we use to organize and respond to those interactions.
          </p>
        </section>

        <section>
          <h2>Acceptable use</h2>
          <p>
            Access to this CRM is restricted to authorized staff and is provided for legitimate
            business purposes only: following up on leads, managing customer communication, and
            reporting on advertising performance. Staff accounts must not be shared, and access
            may be revoked at any time.
          </p>
        </section>

        <section>
          <h2>Facebook, Instagram, and WhatsApp integration</h2>
          <p>
            This CRM connects to the Meta Graph API and the WhatsApp Business Platform, using
            access granted through Facebook Login by authorized staff, solely to retrieve Lead
            Ads submissions and send/receive WhatsApp messages for the Pages and numbers our
            business manages. Use of this integration is subject to Meta&apos;s own terms and
            policies in addition to this document.
          </p>
        </section>

        <section>
          <h2>No warranty</h2>
          <p>
            This tool is provided as-is for internal use. While we take reasonable care to keep
            it available and the data within it accurate, we make no guarantee against downtime,
            data loss, or errors, and are not liable for business decisions made based on
            information in this system.
          </p>
        </section>

        <section>
          <h2>Changes</h2>
          <p>
            We may update these terms as our use of this CRM evolves. Continued use after a
            change means you accept the updated terms.
          </p>
        </section>

        <section>
          <h2>Contact us</h2>
          <p>
            Questions about these terms can be sent to{" "}
            {org.supportEmail ? (
              <a href={`mailto:${org.supportEmail}`} className="text-primary underline">
                {org.supportEmail}
              </a>
            ) : (
              "the team that manages this CRM"
            )}
            .
          </p>
        </section>
      </div>
    </div>
  );
}
