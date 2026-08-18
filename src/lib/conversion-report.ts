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
  /** Social clicks — engagement, geen lead. Niet meegeteld in `total`. */
  social: number;
};

export type ConversionReport = {
  from: string;
  to: string;
  days: number;
  /** `total` = leads (bellen + WhatsApp + offerte + afspraak). Social staat er los van. */
  totals: {
    total: number;
    call: number;
    whatsapp: number;
    quote: number;
    schedule: number;
    social: number;
  };
  byDevice: ConversionBreakdownRow[];
  bySource: ConversionBreakdownRow[];
  byPage: ConversionBreakdownRow[];
  /** WhatsApp-only breakdown per CTA-locatie, zodat je ziet welke knoppen het meest converteren. */
  whatsappByLocation: { key: string; label: string; count: number }[];
  /** Gefilterde bot-/spamhits (niet meegeteld in de cijfers hierboven). */
  filteredBots: { total: number; byReason: { key: string; label: string; count: number }[] };
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

export const BOT_REASON_LABEL: Record<string, string> = {
  bot_user_agent: "Bekende crawler/bot",
  missing_user_agent: "Geen user-agent",
  short_user_agent: "Verdachte user-agent",
  missing_accept_language: "Geen taal-header (script)",
  headless_browser: "Headless browser",
  spam_referrer: "Referral-spam",
  spam_utm_source: "Spam UTM-bron",
  unknown: "Overig",
};

export const REPORT_RANGES = [7, 30, 90] as const;
export type ReportRange = (typeof REPORT_RANGES)[number];

export function share(part: number, total: number): string {
  if (!total) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}
