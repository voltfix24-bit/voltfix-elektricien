/**
 * Biedingsanalyse — gedeelde types en pure rekenregels.
 *
 * Geen netwerkcode: dit bestand draait zowel op de server als in de browser,
 * zodat de beoordeling en de opmaak op één plek staan en testbaar zijn.
 */

export const RANGE_DAYS = [7, 30, 90] as const;
export type RangeDays = (typeof RANGE_DAYS)[number];

export type MatchType = "EXACT" | "PHRASE" | "BROAD" | "ONBEKEND";

export type QualityLabel = "BOVENGEMIDDELD" | "GEMIDDELD" | "ONDERGEMIDDELD" | null;

export type Verdict =
  | "budget"
  | "kwaliteit"
  | "onvoldoende"
  | "te-laag"
  | "te-hoog"
  | "binnen-bereik";

export type VerdictTone = "rood" | "oranje" | "groen" | "grijs";

export type PlannerMetrics = {
  avgMonthlySearches: number | null;
  competition: "LOW" | "MEDIUM" | "HIGH" | null;
  competitionIndex: number | null;
  lowTopOfPageBid: number | null; // euro
  highTopOfPageBid: number | null; // euro
  fetchedAt: string | null;
};

export type KeywordRow = {
  criterionId: string;
  keyword: string;
  matchType: MatchType;
  campaignId: string;
  campaignName: string;
  adGroupId: string;
  adGroupName: string;
  status: string; // ENABLED | PAUSED
  maxCpc: number | null; // euro
  avgCpc: number | null; // euro
  impressions: number;
  clicks: number;
  ctr: number | null; // fractie
  cost: number; // euro
  conversions: number;
  conversionRate: number | null; // fractie
  costPerConversion: number | null; // euro
  qualityScore: number | null;
  expectedCtr: QualityLabel;
  adRelevance: QualityLabel;
  landingPageExperience: QualityLabel;
  searchImpressionShare: number | null;
  topImpressionShare: number | null;
  absoluteTopImpressionShare: number | null;
  lostRankShare: number | null;
  lostBudgetShare: number | null;
  planner: PlannerMetrics;
};

export type Assessment = {
  verdict: Verdict;
  label: string;
  tone: VerdictTone;
  explanation: string;
  action: string;
};

export type AnalysisAccount = { id: string; name: string };
export type AnalysisCampaign = { id: string; name: string; status: string };

export type BidAnalysis = {
  account: AnalysisAccount;
  accounts: AnalysisAccount[];
  campaigns: AnalysisCampaign[];
  rows: KeywordRow[];
  from: string;
  to: string;
  syncedAt: string;
  plannerAvailable: boolean;
  plannerNote: string | null;
  impressionShareAvailable: boolean;
  auctionInsightsAvailable: false;
  geoTarget: string | null;
};

/* ---------------- opmaak ---------------- */

export const NO_DATA = "Onvoldoende gegevens";

export function euro(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return NO_DATA;
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function percent(fraction: number | null | undefined, digits = 0): string {
  if (fraction == null || Number.isNaN(fraction)) return NO_DATA;
  return `${(fraction * 100).toFixed(digits).replace(".", ",")}%`;
}

export function number(value: number | null | undefined, digits = 0): string {
  if (value == null || Number.isNaN(value)) return NO_DATA;
  return new Intl.NumberFormat("nl-NL", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

/** Google levert bedragen in micros (miljoensten van de accountvaluta). */
export function microsToEuro(micros: string | number | null | undefined): number | null {
  if (micros == null || micros === "") return null;
  const value = typeof micros === "string" ? Number(micros) : micros;
  if (!Number.isFinite(value)) return null;
  return value / 1_000_000;
}

export const MATCH_LABEL: Record<MatchType, string> = {
  EXACT: "Exact",
  PHRASE: "Woordgroep",
  BROAD: "Breed",
  ONBEKEND: "Onbekend",
};

export const QUALITY_LABEL: Record<NonNullable<QualityLabel>, string> = {
  BOVENGEMIDDELD: "Bovengemiddeld",
  GEMIDDELD: "Gemiddeld",
  ONDERGEMIDDELD: "Ondergemiddeld",
};

export const COMPETITION_LABEL: Record<"LOW" | "MEDIUM" | "HIGH", string> = {
  LOW: "Laag",
  MEDIUM: "Gemiddeld",
  HIGH: "Hoog",
};

export function statusLabel(status: string): string {
  if (status === "ENABLED") return "Actief";
  if (status === "PAUSED") return "Gepauzeerd";
  return status;
}

/* ---------------- beoordeling ---------------- */

const MIN_IMPRESSIONS = 100;
const MIN_CLICKS = 10;
const RANK_LOSS_THRESHOLD = 0.2;
const BUDGET_LOSS_THRESHOLD = 0.2;

function weakQuality(row: KeywordRow): boolean {
  const lowScore = row.qualityScore != null && row.qualityScore <= 5;
  const belowAverage =
    row.expectedCtr === "ONDERGEMIDDELD" ||
    row.adRelevance === "ONDERGEMIDDELD" ||
    row.landingPageExperience === "ONDERGEMIDDELD";
  return lowScore || belowAverage;
}

function thinData(row: KeywordRow): boolean {
  return row.impressions < MIN_IMPRESSIONS || row.clicks < MIN_CLICKS;
}

function bidRangeText(row: KeywordRow): string {
  if (row.planner.lowTopOfPageBid == null || row.planner.highTopOfPageBid == null) {
    return "Voor dit zoekwoord is geen marktbandbreedte beschikbaar.";
  }
  return `De geschatte marktbandbreedte voor bovenaan de pagina is ${euro(row.planner.lowTopOfPageBid)} tot ${euro(row.planner.highTopOfPageBid)}.`;
}

/**
 * Eén beoordeling per zoekwoord. Volgorde is bewust: een budget- of
 * kwaliteitsprobleem los je niet op met een hoger bod, dus die gaan voor.
 */
export function assess(row: KeywordRow, targetCpa: number | null): Assessment {
  const bid = row.maxCpc;
  const low = row.planner.lowTopOfPageBid;
  const high = row.planner.highTopOfPageBid;
  const rankLoss = row.lostRankShare;
  const budgetLoss = row.lostBudgetShare;
  const aboveTarget =
    targetCpa != null && row.costPerConversion != null && row.costPerConversion > targetCpa;

  if (budgetLoss != null && budgetLoss >= BUDGET_LOSS_THRESHOLD) {
    return {
      verdict: "budget",
      label: "Budgetprobleem",
      tone: "oranje",
      explanation: `Je mist ${percent(budgetLoss)} van de mogelijke vertoningen doordat het campagnebudget op is. Een hoger CPC-bod lost dit waarschijnlijk niet op: je betaalt dan meer per klik binnen hetzelfde budget.`,
      action: "Bekijk eerst het campagnebudget of beperk de campagne tot de sterkste zoekwoorden.",
    };
  }

  if (weakQuality(row)) {
    const parts: string[] = [];
    if (row.qualityScore != null) parts.push(`Quality Score ${row.qualityScore}`);
    if (row.expectedCtr === "ONDERGEMIDDELD") parts.push("verwachte CTR ondergemiddeld");
    if (row.adRelevance === "ONDERGEMIDDELD") parts.push("advertentierelevantie ondergemiddeld");
    if (row.landingPageExperience === "ONDERGEMIDDELD")
      parts.push("landingspagina-ervaring ondergemiddeld");
    return {
      verdict: "kwaliteit",
      label: "Eerst kwaliteit verbeteren",
      tone: "rood",
      explanation: `De kwaliteitssignalen zijn zwak (${parts.join(", ")}). Bij lage kwaliteit betaal je meer voor dezelfde positie, dus een bodverhoging is hier niet het eerste antwoord.`,
      action:
        "Verbeter eerst de advertentietekst, de aansluiting op het zoekwoord en de landingspagina.",
    };
  }

  if (thinData(row)) {
    return {
      verdict: "onvoldoende",
      label: NO_DATA,
      tone: "grijs",
      explanation: `Met ${number(row.impressions)} vertoningen en ${number(row.clicks)} klikken in deze periode is er te weinig data voor een stellige biedingsconclusie (drempel: ${MIN_IMPRESSIONS} vertoningen en ${MIN_CLICKS} klikken).`,
      action: "Laat dit zoekwoord langer lopen voordat je het bod aanpast.",
    };
  }

  if (bid != null && low != null && bid < low && rankLoss != null && rankLoss >= RANK_LOSS_THRESHOLD) {
    return {
      verdict: "te-laag",
      label: "Waarschijnlijk te laag",
      tone: "rood",
      explanation: `Je bod van ${euro(bid)} ligt onder de geschatte marktbandbreedte van ${euro(low)} tot ${euro(high)}. Daarnaast verlies je ${percent(rankLoss)} van de mogelijke vertoningen door advertentierang.`,
      action: "Test een beperkte verhoging en controleer daarna opnieuw de kosten per conversie.",
    };
  }

  if (bid != null && high != null && bid > high) {
    return {
      verdict: "te-hoog",
      label: "Mogelijk te hoog",
      tone: aboveTarget ? "rood" : "oranje",
      explanation: aboveTarget
        ? `Je bod van ${euro(bid)} ligt boven de geschatte marktbandbreedte (tot ${euro(high)}) en de kosten per conversie (${euro(row.costPerConversion)}) liggen boven je doel-CPA van ${euro(targetCpa)}.`
        : `Je bod van ${euro(bid)} ligt boven de geschatte marktbandbreedte van ${euro(low)} tot ${euro(high)}.`,
      action: aboveTarget
        ? "Verlaag het bod stapsgewijs richting de bovenkant van de bandbreedte en volg het effect."
        : "Controleer of de extra positie de hogere klikprijs waard is.",
    };
  }

  if (bid != null && low != null && high != null && bid >= low && bid <= high) {
    return {
      verdict: "binnen-bereik",
      label: "Binnen marktbereik",
      tone: "groen",
      explanation: `Je bod van ${euro(bid)} ligt binnen de geschatte marktbandbreedte van ${euro(low)} tot ${euro(high)}${rankLoss != null ? ` en het verlies door advertentierang is ${percent(rankLoss)}` : ""}.`,
      action: "Geen bodwijziging nodig; blijf de kosten per conversie volgen.",
    };
  }

  return {
    verdict: "onvoldoende",
    label: NO_DATA,
    tone: "grijs",
    explanation: `${bidRangeText(row)} Zonder bandbreedte of zonder bod is een vergelijking met de markt niet te maken.`,
    action: "Beoordeel dit zoekwoord op de eigen cijfers (kosten per conversie en vertoningsaandeel).",
  };
}

/* ---------------- concurrentiedruk ---------------- */

export type PressureLabel = "Laag" | "Gemiddeld" | "Hoog" | typeof NO_DATA;

/**
 * Inschatting van de concurrentiedruk. Dit is nadrukkelijk een inschatting:
 * Google publiceert de biedingen van concurrenten niet.
 */
export function competitionPressure(row: KeywordRow): PressureLabel {
  const signals: number[] = [];
  if (row.planner.competitionIndex != null) signals.push(row.planner.competitionIndex / 100);
  if (row.lostRankShare != null) signals.push(row.lostRankShare);
  if (row.searchImpressionShare != null) signals.push(1 - row.searchImpressionShare);
  if (signals.length === 0) return NO_DATA;
  const score = signals.reduce((sum, value) => sum + value, 0) / signals.length;
  if (score >= 0.6) return "Hoog";
  if (score >= 0.35) return "Gemiddeld";
  return "Laag";
}

/* ---------------- samenvatting ---------------- */

export type Summary = {
  tooLow: number;
  quality: number;
  budget: number;
  wasteAboveTarget: number; // euro
};

export function summarize(
  rows: KeywordRow[],
  targetCpa: number | null,
): Summary {
  let tooLow = 0;
  let quality = 0;
  let budget = 0;
  let waste = 0;

  for (const row of rows) {
    const { verdict } = assess(row, targetCpa);
    if (verdict === "te-laag") tooLow += 1;
    if (verdict === "kwaliteit") quality += 1;
    if (verdict === "budget") budget += 1;
    if (targetCpa != null && row.conversions > 0 && row.costPerConversion != null) {
      const over = (row.costPerConversion - targetCpa) * row.conversions;
      if (over > 0) waste += over;
    }
    // Kosten zonder enige conversie tellen volledig mee zodra er een doel-CPA is.
    if (targetCpa != null && row.conversions === 0) waste += row.cost;
  }

  return { tooLow, quality, budget, wasteAboveTarget: waste };
}

/* ---------------- filters en sortering ---------------- */

export type SortKey =
  | "cost"
  | "conversions"
  | "costPerConversion"
  | "lostRankShare"
  | "competitionIndex";

export type Filters = {
  onlyActive: boolean;
  onlyRankLoss: boolean;
  onlyAboveTarget: boolean;
  onlyLowQuality: boolean;
  campaignId: string; // "alle" of id
  adGroupId: string; // "alle" of id
  matchType: string; // "alle" of MatchType
  verdict: string; // "alle" of Verdict
};

export const EMPTY_FILTERS: Filters = {
  onlyActive: false,
  onlyRankLoss: false,
  onlyAboveTarget: false,
  onlyLowQuality: false,
  campaignId: "alle",
  adGroupId: "alle",
  matchType: "alle",
  verdict: "alle",
};

export function applyFilters(
  rows: KeywordRow[],
  filters: Filters,
  targetCpa: number | null,
): KeywordRow[] {
  return rows.filter((row) => {
    if (filters.onlyActive && row.status !== "ENABLED") return false;
    if (filters.onlyRankLoss && !(row.lostRankShare != null && row.lostRankShare >= RANK_LOSS_THRESHOLD))
      return false;
    if (filters.onlyAboveTarget) {
      if (targetCpa == null || row.costPerConversion == null || row.costPerConversion <= targetCpa)
        return false;
    }
    if (filters.onlyLowQuality && !weakQuality(row)) return false;
    if (filters.campaignId !== "alle" && row.campaignId !== filters.campaignId) return false;
    if (filters.adGroupId !== "alle" && row.adGroupId !== filters.adGroupId) return false;
    if (filters.matchType !== "alle" && row.matchType !== filters.matchType) return false;
    if (filters.verdict !== "alle" && assess(row, targetCpa).verdict !== filters.verdict) return false;
    return true;
  });
}

export function sortRows(rows: KeywordRow[], key: SortKey): KeywordRow[] {
  const value = (row: KeywordRow): number => {
    switch (key) {
      case "cost":
        return row.cost;
      case "conversions":
        return row.conversions;
      case "costPerConversion":
        return row.costPerConversion ?? -1;
      case "lostRankShare":
        return row.lostRankShare ?? -1;
      case "competitionIndex":
        return row.planner.competitionIndex ?? -1;
    }
  };
  return [...rows].sort((a, b) => value(b) - value(a));
}

export const SORT_LABEL: Record<SortKey, string> = {
  cost: "Kosten",
  conversions: "Conversies",
  costPerConversion: "Kosten per conversie",
  lostRankShare: "Verlies door advertentierang",
  competitionIndex: "Concurrentie-index",
};

export const VERDICT_LABEL: Record<Verdict, string> = {
  budget: "Budgetprobleem",
  kwaliteit: "Eerst kwaliteit verbeteren",
  onvoldoende: NO_DATA,
  "te-laag": "Waarschijnlijk te laag",
  "te-hoog": "Mogelijk te hoog",
  "binnen-bereik": "Binnen marktbereik",
};

export const TONE_CLASS: Record<VerdictTone, string> = {
  rood: "border-red-300 bg-red-50 text-red-800",
  oranje: "border-amber-300 bg-amber-50 text-amber-900",
  groen: "border-green-300 bg-green-50 text-green-800",
  grijs: "border-slate-300 bg-slate-100 text-slate-700",
};
