import { business, serviceAreas } from "./business";

export { absoluteUrl } from "./business";

// JSON-LD builders for structured data. Returned objects are stringified
// inside route head() scripts so they render server-side in the HTML.

// Absolute URL of the branded Open Graph / social share image.
export const ogImage = `${business.url}/og-voltfix.jpg`;

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
    sameAs: [] as string[],
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

export function ldScript(obj: unknown) {
  return { type: "application/ld+json", children: JSON.stringify(obj) };
}
