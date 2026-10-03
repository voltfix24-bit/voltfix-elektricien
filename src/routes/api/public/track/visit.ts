import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

// Paginabezoeken van advertentiebezoekers (zie src/lib/ad-visit-tracker.ts).
// Geen persoonsgegevens, geen IP, geen klik-id: alleen of er een klik-id was.
const schema = z.object({
  pageViewId: z.string().min(6).max(80),
  visitId: z.string().min(6).max(80),
  seq: z.number().int().min(1).max(500),
  pagePath: z.string().trim().min(1).max(200),
  language: z.enum(["nl", "en"]).nullish(),
  device: z.string().max(20).nullish(),
  trafficSource: z.enum(["ads", "organic", "direct", "referral", "other_ads"]).default("ads"),
  referrerHost: z.string().max(120).nullish(),
  campaignId: z.string().max(40).nullish(),
  utmCampaign: z.string().max(120).nullish(),
  hasClickId: z.boolean(),
  consentAds: z.enum(["granted", "denied"]).nullish(),
  enteredAt: z.string().datetime(),
  durationMs: z.number().int().min(0).max(86_400_000),
  visibleMs: z.number().int().min(0).max(86_400_000),
  maxScrollPct: z.number().int().min(0).max(100),
  scrollDirectionChanges: z.number().int().min(0).max(100_000),
  action: z.string().max(80).nullish(),
});

export const Route = createFileRoute("/api/public/track/visit")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let parsed;
        try {
          parsed = schema.safeParse(await request.json());
        } catch {
          return new Response(null, { status: 204 });
        }
        if (!parsed.success) return new Response(null, { status: 204 });
        const d = parsed.data;
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { classifyRequest } = await import("@/lib/bot-filter.server");
          const { isInternalPath } = await import("@/lib/internal-traffic");
          if (isInternalPath(d.pagePath)) return new Response(null, { status: 204 });
          const verdict = classifyRequest(request, { referrerHost: null, utmSource: null });
          // Land komt van de server (edge-header), niet van de browser: betrouwbaarder.
          const country = request.headers.get("cf-ipcountry")?.toUpperCase().slice(0, 2) ?? null;
          await supabaseAdmin.from("ad_visit_pages" as never).upsert(
            {
              page_view_id: d.pageViewId, visit_id: d.visitId, seq: d.seq, page_path: d.pagePath,
              language: d.language ?? null, device: d.device ?? null, campaign_id: d.campaignId ?? null,
              utm_campaign: d.utmCampaign ?? null, has_click_id: d.hasClickId, consent_ads: d.consentAds ?? null,
              country_code: country, traffic_source: d.trafficSource, referrer_host: d.referrerHost ?? null,
              entered_at: d.enteredAt, last_seen_at: new Date().toISOString(), duration_ms: d.durationMs,
              visible_ms: d.visibleMs, max_scroll_pct: d.maxScrollPct,
              scroll_direction_changes: d.scrollDirectionChanges, action: d.action ?? null, is_bot: verdict.isBot,
            } as never,
            { onConflict: "page_view_id" },
          );
        } catch (e) {
          console.error("Advertentiebezoek opslaan mislukt", e);
        }
        return new Response(null, { status: 204 });
      },
    },
  },
});
