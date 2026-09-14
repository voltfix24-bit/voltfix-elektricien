// Google Ads-conversies verwachten andere eventnamen dan ons eigen GA4-schema.
// Deze dunne laag vuurt naast `contact_call` / `contact_whatsapp` /
// `quote_submitted` ook de namen waarop de conversieacties in het Ads-account
// zijn ingericht. Geen tweede trackingsysteem: dezelfde gtag/dataLayer-keten,
// dezelfde consent, alleen een extra eventnaam per actie.
//
//   klik_tel                      → VoltFix (web) klik_tel
//   whatsapp_klik                 → VoltFix (web) whatsapp_klik
//   klik_mail                     → VoltFix (web) klik_mail
//   ContactformulierNL_ingevuld   → formulier op een Nederlandse pagina
//   ContactformulierENG_ingevuld  → formulier op een Engelse pagina

export type AdsEventName =
  | "klik_tel"
  | "whatsapp_klik"
  | "klik_mail"
  | "ContactformulierNL_ingevuld"
  | "ContactformulierENG_ingevuld";

export type AdsEventParams = Record<string, unknown>;

/** Ads-eventnaam per klikactie; `null` = deze actie heeft geen Ads-conversie. */
export function adsClickEvent(type: string): AdsEventName | null {
  if (type === "call") return "klik_tel";
  if (type === "whatsapp") return "whatsapp_klik";
  if (type === "mail") return "klik_mail";
  return null;
}

/** Formulierconversie per taal, zodat NL en EN apart meetbaar zijn. */
export function adsFormEvent(language: "nl" | "en"): AdsEventName {
  return language === "en" ? "ContactformulierENG_ingevuld" : "ContactformulierNL_ingevuld";
}

/** Vuurt het Ads-event; stil wanneer gtag (nog) niet geladen is. */
export function fireAdsEvent(name: AdsEventName, params: AdsEventParams = {}) {
  if (typeof window === "undefined") return;
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag !== "function") return;
  gtag("event", name, params);
}

// ---------------------------------------------------------------------------
// Directe Google Ads-conversies (niet via de GA4-import)
// ---------------------------------------------------------------------------
// De GA4-import is een omweg: consent, sampling en de import zelf kunnen kliks
// wegfilteren, waardoor "whatsapp_klik" op nul bleef staan. Daarom melden we de
// WhatsApp-klik óók rechtstreeks aan de Google Ads-tag.

/** Google Ads-tag van VoltFix. */
export const ADS_TAG_ID = "AW-846594114";

/** send_to-labels per directe conversieactie. */
export const ADS_CONVERSION_SEND_TO: Partial<Record<"whatsapp", string>> = {
  whatsapp: `${ADS_TAG_ID}/hetKCL6E9vccEMKA2JMD`,
};

/**
 * Meldt een directe Google Ads-conversie. De gtag-stub staat al in de head,
 * dus een klik vlak na binnenkomst komt in de wachtrij en wordt alsnog verwerkt
 * zodra de tag is geladen. Precies één melding per klik: de aanroeper
 * dedupliceert (zie wasRecentlyTracked in analytics.ts).
 */
export function fireAdsConversion(kind: "whatsapp", params: AdsEventParams = {}) {
  if (typeof window === "undefined") return;
  const sendTo = ADS_CONVERSION_SEND_TO[kind];
  if (!sendTo) return;
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag !== "function") return;
  gtag("event", "conversion", { ...params, send_to: sendTo });
}
