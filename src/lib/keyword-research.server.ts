/**
 * Server-only laag voor de keyword research tool.
 * Haalt zoekvolume, CPC, competitie en trends op via de Semrush-connector.
 */

import {
  competitionLevel,
  trendInfo,
  type KeywordReport,
  type KeywordResult,
} from "./keyword-research";

const GATEWAY = "https://connector-gateway.lovable.dev/semrush";

type SemrushResponse = {
  data?: { columnNames: string[]; rows: string[][] };
  error?: string;
  status?: number;
};

async function semrush(
  resource: string,
  params: Record<string, string>,
): Promise<{ columnNames: string[]; rows: string[][] }> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const connectionKey = process.env["SEMRUSH_API_KEY"];
  if (!lovableKey || !connectionKey) {
    throw new Error("De Semrush-koppeling is niet actief voor dit project.");
  }

  const url = `${GATEWAY}${resource}?${new URLSearchParams(params).toString()}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": connectionKey,
      "Allow-Limit-Offset": "true",
    },
  });

  const text = await res.text();
  if (!res.ok) {
    console.error(`Semrush-verzoek mislukt [${res.status}]: ${text}`);
    if (text.includes("LIMIT EXCEEDED")) {
      throw new Error(
        "Het Semrush-datalimiet is bereikt. Wacht tot de limiet reset of upgrade het Semrush-abonnement.",
      );
    }
    if (res.status === 404 || text.includes("NOTHING FOUND")) {
      return { columnNames: [], rows: [] };
    }
    throw new Error(`Semrush-verzoek mislukt [${res.status}]: ${text.slice(0, 200)}`);
  }

  const json = JSON.parse(text) as SemrushResponse;
  if (json.error) {
    if (json.error.includes("LIMIT EXCEEDED")) {
      throw new Error(
        "Het Semrush-datalimiet is bereikt. Wacht tot de limiet reset of upgrade het Semrush-abonnement.",
      );
    }
    if (json.error.includes("NOTHING FOUND")) return { columnNames: [], rows: [] };
    throw new Error(`Semrush: ${json.error}`);
  }

  return { columnNames: json.data?.columnNames ?? [], rows: json.data?.rows ?? [] };
}

function num(value: string | undefined): number | null {
  if (value == null || value === "") return null;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function toResult(columnNames: string[], row: string[]): KeywordResult | null {
  const at = (name: string) => {
    const i = columnNames.indexOf(name);
    return i === -1 ? undefined : row[i];
  };

  const keyword = at("Keyword")?.trim();
  if (!keyword) return null;

  const competition = num(at("Competition"));
  const trend = (at("Trends") ?? "")
    .split(",")
    .map((v) => Number(v))
    .filter((v) => Number.isFinite(v));
  const { direction, change } = trendInfo(trend);

  return {
    keyword,
    volume: num(at("Search Volume")) ?? 0,
    cpc: num(at("CPC")),
    competition,
    competitionLevel: competitionLevel(competition),
    results: num(at("Number of Results")),
    trend,
    trendDirection: direction,
    trendChange: change,
  };
}

const COLUMNS = "Ph,Nq,Cp,Co,Nr,Td";

/**
 * Onderzoekt één of meerdere zoekwoorden en haalt gerelateerde termen op
 * voor het eerste zoekwoord.
 */
export async function researchKeywords(input: {
  keywords: string[];
  database: string;
  relatedLimit: number;
}): Promise<KeywordReport> {
  const cleaned = [
    ...new Set(
      input.keywords
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 25),
    ),
  ];

  if (cleaned.length === 0) {
    throw new Error("Voer minimaal één zoekwoord in.");
  }

  const main = await semrush("/keywords/phrase_these", {
    phrase: cleaned.join(";"),
    database: input.database,
    export_columns: COLUMNS,
  });

  const keywords = main.rows
    .map((row) => toResult(main.columnNames, row))
    .filter((r): r is KeywordResult => r !== null)
    .sort((a, b) => b.volume - a.volume);

  const found = new Set(keywords.map((k) => k.keyword));
  const notFound = cleaned.filter((k) => !found.has(k));

  let related: KeywordResult[] = [];
  if (input.relatedLimit > 0 && cleaned[0]) {
    const rel = await semrush("/keywords/phrase_related", {
      phrase: cleaned[0],
      database: input.database,
      export_columns: COLUMNS,
      display_limit: String(input.relatedLimit),
    });
    related = rel.rows
      .map((row) => toResult(rel.columnNames, row))
      .filter((r): r is KeywordResult => r !== null)
      .filter((r) => !found.has(r.keyword))
      .sort((a, b) => b.volume - a.volume);
  }

  return {
    database: input.database,
    fetchedAt: new Date().toISOString(),
    keywords,
    related,
    notFound,
  };
}
