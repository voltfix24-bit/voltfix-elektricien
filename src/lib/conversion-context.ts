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
  | "referral"
  | "internal"
  | "campaign";

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
  } else if (utmSource) {
    source = /google/i.test(utmSource)
      ? /maps|gbp|business/i.test(utmSource)
        ? "google-maps"
        : "google-organic"
      : "campaign";
  } else if (referrerHost) {
    if (referrerHost === currentHost) source = "internal";
    else if (/google\./.test(referrerHost)) {
      source = /maps\.google/.test(referrerHost) ? "google-maps" : "google-organic";
    } else if (/bing\.|duckduckgo\.|yahoo\./.test(referrerHost)) source = "bing";
    else if (SOCIAL_HOSTS.some((h) => referrerHost.includes(h))) source = "social";
    else source = "referral";
  }

  return { source, referrerHost, utmSource, utmMedium, utmCampaign };
}

export function getConversionContext(): ConversionContext {
  return { device: detectDevice(), ...detectSource() };
}
