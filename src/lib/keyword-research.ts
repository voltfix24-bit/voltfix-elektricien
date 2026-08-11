/**
 * Keyword research: browser-veilige types en helpers.
 * Databron is de Semrush-connector (zie keyword-research.server.ts).
 */

export type CompetitionLevel = "laag" | "gemiddeld" | "hoog";
export type TrendDirection = "stijgend" | "stabiel" | "dalend";

export type KeywordResult = {
  keyword: string;
  /** Gemiddeld maandelijks zoekvolume. */
  volume: number;
  /** Kosten per klik in euro, of null als onbekend. */
  cpc: number | null;
  /** Competitie-index 0-1 (advertentiedichtheid). */
  competition: number | null;
  competitionLevel: CompetitionLevel;
  results: number | null;
  /** Laatste 12 maanden, genormaliseerd 0-1. */
  trend: number[];
  trendDirection: TrendDirection;
  /** Procentuele verandering tussen eerste en laatste helft van de trend. */
  trendChange: number | null;
};

export type KeywordReport = {
  database: string;
  fetchedAt: string;
  keywords: KeywordResult[];
  related: KeywordResult[];
  notFound: string[];
};

export const DATABASES = [
  { code: "nl", label: "Nederland" },
  { code: "be", label: "België" },
  { code: "de", label: "Duitsland" },
  { code: "uk", label: "Verenigd Koninkrijk" },
  { code: "us", label: "Verenigde Staten" },
] as const;

/** Steden voor lokale keyword-varianten. */
export const DUTCH_CITIES = [
  "amsterdam",
  "amstelveen",
  "haarlem",
  "utrecht",
  "rotterdam",
  "den haag",
  "almere",
  "zaandam",
  "hoofddorp",
  "diemen",
] as const;

export function competitionLevel(value: number | null): CompetitionLevel {
  if (value == null || value < 0.33) return "laag";
  if (value < 0.66) return "gemiddeld";
  return "hoog";
}

/** Vergelijkt het gemiddelde van de laatste 6 maanden met de 6 daarvoor. */
export function trendInfo(trend: number[]): {
  direction: TrendDirection;
  change: number | null;
} {
  if (trend.length < 4) return { direction: "stabiel", change: null };
  const half = Math.floor(trend.length / 2);
  // Semrush levert de trend van oud naar nieuw.
  const older = trend.slice(0, half);
  const newer = trend.slice(half);
  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
  const before = avg(older);
  const after = avg(newer);
  if (before === 0) return { direction: after > 0 ? "stijgend" : "stabiel", change: null };
  const change = ((after - before) / before) * 100;
  if (change > 10) return { direction: "stijgend", change };
  if (change < -10) return { direction: "dalend", change };
  return { direction: "stabiel", change };
}

export function formatCpc(cpc: number | null): string {
  return cpc == null || cpc === 0 ? "—" : `€ ${cpc.toFixed(2)}`;
}

export function formatVolume(volume: number): string {
  return volume.toLocaleString("nl-NL");
}

/** Zet een rapport om naar CSV met puntkomma's (Excel-NL vriendelijk). */
export function toCsv(report: KeywordReport): string {
  const header = [
    "Zoekwoord",
    "Type",
    "Zoekvolume per maand",
    "CPC (EUR)",
    "Competitie",
    "Competitieniveau",
    "Aantal resultaten",
    "Trend",
    "Trendverandering (%)",
  ];

  const escape = (v: string | number | null) => {
    const s = v == null ? "" : String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const line = (row: KeywordResult, type: string) =>
    [
      row.keyword,
      type,
      row.volume,
      row.cpc ?? "",
      row.competition ?? "",
      row.competitionLevel,
      row.results ?? "",
      row.trendDirection,
      row.trendChange == null ? "" : row.trendChange.toFixed(1),
    ]
      .map(escape)
      .join(";");

  return [
    header.join(";"),
    ...report.keywords.map((r) => line(r, "hoofdzoekwoord")),
    ...report.related.map((r) => line(r, "gerelateerd")),
  ].join("\n");
}
