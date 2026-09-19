/**
 * Server-only laag voor de Biedingsanalyse.
 *
 * Alles wat met Google Ads praat staat hier: de koppelingssleutels blijven
 * op de server en komen nooit in de browser. De pagina krijgt alleen kant-en-klare
 * rijen terug.
 */

import {
  microsToEuro,
  type AnalysisAccount,
  type AnalysisCampaign,
  type BidAnalysis,
  type KeywordRow,
  type MatchType,
  type PlannerMetrics,
  type QualityLabel,
} from "./bid-analysis";

const GATEWAY = "https://connector-gateway.lovable.dev/google_ads";
const API_VERSION = "v25";

/** Zolang de cache vers is halen we Keyword Planner niet opnieuw op. */
const CACHE_MAX_AGE_HOURS = 24 * 7;

type GatewayInit = { method: "GET" | "POST"; body?: unknown; step: string };

function credentials(): { lovableKey: string; connectionKey: string; customerId: string } {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const connectionKey = process.env["GOOGLE_ADS_API_KEY"];
  // Klantnummers worden altijd zonder streepjes of spaties verstuurd.
  const customerId = (process.env["GOOGLE_ADS_CUSTOMER_ID"] ?? "").replace(/\D/g, "");
  if (!lovableKey || !connectionKey || !customerId) {
    throw new Error(
      "De Google Ads-koppeling is niet actief voor dit project. Koppel het advertentieaccount opnieuw.",
    );
  }
  return { lovableKey, connectionKey, customerId };
}

/** Haalt de bruikbare details uit een Google Ads-foutantwoord; nooit sleutels of headers. */
function describeGoogleError(step: string, status: number, body: string): string {
  let parsed: any = null;
  try {
    parsed = JSON.parse(body);
  } catch {
    /* geen JSON-antwoord */
  }
  const error = parsed?.error;
  const failure = (error?.details ?? []).find((detail: any) => Array.isArray(detail?.errors));
  const first = failure?.errors?.[0];
  const requestId: string | undefined = failure?.requestId ?? error?.requestId;

  let code: string | null = null;
  if (first?.errorCode && typeof first.errorCode === "object") {
    const [group, value] = Object.entries(first.errorCode)[0] ?? [];
    if (group && value) code = `${String(group)}.${String(value)}`;
  }
  const field = first?.location?.fieldPathElements?.map((el: any) => el?.fieldName).filter(Boolean).join(".");

  const parts = [`${step} mislukt`];
  if (code) parts.push(code);
  if (first?.message) parts.push(String(first.message));
  else if (error?.message) parts.push(String(error.message));
  if (field) parts.push(`bij ${field}`);
  parts.push(`HTTP ${status}`);
  if (requestId) parts.push(`Request-ID: ${requestId}`);
  return parts.join(" — ");
}

async function gateway<T>(path: string, init: GatewayInit): Promise<T> {
  const { lovableKey, connectionKey } = credentials();
  const res = await fetch(`${GATEWAY}/${API_VERSION}${path}`, {
    method: init.method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": connectionKey,
    },
    ...(init.body ? { body: JSON.stringify(init.body) } : {}),
  });

  const text = await res.text();
  if (!res.ok) {
    const detail = describeGoogleError(init.step, res.status, text);
    // Alleen de Google-foutinhoud loggen; sleutels en headers blijven buiten de log.
    console.error(`Google Ads: ${detail}`);
    if (res.status === 401 || text.includes("UNAUTHENTICATED")) {
      throw new Error(`${detail}. De toegang tot Google Ads is verlopen; koppel het account opnieuw.`);
    }
    if (res.status === 403 || text.includes("PERMISSION_DENIED")) {
      throw new Error(`${detail}. Dit account is niet toegankelijk met de huidige koppeling.`);
    }
    if (res.status === 429 || text.includes("RESOURCE_EXHAUSTED")) {
      throw new Error(`${detail}. Probeer het over enkele minuten opnieuw.`);
    }
    throw new Error(detail);
  }
  return (text ? JSON.parse(text) : {}) as T;
}

type SearchResponse<T> = { results?: T[]; nextPageToken?: string };

/**
 * Google weigert een eigen pageSize op googleAds:search
 * (requestError.PAGE_SIZE_NOT_SUPPORTED); we pagineren alleen met pageToken.
 */
async function search<T>(customerId: string, query: string, step: string): Promise<T[]> {
  const rows: T[] = [];
  let pageToken: string | undefined;
  do {
    const page = await gateway<SearchResponse<T>>(
      `/customers/${customerId.replace(/\D/g, "")}/googleAds:search`,
      { method: "POST", step, body: { query, ...(pageToken ? { pageToken } : {}) } },
    );
    rows.push(...(page.results ?? []));
    pageToken = page.nextPageToken;
  } while (pageToken);
  return rows;
}

/* ---------------- accounts en campagnes ---------------- */

async function listAccounts(defaultId: string): Promise<AnalysisAccount[]> {
  const accounts: AnalysisAccount[] = [];
  try {
    const self = await search<{ customer?: { id?: string; descriptiveName?: string } }>(
      defaultId,
      "SELECT customer.id, customer.descriptive_name, customer.currency_code, customer.time_zone FROM customer LIMIT 1",
      "Google Ads-account controleren",
    );
    const name = self[0]?.customer?.descriptiveName;
    accounts.push({ id: defaultId, name: name || `Account ${defaultId}` });
  } catch {
    accounts.push({ id: defaultId, name: `Account ${defaultId}` });
  }

  try {
    const clients = await search<{
      customerClient?: { id?: string; descriptiveName?: string; manager?: boolean };
    }>(
      defaultId,
      "SELECT customer_client.id, customer_client.descriptive_name, customer_client.manager FROM customer_client WHERE customer_client.status = 'ENABLED'",
      "Klantaccounts ophalen",
    );
    for (const row of clients) {
      const id = row.customerClient?.id;
      if (!id || id === defaultId || row.customerClient?.manager) continue;
      accounts.push({ id, name: row.customerClient?.descriptiveName || `Account ${id}` });
    }
  } catch {
    // Onder-accounts zijn optioneel; het gekoppelde account blijft altijd beschikbaar.
  }
  return accounts;
}

async function listCampaigns(customerId: string): Promise<AnalysisCampaign[]> {
  const rows = await search<{ campaign?: { id?: string; name?: string; status?: string } }>(
    customerId,
    "SELECT campaign.id, campaign.name, campaign.status FROM campaign WHERE campaign.status != 'REMOVED' AND campaign.advertising_channel_type = 'SEARCH' ORDER BY campaign.name",
    "Campagnes ophalen",
  );
  return rows
    .filter((row) => row.campaign?.id)
    .map((row) => ({
      id: row.campaign!.id!,
      name: row.campaign!.name ?? `Campagne ${row.campaign!.id}`,
      status: row.campaign!.status ?? "ONBEKEND",
    }));
}

/* ---------------- prestaties per zoekwoord ---------------- */

type KeywordViewRow = {
  campaign?: { id?: string; name?: string };
  adGroup?: { id?: string; name?: string };
  adGroupCriterion?: {
    criterionId?: string;
    status?: string;
    cpcBidMicros?: string;
    effectiveCpcBidMicros?: string;
    keyword?: { text?: string; matchType?: string };
    qualityInfo?: {
      qualityScore?: number;
      creativeQualityScore?: string;
      postClickQualityScore?: string;
      searchPredictedCtr?: string;
    };
  };
  metrics?: Record<string, string | number>;
};

const PERFORMANCE_FIELDS = [
  "campaign.id",
  "campaign.name",
  "ad_group.id",
  "ad_group.name",
  "ad_group_criterion.criterion_id",
  "ad_group_criterion.status",
  "ad_group_criterion.cpc_bid_micros",
  "ad_group_criterion.effective_cpc_bid_micros",
  "ad_group_criterion.keyword.text",
  "ad_group_criterion.keyword.match_type",
  "ad_group_criterion.quality_info.quality_score",
  "ad_group_criterion.quality_info.creative_quality_score",
  "ad_group_criterion.quality_info.post_click_quality_score",
  "ad_group_criterion.quality_info.search_predicted_ctr",
  "metrics.impressions",
  "metrics.clicks",
  "metrics.ctr",
  "metrics.cost_micros",
  "metrics.average_cpc",
  "metrics.conversions",
  "metrics.cost_per_conversion",
];

// Let op: search_budget_lost_impression_share bestaat niet op keyword_view
// (queryError.PROHIBITED_METRIC_IN_SELECT_OR_WHERE_CLAUSE). Dat cijfer halen we
// apart op campagneniveau op en koppelen we op campagne-ID.
const IMPRESSION_SHARE_FIELDS = [
  "metrics.search_impression_share",
  "metrics.search_top_impression_share",
  "metrics.search_absolute_top_impression_share",
  "metrics.search_rank_lost_impression_share",
];

function num(value: string | number | undefined | null): number | null {
  if (value == null || value === "") return null;
  const parsed = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(parsed) ? parsed : null;
}

function qualityLabel(value: string | undefined): QualityLabel {
  switch (value) {
    case "ABOVE_AVERAGE":
      return "BOVENGEMIDDELD";
    case "AVERAGE":
      return "GEMIDDELD";
    case "BELOW_AVERAGE":
      return "ONDERGEMIDDELD";
    default:
      return null;
  }
}

function matchType(value: string | undefined): MatchType {
  if (value === "EXACT" || value === "PHRASE" || value === "BROAD") return value;
  return "ONBEKEND";
}

function emptyPlanner(): PlannerMetrics {
  return {
    avgMonthlySearches: null,
    competition: null,
    competitionIndex: null,
    lowTopOfPageBid: null,
    highTopOfPageBid: null,
    fetchedAt: null,
  };
}

function toKeywordRow(row: KeywordViewRow, withShare: boolean): KeywordRow | null {
  const criterion = row.adGroupCriterion;
  const keyword = criterion?.keyword?.text;
  if (!keyword || !criterion?.criterionId) return null;

  const metrics = row.metrics ?? {};
  const impressions = num(metrics["impressions"]) ?? 0;
  const clicks = num(metrics["clicks"]) ?? 0;
  const conversions = num(metrics["conversions"]) ?? 0;

  return {
    criterionId: criterion.criterionId,
    keyword,
    matchType: matchType(criterion.keyword?.matchType),
    campaignId: row.campaign?.id ?? "",
    campaignName: row.campaign?.name ?? "",
    adGroupId: row.adGroup?.id ?? "",
    adGroupName: row.adGroup?.name ?? "",
    status: criterion.status ?? "ONBEKEND",
    maxCpc: microsToEuro(criterion.cpcBidMicros ?? criterion.effectiveCpcBidMicros ?? null),
    avgCpc: microsToEuro(metrics["averageCpc"] as string | undefined),
    impressions,
    clicks,
    ctr: num(metrics["ctr"]),
    cost: microsToEuro(metrics["costMicros"] as string | undefined) ?? 0,
    conversions,
    conversionRate: clicks > 0 ? conversions / clicks : null,
    costPerConversion:
      conversions > 0 ? microsToEuro(metrics["costPerConversion"] as string | undefined) : null,
    qualityScore: num(criterion.qualityInfo?.qualityScore),
    expectedCtr: qualityLabel(criterion.qualityInfo?.searchPredictedCtr),
    adRelevance: qualityLabel(criterion.qualityInfo?.creativeQualityScore),
    landingPageExperience: qualityLabel(criterion.qualityInfo?.postClickQualityScore),
    searchImpressionShare: withShare ? num(metrics["searchImpressionShare"]) : null,
    topImpressionShare: withShare ? num(metrics["searchTopImpressionShare"]) : null,
    absoluteTopImpressionShare: withShare ? num(metrics["searchAbsoluteTopImpressionShare"]) : null,
    lostRankShare: withShare ? num(metrics["searchRankLostImpressionShare"]) : null,
    lostBudgetShare: withShare ? num(metrics["searchBudgetLostImpressionShare"]) : null,
    planner: emptyPlanner(),
  };
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function windowDates(days: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to.getTime() - (days - 1) * 86_400_000);
  return { from: isoDate(from), to: isoDate(to) };
}

/** Budgetverlies bestaat alleen op campagneniveau; per campagne-ID opgehaald. */
async function fetchCampaignBudgetLoss(
  customerId: string,
  from: string,
  to: string,
  campaignId: string | null,
): Promise<Map<string, number | null>> {
  const map = new Map<string, number | null>();
  const where = [
    `segments.date BETWEEN '${from}' AND '${to}'`,
    "campaign.status != 'REMOVED'",
    ...(campaignId ? [`campaign.id = ${campaignId}`] : []),
  ].join(" AND ");
  try {
    const rows = await search<{
      campaign?: { id?: string };
      metrics?: Record<string, string | number>;
    }>(
      customerId,
      `SELECT campaign.id, metrics.search_budget_lost_impression_share FROM campaign WHERE ${where}`,
      "Budgetverlies per campagne ophalen",
    );
    for (const row of rows) {
      const id = row.campaign?.id;
      if (id) map.set(id, num(row.metrics?.["searchBudgetLostImpressionShare"]));
    }
  } catch (error) {
    console.error("Budgetverlies niet beschikbaar:", error);
  }
  return map;
}

async function fetchKeywordPerformance(
  customerId: string,
  days: number,
  campaignId: string | null,
): Promise<{ rows: KeywordRow[]; from: string; to: string; impressionShareAvailable: boolean }> {
  const { from, to } = windowDates(days);
  const where = [
    `segments.date BETWEEN '${from}' AND '${to}'`,
    "ad_group_criterion.status != 'REMOVED'",
    "campaign.status != 'REMOVED'",
    ...(campaignId ? [`campaign.id = ${campaignId}`] : []),
  ].join(" AND ");

  const build = (fields: string[]) =>
    `SELECT ${fields.join(", ")} FROM keyword_view WHERE ${where}`;

  // Vertoningsaandeel is niet op elk account beschikbaar. Lukt de ruime query
  // niet, dan vallen we terug op de kerncijfers in plaats van niets.
  let rows: KeywordRow[];
  let impressionShareAvailable = true;
  try {
    const raw = await search<KeywordViewRow>(
      customerId,
      build([...PERFORMANCE_FIELDS, ...IMPRESSION_SHARE_FIELDS]),
      "Zoekwoorden ophalen",
    );
    rows = raw.map((row) => toKeywordRow(row, true)).filter((row): row is KeywordRow => row !== null);
  } catch (error) {
    console.error("Vertoningsaandeel niet beschikbaar, val terug op kerncijfers:", error);
    impressionShareAvailable = false;
    const raw = await search<KeywordViewRow>(
      customerId,
      build(PERFORMANCE_FIELDS),
      "Zoekwoorden ophalen (kerncijfers)",
    );
    rows = raw.map((row) => toKeywordRow(row, false)).filter((row): row is KeywordRow => row !== null);
  }

  const budgetLoss = await fetchCampaignBudgetLoss(customerId, from, to, campaignId);
  for (const row of rows) {
    row.lostBudgetShare = budgetLoss.get(row.campaignId) ?? null;
  }

  return { rows, from, to, impressionShareAvailable };
}

/* ---------------- Keyword Planner ---------------- */

/** Zoek de echte geo target constant voor Amsterdam op; nooit een ID verzinnen. */
async function amsterdamGeoTarget(customerId: string): Promise<{ resource: string; name: string } | null> {
  try {
    const rows = await search<{
      geoTargetConstant?: { resourceName?: string; canonicalName?: string; id?: string };
    }>(
      customerId,
      "SELECT geo_target_constant.id, geo_target_constant.canonical_name, geo_target_constant.resource_name FROM geo_target_constant WHERE geo_target_constant.name = 'Amsterdam' AND geo_target_constant.country_code = 'NL' AND geo_target_constant.target_type = 'City' AND geo_target_constant.status = 'ENABLED'",
      "Gebied Amsterdam opzoeken",
    );
    const hit = rows[0]?.geoTargetConstant;
    if (hit?.resourceName) {
      return { resource: hit.resourceName, name: hit.canonicalName ?? "Amsterdam, Noord-Holland, Nederland" };
    }
  } catch (error) {
    console.error("Geo target opzoeken mislukt:", error);
  }

  // Tweede weg: de suggestie-endpoint van Google zelf.
  try {
    const suggested = await gateway<{
      geoTargetConstantSuggestions?: Array<{
        geoTargetConstant?: { resourceName?: string; canonicalName?: string; targetType?: string; countryCode?: string };
      }>;
    }>("/geoTargetConstants:suggest", {
      method: "POST",
      step: "Gebied Amsterdam voorstellen",
      body: { locale: "nl", countryCode: "NL", locationNames: { names: ["Amsterdam"] } },
    });
    const match = suggested.geoTargetConstantSuggestions?.find(
      (item) => item.geoTargetConstant?.targetType === "City",
    )?.geoTargetConstant;
    if (match?.resourceName) {
      return { resource: match.resourceName, name: match.canonicalName ?? "Amsterdam" };
    }
  } catch (error) {
    console.error("Geo target suggestie mislukt:", error);
  }
  return null;
}

async function dutchLanguage(customerId: string): Promise<string | null> {
  try {
    const rows = await search<{ languageConstant?: { resourceName?: string } }>(
      customerId,
      "SELECT language_constant.id, language_constant.code, language_constant.resource_name FROM language_constant WHERE language_constant.code = 'nl'",
      "Taal Nederlands opzoeken",
    );
    return rows[0]?.languageConstant?.resourceName ?? null;
  } catch (error) {
    console.error("Taalconstante opzoeken mislukt:", error);
    return null;
  }
}

type HistoricalResult = {
  results?: Array<{
    text?: string;
    keywordMetrics?: {
      avgMonthlySearches?: string;
      competition?: string;
      competitionIndex?: string;
      lowTopOfPageBidMicros?: string;
      highTopOfPageBidMicros?: string;
    };
  }>;
};

type CacheRow = {
  keyword: string;
  avg_monthly_searches: number | null;
  competition: string | null;
  competition_index: number | null;
  low_top_of_page_bid_micros: number | null;
  high_top_of_page_bid_micros: number | null;
  fetched_at: string;
};

function cacheToPlanner(row: CacheRow): PlannerMetrics {
  const competition = row.competition;
  return {
    avgMonthlySearches: row.avg_monthly_searches,
    competition:
      competition === "LOW" || competition === "MEDIUM" || competition === "HIGH" ? competition : null,
    competitionIndex: row.competition_index,
    lowTopOfPageBid: microsToEuro(row.low_top_of_page_bid_micros),
    highTopOfPageBid: microsToEuro(row.high_top_of_page_bid_micros),
    fetchedAt: row.fetched_at,
  };
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/**
 * Marktgegevens per zoekwoord: eerst uit de cache, alleen wat ontbreekt of
 * verouderd is wordt bij Google opgehaald.
 */
async function loadMarketMetrics(
  supabase: any,
  customerId: string,
  keywords: string[],
  forceRefresh: boolean,
): Promise<{ metrics: Map<string, PlannerMetrics>; geoName: string | null; note: string | null }> {
  const unique = Array.from(new Set(keywords.map((k) => k.trim().toLowerCase()))).filter(Boolean);
  const metrics = new Map<string, PlannerMetrics>();
  if (unique.length === 0) return { metrics, geoName: null, note: null };

  const geo = await amsterdamGeoTarget(customerId);
  const language = await dutchLanguage(customerId);
  const geoKey = geo?.resource ?? "onbekend";

  const { data: cached } = await supabase
    .from("google_ads_keyword_market_cache")
    .select(
      "keyword, avg_monthly_searches, competition, competition_index, low_top_of_page_bid_micros, high_top_of_page_bid_micros, fetched_at",
    )
    .eq("geo_target", geoKey)
    .eq("language_code", "nl")
    .in("keyword", unique);

  const fresh = Date.now() - CACHE_MAX_AGE_HOURS * 3_600_000;
  const stale: string[] = [];
  const cachedRows = (cached ?? []) as CacheRow[];
  const byKeyword = new Map(cachedRows.map((row) => [row.keyword, row]));

  for (const keyword of unique) {
    const row = byKeyword.get(keyword);
    if (!forceRefresh && row && new Date(row.fetched_at).getTime() >= fresh) {
      metrics.set(keyword, cacheToPlanner(row));
    } else {
      stale.push(keyword);
      if (row) metrics.set(keyword, cacheToPlanner(row));
    }
  }

  if (stale.length === 0) return { metrics, geoName: geo?.name ?? null, note: null };

  if (!geo || !language) {
    return {
      metrics,
      geoName: geo?.name ?? null,
      note: "De marktgegevens van Keyword Planner konden niet worden opgehaald: gebied of taal kon niet worden vastgesteld.",
    };
  }

  let note: string | null = null;
  const updates: Array<Record<string, unknown>> = [];

  for (const batch of chunk(stale, 500)) {
    try {
      const response = await gateway<HistoricalResult>(
        `/customers/${customerId}:generateKeywordHistoricalMetrics`,
        {
          method: "POST",
          body: {
            keywords: batch,
            language,
            geoTargetConstants: [geo.resource],
            keywordPlanNetwork: "GOOGLE_SEARCH",
            includeAdultKeywords: false,
          },
        },
      );
      const fetchedAt = new Date().toISOString();
      for (const result of response.results ?? []) {
        const keyword = (result.text ?? "").trim().toLowerCase();
        if (!keyword) continue;
        const m = result.keywordMetrics ?? {};
        const planner: PlannerMetrics = {
          avgMonthlySearches: num(m.avgMonthlySearches),
          competition:
            m.competition === "LOW" || m.competition === "MEDIUM" || m.competition === "HIGH"
              ? m.competition
              : null,
          competitionIndex: num(m.competitionIndex),
          lowTopOfPageBid: microsToEuro(m.lowTopOfPageBidMicros),
          highTopOfPageBid: microsToEuro(m.highTopOfPageBidMicros),
          fetchedAt,
        };
        metrics.set(keyword, planner);
        updates.push({
          keyword,
          geo_target: geo.resource,
          language_code: "nl",
          avg_monthly_searches: planner.avgMonthlySearches,
          competition: planner.competition,
          competition_index: planner.competitionIndex,
          low_top_of_page_bid_micros: num(m.lowTopOfPageBidMicros),
          high_top_of_page_bid_micros: num(m.highTopOfPageBidMicros),
          fetched_at: fetchedAt,
        });
      }
    } catch (error) {
      console.error("Keyword Planner ophalen mislukt:", error);
      note =
        error instanceof Error
          ? `Marktgegevens konden niet (volledig) worden opgehaald: ${error.message}`
          : "Marktgegevens konden niet worden opgehaald.";
    }
  }

  if (updates.length > 0) {
    const { error } = await supabase
      .from("google_ads_keyword_market_cache")
      .upsert(updates, { onConflict: "keyword,geo_target,language_code" });
    if (error) console.error("Marktgegevens opslaan mislukt:", error.message);
  }

  return { metrics, geoName: geo.name, note };
}

/* ---------------- samenstellen ---------------- */

export async function buildBidAnalysis(options: {
  supabase: any;
  accountId?: string | null;
  campaignId?: string | null;
  days: number;
  refresh: boolean;
}): Promise<BidAnalysis> {
  const { customerId: defaultId } = credentials();
  const accountId = options.accountId?.replace(/\D/g, "") || defaultId;

  const [accounts, campaigns, performance] = await Promise.all([
    listAccounts(defaultId),
    listCampaigns(accountId),
    fetchKeywordPerformance(accountId, options.days, options.campaignId ?? null),
  ]);

  const market = await loadMarketMetrics(
    options.supabase,
    accountId,
    performance.rows.map((row) => row.keyword),
    options.refresh,
  );

  const rows = performance.rows.map((row) => ({
    ...row,
    planner: market.metrics.get(row.keyword.trim().toLowerCase()) ?? emptyPlanner(),
  }));

  const account =
    accounts.find((item) => item.id === accountId) ?? { id: accountId, name: `Account ${accountId}` };

  return {
    account,
    accounts,
    campaigns,
    rows,
    from: performance.from,
    to: performance.to,
    syncedAt: new Date().toISOString(),
    plannerAvailable: rows.some((row) => row.planner.lowTopOfPageBid != null),
    plannerNote: market.note,
    impressionShareAvailable: performance.impressionShareAvailable,
    // Veilinginzichten (Auction Insights) zijn geen rapportbron in de Google Ads API.
    auctionInsightsAvailable: false,
    geoTarget: market.geoName,
  };
}
