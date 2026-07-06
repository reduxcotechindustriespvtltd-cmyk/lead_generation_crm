import type { MetaLeadFieldData } from "@/lib/meta/graph-client";

const FIELD_ALIASES: Record<string, string[]> = {
  fullName: ["full_name", "name"],
  firstName: ["first_name"],
  lastName: ["last_name"],
  email: ["email"],
  phone: ["phone_number", "phone"],
  city: ["city"],
  state: ["state", "province"],
};

function findValue(fields: MetaLeadFieldData[], aliases: string[]): string | undefined {
  for (const alias of aliases) {
    const match = fields.find((f) => f.name.toLowerCase() === alias);
    if (match?.values?.[0]) return match.values[0];
  }
  return undefined;
}

export type MappedLeadFields = {
  fullName: string;
  phone: string;
  email?: string;
  city?: string;
  state?: string;
};

/** Meta lead forms have configurable questions — field names vary per form, so we match common aliases. */
export function mapLeadFields(fieldData: MetaLeadFieldData[]): MappedLeadFields {
  const fullNameDirect = findValue(fieldData, FIELD_ALIASES.fullName);
  const firstName = findValue(fieldData, FIELD_ALIASES.firstName);
  const lastName = findValue(fieldData, FIELD_ALIASES.lastName);
  const fullName = fullNameDirect || [firstName, lastName].filter(Boolean).join(" ") || "Unknown";

  return {
    fullName,
    phone: findValue(fieldData, FIELD_ALIASES.phone) ?? "",
    email: findValue(fieldData, FIELD_ALIASES.email),
    city: findValue(fieldData, FIELD_ALIASES.city),
    state: findValue(fieldData, FIELD_ALIASES.state),
  };
}
