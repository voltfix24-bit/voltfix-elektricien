// Central VoltFix business data — used across pages, CTAs and structured data.

export const business = {
  name: "VoltFix",
  legalName: "VoltFix Elektrotechniek",
  domain: "voltfix.nl",
  url: "https://voltfix.nl",
  city: "Amsterdam",
  region: "Noord-Holland",
  country: "NL",
  email: "info@voltfix.nl",
  phoneDisplay: "06 86 30 21 48",
  phoneE164: "+31686302148",
  whatsappNumber: "31686302148",
  tagline: "Snel, betrouwbaar en lokaal — 24/7 spoedservice in heel Amsterdam.",
} as const;

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
  { to: "/groepenkast-vervangen-amsterdam", label: "Groepenkast" },
  { to: "/perilex-aansluiten-amsterdam", label: "Perilex" },
  { to: "/stroomstoring-amsterdam", label: "Stroomstoring" },
  { to: "/over-ons", label: "Over ons" },
  { to: "/contact", label: "Contact" },
] as const;
