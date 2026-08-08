/**
 * Server-only aggregatie voor het conversiedashboard.
 * Telt Bel-, WhatsApp-, Offerte- en Afspraakconversies per apparaat, bron en pagina.
 */

import {
  BOT_REASON_LABEL,
  CONVERSION_LABEL,
  DEVICE_LABEL,
  SOURCE_LABEL,
  type ConversionBreakdownRow,
  type ConversionReport,
} from "./conversion-report";

type EventRow = {
  created_at: string;
  conversion_type: string;
  device: string;
  source: string;
  page_path: string;
  cta_location: string | null;
  is_bot: boolean | null;
  bot_reason: string | null;
};


type Bucket = {
  key: string;
  label: string;
  total: number;
  call: number;
  whatsapp: number;
  quote: number;
  schedule: number;
};

function emptyBucket(key: string, label: string): Bucket {
  return { key, label, total: 0, call: 0, whatsapp: 0, quote: 0, schedule: 0 };
}

function add(map: Map<string, Bucket>, key: string, label: string, type: string) {
  const bucket = map.get(key) ?? emptyBucket(key, label);
  bucket.total += 1;
  if (type === "call") bucket.call += 1;
  else if (type === "whatsapp") bucket.whatsapp += 1;
  else if (type === "quote") bucket.quote += 1;
  else if (type === "schedule") bucket.schedule += 1;
  map.set(key, bucket);
}

function sorted(map: Map<string, Bucket>, limit?: number): ConversionBreakdownRow[] {
  const rows = [...map.values()].sort((a, b) => b.total - a.total);
  return limit ? rows.slice(0, limit) : rows;
}

export async function buildConversionReport(days = 30): Promise<ConversionReport> {
  const safeDays = Math.min(Math.max(Math.floor(days), 1), 365);
  const from = new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000);

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("conversion_events")
    .select("created_at, conversion_type, device, source, page_path, cta_location, is_bot, bot_reason")
    .gte("created_at", from.toISOString())

    .order("created_at", { ascending: false })
    .limit(50000);

  if (error) throw new Error(`Ophalen van conversies mislukt: ${error.message}`);

  const rows = (data ?? []) as EventRow[];
  const byDevice = new Map<string, Bucket>();
  const bySource = new Map<string, Bucket>();
  const byPage = new Map<string, Bucket>();
  const whatsappByLocation = new Map<string, { key: string; label: string; count: number }>();
  const totals = { total: 0, call: 0, whatsapp: 0, quote: 0, schedule: 0 };
  const botReasons = new Map<string, number>();

  for (const row of rows) {
    const type = row.conversion_type;
    if (!(type in CONVERSION_LABEL)) continue;

    // Bot-/spamhits tellen niet mee in de conversiecijfers; we rapporteren
    // ze apart zodat zichtbaar blijft hoeveel ruis er is weggefilterd.
    if (row.is_bot) {
      const reason = row.bot_reason || "unknown";
      botReasons.set(reason, (botReasons.get(reason) ?? 0) + 1);
      continue;
    }

    totals.total += 1;
    if (type === "call") totals.call += 1;
    else if (type === "whatsapp") totals.whatsapp += 1;
    else if (type === "quote") totals.quote += 1;
    else if (type === "schedule") totals.schedule += 1;

    add(byDevice, row.device, DEVICE_LABEL[row.device] ?? row.device, type);
    add(bySource, row.source, SOURCE_LABEL[row.source] ?? row.source, type);
    add(byPage, row.page_path, row.page_path, type);

    if (type === "whatsapp") {
      const loc = row.cta_location || "unknown";
      const existing = whatsappByLocation.get(loc);
      if (existing) {
        existing.count += 1;
      } else {
        whatsappByLocation.set(loc, { key: loc, label: loc, count: 1 });
      }
    }
  }

  return {
    from: from.toISOString(),
    to: new Date().toISOString(),
    days: safeDays,
    totals,
    byDevice: sorted(byDevice),
    bySource: sorted(bySource),
    byPage: sorted(byPage, 15),
    whatsappByLocation: [...whatsappByLocation.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 20),
    filteredBots: {
      total: [...botReasons.values()].reduce((sum, n) => sum + n, 0),
      byReason: [...botReasons.entries()]
        .map(([key, count]) => ({ key, label: BOT_REASON_LABEL[key] ?? key, count }))
        .sort((a, b) => b.count - a.count),
    },
  };
}

