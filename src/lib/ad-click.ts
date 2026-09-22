// ---------------------------------------------------------------------------
// Klik-id van Google Ads vasthouden (browser-only)
// ---------------------------------------------------------------------------
// Google hangt bij een advertentieklik een klik-id aan de landingspagina:
// `gclid`, of `gbraid` / `wbraid` op iOS. Zonder dat id is achteraf niet hard
// vast te stellen of een aanvraag uit een advertentie kwam.
//
// Twee regels die hier hard zijn:
// 1. Toestemming bepaalt de opslag. Heeft de bezoeker advertentiecookies
//    geweigerd, dan bewaren we niets en wissen we wat er stond. Zonder keuze
//    houden we het id alleen in het geheugen van deze pagina.
// 2. Dezelfde klik blijft dezelfde klik. Opnieuw laden of doorklikken maakt
//    geen nieuwe referentie en verzet het oorspronkelijke tijdstip niet.
// ---------------------------------------------------------------------------

import { AD_CLICK_STORAGE_KEY } from "./ad-identifier-storage";
import { readConsent, readConsentTicket, saveConsentTicket } from "./consent";

export type AdClick = {
  gclid: string | null;
  gbraid: string | null;
  wbraid: string | null;
  /** Korte code (4 tekens) die de bezoeker in het WhatsApp-bericht meestuurt. */
  ref: string | null;
  /** Oorspronkelijk tijdstip van de klik (ISO), of null. */
  at: string | null;
};

export const AD_CLICK_KEYS = ["gclid", "gbraid", "wbraid"] as const;
export type AdClickKey = (typeof AD_CLICK_KEYS)[number];

const STORAGE_KEY = "voltfix_ad_click";
/** Google's klikvenster is 90 dagen; daarna is het id waardeloos. */
const MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;
/** Klik-id's van Google zijn kort en alfanumeriek; alles anders negeren we. */
const ID_PATTERN = /^[A-Za-z0-9._-]{6,200}$/;

/** Zonder klinkers en zonder 0/1/I/O: geen leesfouten aan de telefoon. */
const REF_ALPHABET = "23456789BCDFGHJKLMNPQRSTVWXZ";
/**
 * Acht tekens uit 28 mogelijkheden. Vier tekens gaven bij een paar honderd
 * klikken al een reële kans op twee dezelfde codes; met acht is die kans
 * verwaarloosbaar. De server controleert daarnaast bij het opzoeken of een
 * code werkelijk maar naar één klik verwijst.
 */
export const AD_CLICK_REF_LENGTH = 8;
export const AD_CLICK_REF_PATTERN = /^[23456789BCDFGHJKLMNPQRSTVWXZ]{6,10}$/;

/** Willekeurige code uit een alfabet zonder verwarrende tekens. */
export function makeClickRef(random?: () => number): string {
  let out = "";
  if (!random && typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = new Uint8Array(AD_CLICK_REF_LENGTH);
    crypto.getRandomValues(bytes);
    for (const byte of bytes) out += REF_ALPHABET[byte % REF_ALPHABET.length];
    return out;
  }
  const rnd = random ?? Math.random;
  for (let i = 0; i < AD_CLICK_REF_LENGTH; i += 1) {
    out += REF_ALPHABET[Math.floor(rnd() * REF_ALPHABET.length)];
  }
  return out;
}

/** Normaliseert een met de hand ingetypte code (kleine letters, spaties). */
export function normalizeClickRef(value: string): string | null {
  const cleaned = value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  return AD_CLICK_REF_PATTERN.test(cleaned) ? cleaned : null;
}

type Stored = { gclid?: string; gbraid?: string; wbraid?: string; ref?: string; ts: number };

const EMPTY: AdClick = { gclid: null, gbraid: null, wbraid: null, ref: null, at: null };

/** Toestemmingstoestand voor het bewaren van advertentiegegevens. */
export type AdStorageDecision = "granted" | "denied" | "unknown";

export function adStorageDecision(): AdStorageDecision {
  const consent = readConsent();
  if (!consent) return "unknown";
  return consent.ad_storage === "granted" ? "granted" : "denied";
}

/**
 * Zonder keuze bewaren we het klik-id alleen zolang de pagina open is. Accepteert
 * de bezoeker later alsnog, dan verhuist het naar de gewone opslag.
 */
let memoryClick: Stored | null = null;

/** Twee klik-id's die bij dezelfde klik horen? */
function sameClick(a: Stored, b: Stored): boolean {
  return AD_CLICK_KEYS.every((key) => (a[key] ?? null) === (b[key] ?? null));
}

function read(): Stored | null {
  if (typeof window === "undefined") return null;
  const decision = adStorageDecision();
  if (decision === "denied") {
    // Weigering: niets bewaren, ook niet wat er nog stond.
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* privémodus */
    }
    return null;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return memoryClick;
    const parsed = JSON.parse(raw) as Stored;
    if (!parsed || typeof parsed.ts !== "number") return memoryClick;
    if (Date.now() - parsed.ts > MAX_AGE_MS) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return memoryClick;
  }
}

function write(value: Stored) {
  const decision = adStorageDecision();
  memoryClick = value;
  if (decision !== "granted") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* privémodus zonder opslag */
  }
}

/**
 * Leest het klik-id uit de huidige URL en bewaart het, voor zover de
 * toestemming dat toelaat. Dezelfde klik behoudt zijn referentie én zijn
 * oorspronkelijke tijdstip; een nieuwe advertentieklik vervangt de vorige.
 */
export function captureAdClick(search?: string): AdClick {
  if (typeof window === "undefined") return EMPTY;
  const params = new URLSearchParams(search ?? window.location.search);
  const found: Stored = { ts: Date.now() };
  let any = false;
  for (const key of AD_CLICK_KEYS) {
    const value = params.get(key)?.trim();
    if (value && ID_PATTERN.test(value)) {
      found[key] = value;
      any = true;
    }
  }
  if (any) {
    const existing = read();
    if (existing && sameClick(existing, found)) {
      // Herladen of terugnavigeren: alles blijft zoals het was.
      write(existing);
    } else {
      // Eén code per advertentieklik: die noemt de bezoeker in WhatsApp.
      found.ref = makeClickRef();
      write(found);
    }
  } else {
    // Geen nieuwe klik: bestaande opslag alleen opnieuw doorzetten wanneer de
    // bezoeker inmiddels toestemming gaf.
    const existing = read();
    if (existing) write(existing);
  }
  return readAdClick();
}

/** Het bewaarde klik-id, of lege velden wanneer er geen advertentieklik was. */
export function readAdClick(): AdClick {
  const stored = read();
  if (!stored) return EMPTY;
  return {
    gclid: stored.gclid ?? null,
    gbraid: stored.gbraid ?? null,
    wbraid: stored.wbraid ?? null,
    ref: stored.ref ?? null,
    at: stored.ts ? new Date(stored.ts).toISOString() : null,
  };
}

/** Alleen voor tests: maakt het geheugen leeg. */
export function __resetAdClickMemory() {
  memoryClick = null;
}

/**
 * De werkelijke advertentietoestemming van deze bezoeker op dit moment.
 * Zonder cookiekeuze is die onbekend — dat is iets anders dan toestemming.
 */
export function adUserDataConsent(): "granted" | "denied" | null {
  const consent = readConsent();
  if (!consent) return null;
  return consent.ad_user_data === "granted" ? "granted" : "denied";
}

/**
 * Hangt het klik-id én de werkelijke toestemming aan een formulierinzending.
 * Doet niets zonder klik. De toestemming gaat altijd expliciet mee: de server
 * mag nooit aannemen dat een meegestuurd klik-id toestemming bewijst.
 */
export function appendAdClick(form: FormData): void {
  const click = readAdClick();
  let any = false;
  for (const key of AD_CLICK_KEYS) {
    const value = click[key];
    if (value) {
      form.set(key, value);
      any = true;
    }
  }
  if (!any) return;
  const consent = adUserDataConsent();
  if (consent) form.set("adConsentAdUserData", consent);
}

/** Zelfde gegevens als JSON, voor inzendingen die geen formulier gebruiken. */
export function adClickPayload(): (AdClick & { consentAdUserData: "granted" | "denied" | null }) | null {
  const click = readAdClick();
  if (!click.gclid && !click.gbraid && !click.wbraid) return null;
  return { ...click, consentAdUserData: adUserDataConsent() };
}

/**
 * Kiest de klik die bij een ingetypte code hoort. Wijst dezelfde code naar
 * meer dan één advertentieklik, dan is er geen bewijs: we kiezen dan bewust
 * NIET de nieuwste, maar melden de dubbelzinnigheid.
 */
export function pickClickByRef<T extends { gclid?: string | null; gbraid?: string | null; wbraid?: string | null }>(
  rows: T[],
): { ambiguous: boolean; click: T | null; candidates: T[] } {
  const distinct = new Set(rows.map((row) => String(row.gclid || row.gbraid || row.wbraid)));
  if (distinct.size > 1) return { ambiguous: true, click: null, candidates: rows };
  return { ambiguous: false, click: rows[0] ?? null, candidates: rows };
}
