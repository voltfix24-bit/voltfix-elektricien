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
      "referral",
      "internal",
      "campaign",
    ])
    .default("direct"),
  referrerHost: z.string().trim().max(120).nullish(),
  utmSource: z.string().trim().max(80).nullish(),
  utmMedium: z.string().trim().max(80).nullish(),
  utmCampaign: z.string().trim().max(120).nullish(),
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
