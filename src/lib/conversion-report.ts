/**
 * Gedeelde types + labels voor het conversiedashboard.
 * Client-veilig: geen server-imports.
 */

export type ConversionBreakdownRow = {
  key: string;
  label: string;
  total: number;
  call: number;
  whatsapp: number;
  quote: number;
  schedule: number;
};

export type ConversionReport = {
  from: string;
  to: string;
  days: number;
  totals: { total: number; call: number; whatsapp: number; quote: number; schedule: number };
  byDevice: ConversionBreakdownRow[];
  bySource: ConversionBreakdownRow[];
  byPage: ConversionBreakdownRow[];
};

export const DEVICE_LABEL: Record<string, string> = {
  mobile: "Mobiel",
  tablet: "Tablet",
  desktop: "Desktop",
  unknown: "Onbekend",
};

export const SOURCE_LABEL: Record<string, string> = {
  direct: "Direct / opgeslagen",
  "google-organic": "Google organisch",
  "google-ads": "Google Ads",
  "google-maps": "Google Maps / GBP",
  bing: "Bing / overige zoek",
  social: "Social media",
  referral: "Verwijzende site",
  internal: "Interne link",
  campaign: "Campagne (UTM)",
  unknown: "Onbekend",
};

export const CONVERSION_LABEL: Record<string, string> = {
  call: "Bellen",
  whatsapp: "WhatsApp",
  quote: "Offerte",
  schedule: "Afspraak",
  social: "Social",
};

export const REPORT_RANGES = [7, 30, 90] as const;
export type ReportRange = (typeof REPORT_RANGES)[number];

export function share(part: number, total: number): string {
  if (!total) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}
