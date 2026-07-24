// Central VoltFix business data — used across pages, CTAs and structured data.

export const business = {
  name: "VoltFix",
  legalName: "VoltFix Elektrotechniek",
  // Primaire domeinversie is www. Non-www (https://voltfix.nl) moet op
  // hostingniveau met een 301 naar https://www.voltfix.nl/* worden geredirect.
  domain: "www.voltfix.nl",
  url: "https://www.voltfix.nl",
  city: "Amsterdam",
  region: "Noord-Holland",
  country: "NL",
  streetAddress: "Jacob van Lennepkade 142",
  postalCode: "1053 MV",
  email: "info@voltfix.nl",
  phoneDisplay: "06 86 30 21 48",
  phoneE164: "+31686302148",
  kvk: "91447127",
  btw: "NL867186549B01",
  googleBusinessProfile: "https://share.google/5j0CCSArsSiNaj4dw",
  // Directe "sterren"-link uit Google Bedrijfsprofiel — opent het reviewformulier.
  googleReviewLink: "https://g.page/r/CU3tzGD_WrDdEAE/review",
  instagram: "https://www.instagram.com/voltfix_elektricien",
  linkedin: "https://www.linkedin.com/company/voltfix/",
  certifications: [
    "NEN 1010 — Laagspanningsinstallaties",
    "NEN 3140 — Inspectie elektrische installaties",
    "InstallQ / Sterkin gecertificeerd installateur",
    "KvK-geregistreerd",
    "BTW-plichtig ondernemer",
  ],
  tagline: "Snel, betrouwbaar en lokaal — 24/7 spoedservice in heel Amsterdam.",
  foundingDate: "2021",
  paymentAccepted: ["Cash", "Credit Card", "Invoice", "iDEAL", "Bank Transfer"],
  currenciesAccepted: "EUR",
  // Straal (km) van het servicegebied rond het hoofdkantoor.
  serviceRadiusKm: 25,
  // Exacte GeoCoordinates van Jacob van Lennepkade 142, 1053 MV Amsterdam.
  geo: { latitude: 52.3625, longitude: 4.8636 },
  hasMap: "https://www.google.com/maps/place/Jacob+van+Lennepkade+142,+1053+MV+Amsterdam",
  // Reguliere kantoor-/werktijden voor planning en offertes.
  // Spoedservice is los hiervan 24/7 bereikbaar (zie ContactPoint "emergency").
  openingHours: [
    { days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "08:00", closes: "18:00" },
    { days: ["Saturday"], opens: "09:00", closes: "17:00" },
  ],
} as const;

// Bouwt een absolute URL voor canonical/og:url op basis van de primaire (www) domeinversie.
export function absoluteUrl(path: string) {
  if (path === "/") return `${business.url}/`;
  return `${business.url}${path}`;
}

export const telHref = `tel:${business.phoneE164}`;
export const mailHref = `mailto:${business.email}`;

// Single source of truth: het WhatsApp Business-nummer is exact hetzelfde
// als het telefoonnummer op de website — afgeleid van phoneE164 (zonder '+').
export const whatsappNumber = business.phoneE164.replace(/^\+/, "");

// Officiële WhatsApp Business "click-to-chat" endpoint. Opent WhatsApp
// (Business) op mobiel en WhatsApp Web op desktop, met vooringevuld bericht.
// Docs: https://faq.whatsapp.com/5913398998672934
//
// UTM-parameters worden ook meegegeven: WhatsApp zelf negeert ze, maar
// GTM/GA4 leggen de uitgaande klik-URL vast, zodat je in Analytics per
// bron/medium/campagne kunt zien welke WhatsApp-CTA een conversie opleverde.
export type WhatsappUtm = {
  /** utm_source, bv. "website" of "google". Default: "website". */
  source?: string;
  /** utm_medium, bv. "whatsapp". Default: "whatsapp". */
  medium?: string;
  /** utm_campaign, bv. het paginapad "/perilex-amsterdam". */
  campaign?: string;
  /** utm_content, bv. de CTA-locatie "home-hero" of "mobile-cta-bar". */
  content?: string;
  /** utm_term, bv. de taal "nl" / "en". */
  term?: string;
};

export function whatsappHref(message?: string, utm?: WhatsappUtm) {
  const params = new URLSearchParams({ phone: whatsappNumber });
  if (message) params.set("text", message);
  params.set("utm_source", utm?.source ?? "website");
  params.set("utm_medium", utm?.medium ?? "whatsapp");
  if (utm?.campaign) params.set("utm_campaign", utm.campaign);
  if (utm?.content) params.set("utm_content", utm.content);
  if (utm?.term) params.set("utm_term", utm.term);
  return `https://api.whatsapp.com/send?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Gecodeerde Instagram / LinkedIn links met UTM-tags
// ---------------------------------------------------------------------------
// Deze helpers voegen utm-parameters toe zodat je in Google Analytics 4 en
// andere analytics-tools kunt zien welke pagina's en componenten verwijzen
// naar de sociale profielen. De 'raw' instagram/linkedin waarden in `business`
// blijven onveranderd voor schema.org sameAs.
//
// Voorbeeld:
//   socialHref("instagram", "footer", "/over-ons") ->
//     https://www.instagram.com/voltfix_elektricien?utm_source=voltfix.nl&utm_medium=social&utm_campaign=%2Fover-ons&utm_content=instagram&utm_term=footer
// ---------------------------------------------------------------------------

export type SocialUtm = {
  /** Paginapad waarop de link staat, bv. "/over-ons". */
  pagePath?: string;
  /** Component/locatie, bv. "footer", "contact", "about-social". */
  location?: string;
  /** Taal van de pagina, bv. "nl" of "en". */
  language?: string;
};

function buildSocialUrl(baseUrl: string, network: "instagram" | "linkedin", utm?: SocialUtm) {
  const params = new URLSearchParams({
    utm_source: business.domain,
    utm_medium: "social",
    utm_content: network,
  });
  if (utm?.pagePath) params.set("utm_campaign", utm.pagePath);
  if (utm?.location) params.set("utm_term", utm.location);
  if (utm?.language) params.set("utm_language", utm.language);
  return `${baseUrl}?${params.toString()}`;
}

export function instagramHref(utm?: SocialUtm) {
  return buildSocialUrl(business.instagram, "instagram", utm);
}

export function linkedinHref(utm?: SocialUtm) {
  return buildSocialUrl(business.linkedin, "linkedin", utm);
}

export const defaultWhatsappMessage =
  [
    "Hallo VoltFix 👋",
    "",
    "Ik wil graag een offerte / afspraak voor een elektra-klus in Amsterdam.",
    "",
    "• Type klus: ",
    "• Adres / wijk: ",
    "• Gewenste datum: ",
    "",
    "Alvast bedankt!",
  ].join("\n");

export const defaultWhatsappMessageEn =
  [
    "Hi VoltFix 👋",
    "",
    "I would like a quote / appointment for an electrical job in Amsterdam.",
    "",
    "• Type of job: ",
    "• Address / area: ",
    "• Preferred date: ",
    "",
    "Thanks in advance!",
  ].join("\n");

export const serviceAreas = [
  "Amsterdam Centrum",
  "Amsterdam-Zuid",
  "Amsterdam-West",
  "Amsterdam-Oost",
  "Amsterdam-Noord",
  "De Pijp",
  "Jordaan",
  "Oud-West",
  "Watergraafsmeer",
  "Bos en Lommer",
  "Amsterdam-Zuidoost",
  "IJburg",
  "Amstelveen",
  "Diemen",
  "Ouder-Amstel",
  "Zaandam",
];

export const navLinks = [
  { to: "/", label: "Home" },
  { to: "/spoed-elektricien-amsterdam", label: "Spoed" },
  { to: "/Groepenkast-Amsterdam", label: "Groepenkast" },
  { to: "/perilex-amsterdam", label: "Perilex" },
  { to: "/stroomstoring-amsterdam", label: "Stroomstoring" },
  { to: "/over-ons", label: "Over ons" },
  { to: "/contact", label: "Contact" },
] as const;
