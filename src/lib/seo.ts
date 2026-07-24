import { business, serviceAreas } from "./business";
import { NL_PATHS } from "./i18n";

export { absoluteUrl } from "./business";

// JSON-LD builders for structured data. Returned objects are stringified
// inside route head() scripts so they render server-side in the HTML.

// Absolute URL of the branded Open Graph / social share image.
export const ogImage = `${business.url}/og-voltfix.jpg`;
export const ogImageWidth = 1536;
export const ogImageHeight = 1024;

// hreflang alternates linking a page to its counterpart in the other
// language. Pass the canonical *NL* path. If the NL path has no EN
// counterpart (e.g. neighbourhood pages), only nl-NL + x-default are
// emitted — never advertise an EN URL that doesn't exist.
// NL → EN slug overrides for pages whose EN path differs from the NL slug.
const EN_SLUG_OVERRIDES: Record<string, string> = {
  "/laadpaal-amsterdam": "/en-gb/ev-charger-installation-amsterdam",
  "/keuring-amsterdam": "/en-gb/electrical-inspection-amsterdam",
  "/groepenkast-samenstellen": "/en-gb/how-to-assemble-a-fuse-box",
  // Hyperlocal expat landing pages — EN slugs use "electrician" and British "centre".
  "/elektricien-amsterdam-zuid": "/en-gb/electrician-amsterdam-zuid",
  "/elektricien-amsterdam-west": "/en-gb/electrician-amsterdam-west",
  "/elektricien-amsterdam-centrum": "/en-gb/electrician-amsterdam-centre",
  "/elektricien-amstelveen": "/en-gb/electrician-amstelveen",
};

// Reverse map for EN → NL hreflang lookup on English pages.
const NL_FROM_EN_OVERRIDES: Record<string, string> = Object.fromEntries(
  Object.entries(EN_SLUG_OVERRIDES).map(([nl, en]) => [en, nl]),
);
export function nlPathForEn(enPath: string): string | undefined {
  return NL_FROM_EN_OVERRIDES[enPath];
}

export function altLinks(nlPath: string) {
  const override = EN_SLUG_OVERRIDES[nlPath];
  const hasEn = override !== undefined || (NL_PATHS as readonly string[]).includes(nlPath);
  const nlHref = absoluteUrlFromBusiness(nlPath);
  const links = [{ rel: "alternate", hrefLang: "nl-NL", href: nlHref }];
  if (hasEn) {
    const enPath = override ?? (nlPath === "/" ? "/en-gb" : `/en-gb${nlPath}`);
    links.push({ rel: "alternate", hrefLang: "en-GB", href: absoluteUrlFromBusiness(enPath) });
  }
  links.push({ rel: "alternate", hrefLang: "x-default", href: nlHref });
  return links;
}

// Per-page og:locale + og:locale:alternate. Pass "nl" for Dutch pages and
// "en" for English pages. Meta with the same property dedupes, so overriding
// the root defaults is enough on EN routes.
export function localeMeta(locale: "nl" | "en") {
  const current = locale === "en" ? "en_GB" : "nl_NL";
  const alternate = locale === "en" ? "nl_NL" : "en_GB";
  return [
    { property: "og:locale", content: current },
    { property: "og:locale:alternate", content: alternate },
  ];
}

// Complete OpenGraph + Twitter Card meta bundle for a leaf route.
// Returns all tags needed so every share preview uses correct brand data.
export function pageMeta(opts: {
  title: string;
  description: string;
  path: string;
  locale?: "nl" | "en";
  ogTitle?: string;
  ogDescription?: string;
  ogType?: "website" | "article" | "service";
  ogImage?: string;
}) {
  const locale = opts.locale ?? "nl";
  const title = opts.title;
  const description = opts.description;
  const ogTitle = opts.ogTitle ?? title;
  const ogDescription = opts.ogDescription ?? description;
  const ogType = opts.ogType ?? "article";
  const image = opts.ogImage ?? ogImage;
  const url = absoluteUrlFromBusiness(opts.path);

  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: ogTitle },
    { property: "og:description", content: ogDescription },
    { property: "og:url", content: url },
    { property: "og:type", content: ogType },
    { property: "og:site_name", content: business.name },
    ...localeMeta(locale),
    { property: "og:image", content: image },
    { property: "og:image:width", content: String(ogImageWidth) },
    { property: "og:image:height", content: String(ogImageHeight) },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: ogTitle },
    { name: "twitter:description", content: ogDescription },
    { name: "twitter:image", content: image },
  ];
}

function absoluteUrlFromBusiness(path: string) {
  if (path === "/") return `${business.url}/`;
  return `${business.url}${path}`;
}

// Gecertificeerde diensten die VoltFix in Amsterdam aanbiedt. Wordt gebruikt
// voor de OfferCatalog in het LocalBusiness/ElectricalContractor schema
// zodat AI-scrapers (ChatGPT, Perplexity, Google AI Overviews) precies weten
// welke diensten er onder welke URL worden aangeboden.
const offeredServices = [
  {
    name: "Groepenkast vervangen & uitbreiden",
    description:
      "Complete vervanging of uitbreiding van de groepenkast (meterkast) volgens NEN 1010, inclusief aardlekautomaten en installatiekeuring.",
    path: "/Groepenkast-Amsterdam",
  },
  {
    name: "Perilex aansluiting installeren",
    description:
      "Aanleg en aansluiting van een Perilex-stopcontact (400V) voor inductiekookplaat, fornuis of oven — inclusief groep in de meterkast.",
    path: "/perilex-amsterdam",
  },
  {
    name: "Spoed elektricien 24/7",
    description:
      "24/7 spoedservice bij stroomstoringen, kortsluiting en uitgevallen groepen in heel Amsterdam.",
    path: "/spoed-elektricien-amsterdam",
  },
  {
    name: "Stroomstoring verhelpen",
    description:
      "Diagnose en herstel van stroomstoringen, doorgeslagen aardlekschakelaars en kortsluiting.",
    path: "/stroomstoring-amsterdam",
  },
  {
    name: "Laadpaal installatie",
    description:
      "Installatie van een elektrische laadpaal (wallbox) voor thuis of bedrijf, inclusief aparte groep en NEN 1010-controle.",
    path: "/laadpaal-amsterdam",
  },
  {
    name: "NEN 1010 / NEN 3140 keuring",
    description:
      "Inspectie en keuring van elektrische installaties volgens NEN 1010 (nieuwbouw) en NEN 3140 (bestaand/zakelijk), inclusief digitaal certificaat.",
    path: "/keuring-amsterdam",
  },
] as const;

export function localBusinessSchema() {
  const businessNode = {
    "@type": ["LocalBusiness", "Electrician"],
    "@id": `${business.url}/#business`,
    name: business.name,
    legalName: business.legalName,
    alternateName: ["VoltFix Amsterdam", "VoltFix Elektricien"],
    description:
      "VoltFix is een gecertificeerde elektricien in Amsterdam. 24/7 spoedservice, groepenkast vervangen, Perilex aansluitingen, laadpalen en NEN 1010 keuringen in Amsterdam en omstreken.",
    image: `${business.url}/og-voltfix.jpg`,
    logo: `${business.url}/favicon.png`,
    url: business.url,
    telephone: business.phoneE164,
    email: business.email,
    priceRange: "€€",
    vatID: business.btw,
    taxID: business.btw,
    foundingDate: business.foundingDate,
    currenciesAccepted: business.currenciesAccepted,
    paymentAccepted: business.paymentAccepted,
    identifier: [
      { "@type": "PropertyValue", propertyID: "KvK", value: business.kvk },
      { "@type": "PropertyValue", propertyID: "BTW", value: business.btw },
    ],
    knowsAbout: [
      "NEN 1010",
      "NEN 3140",
      "Groepenkast vervangen",
      "Meterkast uitbreiden",
      "Perilex aansluiting (400V)",
      "Krachtstroom / driefasen",
      "Aardlekschakelaar (RCD)",
      "Laadpaal installatie (EV wallbox)",
      "Spoed elektricien 24/7",
      "Stroomstoring oplossen",
      "Kortsluiting opsporen",
      "Elektrische installatie keuren",
    ],
    knowsLanguage: ["nl", "en"],
    hasCredential: business.certifications.map((c) => ({
      "@type": "EducationalOccupationalCredential",
      credentialCategory: "certification",
      name: c,
    })),
    areaServed: [
      {
        "@type": "GeoCircle",
        geoMidpoint: {
          "@type": "GeoCoordinates",
          latitude: business.geo.latitude,
          longitude: business.geo.longitude,
        },
        geoRadius: `${business.serviceRadiusKm * 1000}`,
        description: "Amsterdam en omstreken",
      },
      ...serviceAreas.map((a) => ({ "@type": "City", name: a })),
    ],
    serviceArea: {
      "@type": "GeoCircle",
      geoMidpoint: {
        "@type": "GeoCoordinates",
        latitude: business.geo.latitude,
        longitude: business.geo.longitude,
      },
      geoRadius: `${business.serviceRadiusKm * 1000}`,
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: business.streetAddress,
      addressLocality: "Amsterdam",
      addressRegion: "Noord-Holland",
      postalCode: business.postalCode,
      addressCountry: { "@type": "Country", name: "NL" },
    },
    geo: {
      "@type": "GeoCoordinates",
      "@id": `${business.url}/#geo`,
      latitude: business.geo.latitude,
      longitude: business.geo.longitude,
      address: {
        "@type": "PostalAddress",
        streetAddress: business.streetAddress,
        addressLocality: "Amsterdam",
        addressRegion: "Noord-Holland",
        postalCode: business.postalCode,
        addressCountry: "NL",
      },
    },
    hasMap: business.hasMap,
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer service",
        telephone: business.phoneE164,
        email: business.email,
        areaServed: "NL",
        availableLanguage: ["Dutch", "English"],
        hoursAvailable: business.openingHours.map((h) => ({
          "@type": "OpeningHoursSpecification",
          dayOfWeek: h.days,
          opens: h.opens,
          closes: h.closes,
        })),
      },
      {
        "@type": "ContactPoint",
        contactType: "emergency",
        telephone: business.phoneE164,
        areaServed: "Amsterdam",
        availableLanguage: ["Dutch", "English"],
        hoursAvailable: {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
          opens: "00:00",
          closes: "23:59",
        },
      },
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        name: "WhatsApp",
        telephone: business.phoneE164,
        url: `https://wa.me/${business.phoneE164.replace(/^\+/, "")}`,
        areaServed: "NL",
        availableLanguage: ["Dutch", "English"],
        contactOption: "TollFree",
        hoursAvailable: {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
          opens: "00:00",
          closes: "23:59",
        },
      },
    ],
    openingHoursSpecification: [
      ...business.openingHours.map((h) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: h.days,
        opens: h.opens,
        closes: h.closes,
      })),
      {
        "@type": "OpeningHoursSpecification",
        name: "24/7 Spoedservice",
        description: "24/7 spoedservice voor stroomstoringen en elektra-noodgevallen in Amsterdam",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        opens: "00:00",
        closes: "23:59",
      },
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Elektricien diensten Amsterdam",
      itemListElement: offeredServices.map((s) => ({
        "@type": "Offer",
        url: `${business.url}${s.path}`,
        itemOffered: {
          "@type": "Service",
          name: s.name,
          description: s.description,
          serviceType: s.name,
          url: `${business.url}${s.path}`,
          provider: { "@id": `${business.url}/#business` },
          areaServed: { "@type": "City", name: "Amsterdam" },
        },
      })),
    },
    sameAs: [business.googleBusinessProfile, business.instagram, business.linkedin].filter(
      Boolean,
    ) as string[],
  };

  const websiteNode = {
    "@type": "WebSite",
    "@id": `${business.url}/#website`,
    url: business.url,
    name: business.name,
    inLanguage: ["nl-NL", "en-GB"],
    publisher: { "@id": `${business.url}/#business` },
  };

  return {
    "@context": "https://schema.org",
    "@graph": [businessNode, websiteNode],
  };
}

export function serviceSchema(opts: { name: string; description: string; path: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: opts.name,
    description: opts.description,
    serviceType: opts.name,
    url: `${business.url}${opts.path}`,
    areaServed: { "@type": "City", name: "Amsterdam" },
    provider: { "@id": `${business.url}/#business` },
  };
}

export function faqSchema(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${business.url}${item.path}`,
    })),
  };
}

export function howToSchema(opts: {
  name: string;
  description: string;
  path: string;
  totalTime?: string; // ISO 8601 duration, e.g. "PT45M"
  tools?: string[];
  supplies?: string[];
  steps: { name: string; text: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: opts.name,
    description: opts.description,
    url: `${business.url}${opts.path}#wizard`,
    ...(opts.totalTime ? { totalTime: opts.totalTime } : {}),
    ...(opts.tools ? { tool: opts.tools.map((t) => ({ "@type": "HowToTool", name: t })) } : {}),
    ...(opts.supplies
      ? { supply: opts.supplies.map((s) => ({ "@type": "HowToSupply", name: s })) }
      : {}),
    step: opts.steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
      url: `${business.url}${opts.path}#wizard-step-${i + 1}`,
    })),
  };
}

export function ldScript(obj: unknown) {
  return { type: "application/ld+json", children: JSON.stringify(obj) };
}
