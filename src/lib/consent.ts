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

export function saveConsent(choice: ConsentCategories): StoredConsent {
  const stored: StoredConsent = {
    ...choice,
    timestamp: new Date().toISOString(),
    version: CONSENT_VERSION,
  };
  if (typeof window !== "undefined") {
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
