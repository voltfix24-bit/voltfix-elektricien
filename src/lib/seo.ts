import { business, serviceAreas } from "./business";

export { absoluteUrl } from "./business";

// JSON-LD builders for structured data. Returned objects are stringified
// inside route head() scripts so they render server-side in the HTML.

// Absolute URL of the branded Open Graph / social share image.
export const ogImage = `${business.url}/og-voltfix.jpg`;

// hreflang alternates linking the NL page to its EN counterpart (and vice
// versa). Pass the canonical *NL* path; the EN path lives under /en-gb.
export function altLinks(nlPath: string) {
  const enPath = nlPath === "/" ? "/en-gb" : `/en-gb${nlPath}`;
  return [
    { rel: "alternate", hrefLang: "nl-NL", href: absoluteUrlFromBusiness(nlPath) },
    { rel: "alternate", hrefLang: "en-GB", href: absoluteUrlFromBusiness(enPath) },
    { rel: "alternate", hrefLang: "x-default", href: absoluteUrlFromBusiness(nlPath) },
  ];
}

function absoluteUrlFromBusiness(path: string) {
  if (path === "/") return `${business.url}/`;
  return `${business.url}${path}`;
}

export function localBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Electrician",
    "@id": `${business.url}/#business`,
    name: business.name,
    legalName: business.legalName,
    image: `${business.url}/og-voltfix.jpg`,
    url: business.url,
    telephone: business.phoneE164,
    email: business.email,
    priceRange: "€€",
    vatID: business.btw,
    taxID: business.btw,
    identifier: [
      { "@type": "PropertyValue", propertyID: "KvK", value: business.kvk },
      { "@type": "PropertyValue", propertyID: "BTW", value: business.btw },
    ],
    knowsAbout: [
      "NEN 1010",
      "Groepenkast vervangen",
      "Perilex aansluiting",
      "Spoed elektricien",
      "Stroomstoring oplossen",
      "Meterkast",
    ],
    hasCredential: business.certifications.map((c) => ({
      "@type": "EducationalOccupationalCredential",
      name: c,
    })),
    areaServed: serviceAreas.map((a) => ({ "@type": "City", name: a })),
    address: {
      "@type": "PostalAddress",
      addressLocality: "Amsterdam",
      addressRegion: "Noord-Holland",
      addressCountry: "NL",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 52.3676,
      longitude: 4.9041,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "00:00",
        closes: "23:59",
      },
    ],
    sameAs: [business.googleBusinessProfile] as string[],
  };
}

export function serviceSchema(opts: {
  name: string;
  description: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: opts.name,
    description: opts.description,
    serviceType: opts.name,
    url: `${business.url}${opts.path}`,
    areaServed: { "@type": "City", name: "Amsterdam" },
    provider: {
      "@type": "Electrician",
      name: business.name,
      telephone: business.phoneE164,
      areaServed: "Amsterdam",
    },
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
    ...(opts.tools
      ? { tool: opts.tools.map((t) => ({ "@type": "HowToTool", name: t })) }
      : {}),
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
