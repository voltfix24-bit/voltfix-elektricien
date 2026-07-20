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
  whatsappNumber: "31686302148",
  kvk: "91447127",
  btw: "NL867186549B01",
  googleBusinessProfile: "https://share.google/5j0CCSArsSiNaj4dw",
  certifications: ["NEN 1010", "KvK-geregistreerd", "BTW-plichtig ondernemer"],
  tagline: "Snel, betrouwbaar en lokaal — 24/7 spoedservice in heel Amsterdam.",
} as const;

// Bouwt een absolute URL voor canonical/og:url op basis van de primaire (www) domeinversie.
export function absoluteUrl(path: string) {
  if (path === "/") return `${business.url}/`;
  return `${business.url}${path}`;
}

export const telHref = `tel:${business.phoneE164}`;
export const mailHref = `mailto:${business.email}`;

export function whatsappHref(message?: string) {
  const base = `https://wa.me/${business.whatsappNumber}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export const defaultWhatsappMessage =
  "Hallo VoltFix, ik heb een vraag over een elektra-klus in Amsterdam.";

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
