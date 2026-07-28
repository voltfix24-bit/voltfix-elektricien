import { useCallback } from "react";

import { useLocale, usePathname } from "./i18n";

// ---------------------------------------------------------------------------
// VoltFix conversietracking
// ---------------------------------------------------------------------------
// De drie conversies (bellen, WhatsApp, offerteaanvraag) sturen een event naar
// window.dataLayer (GTM) én naar gtag (GA4 indien geladen). Bij elk event gaat
// de TAAL (nl/en) en het PAGINAPAD mee, zodat je in Analytics kunt zien welke
// taalpagina's het meeste opleveren.
//
// Activeren in Analytics:
//   - Zet VITE_GA_MEASUREMENT_ID (GA4) en/of VITE_GTM_ID (Tag Manager) in .env.
//   - Markeer de events `contact_call`, `contact_whatsapp` en `request_quote`
//     als conversie (doel). De parameters `language` en `page_path` kun je als
//     aangepaste dimensie toevoegen om per taalpagina te segmenteren.
// ---------------------------------------------------------------------------

export type ConversionType = "call" | "whatsapp" | "quote" | "schedule" | "social";

export type SocialNetwork = "instagram" | "linkedin" | "google";

type DataLayerObject = Record<string, unknown>;

declare global {
  interface Window {
    dataLayer?: DataLayerObject[];
    gtag?: (...args: unknown[]) => void;
  }
}

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;
const GTM_ID = import.meta.env.VITE_GTM_ID as string | undefined;

/** GA4-/GTM-eventnaam per conversietype. */
export const EVENT_NAME: Record<ConversionType, string> = {
  call: "contact_call",
  whatsapp: "contact_whatsapp",
  quote: "request_quote",
  schedule: "request_appointment",
  social: "social_click",
};

export function pushToDataLayer(obj: DataLayerObject) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(obj);
}

export type ConversionPayload = {
  type: ConversionType;
  /** Taal van de pagina waarop de conversie plaatsvond. */
  language: "nl" | "en";
  /** Paginapad, bv. "/perilex-amsterdam" of "/en-gb/elektricien-amsterdam". */
  pagePath: string;
  /** Plek van de CTA (hero, mobile-bar, header, cta-band, contact-form, ...). */
  location: string;
  /** Sociaal netwerk (alleen bij type=social). */
  network?: SocialNetwork;
};

export function trackConversion(p: ConversionPayload) {
  const params = {
    conversion_type: p.type,
    language: p.language,
    page_path: p.pagePath,
    cta_location: p.location,
    ...(p.network ? { social_network: p.network } : {}),
  };

  // GTM: één event per conversie met taal/pagina als context.
  pushToDataLayer({ event: EVENT_NAME[p.type], ...params });

  // GA4 (indien gtag geladen is): specifiek event + standaard lead-event.
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", EVENT_NAME[p.type], params);
    window.gtag("event", "generate_lead", params);
  }

  // Dev-zichtbaarheid: log elke conversie in de browserconsole, zodat je
  // meteen kunt zien dat een Bel/WhatsApp-klik daadwerkelijk is geregistreerd.
  if (typeof window !== "undefined" && import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.info(`[VoltFix] ${EVENT_NAME[p.type]}`, params);
  }
}

/**
 * Hook die een tracker teruggeeft die automatisch de huidige taal + pagina
 * meestuurt. Gebruik in CTA-componenten:
 *   const track = useTrackConversion();
 *   <a onClick={() => track("call", "hero")} ... />
 */
export function useTrackConversion() {
  const language = useLocale();
  const pagePath = usePathname();
  return useCallback(
    (type: ConversionType, location: string, network?: SocialNetwork) =>
      trackConversion({ type, language, pagePath, location, network }),
    [language, pagePath],
  );
}

/**
 * Hook specifiek voor sociale-media kliks. Geeft een handler terug die
 * netwerk + locatie meestuurt, zodat je in GTM/GA4 kunt zien welke
 * Instagram/LinkedIn-link op welke pagina wordt aangeklikt.
 *
 * Voorbeeld:
 *   const trackSocial = useTrackSocialClick();
 *   <a onClick={() => trackSocial("instagram", "footer")} ... />
 */
export function useTrackSocialClick() {
  const language = useLocale();
  const pagePath = usePathname();
  return useCallback(
    (network: SocialNetwork, location: string) =>
      trackConversion({
        type: "social",
        language,
        pagePath,
        location,
        network,
      }),
    [language, pagePath],
  );
}

/**
 * Scripts voor in <head> (SSR). Laadt GA4 en/of GTM alleen als de bijbehorende
 * env-variabele is ingesteld; zonder ID blijven de dataLayer-events gewoon
 * beschikbaar voor een eventuele latere koppeling.
 */
export function getAnalyticsHeadScripts(): Array<Record<string, unknown>> {
  const scripts: Array<Record<string, unknown>> = [];

  // Consent Mode v2 defaults MUST run before any GA/GTM loader so tags respect
  // the visitor's stored choice (or default to denied in the EEA/UK).
  scripts.push({ children: consentDefaultsInlineScript });

  if (GA_ID) {
    scripts.push({
      src: `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`,
      async: true,
    });
    scripts.push({
      children:
        `window.dataLayer=window.dataLayer||[];` +
        `function gtag(){dataLayer.push(arguments);}` +
        `gtag('js',new Date());` +
        `gtag('config','${GA_ID}',{anonymize_ip:true});`,
    });
  }

  if (GTM_ID) {
    scripts.push({
      children:
        `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':` +
        `new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],` +
        `j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;` +
        `j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;` +
        `f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`,
    });
  }

  return scripts;
}
