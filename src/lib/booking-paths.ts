/**
 * Single source of truth: which routes expose the inline booking flow
 * (SchedulePicker rendered inside a ScheduleDisclosure with anchor
 * #installatiemoment). On these pages the third CTA switches from
 * "Offerte" to "Plan afspraak" / "Book installation".
 *
 * Excluded by design:
 *  - /spoed-* and /stroomstoring-* → bel-first, agenda past niet bij urgentie
 *  - transactionele / utility pagina's (contact, review, unsubscribe, seo-monitor, postocode)
 *  - /perilex-zelf-aansluiten (heeft eigen DIY-wizard, geen boeking)
 */
const EXCLUDED_PREFIXES = [
  "/spoed-elektricien-amsterdam",
  "/en-gb/spoed-elektricien-amsterdam",
  "/stroomstoring-amsterdam",
  "/en-gb/stroomstoring-amsterdam",
  "/contact",
  "/en-gb/contact",
  "/review",
  
  "/seo-monitor",
  "/postocode-check",
  "/perilex-zelf-aansluiten",
];

export function hasBookingFlow(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, "") || "/";
  for (const ex of EXCLUDED_PREFIXES) {
    if (p === ex || p.startsWith(ex + "/")) return false;
  }
  return true;
}

/**
 * Pagina's die hun eigen inline SchedulePicker al renderen — de globale
 * booking-sectie (in __root.tsx) wordt daar overgeslagen om dubbele
 * rendering te voorkomen.
 */
const INLINE_BOOKING_PATHS = new Set([
  "/perilex-amsterdam",
  "/en-gb/perilex-amsterdam",
]);

export function hasInlineBooking(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, "") || "/";
  return INLINE_BOOKING_PATHS.has(p);
}

export function shouldRenderGlobalBooking(pathname: string): boolean {
  return hasBookingFlow(pathname) && !hasInlineBooking(pathname);
}
