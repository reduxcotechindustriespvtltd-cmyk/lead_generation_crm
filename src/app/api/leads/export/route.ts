import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api-response";
import { buildLeadWhere, type LeadScope } from "@/lib/queries/leads";
import { leadListQuerySchema } from "@/lib/validations/leads";

function scopeFor(role: string, userId: string): LeadScope {
  return role === "SALES_EXECUTIVE" ? { forcedAssignedToId: userId } : {};
}

const EXPORT_COLUMNS = [
  "Lead ID",
  "Full Name",
  "Phone",
  "Email",
  "City",
  "State",
  "Campaign",
  "Ad Set",
  "Ad",
  "Form",
  "Source",
  "Status",
  "Assigned To",
  "Follow-up Date",
  "Created At",
  "Last Updated",
] as const;

export async function GET(request: NextRequest) {
  try {
    const session = await requireUser();
    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const format = params.format === "xlsx" ? "xlsx" : "csv";
    const query = leadListQuerySchema.parse(params);

    const where = buildLeadWhere(query, scopeFor(session.role, session.sub));
    const leads = await db.lead.findMany({
      where,
      orderBy: { [query.sortBy]: query.sortDir },
      include: { status: true, assignedTo: { select: { name: true } } },
      take: 10000,
    });

    const rows = leads.map((lead) => ({
      "Lead ID": lead.id,
      "Full Name": lead.fullName,
      Phone: lead.phone,
      Email: lead.email ?? "",
      City: lead.city ?? "",
      State: lead.state ?? "",
      Campaign: lead.campaignName ?? "",
      "Ad Set": lead.adSetName ?? "",
      Ad: lead.adName ?? "",
      Form: lead.formName ?? "",
      Source: lead.source,
      Status: lead.status.name,
      "Assigned To": lead.assignedTo?.name ?? "Unassigned",
      "Follow-up Date": lead.followUpDate?.toISOString() ?? "",
      "Created At": lead.createdAt.toISOString(),
      "Last Updated": lead.updatedAt.toISOString(),
    }));

    const filename = `leads-export-${new Date().toISOString().slice(0, 10)}`;

    if (format === "xlsx") {
      const worksheet = XLSX.utils.json_to_sheet(rows, { header: [...EXPORT_COLUMNS] });
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
        },
      });
    }

    const csv = Papa.unparse(rows, { columns: [...EXPORT_COLUMNS] });
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}.csv"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
