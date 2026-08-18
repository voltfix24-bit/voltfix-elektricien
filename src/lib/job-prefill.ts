import type { Locale } from "@/lib/i18n";

/** Compact keys used in URLs, e.g. /contact?klus=perilex#offerte */
export type JobKey =
  | "spoed"
  | "groepenkast"
  | "perilex"
  | "stroomstoring"
  | "stopcontact"
  | "laadpaal"
  | "keuring"
  | "anders";

/**
 * Map a JobKey to the exact label used in the contact-form <select>.
 * Must stay in sync with formStrings.jobTypes in src/lib/i18n.ts.
 */
const LABELS: Record<Locale, Record<JobKey, string>> = {
  nl: {
    spoed: "Spoed / storing",
    groepenkast: "Groepenkast vervangen",
    perilex: "Perilex / kookgroep",
    stroomstoring: "Stroomstoring of kortsluiting",
    stopcontact: "Stopcontacten / verlichting",
    laadpaal: "Laadpaal",
    keuring: "Keuring / inspectie",
    anders: "Anders",
  },
  en: {
    spoed: "Emergency / fault",
    groepenkast: "Fuse box replacement",
    perilex: "Perilex / cooker circuit",
    stroomstoring: "Power outage or short circuit",
    stopcontact: "Sockets / lighting",
    laadpaal: "EV charger",
    keuring: "Inspection / certification",
    anders: "Other",
  },
};

export function jobLabelFor(key: JobKey, locale: Locale): string {
  return LABELS[locale][key];
}

/** Path → JobKey mapping for both NL and EN routes. */
function keyForPath(pathname: string): JobKey | null {
  const p = pathname.toLowerCase();
  if (p.includes("perilex")) return "perilex";
  if (p.includes("groepenkast")) return "groepenkast";
  if (p.includes("laadpaal") || p.includes("ev-charger")) return "laadpaal";
  if (p.includes("keuring") || p.includes("inspection")) return "keuring";
  // Stroomstoring vóór spoed: "stroomstoring" bevat ook "storing".
  if (
    p.includes("stroomstoring") ||
    p.includes("power-outage") ||
    p.includes("short-circuit")
  )
    return "stroomstoring";
  if (p.includes("spoed") || p.includes("emergency") || p.includes("storing")) return "spoed";
  if (p.includes("stopcontact") || p.includes("verlichting") || p.includes("socket") || p.includes("lighting"))
    return "stopcontact";
  return null;
}

/**
 * Resolve a prefilled klus label based on:
 *  1. explicit ?klus=<key> query param on the current URL (highest priority)
 *  2. document.referrer path (automatic, when user clicked from a service page)
 * Returns null on SSR or when nothing matches.
 */
export function resolvePrefilledKlus(locale: Locale): string | null {
  if (typeof window === "undefined") return null;

  // 1. Explicit query param
  const params = new URLSearchParams(window.location.search);
  const explicit = params.get("klus");
  if (explicit && (explicit as JobKey) in LABELS[locale]) {
    return LABELS[locale][explicit as JobKey];
  }

  // 2. Referrer-based inference (same origin only)
  try {
    const ref = document.referrer;
    if (!ref) return null;
    const url = new URL(ref);
    if (url.origin !== window.location.origin) return null;
    const key = keyForPath(url.pathname);
    if (key) return LABELS[locale][key];
  } catch {
    // ignore malformed referrer
  }
  return null;
}

/**
 * Build an offerte href that prefills "Soort klus" based on the given path
 * (typically the current page). Falls back to a plain hash link.
 */
export function contactQuoteHref(
  contactTo: "/contact" | "/en-gb/contact",
  currentPath: string,
  explicitKey?: JobKey,
): string {
  const key = explicitKey ?? keyForPath(currentPath);
  return key ? `${contactTo}?klus=${key}#offerte` : `${contactTo}#offerte`;
}
