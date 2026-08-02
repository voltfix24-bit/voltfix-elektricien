/**
 * Rangtracking: welke zoekwoorden we wekelijks volgen in Google Search Console.
 *
 * Dit bestand is browser-veilig (geen server-only imports) zodat zowel de
 * cron-route, de server functions als de UI dezelfde lijst gebruiken.
 */

export type TrackedKeyword = {
  keyword: string;
  /** Groep voor de weergave in het dashboard. */
  cluster: "Groepenkast" | "Perilex" | "Elektricien" | "Spoed" | "Laadpaal" | "Expat (EN)";
};

export const TRACKED_KEYWORDS: TrackedKeyword[] = [
  // Groepenkast — hoofdfocus
  { keyword: "groepenkast vervangen amsterdam", cluster: "Groepenkast" },
  { keyword: "groepenkast amsterdam", cluster: "Groepenkast" },
  { keyword: "groepenkast vervangen", cluster: "Groepenkast" },
  { keyword: "groepenkast vervangen kosten", cluster: "Groepenkast" },
  { keyword: "groepenkast uitbreiden", cluster: "Groepenkast" },
  { keyword: "meterkast vervangen amsterdam", cluster: "Groepenkast" },
  { keyword: "groepenkast vervangen bedrijfspand", cluster: "Groepenkast" },
  { keyword: "groepenkast hoofdschakelaar", cluster: "Groepenkast" },

  // Perilex
  { keyword: "perilex aansluiten amsterdam", cluster: "Perilex" },
  { keyword: "perilex amsterdam", cluster: "Perilex" },
  { keyword: "perilex stekker", cluster: "Perilex" },
  { keyword: "perilex aansluiten", cluster: "Perilex" },

  // Elektricien algemeen
  { keyword: "elektricien amsterdam", cluster: "Elektricien" },
  { keyword: "elektricien amsterdam zuid", cluster: "Elektricien" },
  { keyword: "elektricien amsterdam west", cluster: "Elektricien" },
  { keyword: "elektricien amstelveen", cluster: "Elektricien" },

  // Spoed
  { keyword: "spoed elektricien amsterdam", cluster: "Spoed" },
  { keyword: "storingsdienst elektra amsterdam", cluster: "Spoed" },
  { keyword: "stroomstoring amsterdam", cluster: "Spoed" },

  // Laadpaal
  { keyword: "laadpaal installateur amsterdam", cluster: "Laadpaal" },
  { keyword: "laadpaal amsterdam", cluster: "Laadpaal" },

  // Expat / Engels
  { keyword: "electrician amsterdam", cluster: "Expat (EN)" },
  { keyword: "emergency electrician", cluster: "Expat (EN)" },
  { keyword: "emergency electrician near me", cluster: "Expat (EN)" },
  { keyword: "fuse box replacement amsterdam", cluster: "Expat (EN)" },
];

export const TRACKED_CLUSTERS = [
  "Groepenkast",
  "Perilex",
  "Elektricien",
  "Spoed",
  "Laadpaal",
  "Expat (EN)",
] as const;

export type RankRow = {
  keyword: string;
  cluster: string;
  /** Gemiddelde positie deze week, of null als er geen vertoningen waren. */
  position: number | null;
  clicks: number;
  impressions: number;
  ctr: number;
  topPage: string | null;
  /** Positie van de vorige meetweek, of null. */
  previousPosition: number | null;
  /** Positief = gestegen (lager positienummer). Null als er geen vergelijking is. */
  delta: number | null;
};

export type RankReport = {
  weekStart: string;
  previousWeekStart: string | null;
  rows: RankRow[];
  summary: { improved: number; declined: number; stable: number; unranked: number };
};

/** Formatteert een Date als YYYY-MM-DD (UTC). */
export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Search Console loopt ~3 dagen achter. We meten daarom steeds het venster van
 * 7 volledige dagen dat 3 dagen geleden eindigde.
 */
export function measurementWindow(reference = new Date()): {
  startDate: string;
  endDate: string;
} {
  const end = new Date(reference);
  end.setUTCDate(end.getUTCDate() - 3);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 6);
  return { startDate: isoDate(start), endDate: isoDate(end) };
}

/** Leesbare weergave van een positieverschil. */
export function formatDelta(delta: number | null): string {
  if (delta === null) return "—";
  if (delta === 0) return "0";
  return delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1);
}
