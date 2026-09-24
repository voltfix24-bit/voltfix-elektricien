import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import type { Database } from "@/integrations/supabase/types";
import { isInternalPath } from "@/lib/internal-traffic";

// ---------------------------------------------------------------------------
// First-party conversielogging.
// De Bel-, WhatsApp-, Offerte- en Afspraak-CTA's sturen hier een klein
// beacon-bericht naartoe (navigator.sendBeacon), zodat het conversiedashboard
// per apparaat en bron kan tonen hoeveel contactmomenten er binnenkomen —
// ook wanneer de bezoeker analytics-cookies weigert (geen persoonsgegevens,
// geen cookies, geen IP-opslag).
// ---------------------------------------------------------------------------

export const bodySchema = z.object({
  conversionType: z.enum(["call", "whatsapp", "quote", "schedule", "social"]),
  eventName: z.string().trim().min(1).max(60),
  /** Stabiele sleutel van deze gebeurtenis; dezelfde sleutel telt maar één keer. */
  eventId: z.string().trim().min(6).max(120).nullish(),
  /** Aanvraagnummer van de server, wanneer de gebeurtenis bij een dossier hoort. */
  leadId: z.string().uuid().nullish(),
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
      // "onbekend" is een bedoelde uitkomst: eerlijker dan "rechtstreeks".
      "unknown",
    ])
    .default("unknown"),
  referrerHost: z.string().trim().max(120).nullish(),
  utmSource: z.string().trim().max(80).nullish(),
  utmMedium: z.string().trim().max(80).nullish(),
  utmCampaign: z.string().trim().max(120).nullish(),
  clickId: z.string().trim().max(200).nullish(),
  // Klik-id van Google Ads + de korte code die de bezoeker in WhatsApp noemt.
  gclid: z.string().trim().max(200).nullish(),
  gbraid: z.string().trim().max(200).nullish(),
  wbraid: z.string().trim().max(200).nullish(),
  clickRef: z.string().trim().max(16).nullish(),
  // Toestemming zoals die gold op het moment van de klik.
  consentAdUserData: z.enum(["granted", "denied"]).nullish(),
  consentAdStorage: z.enum(["granted", "denied"]).nullish(),
  consentSeq: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER).nullish(),
  isInternal: z.boolean().nullish(),
  /** Geheim van de browser; wordt alleen als vingerafdruk bewaard. */
  visitorToken: z.string().trim().min(16).max(200).nullish(),
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
          // De vingerafdruk van de bezoeker: nooit het geheim zelf.
          const { visitorHashFrom, recordFormConsent, missingConsentColumn, consentForStorage } = await import("@/lib/ads-consent.server");
          await recordFormConsent({ adVisitorToken: d.visitorToken, adConsentSeq: d.consentSeq,
            adConsentAdUserData: d.consentAdUserData, adConsentAdStorage: d.consentAdStorage });
          const visitorHash = await visitorHashFrom(d.visitorToken ?? null);
          const adConsent = await consentForStorage(supabaseAdmin, visitorHash);
          const row: Database["public"]["Tables"]["conversion_events"]["Insert"] & {
            event_id?: string | null
            lead_id?: string | null
            consent_visitor_hash?: string | null
          } = {
            conversion_type: d.conversionType,
            event_name: d.eventName,
            event_id: d.eventId ?? null,
            lead_id: d.leadId ?? null,
            language: d.language,
            page_path: d.pagePath,
            cta_location: d.ctaLocation,
            device: d.device,
            source: d.source,
            referrer_host: d.referrerHost ?? null,
            utm_source: d.utmSource ?? null,
            utm_medium: d.utmMedium ?? null,
            utm_campaign: d.utmCampaign ?? null,
            gclid: adConsent === 'granted' ? d.gclid ?? null : null,
            gbraid: adConsent === 'granted' ? d.gbraid ?? null : null,
            wbraid: adConsent === 'granted' ? d.wbraid ?? null : null,
            click_ref: adConsent === 'granted' ? d.clickRef ?? null : null,
            consent_ad_user_data: adConsent,
            consent_ad_storage: adConsent,
            consent_visitor_hash: visitorHash,
            // De server beslist mee: een beheerpad is altijd intern verkeer.
            is_internal: Boolean(d.isInternal) || isInternalPath(d.pagePath),
            is_bot: verdict.isBot,
            bot_reason: verdict.reason,
          };

          let { error } = await supabaseAdmin.from("conversion_events").insert(row as never);
          if (missingConsentColumn(error)) {
            // Omgeving zonder de voorbereide migratie: dan zonder vingerafdruk
            // opslaan in plaats van de meting te verliezen.
            const { consent_visitor_hash: _drop, ...rest } = row;
            ({ error } = await supabaseAdmin.from("conversion_events").insert({ ...rest,
              gclid: null, gbraid: null, wbraid: null, click_ref: null,
              consent_ad_user_data: null, consent_ad_storage: null } as never));
          }
          // Dezelfde gebeurtenis die twee keer aankomt (beacon én terugvalweg)
          // botst op de unieke sleutel: dat is de bedoeling, geen fout.
          if (error && error.code !== "23505") {
            console.error("Conversie-event opslaan mislukt:", error.message);
          }
        } catch (err) {
          console.error("Conversie-event opslaan mislukt:", err);
        }

        return new Response(null, { status: 204 });
      },
    },
  },
});
