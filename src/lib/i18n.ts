import { useRouterState } from "@tanstack/react-router";
import { business } from "./business";

// ---------------------------------------------------------------------------
// VoltFix bilingual setup (NL primary, EN for expats under /en-gb).
// English pages keep the SAME slugs under /en-gb to preserve existing
// voltfix.nl rankings (e.g. /en-gb/elektricien-amsterdam ranked #3).
// ---------------------------------------------------------------------------

export type Locale = "nl" | "en";

export const EN_PREFIX = "/en-gb";

/** localStorage key used to remember the visitor's preferred locale. */
export const LANG_STORAGE_KEY = "voltfix.lang";

/** All NL ↔ EN page pairs. EN path = EN_PREFIX + NL path ("/" → /en-gb). */
export const NL_PATHS = [
  "/",
  "/elektricien-amsterdam",
  "/perilex-amsterdam",
  "/spoed-elektricien-amsterdam",
  "/Groepenkast-Amsterdam",
  "/stroomstoring-amsterdam",
  "/over-ons",
  "/contact",
] as const;

export function toEnPath(nlPath: string): string {
  return nlPath === "/" ? EN_PREFIX : `${EN_PREFIX}${nlPath}`;
}

export function toNlPath(enPath: string): string {
  if (enPath === EN_PREFIX) return "/";
  return enPath.slice(EN_PREFIX.length) || "/";
}

export function getLocale(pathname: string): Locale {
  return pathname === EN_PREFIX || pathname.startsWith(`${EN_PREFIX}/`) ? "en" : "nl";
}

/** Equivalent page in the other language (for the language switcher). */
export function otherLangPath(pathname: string): string {
  return getLocale(pathname) === "en" ? toNlPath(pathname) : toEnPath(pathname);
}

export function useLocale(): Locale {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return getLocale(pathname);
}

export function usePathname(): string {
  return useRouterState({ select: (s) => s.location.pathname });
}

// ---------------------------------------------------------------------------
// Navigation (typed literal paths so <Link to> stays type-safe)
// ---------------------------------------------------------------------------

export const navNl = [
  { to: "/spoed-elektricien-amsterdam", label: "Spoed" },
  { to: "/Groepenkast-Amsterdam", label: "Groepenkast" },
  { to: "/perilex-amsterdam", label: "Perilex" },
  { to: "/stroomstoring-amsterdam", label: "Stroomstoring" },
  { to: "/over-ons", label: "Over ons" },
  { to: "/contact", label: "Contact" },
] as const;

export const navEn = [
  { to: "/en-gb/spoed-elektricien-amsterdam", label: "Emergency" },
  { to: "/en-gb/Groepenkast-Amsterdam", label: "Fuse box" },
  { to: "/en-gb/perilex-amsterdam", label: "Perilex" },
  { to: "/en-gb/stroomstoring-amsterdam", label: "Power outage" },
  { to: "/en-gb/over-ons", label: "About" },
  { to: "/en-gb/contact", label: "Contact" },
] as const;

// ---------------------------------------------------------------------------
// UI string dictionary for shared chrome components
// ---------------------------------------------------------------------------

type RelatedCard = { to: string; title: string; text: string };

type Dict = {
  homeTo: "/" | "/en-gb";
  contactTo: "/contact" | "/en-gb/contact";
  langSwitchLabel: string;
  // header
  menuLabel: string;
  quote: string;
  openMenu: string;
  closeMenu: string;
  // cta buttons
  callDirect: string;
  whatsapp: string;
  requestQuote: string;
  // mobile bar
  mobileCall: string;
  mobileQuote: string;
  // cta band
  bandCompactTitle: string;
  bandCallPrefix: string;
  bandBigTitle: string;
  bandBigText: string;
  bandFooterTitle: string;
  // trust row
  trust: string[];
  // faq
  faqHeading: string;
  // price
  priceTitle: string;
  priceMostChosen: string;
  priceFootnote: string;
  // testimonials
  reviewsTitle: string;
  reviewsPlaceholderIntro: string;
  reviewsPlaceholderFootnote: string;
  reviews: { name: string; text: string }[];
  // related services
  relatedHeading: string;
  relatedIntro: string;
  relatedMore: string;
  related: RelatedCard[];
  // footer
  footerBlurb: string;
  footerServices: string;
  footerArea: string;
  footerContact: string;
  footerAreaLabel: string;
  footerRights: string;
  footerStandard: string;
};

const relatedNl: RelatedCard[] = [
  {
    to: "/spoed-elektricien-amsterdam",
    title: "Spoed elektricien Amsterdam",
    text: "Storing, kortsluiting of stroomuitval? 24/7 snel ter plaatse.",
  },
  {
    to: "/Groepenkast-Amsterdam",
    title: "Groepenkast vervangen Amsterdam",
    text: "Veilige, moderne groepenkast met extra groepen en aardlekschakelaars.",
  },
  {
    to: "/perilex-amsterdam",
    title: "Perilex aansluiten Amsterdam",
    text: "Kookgroep en perilex stopcontact voor inductie en fornuis.",
  },
  {
    to: "/stroomstoring-amsterdam",
    title: "Stroomstoring Amsterdam",
    text: "Kortsluiting en stroomuitval snel opgespoord en verholpen.",
  },
  {
    to: "/laadpaal-amsterdam",
    title: "Laadpaal installeren Amsterdam",
    text: "Laadpaal aan huis of VvE — inclusief extra groep en netbeheerder-aanmelding.",
  },
  {
    to: "/keuring-amsterdam",
    title: "Elektrische keuring Amsterdam",
    text: "NEN 1010 & NEN 3140-keuring voor woning, verhuur en bedrijfspand.",
  },
];

const relatedEn: RelatedCard[] = [
  {
    to: "/en-gb/spoed-elektricien-amsterdam",
    title: "Emergency electrician Amsterdam",
    text: "Fault, short circuit or power loss? On site fast, 24/7.",
  },
  {
    to: "/en-gb/Groepenkast-Amsterdam",
    title: "Fuse box replacement Amsterdam",
    text: "A safe, modern fuse box with extra circuits and RCDs.",
  },
  {
    to: "/en-gb/perilex-amsterdam",
    title: "Perilex connection Amsterdam",
    text: "Cooker circuit and perilex socket for induction hobs and ranges.",
  },
  {
    to: "/en-gb/stroomstoring-amsterdam",
    title: "Power outage Amsterdam",
    text: "Short circuits and power failures traced and fixed quickly.",
  },
  {
    to: "/en-gb/ev-charger-installation-amsterdam",
    title: "EV charger installation Amsterdam",
    text: "Home or VvE EV charger — dedicated circuit and grid operator notification included.",
  },
  {
    to: "/en-gb/electrical-inspection-amsterdam",
    title: "Electrical inspection Amsterdam",
    text: "NEN 1010 & NEN 3140 inspection for homes, rentals and business premises.",
  },
];


const nl: Dict = {
  homeTo: "/",
  contactTo: "/contact",
  langSwitchLabel: "EN",
  menuLabel: "Hoofdmenu",
  quote: "Offerte",
  openMenu: "Menu openen",
  closeMenu: "Menu sluiten",
  callDirect: "Bel direct",
  whatsapp: "WhatsApp",
  requestQuote: "Offerte aanvragen",
  mobileCall: "Bellen",
  mobileQuote: "Offerte",
  bandCompactTitle: "Direct hulp nodig?",
  bandCallPrefix: "Bel",
  bandBigTitle: "Direct een elektricien nodig in Amsterdam?",
  bandBigText: `Bel ${business.phoneDisplay} of stuur een WhatsApp. Vaak binnen 30–60 minuten ter plaatse bij spoed, met een vaste prijsafspraak vooraf.`,
  bandFooterTitle: "Direct hulp nodig?",
  trust: ["Lokaal in Amsterdam", "Snelle service", "Transparante tarieven", "Vakkundig werk"],
  faqHeading: "Veelgestelde vragen",
  priceTitle: "Prijsindicatie",
  priceMostChosen: "Meest gekozen",
  priceFootnote:
    "Indicatieve prijzen incl. btw. U krijgt altijd een vaste prijs vooraf, afgestemd op uw situatie.",
  reviewsTitle: "Wat klanten zeggen",
  reviewsPlaceholderIntro: "Voorbeelden van het soort werk dat we doen in Amsterdam.",
  reviewsPlaceholderFootnote: "Voorbeeldweergave — hier verschijnen straks echte Google reviews.",
  reviews: [
    {
      name: "Sanne — Amsterdam-Zuid",
      text: "Op zondagavond stroomstoring, binnen een uur was VoltFix er en alles werkte weer. Top en eerlijk over de prijs.",
    },
    {
      name: "Bram — De Pijp",
      text: "Nieuwe groepenkast laten plaatsen. Netjes gewerkt, alles uitgelegd en keurig opgeruimd achtergelaten.",
    },
    {
      name: "Familie El Amrani — Oost",
      text: "Perilex voor de inductiekookplaat snel en vakkundig aangesloten. Aanrader voor Amsterdam.",
    },
  ],
  relatedHeading: "Ook interessant",
  relatedIntro:
    "Ontdek onze andere diensten als elektricien in Amsterdam. VoltFix helpt u met alle elektra in en om huis of bedrijf.",
  relatedMore: "Meer info",
  related: relatedNl,
  footerBlurb:
    "Uw lokale elektricien in Amsterdam. Snel ter plaatse bij storingen, vakkundig bij installaties en altijd transparant over de prijs.",
  footerServices: "Diensten",
  footerArea: "Werkgebied",
  footerContact: "Contact",
  footerAreaLabel: "Amsterdam & omgeving",
  footerRights: "VoltFix Elektrotechniek — Amsterdam",
  footerStandard: "Werkt volgens NEN 1010",
};

const en: Dict = {
  homeTo: "/en-gb",
  contactTo: "/en-gb/contact",
  langSwitchLabel: "NL",
  menuLabel: "Main menu",
  quote: "Quote",
  openMenu: "Open menu",
  closeMenu: "Close menu",
  callDirect: "Call now",
  whatsapp: "WhatsApp",
  requestQuote: "Request a quote",
  mobileCall: "Call",
  mobileQuote: "Quote",
  bandCompactTitle: "Need help now?",
  bandCallPrefix: "Call",
  bandBigTitle: "Need an electrician in Amsterdam now?",
  bandBigText: `Call ${business.phoneDisplay} or send a WhatsApp. Often on site within 30–60 minutes for emergencies, with a fixed price agreed up front.`,
  bandFooterTitle: "Need help now?",
  trust: ["Local in Amsterdam", "Fast service", "Transparent rates", "Expert workmanship"],
  faqHeading: "Frequently asked questions",
  priceTitle: "Price indication",
  priceMostChosen: "Most chosen",
  priceFootnote:
    "Indicative prices incl. VAT. You always get a fixed price up front, tailored to your situation.",
  reviewsTitle: "What customers say",
  reviewsPlaceholderIntro: "Examples of the kind of work we do across Amsterdam.",
  reviewsPlaceholderFootnote: "Sample preview — real Google reviews will appear here soon.",
  reviews: [
    {
      name: "Sanne — Amsterdam-Zuid",
      text: "Power outage on a Sunday night — VoltFix arrived within the hour and everything worked again. Great service and honest about the price.",
    },
    {
      name: "Bram — De Pijp",
      text: "Had a new fuse box installed. Tidy work, everything explained, and the place left spotless.",
    },
    {
      name: "El Amrani family — East",
      text: "Perilex for the induction hob connected quickly and expertly. Highly recommended in Amsterdam.",
    },
  ],
  relatedHeading: "Related services",
  relatedIntro:
    "Discover our other services as an electrician in Amsterdam. VoltFix helps with all electrical work in and around your home or business.",
  relatedMore: "Learn more",
  related: relatedEn,
  footerBlurb:
    "Your local electrician in Amsterdam. Fast on site for faults, expert with installations and always transparent about the price.",
  footerServices: "Services",
  footerArea: "Service area",
  footerContact: "Contact",
  footerAreaLabel: "Amsterdam & surroundings",
  footerRights: "VoltFix Elektrotechniek — Amsterdam",
  footerStandard: "Works to the NEN 1010 standard",
};

export const dict: Record<Locale, Dict> = { nl, en };

export function useT(): Dict {
  return dict[useLocale()];
}

// ---------------------------------------------------------------------------
// Contact form strings
// ---------------------------------------------------------------------------

export type FormStrings = {
  name: string;
  namePh: string;
  phone: string;
  email: string;
  emailPh: string;
  postcode: string;
  postcodePh: string;
  job: string;
  jobChoose: string;
  jobTypes: string[];
  message: string;
  messagePh: string;
  submit: string;
  whatsappNote: string;
  whatsappFallback: string;
  toastSuccess: string;
  errName: string;
  errPhone: string;
  errPhoneChars: string;
  errEmail: string;
  errPostcode: string;
  errPostcodeFormat: string;
  errJob: string;
  quoteRequest: string;
};

const formNl: FormStrings = {
  name: "Naam",
  namePh: "Uw naam",
  phone: "Telefoon",
  email: "E-mail",
  emailPh: "naam@voorbeeld.nl",
  postcode: "Postcode",
  postcodePh: "1012 AB",
  job: "Soort klus",
  jobChoose: "Kies een optie…",
  jobTypes: [
    "Spoed / storing",
    "Groepenkast vervangen",
    "Perilex / kookgroep",
    "Stroomstoring of kortsluiting",
    "Stopcontacten / verlichting",
    "Laadpaal",
    "Anders",
  ],
  message: "Bericht (optioneel)",
  messagePh: "Omschrijf kort wat er aan de hand is…",
  submit: "Verstuur aanvraag",
  whatsappNote: "Uw aanvraag wordt via WhatsApp verstuurd voor het snelste antwoord.",
  whatsappFallback: "Geen WhatsApp geopend? Bel ons gerust direct.",
  toastSuccess: "Bedankt! We openen WhatsApp om uw aanvraag te versturen.",
  errName: "Vul uw naam in",
  errPhone: "Vul een geldig telefoonnummer in",
  errPhoneChars: "Alleen cijfers en + ( ) - zijn toegestaan",
  errEmail: "Vul een geldig e-mailadres in",
  errPostcode: "Vul uw postcode in",
  errPostcodeFormat: "Bijv. 1012 AB",
  errJob: "Kies een soort klus",
  quoteRequest: "Offerte-aanvraag VoltFix",
};

const formEn: FormStrings = {
  name: "Name",
  namePh: "Your name",
  phone: "Phone",
  email: "Email",
  emailPh: "name@example.com",
  postcode: "Postcode",
  postcodePh: "1012 AB",
  job: "Type of job",
  jobChoose: "Choose an option…",
  jobTypes: [
    "Emergency / fault",
    "Fuse box replacement",
    "Perilex / cooker circuit",
    "Power outage or short circuit",
    "Sockets / lighting",
    "EV charger",
    "Other",
  ],
  message: "Message (optional)",
  messagePh: "Briefly describe what's going on…",
  submit: "Send request",
  whatsappNote: "Your request is sent via WhatsApp for the fastest reply.",
  whatsappFallback: "WhatsApp didn't open? Feel free to call us directly.",
  toastSuccess: "Thanks! We're opening WhatsApp to send your request.",
  errName: "Please enter your name",
  errPhone: "Please enter a valid phone number",
  errPhoneChars: "Only digits and + ( ) - are allowed",
  errEmail: "Please enter a valid email address",
  errPostcode: "Please enter your postcode",
  errPostcodeFormat: "E.g. 1012 AB",
  errJob: "Choose a type of job",
  quoteRequest: "Quote request VoltFix",
};

export const formDict: Record<Locale, FormStrings> = { nl: formNl, en: formEn };

export function useFormStrings(): FormStrings {
  return formDict[useLocale()];
}
