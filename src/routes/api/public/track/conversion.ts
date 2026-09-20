import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import type { Database } from "@/integrations/supabase/types";

// ---------------------------------------------------------------------------
// First-party conversielogging.
// De Bel-, WhatsApp-, Offerte- en Afspraak-CTA's sturen hier een klein
// beacon-bericht naartoe (navigator.sendBeacon), zodat het conversiedashboard
// per apparaat en bron kan tonen hoeveel contactmomenten er binnenkomen —
// ook wanneer de bezoeker analytics-cookies weigert (geen persoonsgegevens,
// geen cookies, geen IP-opslag).
// ---------------------------------------------------------------------------

const bodySchema = z.object({
  conversionType: z.enum(["call", "whatsapp", "quote", "schedule", "social"]),
  eventName: z.string().trim().min(1).max(60),
  language: z.enum(["nl", "en"]).default("nl"),
  pagePath: z.string().trim().min(1).max(200),
  ctaLocation: z.string().trim().min(1).max(60).default("unknown"),
  device: z.enum(["mobile", "tablet", "desktop", "unknown"]).default("unknown"),
  source: z
    .enum([
      "direct",
      "google-organic",
      "google-ads",
      "google-maps",
      "bing",
      "social",
      "ai-search",
      "referral",
      "internal",
      "campaign",
    ])
    .default("direct"),
  referrerHost: z.string().trim().max(120).nullish(),
  utmSource: z.string().trim().max(80).nullish(),
  utmMedium: z.string().trim().max(80).nullish(),
  utmCampaign: z.string().trim().max(120).nullish(),
  // Klik-id van Google Ads + de korte code die de bezoeker in WhatsApp noemt.
  gclid: z.string().trim().max(200).nullish(),
  gbraid: z.string().trim().max(200).nullish(),
  wbraid: z.string().trim().max(200).nullish(),
  clickRef: z.string().trim().max(8).nullish(),
  // Toestemming zoals die gold op het moment van de klik.
  consentAdUserData: z.enum(["granted", "denied"]).nullish(),
  consentAdStorage: z.enum(["granted", "denied"]).nullish(),
  isInternal: z.boolean().nullish(),
});


export const Route = createFileRoute("/api/public/track/conversion")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: unknown;
        try {
          payload = await request.json();
        } catch {
          return new Response(null, { status: 204 });
        }

        const parsed = bodySchema.safeParse(payload);
        if (!parsed.success) {
          // Nooit een fout terug naar de bezoeker: tracking mag een klik
          // op "Bel direct" nooit blokkeren.
          return new Response(null, { status: 204 });
        }

        const d = parsed.data;
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { classifyRequest } = await import("@/lib/bot-filter.server");
          // Bot-/spamfiltering: hits van crawlers, headless browsers en
          // referral-spam worden getagd, zodat het dashboard alleen echt
          // bezoekersgedrag telt.
          const verdict = classifyRequest(request, {
            referrerHost: d.referrerHost ?? null,
            utmSource: d.utmSource ?? null,
          });
          const row: Database["public"]["Tables"]["conversion_events"]["Insert"] = {
            conversion_type: d.conversionType,
            event_name: d.eventName,
            language: d.language,
            page_path: d.pagePath,
            cta_location: d.ctaLocation,
            device: d.device,
            source: d.source,
            referrer_host: d.referrerHost ?? null,
            utm_source: d.utmSource ?? null,
            utm_medium: d.utmMedium ?? null,
            utm_campaign: d.utmCampaign ?? null,
            gclid: d.gclid ?? null,
            gbraid: d.gbraid ?? null,
            wbraid: d.wbraid ?? null,
            click_ref: d.clickRef ?? null,
            consent_ad_user_data: d.consentAdUserData ?? null,
            consent_ad_storage: d.consentAdStorage ?? null,
            // De server beslist mee: een beheerpad is altijd intern verkeer.
            is_internal: Boolean(d.isInternal) || isInternalPath(d.pagePath),
            is_bot: verdict.isBot,
            bot_reason: verdict.reason,
          };

          const { error } = await supabaseAdmin.from("conversion_events").insert(row);
          if (error) console.error("Conversie-event opslaan mislukt:", error.message);
        } catch (err) {
          console.error("Conversie-event opslaan mislukt:", err);
        }

        return new Response(null, { status: 204 });
      },
    },
  },
});
