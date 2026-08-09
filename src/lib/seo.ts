import { type ReactNode, isValidElement } from "react";
import {
  business,
  responsePromiseEn,
  responsePromiseMinutes,
  responsePromiseNl,
  serviceAreas,
} from "./business";
import { NL_PATHS } from "./i18n";
import { prices } from "./pricing";

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
  "/privacybeleid": "/en-gb/privacy-policy",
  "/cookiebeleid": "/en-gb/cookie-policy",
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
    minPrice: prices.groepenkastFrom,
  },
  {
    name: "Perilex aansluiting installeren",
    description:
      "Aanleg en aansluiting van een Perilex-stopcontact (400V) voor inductiekookplaat, fornuis of oven — inclusief groep in de meterkast.",
    path: "/perilex-amsterdam",
    minPrice: prices.perilexFrom,
  },
  {
    name: "Spoed elektricien 24/7",
    description:
      "24/7 spoedservice bij stroomstoringen, kortsluiting en uitgevallen groepen in heel Amsterdam.",
    path: "/spoed-elektricien-amsterdam",
    minPrice: prices.emergencyFirstHour,
  },
  {
    name: "Stroomstoring verhelpen",
    description:
      "Diagnose en herstel van stroomstoringen, doorgeslagen aardlekschakelaars en kortsluiting.",
    path: "/stroomstoring-amsterdam",
    minPrice: prices.stroomstoringFirstHour,
  },
  {
    name: "Laadpaal installatie",
    description:
      "Installatie van een elektrische laadpaal (wallbox) voor thuis of bedrijf, inclusief aparte groep en NEN 1010-controle.",
    path: "/laadpaal-amsterdam",
    minPrice: prices.laadpaal1PhaseFrom,
  },
  {
    name: "NEN 1010 / NEN 3140 keuring",
    description:
      "Inspectie en keuring van elektrische installaties volgens NEN 1010 (nieuwbouw) en NEN 3140 (bestaand/zakelijk), inclusief digitaal certificaat.",
    path: "/keuring-amsterdam",
    minPrice: prices.keuringWoningFrom,
  },
] as const;

// Prijsblok voor een Offer — validators verwachten price, priceSpecification
// of priceRange. We publiceren de "vanaf"-prijs als minimum (incl. btw).
function offerPriceSpecification(minPrice: number) {
  return {
    "@type": "PriceSpecification",
    priceCurrency: "EUR",
    minPrice,
    valueAddedTaxIncluded: true,
  } as const;
}


export function localBusinessSchema() {
  const businessNode = {
    "@type": ["LocalBusiness", "Electrician"],
    "@id": `${business.url}/#business`,
    name: business.name,
    legalName: business.legalName,
    alternateName: ["VoltFix Amsterdam", "VoltFix Elektricien"],
    slogan: responsePromiseNl,
    description:
      `VoltFix is een gecertificeerde elektricien in Amsterdam. ${responsePromiseNl}. 24/7 spoedservice, groepenkast vervangen, Perilex aansluitingen, laadpalen en NEN 1010 keuringen in Amsterdam en omstreken.`,
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
    hasCredential: [
      ...business.credentials.map((c) => ({
        "@type": "EducationalOccupationalCredential",
        credentialCategory: "certification",
        name: c.name,
        description: c.description,
        url: c.url,
        recognizedBy: {
          "@type": "Organization",
          name: c.recognizedBy,
          url: c.recognizedByUrl,
        },
      })),
      ...business.certifications
        .filter(
          (c) =>
            !business.credentials.some((cred) => c.startsWith(cred.abbrev)),
        )
        .map((c) => ({
          "@type": "EducationalOccupationalCredential",
          credentialCategory: "certification",
          name: c,
        })),
    ],
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
      description: "Bezoek- en servicelocatie — uitsluitend op afspraak",
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
    parentOrganization: { "@id": `${business.url}/#organization` },
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
        name: "24/7 Spoedservice",
        description: `${responsePromiseNl}. ${responsePromiseEn}.`,
        telephone: business.phoneE164,
        areaServed: "Amsterdam",
        availableLanguage: ["Dutch", "English"],
        hoursAvailable: {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
          opens: "00:00",
          closes: "23:59",
        },
        // Standard response time for on-site arrival on emergency calls.
        // ISO 8601 duration — machine-readable canonical of the 60-min promise.
        serviceOutput: {
          "@type": "PropertyValue",
          name: "Response time",
          value: `PT${responsePromiseMinutes}M`,
          unitText: "ISO 8601 duration",
          description: responsePromiseEn,
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
      description: responsePromiseNl,
      itemListElement: offeredServices.map((s) => ({
        "@type": "Offer",
        url: `${business.url}${s.path}`,
        priceCurrency: "EUR",
        priceSpecification: offerPriceSpecification(s.minPrice),
        availability: "https://schema.org/InStock",
        itemOffered: {
          "@type": "Service",
          name: s.name,
          description: s.description,
          serviceType: s.name,
          url: `${business.url}${s.path}`,
          provider: { "@id": `${business.url}/#business` },
          areaServed: { "@type": "City", name: "Amsterdam" },
          availableChannel: {
            "@type": "ServiceChannel",
            servicePhone: business.phoneE164,
            serviceUrl: `${business.url}${s.path}`,
            // Canonical machine-readable response promise: 60 minutes for spoed in Amsterdam.
            processingTime: `PT${responsePromiseMinutes}M`,
            availableLanguage: ["nl-NL", "en-GB"],
          },
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
    publisher: { "@id": `${business.url}/#organization` },
  };

  // Juridische organisatie (VoltFix V.O.F) met geregistreerd bedrijfsadres.
  // Losstaand van de LocalBusiness/Electrician-node zodat er geen adres-conflict
  // ontstaat tussen het juridische adres (Zaandam) en de bezoeklocatie (Amsterdam).
  const organizationNode = {
    "@type": "Organization",
    "@id": `${business.url}/#organization`,
    name: business.name,
    legalName: business.legalName,
    alternateName: business.alternateName,
    url: business.url,
    email: business.email,
    telephone: business.phoneE164,
    vatID: business.btw,
    taxID: business.btw,
    identifier: [
      { "@type": "PropertyValue", propertyID: "KvK", value: business.kvk },
      { "@type": "PropertyValue", propertyID: "BTW", value: business.btw },
    ],
    address: {
      "@type": "PostalAddress",
      streetAddress: business.registeredAddress.streetAddress,
      addressLocality: business.registeredAddress.city,
      addressRegion: business.registeredAddress.region,
      postalCode: business.registeredAddress.postalCode,
      addressCountry: { "@type": "Country", name: business.registeredAddress.country },
      description: "Geregistreerd bedrijfsadres (KvK)",
    },
    subOrganization: { "@id": `${business.url}/#business` },
    privacyPolicy: `${business.url}/privacybeleid`,
    sameAs: [business.googleBusinessProfile, business.instagram, business.linkedin].filter(
      Boolean,
    ) as string[],
  };

  return {
    "@context": "https://schema.org",
    "@graph": [organizationNode, businessNode, websiteNode],
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
    // Canonical response promise, machine-readable for AI answer engines.
    availableChannel: {
      "@type": "ServiceChannel",
      servicePhone: business.phoneE164,
      serviceUrl: `${business.url}${opts.path}`,
      processingTime: `PT${responsePromiseMinutes}M`,
      availableLanguage: ["nl-NL", "en-GB"],
    },
    termsOfService: `${responsePromiseNl}. ${responsePromiseEn}.`,
  };
}

/**
 * Hyperlokale Service JSON-LD voor wijk- en locatiepagina's.
 * - `areaServed` is een Place met wijk/plaats + postcode-identifiers
 *   (containedInPlace = Amsterdam / Noord-Holland) zodat Google én
 *   AI-antwoordmachines de lokale scope oppikken.
 * - `provider` refereert naar de sitewide LocalBusiness `@id`, dus
 *   we dupliceren de LocalBusiness niet per pagina (Google-guideline).
 * - `hasOfferCatalog` somt de 6 kerndiensten op, elk gescoped op de wijk.
 */
export function locationServiceSchema(opts: {
  name: string;
  description: string;
  path: string;
  postcodes?: string[];
  neighborhoods?: string[];
  containedIn?: string; // default "Amsterdam"
  lang?: "nl" | "en";
}) {
  const lang = opts.lang ?? "nl";
  const containedIn = opts.containedIn ?? "Amsterdam";
  const place = {
    "@type": "Place",
    name: opts.name,
    ...(opts.postcodes && opts.postcodes.length > 0
      ? {
          address: {
            "@type": "PostalAddress",
            addressLocality: containedIn,
            addressRegion: "Noord-Holland",
            addressCountry: "NL",
            postalCode: opts.postcodes.join(", "),
          },
        }
      : {}),
    containedInPlace: {
      "@type": "City",
      name: containedIn,
      containedInPlace: { "@type": "AdministrativeArea", name: "Noord-Holland" },
    },
  };

  const catalogName =
    lang === "en" ? `Electrician services in ${opts.name}` : `Diensten van elektricien in ${opts.name}`;

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${business.url}${opts.path}#service`,
    name: opts.name,
    description: opts.description,
    serviceType: lang === "en" ? "Electrician" : "Elektricien",
    url: `${business.url}${opts.path}`,
    areaServed: place,
    ...(opts.neighborhoods && opts.neighborhoods.length > 0
      ? {
          serviceArea: opts.neighborhoods.map((n) => ({
            "@type": "Place",
            name: n,
            containedInPlace: { "@type": "City", name: containedIn },
          })),
        }
      : {}),
    provider: { "@id": `${business.url}/#business` },
    availableChannel: {
      "@type": "ServiceChannel",
      servicePhone: business.phoneE164,
      serviceUrl: `${business.url}${opts.path}`,
      processingTime: `PT${responsePromiseMinutes}M`,
      availableLanguage: ["nl-NL", "en-GB"],
    },
    termsOfService: `${responsePromiseNl}. ${responsePromiseEn}.`,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: catalogName,
      itemListElement: offeredServices.map((s) => ({
        "@type": "Offer",
        url: `${business.url}${s.path}`,
        priceCurrency: "EUR",
        priceSpecification: offerPriceSpecification(s.minPrice),
        availability: "https://schema.org/InStock",
        itemOffered: {
          "@type": "Service",
          name: `${s.name} — ${opts.name}`,
          description: s.description,
          url: `${business.url}${s.path}`,
          areaServed: place,
          provider: { "@id": `${business.url}/#business` },
        },
      })),
    },
  };
}

/**
 * Canonical response-time FAQ pair. Spread into faqSchema() on the homepage,
 * spoedpagina and service pages so the 60-minute promise is quoted verbatim in
 * FAQPage JSON-LD.
 */
export const responseTimeFaqNl = {
  q: "Hoe snel zijn jullie ter plaatse bij een spoedmelding?",
  a: `${responsePromiseNl}. Bij een stroomstoring of andere elektra-noodgeval bellen we direct terug en sturen we de dichtstbijzijnde monteur naar u toe.`,
};

export const responseTimeFaqEn = {
  q: "How quickly are you on site for an emergency?",
  a: `${responsePromiseEn}. For power outages or other electrical emergencies we call you back straight away and dispatch the nearest engineer.`,
};

// Convert a ReactNode FAQ answer to plain text for JSON-LD.
// Keeps the schema valid while allowing rich UI answers with internal links.
function reactNodeToText(node: ReactNode): string {
  if (node == null) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(reactNodeToText).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return reactNodeToText(node.props.children);
  }
  return "";
}

export function faqSchema(faqs: { q: string; a: string | ReactNode }[]) {
  // Ensure every FAQPage schema carries the canonical 60-minute response
  // promise so answer engines (Google, ChatGPT, Perplexity) can quote it.
  const mentionsPromise = faqs.some((f) =>
    /60\s*(min|minuten|minutes)/i.test(`${f.q} ${reactNodeToText(f.a)}`),
  );
  const withPromise = mentionsPromise
    ? faqs
    : [responseTimeFaqNl, ...faqs, responseTimeFaqEn];
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: withPromise.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: reactNodeToText(f.a) },
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

export function privacyPolicySchema(opts: {
  path: string;
  title: string;
  description: string;
  locale: "nl" | "en";
  dateModified: string; // ISO date, e.g. "2026-07-27"
}) {
  const url = `${business.url}${opts.path}`;
  return {
    "@context": "https://schema.org",
    "@type": "PrivacyPolicy",
    "@id": `${url}#privacy-policy`,
    name: opts.title,
    headline: opts.title,
    description: opts.description,
    url,
    inLanguage: opts.locale === "en" ? "en-GB" : "nl-NL",
    dateModified: opts.dateModified,
    isPartOf: { "@id": `${business.url}/#website` },
    about: { "@id": `${business.url}/#organization` },
    publisher: { "@id": `${business.url}/#organization` },
    provider: { "@id": `${business.url}/#business` },
  };
}

export function cookiePolicySchema(opts: {
  path: string;
  title: string;
  description: string;
  locale: "nl" | "en";
  dateModified: string; // ISO date, e.g. "2026-08-01"
}) {
  const url = `${business.url}${opts.path}`;
  const privacyPath = opts.locale === "en" ? "/en-gb/privacy-policy" : "/privacybeleid";
  return {
    "@context": "https://schema.org",
    "@type": ["WebPage", "DigitalDocument"],
    "@id": `${url}#cookie-policy`,
    name: opts.title,
    headline: opts.title,
    description: opts.description,
    url,
    inLanguage: opts.locale === "en" ? "en-GB" : "nl-NL",
    dateModified: opts.dateModified,
    isPartOf: { "@id": `${business.url}/#website` },
    about: { "@id": `${business.url}/#organization` },
    publisher: { "@id": `${business.url}/#organization` },
    provider: { "@id": `${business.url}/#business` },
    mainEntity: {
      "@type": "CreativeWork",
      name: opts.locale === "en" ? "VoltFix cookie policy" : "VoltFix cookiebeleid",
      genre: "cookie-policy",
      inLanguage: opts.locale === "en" ? "en-GB" : "nl-NL",
    },
    significantLink: `${business.url}${privacyPath}`,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: opts.locale === "en" ? "Home" : "Home", item: opts.locale === "en" ? `${business.url}/en-gb` : `${business.url}/` },
        { "@type": "ListItem", position: 2, name: opts.title, item: url },
      ],
    },
  };
}

export function cookieFaqSchema(locale: "nl" | "en") {
  const path = locale === "en" ? "/en-gb/cookie-policy" : "/cookiebeleid";
  const url = `${business.url}${path}`;
  const faqs =
    locale === "en"
      ? [
          {
            q: "Which cookies does VoltFix use?",
            a: "Necessary cookies (session, security, forms), preference cookies (language, area), analytics via Google Analytics 4 and — only with consent — marketing cookies via Google Ads for conversion measurement and remarketing.",
          },
          {
            q: "Do I have to accept cookies?",
            a: "No. Necessary cookies are always on because the site cannot function without them. Preferences, statistics and marketing cookies are only placed when you grant consent via the cookie banner.",
          },
          {
            q: "How do I change my cookie preferences?",
            a: "Open 'Cookie settings' in the footer of any page. You can toggle preferences, statistics and marketing individually and save your choice at any time.",
          },
          {
            q: "How long are cookies stored?",
            a: "Session cookies expire when you close the browser. Persistent cookies (analytics, marketing) are stored for a maximum of 24 months, in line with Google Consent Mode v2 defaults.",
          },
          {
            q: "Does VoltFix sell personal data?",
            a: "No. VoltFix never sells personal data. Analytics and marketing data are only processed by Google as our processor under a DPA, with IP anonymisation and EU data-region settings.",
          },
        ]
      : [
          {
            q: "Welke cookies gebruikt VoltFix?",
            a: "Noodzakelijke cookies (sessie, beveiliging, formulieren), voorkeurencookies (taal, wijk), statistiekencookies via Google Analytics 4 en — alleen met toestemming — marketingcookies via Google Ads voor conversiemeting en remarketing.",
          },
          {
            q: "Moet ik cookies accepteren?",
            a: "Nee. Noodzakelijke cookies staan altijd aan omdat de site anders niet werkt. Voorkeuren, statistieken en marketing worden pas geplaatst als je toestemming geeft via de cookiebanner.",
          },
          {
            q: "Hoe pas ik mijn cookievoorkeuren aan?",
            a: "Klik op 'Cookie-instellingen' onderaan iedere pagina. Je kunt voorkeuren, statistieken en marketing afzonderlijk in- of uitschakelen en je keuze op elk moment opnieuw opslaan.",
          },
          {
            q: "Hoe lang worden cookies bewaard?",
            a: "Sessiecookies verdwijnen zodra je de browser sluit. Permanente cookies (statistieken, marketing) worden maximaal 24 maanden bewaard, conform de Google Consent Mode v2-instellingen.",
          },
          {
            q: "Verkoopt VoltFix persoonsgegevens?",
            a: "Nee. VoltFix verkoopt nooit persoonsgegevens. Statistieken- en marketinggegevens worden alleen door Google verwerkt als verwerker onder een verwerkersovereenkomst, met geanonimiseerd IP-adres en EU data-region.",
          },
        ];
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${url}#cookie-faq`,
    inLanguage: locale === "en" ? "en-GB" : "nl-NL",
    isPartOf: { "@id": `${url}#cookie-policy` },
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
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

// ---------------------------------------------------------------------------
// Tarieven (PriceSpecification) — laat AI/zoekmachines exact zien wat het
// eerste uur kost per situatie (kantooruren, storing, avond/nacht/weekend).
// Alle bedragen incl. btw voor particulieren. Voorrijden inbegrepen.
// ---------------------------------------------------------------------------
type RateOffer = {
  name: string;
  description: string;
  amount: number;
  /** UnitPriceSpecification.unitCode: "HUR" = uur, "ANN" = per uur eerste uur */
  unitText: string;
};

const rateOffers: RateOffer[] = [
  {
    name: "Uurtarief kantooruren",
    description:
      "Ma–vr 08:00–18:00, voorrijden binnen Amsterdam inbegrepen. Incl. btw voor particulieren.",
    amount: prices.hourly,
    unitText: "hour",
  },
  {
    name: "Storing / spoed binnen kantooruren",
    description:
      "Eerste uur all-in, voorrijden inbegrepen. Ook bij een spoedmelding binnen kantooruren geldt dit tarief — geen toeslag. Daarna per 15 minuten.",
    amount: prices.emergencyFirstHour,
    unitText: "first hour all-in",
  },
  {
    name: "Avond, nacht, weekend & feestdag",
    description:
      "Na 18:00, in het weekend en op feestdagen. Eerste uur all-in, voorrijden inbegrepen. Dit is het tarief dat we onze monteurs voor die uren betalen.",
    amount: prices.offHoursFirstHour,
    unitText: "first hour all-in",
  },
];

export function ratesSchema(path: string = "/") {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${business.url}${path}#rates`,
    name: "Elektricien tarieven Amsterdam — VoltFix",
    description:
      "Transparante, all-in tarieven voor een elektricien in Amsterdam. Eerste uur staat vast, voorrijden inbegrepen, daarna per 15 minuten. Incl. btw voor particulieren.",
    serviceType: "Electrician",
    provider: { "@id": `${business.url}/#business` },
    areaServed: { "@type": "City", name: "Amsterdam" },
    url: `${business.url}${path}#rates`,
    offers: rateOffers.map((r) => ({
      "@type": "Offer",
      name: r.name,
      description: r.description,
      availability: "https://schema.org/InStock",
      priceCurrency: "EUR",
      price: r.amount,
      url: `${business.url}${path}#rates`,
      eligibleCustomerType: "Consumer",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: r.amount,
        priceCurrency: "EUR",
        unitText: r.unitText,
        valueAddedTaxIncluded: true,
        referenceQuantity: {
          "@type": "QuantitativeValue",
          value: 1,
          unitCode: "HUR",
        },
      },
    })),
    termsOfService: `${business.url}${path}#garantie`,
  };
}

// ---------------------------------------------------------------------------
// Garantie & no-surprise belofte — WarrantyPromise + Service met termsOfService.
// Geeft AI-zoekmachines een citeerbaar blok over onze voorwaarden.
// ---------------------------------------------------------------------------
export function warrantySchema(path: string = "/") {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WarrantyPromise",
        "@id": `${business.url}${path}#warranty-installation`,
        durationOfWarranty: {
          "@type": "QuantitativeValue",
          // "Op installatiewerk" — bewust geen vaste duur (zie pricing.ts),
          // maar we geven schema.org een minimum van 12 maanden zodat het veld valide is.
          value: 12,
          unitCode: "MON",
          minValue: 12,
        },
        warrantyScope: {
          "@type": "WarrantyScope",
          name: "Garantie op installatiewerk",
        },
      },
      {
        "@type": "WarrantyPromise",
        "@id": `${business.url}${path}#warranty-materials`,
        durationOfWarranty: {
          "@type": "QuantitativeValue",
          value: 2,
          unitCode: "ANN",
        },
        warrantyScope: {
          "@type": "WarrantyScope",
          name: "Fabrieksgarantie op geplaatste materialen",
        },
      },
      {
        "@type": "Service",
        "@id": `${business.url}${path}#garantie`,
        name: "Garantie & no-surprise belofte — VoltFix",
        description:
          "Garantie op installatiewerk en 2 jaar fabrieksgarantie op geplaatste materialen. Nooit een verrassing op de factuur: loopt het uit of is er extra materiaal nodig, dan stopt de monteur en hoort u eerst wat het extra kost.",
        provider: { "@id": `${business.url}/#business` },
        areaServed: { "@type": "City", name: "Amsterdam" },
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Garanties",
          itemListElement: [
            {
              "@type": "Offer",
              name: "Garantie op installatiewerk",
              price: 0,
              priceCurrency: "EUR",
              itemOffered: { "@id": `${business.url}${path}#warranty-installation` },
            },
            {
              "@type": "Offer",
              name: "2 jaar fabrieksgarantie op materialen",
              price: 0,
              priceCurrency: "EUR",
              itemOffered: { "@id": `${business.url}${path}#warranty-materials` },
            },
          ],
        },
        termsOfService: `${business.url}${path}#garantie`,
      },
    ],
  };
}

/**
 * ImageObject JSON-LD voor foto's, kaarten en illustraties.
 * Helpt AI-crawlers en zoekmachines om afbeeldingen in context te plaatsen,
 * vooral voor GEO/LLM-vindbaarheid van het werkgebied en servicegebied.
 */
export function imageObjectSchema(opts: {
  url: string;
  name: string;
  description: string;
  caption?: string;
  width?: number;
  height?: number;
  contentLocation?: string;
  about?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    contentUrl: opts.url,
    name: opts.name,
    description: opts.description,
    caption: opts.caption ?? opts.name,
    ...(opts.width ? { width: { "@type": "QuantitativeValue", value: opts.width } } : {}),
    ...(opts.height ? { height: { "@type": "QuantitativeValue", value: opts.height } } : {}),
    ...(opts.contentLocation
      ? {
          contentLocation: {
            "@type": "Place",
            name: opts.contentLocation,
          },
        }
      : {}),
    ...(opts.about ? { about: { "@type": "Thing", name: opts.about } } : {}),
    author: { "@id": `${business.url}/#business` },
    publisher: { "@id": `${business.url}/#organization` },
  };
}

export function ldScript(obj: unknown) {
  return { type: "application/ld+json", children: JSON.stringify(obj) };
}

