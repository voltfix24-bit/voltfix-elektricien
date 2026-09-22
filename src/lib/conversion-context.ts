// ---------------------------------------------------------------------------
// Device- en bronherkenning voor conversietracking (browser-only)
// ---------------------------------------------------------------------------
// GA4/GTM meten dit ook, maar alleen achter analytics-consent en met vertraging.
// Deze lichte first-party context laat het conversiedashboard direct zien via
// welk apparaat en welke bron een Bel- of WhatsApp-klik binnenkomt.
// ---------------------------------------------------------------------------

import { adStorageDecision } from "./ad-click";

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
  /**
   * Het klik-id van déze aanraking. Twee advertentieklikken met dezelfde
   * campagneparameters zijn pas te onderscheiden aan hun klik-id.
   */
  clickId?: string | null;
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

// ---------------------------------------------------------------------------
// Documentlanding versus navigatie binnen de app
// ---------------------------------------------------------------------------
// Bij doorklikken binnen de app blijft `document.referrer` gewoon staan op de
// verwijzer van de eerste pagina. Zonder onderscheid zou een bezoeker die via
// een advertentie binnenkwam en daarna doorklikt plotseling als "organisch via
// Google" tellen. We leggen daarom bij het eerste meetmoment vast met welke
// URL en welke verwijzer dit document begon. Verandert alleen de URL, dan is
// het interne navigatie. Verandert ook de verwijzer, dan is het echt een
// nieuwe landing.
// ---------------------------------------------------------------------------

type Landing = { href: string; referrer: string };
let landing: Landing | null = null;

function currentHref(): string {
  const loc = window.location as unknown as { href?: string; pathname?: string; search?: string };
  return loc.href ?? `${loc.pathname ?? ""}${loc.search ?? ""}`;
}

/** True wanneer dit meetmoment nog bij de oorspronkelijke documentlanding hoort. */
export function isDocumentLanding(): boolean {
  if (typeof window === "undefined") return true;
  const referrer = typeof document === "undefined" ? "" : document.referrer || "";
  const href = currentHref();
  if (!landing) {
    landing = { href, referrer };
    return true;
  }
  // Andere verwijzer = een nieuw document, ook als de app er niet van weet.
  if (referrer !== landing.referrer) {
    landing = { href, referrer };
    return true;
  }
  return href === landing.href;
}

/** Alleen voor tests: vergeet de vastgelegde landing. */
export function __resetLanding() {
  landing = null;
}

/** Bepaalt de bron uit UTM-parameters, gclid en de referrer. */
export function detectSource(): Pick<
  ConversionContext,
  "source" | "referrerHost" | "utmSource" | "utmMedium" | "utmCampaign" | "clickId"
> {
  if (typeof window === "undefined") {
    return {
      source: "direct",
      referrerHost: null,
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      clickId: null,
    };
  }

  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get("utm_source");
  const utmMedium = params.get("utm_medium");
  const utmCampaign = params.get("utm_campaign");
  const clickId = params.get("gclid") ?? params.get("gbraid") ?? params.get("wbraid");
  const hasAdClick = Boolean(clickId);
  const referrerHost = document.referrer ? hostOf(document.referrer) : null;
  const currentHost = window.location.hostname.replace(/^www\./, "").toLowerCase();
  const landed = isDocumentLanding();

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
  } else if (!landed) {
    // Navigatie binnen de app: de verwijzer van de landing zegt niets over
    // deze pagina, dus we leiden er geen nieuwe herkomst uit af.
    source = "internal";
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

  return { source, referrerHost, utmSource, utmMedium, utmCampaign, clickId };
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
  "source" | "referrerHost" | "utmSource" | "utmMedium" | "utmCampaign" | "clickId"
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

/**
 * Toestemming bepaalt ook hier wat er bewaard mag worden. Het bronlabel ("via
 * een advertentie") blijft, want dat wijst niemand aan; het klik-id zelf gaat
 * er zonder toestemming uit.
 */
function forStorage(value: StoredSource): StoredSource {
  return adStorageDecision() === "granted" ? value : { ...value, clickId: null };
}

function storeSource(value: StoredSource) {
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(forStorage(value)));
  } catch {
    // Privémodus of geblokkeerde opslag: dan valt het terug op de meting nu.
  }
}

// ---------------------------------------------------------------------------
// Geschiedenis van herkomsten
// ---------------------------------------------------------------------------
// Komt dezelfde bezoeker later opnieuw binnen — via een tweede, andere
// advertentie of gewoon via Google — dan is dat nieuwe informatie. De oude
// herkomst mag die nooit overschrijven, maar gaat ook niet verloren: we
// bewaren de laatste vijf aanrakingen, met de nieuwste vooraan.
// ---------------------------------------------------------------------------

const HISTORY_KEY = "voltfix_src_history";
const MAX_HISTORY = 5;

export type SourceTouch = StoredSource & { at: string };

export function readSourceHistory(): SourceTouch[] {
  try {
    const raw = window.sessionStorage.getItem(HISTORY_KEY);
    const parsed = raw ? (JSON.parse(raw) as SourceTouch[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function sameTouch(a: StoredSource, b: StoredSource): boolean {
  return (
    a.source === b.source &&
    a.referrerHost === b.referrerHost &&
    a.utmSource === b.utmSource &&
    a.utmMedium === b.utmMedium &&
    a.utmCampaign === b.utmCampaign &&
    // Twee advertentieklikken met identieke campagneparameters zijn pas te
    // onderscheiden aan hun klik-id: dat maakt het een nieuwe aanraking.
    (a.clickId ?? null) === (b.clickId ?? null)
  );
}

function pushHistory(value: StoredSource) {
  try {
    const history = readSourceHistory();
    // Dezelfde herkomst opnieuw is geen nieuwe aanraking.
    if (history[0] && sameTouch(history[0], value)) return;
    const next = [{ ...forStorage(value), at: new Date().toISOString() }, ...history].slice(0, MAX_HISTORY);
    window.sessionStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    // Opslag geblokkeerd: de meting zelf gaat gewoon door.
  }
}

/** De bron van dit bezoek: één keer bepaald, daarna stabiel. */
export function resolveSource(): StoredSource {
  if (typeof window === "undefined") return detectSource();
  const stored = readStoredSource();
  const fresh = detectSource();

  // Een advertentieklik, campagne of externe verwijzing op déze pagina is
  // nieuwe, hardere informatie dan wat er al stond — ook als er al een
  // eerdere herkomst bekend was.
  const isNewTouch = fresh.source !== "direct" && fresh.source !== "internal";
  if (!stored || isNewTouch) {
    const value = isNewTouch ? fresh : stored ?? fresh;
    storeSource(value);
    pushHistory(value);
    return value;
  }
  // Doorklikken of taalwissel: de bestaande herkomst blijft leidend.
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

/**
 * Legt de landing vast zodra de app start — niet pas bij het eerste contact.
 *
 * Waarom dit vroeg moet: bij navigatie binnen de app blijft `document.referrer`
 * staan op de verwijzer van de eerste pagina. Wie via een advertentie
 * binnenkomt, doorklikt naar een andere taal en pas daarna belt, zou zonder
 * deze vroege vastlegging als "organisch via Google" tellen. De bron van het
 * bezoek wordt hier één keer bepaald en daarna hergebruikt.
 */
export function initTrafficContext(): StoredSource | null {
  if (typeof window === "undefined") return null;
  // Legt zowel de landing als de bron van dit bezoek vast.
  return resolveSource();
}

/** Alleen voor tests: vergeet de bron van dit bezoek. */
export function __resetStoredSource() {
  __resetLanding();
  try {
    window.sessionStorage.removeItem(SESSION_KEY);
    window.sessionStorage.removeItem(HISTORY_KEY);
  } catch {
    // niets te doen
  }
}
