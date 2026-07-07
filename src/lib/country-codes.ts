export const COUNTRY_CODES = [
  { code: "+91", country: "IN", label: "India (+91)" },
  { code: "+1", country: "US", label: "US/Canada (+1)" },
  { code: "+44", country: "GB", label: "UK (+44)" },
  { code: "+971", country: "AE", label: "UAE (+971)" },
  { code: "+966", country: "SA", label: "Saudi Arabia (+966)" },
  { code: "+974", country: "QA", label: "Qatar (+974)" },
  { code: "+968", country: "OM", label: "Oman (+968)" },
  { code: "+973", country: "BH", label: "Bahrain (+973)" },
  { code: "+65", country: "SG", label: "Singapore (+65)" },
  { code: "+60", country: "MY", label: "Malaysia (+60)" },
  { code: "+61", country: "AU", label: "Australia (+61)" },
  { code: "+92", country: "PK", label: "Pakistan (+92)" },
  { code: "+880", country: "BD", label: "Bangladesh (+880)" },
  { code: "+977", country: "NP", label: "Nepal (+977)" },
  { code: "+94", country: "LK", label: "Sri Lanka (+94)" },
  { code: "+27", country: "ZA", label: "South Africa (+27)" },
  { code: "+49", country: "DE", label: "Germany (+49)" },
  { code: "+33", country: "FR", label: "France (+33)" },
  { code: "+81", country: "JP", label: "Japan (+81)" },
  { code: "+86", country: "CN", label: "China (+86)" },
] as const;

export const COUNTRY_CODE_VALUES = COUNTRY_CODES.map((c) => c.code) as [string, ...string[]];

export const DEFAULT_COUNTRY_CODE = "+91";
