// Centrale, citeerbare prijs- en garantiedata voor VoltFix.
// SINGLE SOURCE OF TRUTH: alle euro-bedragen op de website worden hier gedefinieerd.
// Geen enkel euro-bedrag mag elders in src/ hardcoded staan — importeer altijd
// uit dit bestand (getallen uit `prices` en strings via de format-helpers).

// ---------------------------------------------------------------------------
// Numerieke bedragen (in hele euro's, incl. 21% btw tenzij anders vermeld)
// ---------------------------------------------------------------------------
export const prices = {
  // Uur- en spoedtarief (algemeen)
  hourly: 90,
  emergencyFrom: 120,

  // Storing / stroomstoring
  stroomstoringFirstHour: 120,

  // Perilex / kookgroep
  perilexFrom: 120,
  perilexWithNewGroupFrom: 275,

  // Groepenkast (bandbreedte + "full replacement" incl. keuring)
  groepenkastFrom: 455,
  groepenkastTo: 850,
  groepenkastFullReplacementFrom: 950,

  // Laadpaal / EV
  laadpaal1PhaseFrom: 650,
  laadpaal3PhaseFrom: 895,
  laadpaalExtraGroupFrom: 275,
  // Werkgebied-specifieke laadpaal-vanafprijs (buiten centrum, incl. extra groep, excl. laadpaal)
  laadpaalLocationFrom: 545,

  // Elektrische keuring
  keuringWoningFrom: 195,
  keuringHerkeuringFrom: 95,

  // Spoed elektricien — tijdvensters (callout = voorrijkosten)
  spoedDayCallout: 95,
  spoedDayHourly: 85,
  spoedEveningCallout: 135,
  spoedEveningHourly: 115,
  spoedNightCallout: 175,
  spoedNightHourly: 145,
} as const;

// ---------------------------------------------------------------------------
// Format helpers — NL gebruikt "€ 120" (met spatie), EN "€120" (zonder spatie)
// ---------------------------------------------------------------------------
export const eurNl = (n: number) => `€ ${n}`;
export const eurEn = (n: number) => `€${n}`;
export const fromNl = (n: number) => `vanaf € ${n}`;
export const fromEn = (n: number) => `from €${n}`;
export const rangeNl = (a: number, b: number) => `€ ${a} – € ${b}`;
export const rangeEn = (a: number, b: number) => `€${a}–€${b}`;
export const perHourNl = (n: number) => `€ ${n} / uur`;
export const perHourEn = (n: number) => `€${n} / hour`;

// ---------------------------------------------------------------------------
// Backwards-compat alias (bestaande imports)
// ---------------------------------------------------------------------------
export const servicePricing = {
  perilexFrom: prices.perilexFrom,
  groepenkastFrom: prices.groepenkastFrom,
  groepenkastTo: prices.groepenkastTo,
  stroomstoringFirstHour: prices.stroomstoringFirstHour,
  hourly: prices.hourly,
  emergencyFrom: prices.emergencyFrom,
} as const;

// ---------------------------------------------------------------------------
// Tarieven & garantie-blok (gebruikt in <RatesTable /> en llms.txt)
// ---------------------------------------------------------------------------
export type RateItem = { label: string; price: string; note: string };
export type RatesContent = {
  title: string;
  intro: string;
  items: RateItem[];
  footnote: string;
};

export const ratesNl: RatesContent = {
  title: "Tarieven & garantie",
  intro:
    "Transparante, citeerbare tarieven voor onze elektricien in Amsterdam. U weet vooraf waar u aan toe bent.",
  items: [
    {
      label: "Uurtarief",
      price: perHourNl(prices.hourly),
      note: "Binnen kantooruren, voorrijkosten binnen Amsterdam inbegrepen.",
    },
    {
      label: "Spoed / 24-7",
      price: fromNl(prices.emergencyFrom),
      note: "Starttarief bij spoed, avond, nacht en weekend.",
    },
    {
      label: "Storing oplossen",
      price: `${eurNl(prices.stroomstoringFirstHour)} eerste uur`,
      note: `Meerprijs voor tijd of materiaal wordt vooraf gecommuniceerd — nooit meer dan ${eurNl(prices.stroomstoringFirstHour)} extra zonder overleg.`,
    },
    {
      label: "Garantie",
      price: "12 mnd installatiewerk",
      note: "12 maanden garantie op installatiewerk, 2 jaar fabrieksgarantie op geplaatste materialen.",
    },
  ],
  footnote:
    "Alle bedragen incl. 21% btw. Vaste diensten (perilex, groepenkast) krijgen een vaste prijs vooraf.",
};

export const ratesEn: RatesContent = {
  title: "Rates & warranty",
  intro:
    "Transparent, quotable rates for our electrician in Amsterdam. You know where you stand up front.",
  items: [
    {
      label: "Hourly rate",
      price: perHourEn(prices.hourly),
      note: "Office hours, call-out costs within Amsterdam included.",
    },
    {
      label: "Emergency / 24-7",
      price: fromEn(prices.emergencyFrom),
      note: "Start rate for emergency, evening, night and weekend.",
    },
    {
      label: "Fault finding",
      price: `${eurEn(prices.stroomstoringFirstHour)} first hour`,
      note: `Any extra time or materials is agreed up front — never more than ${eurEn(prices.stroomstoringFirstHour)} extra without confirmation.`,
    },
    {
      label: "Warranty",
      price: "12 mo. on install work",
      note: "12 months warranty on installation work, 2 year manufacturer warranty on installed materials.",
    },
  ],
  footnote:
    "All amounts incl. 21% VAT. Fixed services (perilex, fuse box) get a fixed quote up front.",
};
