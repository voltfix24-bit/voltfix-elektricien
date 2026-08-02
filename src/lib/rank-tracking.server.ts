/**
 * Server-only logica voor wekelijkse rangtracking.
 * Haalt posities op uit Google Search Console en bewaart ze als weeksnapshot.
 */

import {
  TRACKED_KEYWORDS,
  measurementWindow,
  type RankReport,
  type RankRow,
} from "./rank-tracking";

const GATEWAY = "https://connector-gateway.lovable.dev/google_search_console";
const SITE_URL = "sc-domain:voltfix.nl";

type GscRow = { keys: string[]; clicks: number; impressions: number; ctr: number; position: number };

type Aggregated = {
  keyword: string;
  clicks: number;
  impressions: number;
  weightedPosition: number;
  topPage: string | null;
  topPageImpressions: number;
};

async function querySearchAnalytics(startDate: string, endDate: string): Promise<GscRow[]> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const connectionKey = process.env["GOOGLE_SEARCH_CONSOLE_API_KEY"];
  if (!lovableKey || !connectionKey) {
    throw new Error("Search Console connector is niet gekoppeld aan dit project.");
  }

  const res = await fetch(
    `${GATEWAY}/webmasters/v3/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": connectionKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate,
        endDate,
        dimensions: ["query", "page"],
        rowLimit: 25000,
      }),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    console.error(`Search Console query mislukt [${res.status}]: ${body}`);
    throw new Error(`Search Console query mislukt [${res.status}]: ${body.slice(0, 300)}`);
  }

  const json = (await res.json()) as { rows?: GscRow[] };
  return json.rows ?? [];
}

/** Vouwt de (query, page)-rijen samen tot één rij per gevolgd zoekwoord. */
function aggregate(rows: GscRow[]): Map<string, Aggregated> {
  const tracked = new Set(TRACKED_KEYWORDS.map((k) => k.keyword));
  const map = new Map<string, Aggregated>();

  for (const row of rows) {
    const [query, page] = row.keys;
    if (!query || !tracked.has(query)) continue;

    const current =
      map.get(query) ??
      ({
        keyword: query,
        clicks: 0,
        impressions: 0,
        weightedPosition: 0,
        topPage: null,
        topPageImpressions: 0,
      } satisfies Aggregated);

    current.clicks += row.clicks;
    current.impressions += row.impressions;
    current.weightedPosition += row.position * row.impressions;

    if (row.impressions > current.topPageImpressions) {
      current.topPage = page ?? null;
      current.topPageImpressions = row.impressions;
    }

    map.set(query, current);
  }

  return map;
}

/**
 * Meet de huidige week en schrijft één snapshot per zoekwoord weg.
 * Draait vanuit de wekelijkse cron of handmatig vanaf het SEO-dashboard.
 */
export async function captureWeeklySnapshot(reference = new Date()): Promise<{
  weekStart: string;
  stored: number;
  withImpressions: number;
}> {
  const { startDate, endDate } = measurementWindow(reference);
  const rows = await querySearchAnalytics(startDate, endDate);

  const aggregated = aggregate(rows);

  const records = TRACKED_KEYWORDS.map((tracked) => {
    const agg = aggregated.get(tracked.keyword);
    const impressions = agg?.impressions ?? 0;
    return {
      week_start: startDate,
      keyword: tracked.keyword,
      position:
        agg && impressions > 0 ? Number((agg.weightedPosition / impressions).toFixed(2)) : null,
      clicks: agg?.clicks ?? 0,
      impressions,
      ctr: impressions > 0 ? Number(((agg?.clicks ?? 0) / impressions).toFixed(4)) : 0,
      top_page: agg?.topPage ?? null,
      captured_at: new Date().toISOString(),
    };
  });

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin
    .from("rank_snapshots")
    .upsert(records, { onConflict: "week_start,keyword" });

  if (error) {
    console.error("Opslaan van rangsnapshot mislukt:", error);
    throw new Error(`Opslaan van rangsnapshot mislukt: ${error.message}`);
  }

  return {
    weekStart: startDate,
    stored: records.length,
    withImpressions: records.filter((r) => r.impressions > 0).length,
  };
}

/** Bouwt het dashboardrapport: laatste week vergeleken met de week ervoor. */
export async function buildRankReport(): Promise<RankReport> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: weeks, error: weeksError } = await supabaseAdmin
    .from("rank_snapshots")
    .select("week_start")
    .order("week_start", { ascending: false })
    .limit(500);

  if (weeksError) throw new Error(`Ophalen van meetweken mislukt: ${weeksError.message}`);

  const uniqueWeeks = [...new Set((weeks ?? []).map((w) => w.week_start))];
  const weekStart = uniqueWeeks[0] ?? null;
  const previousWeekStart = uniqueWeeks[1] ?? null;

  if (!weekStart) {
    return {
      weekStart: "",
      previousWeekStart: null,
      rows: [],
      summary: { improved: 0, declined: 0, stable: 0, unranked: 0 },
    };
  }

  const wanted = previousWeekStart ? [weekStart, previousWeekStart] : [weekStart];
  const { data: snapshots, error } = await supabaseAdmin
    .from("rank_snapshots")
    .select("week_start, keyword, position, clicks, impressions, ctr, top_page")
    .in("week_start", wanted);

  if (error) throw new Error(`Ophalen van snapshots mislukt: ${error.message}`);

  const current = new Map((snapshots ?? []).filter((s) => s.week_start === weekStart).map((s) => [s.keyword, s]));
  const previous = new Map(
    (snapshots ?? []).filter((s) => s.week_start === previousWeekStart).map((s) => [s.keyword, s]),
  );

  const rows: RankRow[] = TRACKED_KEYWORDS.map((tracked) => {
    const now = current.get(tracked.keyword);
    const before = previous.get(tracked.keyword);
    const position = now?.position != null ? Number(now.position) : null;
    const previousPosition = before?.position != null ? Number(before.position) : null;

    return {
      keyword: tracked.keyword,
      cluster: tracked.cluster,
      position,
      clicks: now?.clicks ?? 0,
      impressions: now?.impressions ?? 0,
      ctr: now?.ctr != null ? Number(now.ctr) : 0,
      topPage: now?.top_page ?? null,
      previousPosition,
      // Lager positienummer = beter, dus stijging = previous - current.
      delta:
        position != null && previousPosition != null
          ? Number((previousPosition - position).toFixed(1))
          : null,
    };
  });

  return {
    weekStart,
    previousWeekStart,
    rows,
    summary: {
      improved: rows.filter((r) => r.delta != null && r.delta > 0.2).length,
      declined: rows.filter((r) => r.delta != null && r.delta < -0.2).length,
      stable: rows.filter((r) => r.delta != null && Math.abs(r.delta) <= 0.2).length,
      unranked: rows.filter((r) => r.position == null).length,
    },
  };
}

/**
 * Vult met terugwerkende kracht de afgelopen weken, zodat het dashboard direct
 * een trend laat zien in plaats van pas over een week.
 */
export async function backfillWeeks(weeks: number): Promise<{ weekStart: string }[]> {
  const results: { weekStart: string }[] = [];
  for (let i = 1; i <= weeks; i++) {
    const reference = new Date();
    reference.setUTCDate(reference.getUTCDate() - i * 7);
    results.push({ weekStart: (await captureWeeklySnapshot(reference)).weekStart });
  }
  return results;
}
