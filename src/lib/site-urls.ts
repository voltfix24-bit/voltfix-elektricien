/**
 * Eén bron voor alle publieke, indexeerbare URL's van de site.
 * Wordt gebruikt door /sitemap.xml én door de IndexNow-ping naar Bing,
 * zodat beide altijd dezelfde pagina's kennen.
 */

export const BASE_URL = "https://www.voltfix.nl";

export type SitemapEntry = {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
  /**
   * Alleen invullen wanneer de pagina-inhoud werkelijk is gewijzigd.
   * Nooit afleiden uit de huidige datum of buildtijd.
   */
  lastmod?: string;
};

export const SITE_ENTRIES: SitemapEntry[] = [
  // Nederlands
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/elektricien-amsterdam", changefreq: "monthly", priority: "0.9" },
  { path: "/elektricien-amsterdam-centrum", changefreq: "monthly", priority: "0.8" },
  { path: "/elektricien-amsterdam-zuid", changefreq: "monthly", priority: "0.8" },
  { path: "/elektricien-amsterdam-west", changefreq: "monthly", priority: "0.8" },
  { path: "/elektricien-amsterdam-oost", changefreq: "monthly", priority: "0.8" },
  { path: "/elektricien-amsterdam-noord", changefreq: "monthly", priority: "0.8" },
  { path: "/elektricien-amsterdam-de-pijp", changefreq: "monthly", priority: "0.8" },
  { path: "/elektricien-amsterdam-ijburg", changefreq: "monthly", priority: "0.8" },
  { path: "/elektricien-amstelveen", changefreq: "monthly", priority: "0.8" },
  { path: "/elektricien-haarlem", changefreq: "monthly", priority: "0.8" },
  { path: "/spoed-elektricien-amsterdam", changefreq: "monthly", priority: "0.9" },
  { path: "/groepenkast-amsterdam", changefreq: "monthly", priority: "0.9" },
  { path: "/perilex-amsterdam", changefreq: "monthly", priority: "0.9" },
  { path: "/perilex-stekker", changefreq: "monthly", priority: "0.7" },
  { path: "/stroomstoring-amsterdam", changefreq: "monthly", priority: "0.9" },
  { path: "/laadpaal-amsterdam", changefreq: "monthly", priority: "0.9" },
  { path: "/keuring-amsterdam", changefreq: "monthly", priority: "0.9" },
  { path: "/groepenkast-samenstellen", changefreq: "monthly", priority: "0.7" },
  { path: "/veelgestelde-vragen", changefreq: "monthly", priority: "0.7" },
  { path: "/over-ons", changefreq: "yearly", priority: "0.5" },
  { path: "/contact", changefreq: "yearly", priority: "0.7" },
  { path: "/privacybeleid", changefreq: "yearly", priority: "0.3" },
  { path: "/cookiebeleid", changefreq: "yearly", priority: "0.3" },
  // English
  { path: "/en-gb", changefreq: "weekly", priority: "0.9" },
  { path: "/en-gb/elektricien-amsterdam", changefreq: "monthly", priority: "0.8" },
  { path: "/en-gb/spoed-elektricien-amsterdam", changefreq: "monthly", priority: "0.8" },
  { path: "/en-gb/groepenkast-amsterdam", changefreq: "monthly", priority: "0.8" },
  { path: "/en-gb/perilex-amsterdam", changefreq: "monthly", priority: "0.8" },
  { path: "/en-gb/stroomstoring-amsterdam", changefreq: "monthly", priority: "0.8" },
  { path: "/en-gb/ev-charger-installation-amsterdam", changefreq: "monthly", priority: "0.8" },
  { path: "/en-gb/electrical-inspection-amsterdam", changefreq: "monthly", priority: "0.8" },
  { path: "/en-gb/how-to-assemble-a-fuse-box", changefreq: "monthly", priority: "0.6" },
  { path: "/en-gb/electrician-amsterdam-zuid", changefreq: "monthly", priority: "0.8" },
  { path: "/en-gb/electrician-amsterdam-west", changefreq: "monthly", priority: "0.8" },
  { path: "/en-gb/electrician-amsterdam-centre", changefreq: "monthly", priority: "0.8" },
  { path: "/en-gb/electrician-amstelveen", changefreq: "monthly", priority: "0.8" },
  { path: "/en-gb/faq", changefreq: "monthly", priority: "0.6" },
  { path: "/en-gb/over-ons", changefreq: "yearly", priority: "0.4" },
  { path: "/en-gb/contact", changefreq: "yearly", priority: "0.6" },
  { path: "/en-gb/privacy-policy", changefreq: "yearly", priority: "0.3" },
  { path: "/en-gb/cookie-policy", changefreq: "yearly", priority: "0.3" },
];

/** Absolute URL's van alle indexeerbare pagina's. */
export function allSiteUrls(): string[] {
  return SITE_ENTRIES.map((e) => `${BASE_URL}${e.path === "/" ? "/" : e.path}`);
}
