import { defaultWhatsappMessage, defaultWhatsappMessageEn } from "@/lib/business";
import type { Locale } from "@/lib/i18n";

// Per-route WhatsApp berichten. Bij een klik op WhatsApp krijgt de klant een
// context-relevant vooringevuld bericht (dienst / locatie / spoed).
// Componenten kunnen een override meegeven via de `message` prop; deze map is
// de fallback voor plekken zonder expliciete prop (o.a. MobileCtaBar).

type Messages = { nl: string; en: string };

function structured(
  intro: { nl: string; en: string },
  bullets: { nl: string[]; en: string[] },
): Messages {
  const build = (i: string, b: string[], footerNl: boolean) => {
    const footer = footerNl ? "Alvast bedankt!" : "Thanks in advance!";
    return [`${footerNl ? "Hallo" : "Hi"} VoltFix 👋`, "", i, "", ...b.map((x) => `• ${x}`), "", footer].join("\n");
  };
  return {
    nl: build(intro.nl, bullets.nl, true),
    en: build(intro.en, bullets.en, false),
  };
}

const jobBullets = {
  nl: ["Adres / wijk: ", "Gewenste datum: ", "Extra info: "],
  en: ["Address / area: ", "Preferred date: ", "Extra info: "],
};

const urgentBullets = {
  nl: ["Adres: ", "Wat is er aan de hand: ", "Bereikbaar op: "],
  en: ["Address: ", "What's the issue: ", "Reachable on: "],
};

const ROUTES: Record<string, Messages> = {
  "/": structured(
    { nl: "Ik wil graag een offerte of afspraak voor een elektra-klus.", en: "I'd like a quote or appointment for an electrical job." },
    { nl: ["Type klus: ", ...jobBullets.nl], en: ["Type of job: ", ...jobBullets.en] },
  ),
  "/perilex-amsterdam": structured(
    { nl: "Ik wil een Perilex / kookgroep laten aansluiten in Amsterdam.", en: "I'd like a Perilex / cooker circuit connected in Amsterdam." },
    {
      nl: ["Type kookplaat (inductie/keramisch): ", "Vermogen (kW): ", ...jobBullets.nl],
      en: ["Cooktop type (induction/ceramic): ", "Power (kW): ", ...jobBullets.en],
    },
  ),
  "/groepenkast-amsterdam": structured(
    { nl: "Ik wil mijn groepenkast laten vervangen of uitbreiden in Amsterdam.", en: "I'd like my fuse box replaced or upgraded in Amsterdam." },
    {
      nl: ["Huidige situatie (leeftijd/aantal groepen): ", "Wens (vervangen/uitbreiden): ", ...jobBullets.nl],
      en: ["Current setup (age/circuits): ", "Goal (replace/upgrade): ", ...jobBullets.en],
    },
  ),
  "/elektricien-amsterdam": structured(
    { nl: "Ik zoek een elektricien in Amsterdam.", en: "I'm looking for an electrician in Amsterdam." },
    { nl: ["Type klus: ", ...jobBullets.nl], en: ["Type of job: ", ...jobBullets.en] },
  ),
  "/spoed-elektricien-amsterdam": structured(
    { nl: "SPOED — ik heb met spoed een elektricien nodig in Amsterdam.", en: "URGENT — I need an electrician right away in Amsterdam." },
    urgentBullets,
  ),
  "/stroomstoring-amsterdam": structured(
    { nl: "SPOED — ik heb een stroomstoring in Amsterdam.", en: "URGENT — I have a power outage in Amsterdam." },
    urgentBullets,
  ),
  "/contact": structured(
    { nl: "Ik heb een vraag en zou graag contact opnemen.", en: "I have a question and would like to get in touch." },
    { nl: ["Onderwerp: ", "Vraag: "], en: ["Subject: ", "Question: "] },
  ),
  "/over-ons": structured(
    { nl: "Ik zag jullie website en wil graag meer weten over VoltFix.", en: "I saw your website and would like to know more about VoltFix." },
    { nl: ["Onderwerp: "], en: ["Subject: "] },
  ),
  "/faq": structured(
    { nl: "Ik heb een vraag die niet in de FAQ staat.", en: "I have a question that isn't in the FAQ." },
    { nl: ["Vraag: "], en: ["Question: "] },
  ),
};

// Wijk- en regio-pagina's (auto-gegenereerd op basis van patroon).
const LOCATIONS: Array<{ path: string; nl: string; en: string }> = [
  { path: "/elektricien-amsterdam-zuid", nl: "Amsterdam-Zuid", en: "Amsterdam South" },
  { path: "/elektricien-amsterdam-west", nl: "Amsterdam-West", en: "Amsterdam West" },
  { path: "/elektricien-amsterdam-oost", nl: "Amsterdam-Oost", en: "Amsterdam East" },
  { path: "/elektricien-amsterdam-noord", nl: "Amsterdam-Noord", en: "Amsterdam North" },
  { path: "/elektricien-amsterdam-centrum", nl: "Amsterdam-Centrum", en: "Amsterdam Centre" },
  { path: "/elektricien-amsterdam-de-pijp", nl: "De Pijp", en: "De Pijp" },
  { path: "/elektricien-amsterdam-ijburg", nl: "IJburg", en: "IJburg" },
  { path: "/elektricien-amstelveen", nl: "Amstelveen", en: "Amstelveen" },
];
for (const l of LOCATIONS) {
  ROUTES[l.path] = structured(
    { nl: `Ik zoek een elektricien in ${l.nl}.`, en: `I'm looking for an electrician in ${l.en}.` },
    { nl: ["Type klus: ", ...jobBullets.nl], en: ["Type of job: ", ...jobBullets.en] },
  );
}

/**
 * Geef het WhatsApp-bericht voor een pad + taal. Valt terug op de generieke
 * default wanneer er geen specifieke tekst is (bijv. onbekende route).
 */
export function whatsappMessageFor(pathname: string, locale: Locale): string {
  // Strip trailing slash + querystring
  const clean = pathname.replace(/\/$/, "").split("?")[0] || "/";
  // English mirror routes leven onder /en-gb/... → strip prefix
  const key = clean.startsWith("/en-gb")
    ? clean.replace(/^\/en-gb/, "") || "/"
    : clean;
  const hit = ROUTES[key];
  if (hit) return locale === "en" ? hit.en : hit.nl;
  return locale === "en" ? defaultWhatsappMessageEn : defaultWhatsappMessage;
}
