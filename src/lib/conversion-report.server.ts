/**
 * Server-only aggregatie voor het conversiedashboard.
 * Telt Bel-, WhatsApp-, Offerte- en Afspraakconversies per apparaat, bron en pagina.
 */

import {
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
    .select("created_at, conversion_type, device, source, page_path")
    .gte("created_at", from.toISOString())
    .order("created_at", { ascending: false })
    .limit(50000);

  if (error) throw new Error(`Ophalen van conversies mislukt: ${error.message}`);

  const rows = (data ?? []) as EventRow[];
  const byDevice = new Map<string, Bucket>();
  const bySource = new Map<string, Bucket>();
  const byPage = new Map<string, Bucket>();
  const totals = { total: 0, call: 0, whatsapp: 0, quote: 0, schedule: 0 };

  for (const row of rows) {
    const type = row.conversion_type;
    if (!(type in CONVERSION_LABEL)) continue;

    totals.total += 1;
    if (type === "call") totals.call += 1;
    else if (type === "whatsapp") totals.whatsapp += 1;
    else if (type === "quote") totals.quote += 1;
    else if (type === "schedule") totals.schedule += 1;

    add(byDevice, row.device, DEVICE_LABEL[row.device] ?? row.device, type);
    add(bySource, row.source, SOURCE_LABEL[row.source] ?? row.source, type);
    add(byPage, row.page_path, row.page_path, type);
  }

  return {
    from: from.toISOString(),
    to: new Date().toISOString(),
    days: safeDays,
    totals,
    byDevice: sorted(byDevice),
    bySource: sorted(bySource),
    byPage: sorted(byPage, 15),
  };
}
