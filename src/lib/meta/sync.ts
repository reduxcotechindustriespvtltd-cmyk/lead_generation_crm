import "server-only";
import { db } from "@/lib/db";
import { decryptToken } from "@/lib/meta/crypto";
import { getFormLeads, getLeadForms, type MetaLead } from "@/lib/meta/graph-client";
import { mapLeadFields } from "@/lib/meta/field-mapper";
import { logActivity } from "@/lib/activity";
import { getNextRoundRobinAssignee } from "@/lib/assignment";
import type { MetaAccount, LeadForm } from "@/generated/prisma/client";

export type SyncSummary = {
  formsFound: number;
  leadsFetched: number;
  leadsCreated: number;
  leadsSkippedDuplicate: number;
  errors: string[];
};

async function ensureDefaultStatusId(): Promise<string> {
  const status = await db.leadStatus.findFirst({ where: { isDefault: true } });
  if (status) return status.id;
  const fallback = await db.leadStatus.findFirst({ orderBy: { order: "asc" } });
  if (!fallback) throw new Error("No lead statuses configured — add one in Settings first");
  return fallback.id;
}

/** Upserts a single Meta lead into our Lead table. Shared by manual sync and the webhook receiver. */
export async function processMetaLead(
  account: MetaAccount,
  form: LeadForm | null,
  metaLead: MetaLead,
  defaultStatusId: string
): Promise<"created" | "duplicate"> {
  const existing = await db.lead.findUnique({ where: { metaLeadId: metaLead.id } });
  if (existing) return "duplicate";

  const mapped = mapLeadFields(metaLead.field_data);
  const source = metaLead.platform === "ig" ? "INSTAGRAM" : "FACEBOOK";

  // Sequential, not parallel: AdSet depends on Campaign existing, Ad depends on AdSet existing.
  const campaign = metaLead.campaign_id
    ? await db.campaign.upsert({
        where: { metaCampaignId: metaLead.campaign_id },
        update: { name: metaLead.campaign_name ?? "Unknown Campaign" },
        create: {
          metaCampaignId: metaLead.campaign_id,
          metaAccountId: account.id,
          name: metaLead.campaign_name ?? "Unknown Campaign",
        },
      })
    : null;

  const adSet =
    metaLead.adset_id && campaign
      ? await db.adSet.upsert({
          where: { metaAdSetId: metaLead.adset_id },
          update: { name: metaLead.adset_name ?? "Unknown Ad Set" },
          create: {
            metaAdSetId: metaLead.adset_id,
            campaignId: campaign.id,
            name: metaLead.adset_name ?? "Unknown Ad Set",
          },
        })
      : null;

  const ad =
    metaLead.ad_id && adSet
      ? await db.ad.upsert({
          where: { metaAdId: metaLead.ad_id },
          update: { name: metaLead.ad_name ?? "Unknown Ad" },
          create: {
            metaAdId: metaLead.ad_id,
            adSetId: adSet.id,
            name: metaLead.ad_name ?? "Unknown Ad",
          },
        })
      : null;

  const assignedToId = await getNextRoundRobinAssignee();

  const lead = await db.lead.create({
    data: {
      fullName: mapped.fullName,
      phone: mapped.phone || "N/A",
      email: mapped.email,
      city: mapped.city,
      state: mapped.state,
      source,
      metaLeadId: metaLead.id,
      rawPayload: metaLead as unknown as object,
      campaignId: campaign?.id,
      adSetId: adSet?.id,
      adId: ad?.id,
      formId: form?.id,
      campaignName: metaLead.campaign_name,
      adSetName: metaLead.adset_name,
      adName: metaLead.ad_name,
      formName: form?.name,
      statusId: defaultStatusId,
      assignedToId,
      createdAt: new Date(metaLead.created_time),
      lastActivityAt: new Date(metaLead.created_time),
    },
  });

  await logActivity({
    leadId: lead.id,
    userId: null,
    type: "LEAD_CREATED",
    description: `Lead captured from ${source} Lead Ad — ${metaLead.campaign_name ?? "Unknown Campaign"}`,
  });

  if (assignedToId) {
    await logActivity({
      leadId: lead.id,
      userId: null,
      type: "ASSIGNED",
      description: "Auto-assigned via round robin",
    });
    await db.notification.create({
      data: {
        userId: assignedToId,
        type: "LEAD_ASSIGNED",
        title: "New lead assigned",
        message: `${lead.fullName} has been assigned to you`,
        link: `/dashboard/leads/${lead.id}`,
      },
    });
  }

  return "created";
}

export async function syncMetaAccount(accountId: string): Promise<SyncSummary> {
  const account = await db.metaAccount.findUniqueOrThrow({ where: { id: accountId } });
  const accessToken = decryptToken(account.accessToken);
  const defaultStatusId = await ensureDefaultStatusId();

  const summary: SyncSummary = {
    formsFound: 0,
    leadsFetched: 0,
    leadsCreated: 0,
    leadsSkippedDuplicate: 0,
    errors: [],
  };

  const formsResponse = await getLeadForms(account.metaPageId, accessToken);
  summary.formsFound = formsResponse.data.length;

  for (const metaForm of formsResponse.data) {
    const form = await db.leadForm.upsert({
      where: { metaFormId: metaForm.id },
      update: { name: metaForm.name, status: metaForm.status },
      create: {
        metaFormId: metaForm.id,
        metaAccountId: account.id,
        name: metaForm.name,
        status: metaForm.status,
      },
    });

    try {
      let after: string | undefined;
      do {
        const leadsResponse = await getFormLeads(metaForm.id, accessToken, after);
        summary.leadsFetched += leadsResponse.data.length;

        for (const metaLead of leadsResponse.data) {
          const result = await processMetaLead(account, form, metaLead, defaultStatusId);
          if (result === "created") summary.leadsCreated++;
          else summary.leadsSkippedDuplicate++;
        }

        after = leadsResponse.paging?.cursors?.after;
      } while (after);
    } catch (error) {
      summary.errors.push(
        `Form "${metaForm.name}": ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  await db.metaAccount.update({ where: { id: account.id }, data: { lastSyncedAt: new Date() } });

  return summary;
}
