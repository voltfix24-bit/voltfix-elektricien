// Cookie consent + Google Consent Mode v2.
// Stores the visitor's choice in localStorage under CONSENT_STORAGE_KEY and
// forwards updates to gtag/dataLayer. The head script in analytics.ts sets
// the SSR-safe defaults (denied) *before* GA/GTM loads.

export const CONSENT_STORAGE_KEY = "voltfix.consent";
// Bumped to v2: added preferences category (personalization_storage).
// A stored v1 choice is treated as absent so the banner re-appears once and
// visitors can opt into the new category (or keep it denied).
export const CONSENT_VERSION = 2;
export const CONSENT_OPEN_EVENT = "voltfix:open-consent";

export type ConsentValue = "granted" | "denied";

export type ConsentCategories = {
  analytics_storage: ConsentValue;
  ad_storage: ConsentValue;
  ad_user_data: ConsentValue;
  ad_personalization: ConsentValue;
  personalization_storage: ConsentValue;
};

export type StoredConsent = ConsentCategories & {
  timestamp: string;
  version: number;
};

export const ACCEPT_ALL: ConsentCategories = {
  analytics_storage: "granted",
  ad_storage: "granted",
  ad_user_data: "granted",
  ad_personalization: "granted",
  personalization_storage: "granted",
};

export const REJECT_ALL: ConsentCategories = {
  analytics_storage: "denied",
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  personalization_storage: "denied",
};

export function readConsent(): StoredConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredConsent>;
    if (!parsed || parsed.version !== CONSENT_VERSION) return null;
    return {
      analytics_storage: parsed.analytics_storage === "granted" ? "granted" : "denied",
      ad_storage: parsed.ad_storage === "granted" ? "granted" : "denied",
      ad_user_data: parsed.ad_user_data === "granted" ? "granted" : "denied",
      ad_personalization: parsed.ad_personalization === "granted" ? "granted" : "denied",
      personalization_storage:
        parsed.personalization_storage === "granted" ? "granted" : "denied",
      timestamp: typeof parsed.timestamp === "string" ? parsed.timestamp : new Date().toISOString(),
      version: CONSENT_VERSION,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// De keuze doorzetten naar de server
// ---------------------------------------------------------------------------
// De browser stuurt niet zijn klik-id's mee (die bewijzen niets), maar de bon
// die de server bij de advertentieklik heeft uitgegeven. Alleen daarmee is de
// keuze van déze bezoeker te wijzigen.
//
// Een verzending geldt pas als geslaagd wanneer de server dat bevestigt. Lukt
// het niet, dan onthouden we alleen de keuze plus de bon — nooit opnieuw de
// geweigerde advertentie-id's — en proberen we het bij een volgend bezoek
// opnieuw.
// ---------------------------------------------------------------------------

export const CONSENT_TICKET_KEY = "voltfix_consent_ticket";
export const CONSENT_SEQ_KEY = "voltfix_consent_seq";
export const CONSENT_PENDING_KEY = "voltfix_consent_pending";
const CONSENT_ENDPOINT = "/api/public/track/consent";

let memoryTicket: string | null = null;

export function readConsentTicket(): string | null {
  if (memoryTicket) return memoryTicket;
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(CONSENT_TICKET_KEY);
  } catch {
    return null;
  }
}

export function saveConsentTicket(token: string) {
  memoryTicket = token;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CONSENT_TICKET_KEY, token);
  } catch {
    /* privémodus: de bon leeft dan alleen in het geheugen van deze pagina */
  }
}

function nextSeq(): number {
  if (typeof window === "undefined") return 1;
  let current = 0;
  try {
    current = Number.parseInt(window.localStorage.getItem(CONSENT_SEQ_KEY) ?? "0", 10) || 0;
  } catch {
    current = 0;
  }
  const next = current + 1;
  try {
    window.localStorage.setItem(CONSENT_SEQ_KEY, String(next));
  } catch {
    /* geen opslag: het volgnummer begint dan opnieuw, de server weigert een oude keuze */
  }
  return next;
}

type PendingConsent = {
  token: string;
  seq: number;
  adUserData: ConsentValue;
  adStorage: ConsentValue | null;
};

function rememberPending(pending: PendingConsent) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CONSENT_PENDING_KEY, JSON.stringify(pending));
  } catch {
    /* niets te doen */
  }
}

function forgetPending() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CONSENT_PENDING_KEY);
  } catch {
    /* niets te doen */
  }
}

export function readPendingConsent(): PendingConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_PENDING_KEY);
    const parsed = raw ? (JSON.parse(raw) as PendingConsent) : null;
    return parsed && typeof parsed.token === "string" && typeof parsed.seq === "number" ? parsed : null;
  } catch {
    return null;
  }
}

export type ConsentSyncResult = "synced" | "stale" | "rejected" | "failed" | "skipped";

async function postConsent(pending: PendingConsent): Promise<ConsentSyncResult> {
  const body = JSON.stringify({
    token: pending.token,
    adUserData: pending.adUserData,
    adStorage: pending.adStorage,
    seq: pending.seq,
    version: CONSENT_VERSION,
  });
  try {
    const response = await fetch(CONSENT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
    // 409 = er is al een nieuwere keuze verwerkt; 401 = de bon is onbekend.
    // Beide zijn eindstanden: opnieuw proberen heeft geen zin.
    if (response.ok) return "synced";
    if (response.status === 409) return "stale";
    if (response.status === 400 || response.status === 401) return "rejected";
    return "failed";
  } catch {
    return "failed";
  }
}

/**
 * Meldt de nieuwe advertentiekeuze aan de server. Pas na bevestiging van de
 * server geldt de synchronisatie als geslaagd; sendBeacon wordt hier bewust
 * niet gebruikt, want dat geeft geen antwoord terug.
 */
export async function syncAdConsentToServer(choice: ConsentCategories): Promise<ConsentSyncResult> {
  if (typeof window === "undefined") return "skipped";
  const token = readConsentTicket();
  if (!token) return "skipped";
  const pending: PendingConsent = {
    token,
    seq: nextSeq(),
    adUserData: choice.ad_user_data,
    adStorage: choice.ad_storage,
  };
  const result = await postConsent(pending);
  if (result === "failed") rememberPending(pending);
  else forgetPending();
  return result;
}

/**
 * Probeert een eerder mislukte synchronisatie alsnog af te maken. Wordt bij het
 * opstarten van de app aangeroepen, zodat een intrekking die de server nooit
 * bereikte niet stilletjes verloren gaat.
 */
export async function flushPendingConsent(): Promise<ConsentSyncResult> {
  const pending = readPendingConsent();
  if (!pending) return "skipped";
  const result = await postConsent(pending);
  if (result !== "failed") forgetPending();
  return result;
}

export function saveConsent(choice: ConsentCategories): StoredConsent {
  const stored: StoredConsent = {
    ...choice,
    timestamp: new Date().toISOString(),
    version: CONSENT_VERSION,
  };
  if (typeof window !== "undefined") {
    // Eerst de server op de hoogte brengen: daarna wist de opslag mogelijk het
    // klik-id waarmee de keuze aan het dossier te koppelen is.
    syncAdConsentToServer(choice);
    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(stored));
    } catch {
      /* ignore quota / private mode */
    }
    // Push consent update to GTM/GA (Consent Mode v2).
    type DL = { push: (...args: unknown[]) => void };
    const w = window as unknown as { dataLayer?: DL; gtag?: (...args: unknown[]) => void };
    w.dataLayer = w.dataLayer ?? { push: () => {} };
    if (typeof w.gtag !== "function") {
      w.gtag = (...args: unknown[]) => w.dataLayer!.push(args);
    }
    w.gtag("consent", "update", choice);
    (w.dataLayer as DL).push({ event: "consent_update", ...choice });
  }
  return stored;
}

export function openConsentPreferences() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CONSENT_OPEN_EVENT));
}

/**
 * Inline SSR script — must run BEFORE GA/GTM loaders. Sets Consent Mode v2
 * defaults (denied) and applies any stored choice from localStorage.
 */
export const consentDefaultsInlineScript = `
window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments);}
window.gtag=window.gtag||gtag;
gtag('set','url_passthrough',true);
try{

  var raw=window.localStorage.getItem('${CONSENT_STORAGE_KEY}');
  var c=raw?JSON.parse(raw):null;
  var v=${CONSENT_VERSION};
  var ok=c&&c.version===v;
  var g=function(k){return ok&&c[k]==='granted'?'granted':'denied';};
  gtag('consent','default',{
    ad_storage:g('ad_storage'),
    ad_user_data:g('ad_user_data'),
    ad_personalization:g('ad_personalization'),
    analytics_storage:g('analytics_storage'),
    personalization_storage:g('personalization_storage'),
    functionality_storage:'granted',
    security_storage:'granted',
    wait_for_update:500,
    region:['NL','BE','DE','FR','AT','BG','HR','CY','CZ','DK','EE','FI','GR','HU','IE','IT','LV','LT','LU','MT','PL','PT','RO','SK','SI','ES','SE','IS','LI','NO','GB']
  });
}catch(e){
  gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',personalization_storage:'denied',functionality_storage:'granted',security_storage:'granted',wait_for_update:500});
}
`.replace(/\n\s*/g, "");
