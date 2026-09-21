// ---------------------------------------------------------------------------
// Device- en bronherkenning voor conversietracking (browser-only)
// ---------------------------------------------------------------------------
// GA4/GTM meten dit ook, maar alleen achter analytics-consent en met vertraging.
// Deze lichte first-party context laat het conversiedashboard direct zien via
// welk apparaat en welke bron een Bel- of WhatsApp-klik binnenkomt.
// ---------------------------------------------------------------------------

export type DeviceType = "mobile" | "tablet" | "desktop" | "unknown";

/** Genormaliseerde verkeersbronnen voor het dashboard. */
export type TrafficSource =
  | "direct"
  | "google-organic"
  | "google-ads"
  | "google-maps"
  | "bing"
  | "social"
  | "ai-search"
  | "referral"
  | "internal"
  | "campaign"
  /** We weten het echt niet — dat is iets anders dan "rechtstreeks". */
  | "unknown";

export type ConversionContext = {
  device: DeviceType;
  source: TrafficSource;
  referrerHost: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
};

export function detectDevice(): DeviceType {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) {
    return "tablet";
  }
  if (/Mobi|Android|iPhone|iPod|Windows Phone/i.test(ua)) return "mobile";
  return "desktop";
}

/** Hosts van AI-/answer engines die verkeer doorsturen. */
const AI_HOSTS = [
  "chatgpt.com",
  "chat.openai.com",
  "openai.com",
  "perplexity.ai",
  "claude.ai",
  "anthropic.com",
  "copilot.microsoft.com",
  "gemini.google.com",
];

const AI_SOURCE_RE = /chatgpt|openai|perplexity|claude|anthropic|copilot|gemini|ai[-_]?search/i;

const SOCIAL_HOSTS = [
  "facebook.",
  "instagram.",
  "linkedin.",
  "t.co",
  "twitter.",
  "x.com",
  "tiktok.",
  "pinterest.",
  "youtube.",
  "reddit.",
];

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

/** Bepaalt de bron uit UTM-parameters, gclid en de referrer. */
export function detectSource(): Pick<
  ConversionContext,
  "source" | "referrerHost" | "utmSource" | "utmMedium" | "utmCampaign"
> {
  if (typeof window === "undefined") {
    return {
      source: "direct",
      referrerHost: null,
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
    };
  }

  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get("utm_source");
  const utmMedium = params.get("utm_medium");
  const utmCampaign = params.get("utm_campaign");
  const hasAdClick = params.has("gclid") || params.has("gbraid") || params.has("wbraid");
  const referrerHost = document.referrer ? hostOf(document.referrer) : null;
  const currentHost = window.location.hostname.replace(/^www\./, "").toLowerCase();

  let source: TrafficSource = "direct";

  if (hasAdClick || utmMedium === "cpc" || utmMedium === "ppc" || utmMedium === "paid") {
    source = "google-ads";
  } else if (utmSource && AI_SOURCE_RE.test(utmSource)) {
    source = "ai-search";
  } else if (utmSource) {
    source = /google/i.test(utmSource)
      ? /maps|gbp|business/i.test(utmSource)
        ? "google-maps"
        : "google-organic"
      : "campaign";
  } else if (referrerHost) {
    if (referrerHost === currentHost) source = "internal";
    else if (AI_HOSTS.some((h) => referrerHost === h || referrerHost.endsWith(`.${h}`))) {
      source = "ai-search";
    }
    else if (/google\./.test(referrerHost)) {
      source = /maps\.google/.test(referrerHost) ? "google-maps" : "google-organic";
    } else if (/bing\.|duckduckgo\.|yahoo\./.test(referrerHost)) source = "bing";
    else if (SOCIAL_HOSTS.some((h) => referrerHost.includes(h))) source = "social";
    else source = "referral";
  }

  return { source, referrerHost, utmSource, utmMedium, utmCampaign };
}

// ---------------------------------------------------------------------------
// Eén bron per bezoek
// ---------------------------------------------------------------------------
// De bron staat alleen in de URL van de eerste pagina. Klikt de bezoeker door,
// of wisselt hij van taal, dan is die URL weg en zou dezelfde bezoeker plots
// "rechtstreeks" of "intern" heten. We leggen de bron daarom één keer per
// bezoek vast en gebruiken die daarna overal. Weten we het niet, dan zeggen we
// dat eerlijk ("onbekend") in plaats van het als "rechtstreeks" te tellen.
// ---------------------------------------------------------------------------

const SESSION_KEY = "voltfix_src";

type StoredSource = Pick<
  ConversionContext,
  "source" | "referrerHost" | "utmSource" | "utmMedium" | "utmCampaign"
>;

function readStoredSource(): StoredSource | null {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSource;
    return parsed && typeof parsed.source === "string" ? parsed : null;
  } catch {
    return null;
  }
}

function storeSource(value: StoredSource) {
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(value));
  } catch {
    // Privémodus of geblokkeerde opslag: dan valt het terug op de meting nu.
  }
}

/** De bron van dit bezoek: één keer bepaald, daarna stabiel. */
export function resolveSource(): StoredSource {
  if (typeof window === "undefined") return detectSource();
  const stored = readStoredSource();
  const fresh = detectSource();

  // Een advertentieklik, campagne of externe verwijzing op déze pagina is
  // nieuwe, hardere informatie dan wat er al stond.
  const isFirstTouch = fresh.source !== "direct" && fresh.source !== "internal";
  if (!stored || isFirstTouch) {
    const value = isFirstTouch || !stored ? fresh : stored;
    if (!stored || isFirstTouch) storeSource(value)
    return value;
  }
  return stored;
}

export function getConversionContext(): ConversionContext {
  if (typeof window === "undefined") return { device: detectDevice(), ...detectSource() };
  const resolved = resolveSource();
  // Geen referrer, geen campagne én geen eerdere pagina in dit bezoek: dan
  // weten we het niet. "Rechtstreeks" zou meer beweren dan we kunnen zien.
  const honest: StoredSource =
    resolved.source === "internal" || (resolved.source === "direct" && document.referrer)
      ? { ...resolved, source: "unknown" }
      : resolved;
  return { device: detectDevice(), ...honest };
}

/** Alleen voor tests: vergeet de bron van dit bezoek. */
export function __resetStoredSource() {
  try {
    window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // niets te doen
  }
}
