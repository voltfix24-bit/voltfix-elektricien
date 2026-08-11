// Central VoltFix business data — used across pages, CTAs and structured data.

export const business = {
  name: "VoltFix",
  legalName: "VoltFix V.O.F",
  alternateName: "VoltFix",
  // Primaire domeinversie is www. Non-www (https://voltfix.nl) moet op
  // hostingniveau met een 301 naar https://www.voltfix.nl/* worden geredirect.
  domain: "www.voltfix.nl",
  url: "https://www.voltfix.nl",
  city: "Amsterdam",
  region: "Noord-Holland",
  country: "NL",
  // Bezoek- en servicelocatie in Amsterdam — uitsluitend op afspraak.
  streetAddress: "Jacob van Lennepkade 142",
  postalCode: "1053 MV",
  visitByAppointment: true,
  // Officieel geregistreerd bedrijfsadres bij de Kamer van Koophandel.
  registeredAddress: {
    streetAddress: "Mauritius 17",
    postalCode: "1505 VK",
    city: "Zaandam",
    region: "Noord-Holland",
    country: "NL",
  },
  email: "info@voltfix.nl",
  phoneDisplay: "06 45 19 35 89",
  phoneE164: "+31645193589",
  phoneInternational: "+31 6 45 19 35 89",
  kvk: "95572589",
  btw: "NL867186549B01",

  googleBusinessProfile: "https://share.google/5j0CCSArsSiNaj4dw",
  // Bing Places-vermelding. Vul hier de publieke URL in zodra de vermelding
  // door Bing is geverifieerd; hij wordt dan automatisch opgenomen in sameAs.
  bingPlaces: "",
  // Directe "sterren"-link uit Google Bedrijfsprofiel — opent het reviewformulier.
  googleReviewLink: "https://g.page/r/CU3tzGD_WrDdEAE/review",
  instagram: "https://www.instagram.com/voltfix_elektricien",
  linkedin: "https://www.linkedin.com/company/voltfix/",
  certifications: [
    "VCA** — Veiligheid, Gezondheid & Milieu Checklist Aannemers (twee sterren)",
    "ISO 9001 — Kwaliteitsmanagementsysteem",
    "Erkend Leerbedrijf (SBB) — opleider elektrotechniek",
    "NEN 1010 — Laagspanningsinstallaties",
    "NEN 3140 — Inspectie elektrische installaties",
    "InstallQ / Sterkin gecertificeerd installateur",
    "KvK-geregistreerd",
    "BTW-plichtig ondernemer",
  ],
  // Genormaliseerde credentials — gebruikt in JSON-LD hasCredential met recognizedBy.
  credentials: [
    {
      name: "VCA** (twee sterren)",
      abbrev: "VCA**",
      description:
        "Veiligheid, Gezondheid en Milieu Checklist Aannemers — niveau twee sterren voor operationeel leidinggevenden.",
      recognizedBy: "SSVV (Stichting Samenwerken Voor Veiligheid)",
      recognizedByUrl: "https://www.ssvv.nl/",
      url: "https://www.ssvv.nl/vca",
    },
    {
      name: "ISO 9001",
      abbrev: "ISO 9001",
      description: "Internationale norm voor kwaliteitsmanagementsystemen.",
      recognizedBy: "International Organization for Standardization (ISO)",
      recognizedByUrl: "https://www.iso.org/",
      url: "https://www.iso.org/iso-9001-quality-management.html",
    },
    {
      name: "Erkend Leerbedrijf",
      abbrev: "SBB Erkend Leerbedrijf",
      description:
        "Officieel erkend leerbedrijf voor mbo-studenten elektrotechniek; opleidingsplaats en begeleiding.",
      recognizedBy: "Samenwerkingsorganisatie Beroepsonderwijs Bedrijfsleven (SBB)",
      recognizedByUrl: "https://www.s-bb.nl/",
      url: "https://www.s-bb.nl/bedrijven/erkenning/",
    },
  ],
  // Vaste monteurs — zichtbare E-E-A-T-signalen (Person JSON-LD + byline).
  team: [
    {
      id: "hassan",
      name: "Hassan",
      jobTitle: "Elektricien",
      jobTitleEn: "Electrician",
      photo: "/images/team/hassan-monteur.jpg",
      // Gestart als elektricien in september 2010 — ervaring wordt hieruit berekend.
      careerStartYear: 2010,
      get yearsExperience() {
        return new Date().getFullYear() - 2010;
      },
      bioNl:
        "Elektricien bij VoltFix, actief in de installatietechniek sinds 2010. VCA-gecertificeerd en opgeleid als Technicus Elektrotechniek (mbo niveau 4).",
      bioEn:
        "Electrician at VoltFix, working in electrical installation since 2010. VCA-certified and trained as an Electrical Technician (MBO level 4).",
      knowsAbout: [
        "Elektrische installaties",
        "Groepenkast vervangen",
        "Storingsherstel",
        "Inspectie NEN 1010 / NEN 3140",
        "Veiligheid",
      ],
      // Vul in zodra de publieke LinkedIn-URL bekend is; leeg = niet in sameAs.
      linkedin: "",
      // Alleen certificaten met een verifieerbare uitgever en geldigheidsdatum.
      credentials: [
        {
          id: "vca-cert",
          name: "VCA Veiligheid voor Operationeel Leidinggevenden",
          issuer: "NIKTA",
          issuerType: "Organization" as const,
          validFrom: "2018-11-01",
          validUntil: "2028-11-01",
        },
        {
          id: "mbo4-cert",
          name: "Technicus Elektrotechniek (mbo niveau 4)",
          issuer: "Deltion College",
          issuerType: "EducationalOrganization" as const,
          validFrom: "2024-02-01",
        },
      ],
    },
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

// Eén primaire tijdbelofte — overal identiek gebruiken in hero, FAQ en CTA's.
// Nuances per wijk staan alleen in <ResponseTimes />, en nooit langer dan 60 min
// zonder dat het expliciet als uitzondering is gelabeld.
export const responsePromiseMinutes = 60;
export const responsePromiseNl = "Bij spoed binnen 60 minuten in heel Amsterdam";
export const responsePromiseEn = "For emergencies: on site within 60 minutes across Amsterdam";
export const responsePromiseShortNl = "binnen 60 minuten bij spoed";
export const responsePromiseShortEn = "within 60 minutes for emergencies";

// WhatsApp Business-nummer blijft onveranderd, ook als het belnummer wijzigt.
export const whatsappNumber = "31686302148";

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
// Google review link met UTM-tracking
// ---------------------------------------------------------------------------
// De g.page-URL van Google negeert querystrings zelf, maar GA4/GTM leggen de
// uitgaande klik-URL vast. Zo zie je per kanaal (WhatsApp, e-mail, QR, /review
// redirect) hoeveel reviews-klikken je krijgt.

export type ReviewUtm = {
  /** utm_source, bv. "whatsapp", "email", "qr", "invoice". Default: "website". */
  source?: string;
  /** utm_medium, bv. "post-job". Default: "post-job". */
  medium?: string;
  /** utm_campaign, bv. "review-request". */
  campaign?: string;
  /** utm_content, bv. de CTA-locatie "footer" of "thank-you-page". */
  content?: string;
};

export function reviewHref(utm?: ReviewUtm) {
  const params = new URLSearchParams();
  params.set("utm_source", utm?.source ?? "website");
  params.set("utm_medium", utm?.medium ?? "post-job");
  params.set("utm_campaign", utm?.campaign ?? "review-request");
  if (utm?.content) params.set("utm_content", utm.content);
  return `${business.googleReviewLink}?${params.toString()}`;
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
  { to: "/groepenkast-amsterdam", label: "Groepenkast" },
  { to: "/perilex-amsterdam", label: "Perilex" },
  { to: "/stroomstoring-amsterdam", label: "Stroomstoring" },
  { to: "/over-ons", label: "Over ons" },
  { to: "/contact", label: "Contact" },
] as const;
