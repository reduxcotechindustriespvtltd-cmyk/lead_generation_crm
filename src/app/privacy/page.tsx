import type { Metadata } from "next";
import { getOrgSettings } from "@/lib/queries/org-settings";

// Branding is editable at runtime from Settings — re-read on every request.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const org = await getOrgSettings();
  return { title: `Privacy Policy — ${org.name}` };
}

export default async function PrivacyPolicyPage() {
  const org = await getOrgSettings();
  const contactEmail = org.supportEmail ?? "the team that manages this CRM";
  const lastUpdated = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-16">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {org.name} · Last updated {lastUpdated}
        </p>
      </div>

      <div className="flex flex-col gap-8 text-sm leading-6 [&_h2]:mt-2 [&_h2]:text-lg [&_h2]:font-semibold [&_p]:text-muted-foreground [&_li]:text-muted-foreground [&_ul]:list-disc [&_ul]:pl-5">
        <section>
          <h2>Overview</h2>
          <p>
            This CRM ({org.name}) is used internally by our sales team to manage leads generated
            from Facebook, Instagram, and WhatsApp advertising, and to communicate with customers
            who have expressed interest in our products or services. This policy explains what
            information we collect through those channels, how it is used, and how it is
            protected.
          </p>
        </section>

        <section>
          <h2>Information we collect</h2>
          <ul>
            <li>
              <strong>Lead information</strong> submitted through Facebook/Instagram Lead Ads or
              a click-to-WhatsApp ad: name, phone number, email address, and any other fields
              included in the ad&apos;s lead form (for example city or state).
            </li>
            <li>
              <strong>WhatsApp messages</strong> exchanged between a customer and our team through
              the WhatsApp Business Platform.
            </li>
            <li>
              <strong>Account information</strong> for our own staff who use this CRM (name,
              email, role) — not shared with or visible to leads/customers.
            </li>
          </ul>
        </section>

        <section>
          <h2>How we use this information</h2>
          <p>
            Lead and WhatsApp data is used exclusively to follow up on inquiries, provide
            customer support, and track the performance of our advertising campaigns. We do not
            sell, rent, or share this information with third parties for their own marketing
            purposes.
          </p>
        </section>

        <section>
          <h2>Facebook, Instagram, and WhatsApp data</h2>
          <p>
            To receive leads and messages, this CRM connects to the Meta Graph API and the
            WhatsApp Business Platform using access tokens authorized by our team through
            Facebook Login. Those tokens are encrypted at rest and are used only to (a) retrieve
            Lead Ads submissions and Instagram-linked leads for the Pages we manage, and (b) send
            and receive WhatsApp messages for the numbers we manage. We do not use this access to
            read or collect any other data from your Facebook, Instagram, or WhatsApp account.
          </p>
        </section>

        <section>
          <h2>Data storage and security</h2>
          <p>
            Data is stored in a private database accessible only to authorized staff. Access
            tokens for connected Facebook Pages and WhatsApp numbers are encrypted at rest.
            Every action taken on lead or account data is recorded in an internal audit log.
          </p>
        </section>

        <section>
          <h2>Data retention and deletion</h2>
          <p>
            We retain lead and message data for as long as reasonably necessary to support our
            sales and customer-service relationship with you. If you would like your information
            removed from our systems, contact us using the details below and we will delete it,
            except where we are required to retain records for legal or accounting purposes.
          </p>
        </section>

        <section>
          <h2>Contact us</h2>
          <p>
            Questions about this policy, or requests to access or delete your data, can be sent
            to{" "}
            {org.supportEmail ? (
              <a href={`mailto:${org.supportEmail}`} className="text-primary underline">
                {org.supportEmail}
              </a>
            ) : (
              contactEmail
            )}
            .
          </p>
        </section>
      </div>
    </div>
  );
}
