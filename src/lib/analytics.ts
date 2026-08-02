import { useCallback } from "react";

import { consentDefaultsInlineScript, type ConsentCategories } from "./consent";
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

export type ConsentAction =
  | "banner_view"
  | "accept_all"
  | "reject_all"
  | "save"
  | "open_settings";

export type ConsentSource =
  | "banner"
  | "banner_customize"
  | "footer"
  | "cookie_policy"
  | "privacy_policy";

type DataLayerObject = Record<string, unknown>;

declare global {
  interface Window {
    dataLayer?: DataLayerObject[];
    gtag?: (...args: unknown[]) => void;
  }
}

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;
const GTM_ID = import.meta.env.VITE_GTM_ID as string | undefined;

/**
 * Centraal labelschema voor GA4/GTM. Alle events — ongeacht taalroute (NL of
 * /en-gb/*) — gebruiken dezelfde `event_name`, `event_category` en
 * `event_label`. Zo groepeert GA4 conversies en consent-acties altijd op
 * exact hetzelfde schema en hoef je in Analytics niet per taal te filteren.
 *
 * Convention:
 *   - event_name      snake_case, taalonafhankelijk (bv. "contact_call")
 *   - event_category  hoofdgroep in GA4 (bv. "contact", "consent", "social")
 *   - event_label     leesbaar label per actie (bv. "Phone call")
 *   - language        genormaliseerd naar "nl" / "en"
 *   - language_label  BCP-47 locale ("nl-NL" / "en-GB") voor rapporten
 */

export const EVENT_CATEGORY = {
  contact: "contact",
  consent: "consent",
  social: "social",
} as const;

export type EventCategory = (typeof EVENT_CATEGORY)[keyof typeof EVENT_CATEGORY];

export type EventSchemaEntry = {
  name: string;
  category: EventCategory;
  label: string;
};

/** GA4-/GTM-eventschema per conversietype. */
export const EVENT_SCHEMA: Record<ConversionType, EventSchemaEntry> = {
  call: { name: "contact_call", category: EVENT_CATEGORY.contact, label: "Phone call" },
  whatsapp: { name: "contact_whatsapp", category: EVENT_CATEGORY.contact, label: "WhatsApp message" },
  quote: { name: "request_quote", category: EVENT_CATEGORY.contact, label: "Quote request" },
  schedule: { name: "request_appointment", category: EVENT_CATEGORY.contact, label: "Appointment request" },
  social: { name: "social_click", category: EVENT_CATEGORY.social, label: "Social profile click" },
};

/** Legacy alias — houdt bestaande imports werkend. */
export const EVENT_NAME: Record<ConversionType, string> = {
  call: EVENT_SCHEMA.call.name,
  whatsapp: EVENT_SCHEMA.whatsapp.name,
  quote: EVENT_SCHEMA.quote.name,
  schedule: EVENT_SCHEMA.schedule.name,
  social: EVENT_SCHEMA.social.name,
};

/** GA4-/GTM-eventschema per consent-actie. */
export const CONSENT_EVENT_SCHEMA: Record<ConsentAction, EventSchemaEntry> = {
  banner_view: { name: "consent_banner_view", category: EVENT_CATEGORY.consent, label: "Cookie banner shown" },
  accept_all: { name: "consent_accept_all", category: EVENT_CATEGORY.consent, label: "Accept all cookies" },
  reject_all: { name: "consent_reject_all", category: EVENT_CATEGORY.consent, label: "Reject non-essential cookies" },
  save: { name: "consent_save", category: EVENT_CATEGORY.consent, label: "Save cookie preferences" },
  open_settings: { name: "consent_open_settings", category: EVENT_CATEGORY.consent, label: "Open cookie settings" },
};

/** Legacy alias — houdt bestaande imports werkend. */
export const CONSENT_EVENT_NAME: Record<ConsentAction, string> = {
  banner_view: CONSENT_EVENT_SCHEMA.banner_view.name,
  accept_all: CONSENT_EVENT_SCHEMA.accept_all.name,
  reject_all: CONSENT_EVENT_SCHEMA.reject_all.name,
  save: CONSENT_EVENT_SCHEMA.save.name,
  open_settings: CONSENT_EVENT_SCHEMA.open_settings.name,
};

/** Sociale netwerken → consistente labels in GA4. */
export const SOCIAL_NETWORK_LABEL: Record<SocialNetwork, string> = {
  instagram: "Instagram",
  linkedin: "LinkedIn",
  google: "Google Business Profile",
};

/** Consent-categorieën → consistente labels (taalonafhankelijk). */
export const CONSENT_CATEGORY_LABEL = {
  necessary: "necessary",
  preferences: "preferences",
  analytics: "analytics",
  marketing: "marketing",
} as const;

const LANGUAGE_LABEL: Record<"nl" | "en", string> = {
  nl: "nl-NL",
  en: "en-GB",
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
  const schema = EVENT_SCHEMA[p.type];
  const networkLabel = p.network ? SOCIAL_NETWORK_LABEL[p.network] : undefined;
  const params = {
    event_category: schema.category,
    event_label: networkLabel ? `${schema.label} — ${networkLabel}` : schema.label,
    conversion_type: p.type,
    language: p.language,
    language_label: LANGUAGE_LABEL[p.language],
    page_path: p.pagePath,
    cta_location: p.location,
    ...(p.network ? { social_network: p.network, social_network_label: networkLabel } : {}),
  };

  // GTM: één event per conversie met taal/pagina als context.
  pushToDataLayer({ event: schema.name, ...params });

  // GA4 (indien gtag geladen is): specifiek event + standaard lead-event.
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", schema.name, params);
    window.gtag("event", "generate_lead", params);
  }

  // First-party logging: legt device + bron vast voor het conversiedashboard
  // (/conversie-monitor). Werkt ook zonder GA4/GTM en zonder analytics-consent,
  // omdat er geen cookies, IP-adressen of persoonsgegevens worden opgeslagen.
  logConversionFirstParty(p, schema.name);

  // Dev-zichtbaarheid: log elke conversie in de browserconsole, zodat je
  // meteen kunt zien dat een Bel/WhatsApp-klik daadwerkelijk is geregistreerd.
  if (typeof window !== "undefined" && import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.info(`[VoltFix] ${schema.name}`, params);
  }
}

const TRACK_ENDPOINT = "/api/public/track/conversion";

/**
 * Stuurt de conversie naar onze eigen backend met sendBeacon, zodat de klik
 * ook wordt geregistreerd terwijl de browser al naar tel:/WhatsApp navigeert.
 */
function logConversionFirstParty(p: ConversionPayload, eventName: string) {
  if (typeof window === "undefined") return;
  const context = getConversionContext();
  const body = JSON.stringify({
    conversionType: p.type,
    eventName,
    language: p.language,
    pagePath: p.pagePath,
    ctaLocation: p.location,
    ...context,
  });

  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      navigator.sendBeacon(TRACK_ENDPOINT, new Blob([body], { type: "application/json" }));
      return;
    }
    void fetch(TRACK_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Tracking mag een Bel- of WhatsApp-klik nooit blokkeren.
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

// ---------------------------------------------------------------------------
// Cookie consent tracking (Consent Mode v2)
// ---------------------------------------------------------------------------
// Elke actie op de cookie-banner of cookie-instellingen stuurt een event naar
// dataLayer (GTM) en gtag (GA4) met TAAL en PAGINAPAD als context. Zo kun je
// per taalroute (nl vs /en-gb/*) meten hoe bezoekers omgaan met consent en
// welke categorieën ze toestaan.
//
// Events (te markeren in GA4):
//   - consent_banner_view      → banner is voor het eerst getoond
//   - consent_accept_all       → "Alles accepteren" geklikt
//   - consent_reject_all       → "Alleen noodzakelijk" geklikt
//   - consent_save             → aangepaste voorkeuren opgeslagen
//   - consent_open_settings    → instellingen heropend (footer, policy, banner)
// ---------------------------------------------------------------------------

export type ConsentTrackPayload = {
  action: ConsentAction;
  language: "nl" | "en";
  pagePath: string;
  /** Waar de actie vandaan komt (banner, footer, cookie-policy, ...). */
  source: ConsentSource;
  /** Gekozen categorieën — meegestuurd bij accept_all / reject_all / save. */
  categories?: ConsentCategories;
};

function grantedCategoryList(c: ConsentCategories): string[] {
  const out: string[] = [CONSENT_CATEGORY_LABEL.necessary];
  if (c.personalization_storage === "granted") out.push(CONSENT_CATEGORY_LABEL.preferences);
  if (c.analytics_storage === "granted") out.push(CONSENT_CATEGORY_LABEL.analytics);
  if (c.ad_storage === "granted") out.push(CONSENT_CATEGORY_LABEL.marketing);
  return out;
}

export function trackConsent(p: ConsentTrackPayload) {
  const schema = CONSENT_EVENT_SCHEMA[p.action];
  const params: DataLayerObject = {
    event_category: schema.category,
    event_label: schema.label,
    consent_action: p.action,
    consent_source: p.source,
    language: p.language,
    language_label: LANGUAGE_LABEL[p.language],
    page_path: p.pagePath,
  };
  if (p.categories) {
    const granted = grantedCategoryList(p.categories);
    params.granted_categories = granted;
    params.granted_categories_csv = granted.join(",") || CONSENT_CATEGORY_LABEL.necessary;
    params.analytics_storage = p.categories.analytics_storage;
    params.ad_storage = p.categories.ad_storage;
    params.ad_user_data = p.categories.ad_user_data;
    params.ad_personalization = p.categories.ad_personalization;
    params.personalization_storage = p.categories.personalization_storage;
  }

  pushToDataLayer({ event: schema.name, ...params });

  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", schema.name, params);
  }

  if (typeof window !== "undefined" && import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.info(`[VoltFix] ${schema.name}`, params);
  }
}

/**
 * Hook die een consent-tracker teruggeeft die automatisch taal + paginapad
 * meestuurt. Gebruik in de banner, footer of cookie-policy pagina:
 *   const trackC = useTrackConsent();
 *   trackC("accept_all", "banner", categories);
 */
export function useTrackConsent() {
  const language = useLocale();
  const pagePath = usePathname();
  return useCallback(
    (action: ConsentAction, source: ConsentSource, categories?: ConsentCategories) =>
      trackConsent({ action, language, pagePath, source, categories }),
    [language, pagePath],
  );
}
