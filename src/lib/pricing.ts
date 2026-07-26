// Centrale, citeerbare prijs- en garantiedata voor VoltFix.
// SINGLE SOURCE OF TRUTH: alle euro-bedragen op de website worden hier gedefinieerd.
// Geen enkel euro-bedrag mag elders in src/ hardcoded staan — importeer altijd
// uit dit bestand (getallen uit `prices` en strings via de format-helpers).

// ---------------------------------------------------------------------------
// Numerieke bedragen (in hele euro's, incl. 21% btw voor particulieren)
// ---------------------------------------------------------------------------
export const prices = {
  // Uur- en spoedtarief (algemeen)
  hourly: 90, // uurtarief binnen kantooruren
  // Storing / spoed — eerste uur all-in, voorrijden inbegrepen
  emergencyFirstHour: 120,
  // Avond, nacht, weekend & feestdag — eerste uur all-in
  offHoursFirstHour: 145,

  // Backwards-compat alias (oude naam, zelfde bedrag als emergencyFirstHour)
  emergencyFrom: 120,
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

// All-in eerste uur — vaste formulering voor uur-/spoedwerk
export const firstHourAllInNl = (n: number) => `€ ${n} eerste uur all-in`;
export const firstHourAllInEn = (n: number) => `€${n} first hour all-in`;

// Sublabels + vaste voetregels
export const allInSublabelNl = "eerste uur, all-in — voorrijden inbegrepen";
export const allInSublabelEn = "first hour, all-in — call-out included";
export const firstHourNoteNl =
  "Het eerste uur staat vast, daarna rekenen we per 15 minuten.";
export const firstHourNoteEn =
  "The first hour is fixed, after that we bill per 15 minutes.";
export const vatConsumerNoteNl = "Alle bedragen incl. btw voor particulieren.";
export const vatConsumerNoteEn = "All amounts incl. VAT for consumers.";

// Kostenframing i.p.v. noodframing — expliciet dat spoed binnen kantooruren
// het normale storingstarief houdt, en dat het hogere tarief alleen de
// werkelijke loonkosten voor onze monteurs in de avond/nacht/weekend dekt.
export const emergencyOfficeHoursNoteNl =
  "Ook bij een spoedmelding binnen kantooruren rekenen we gewoon dit storingstarief — geen toeslag.";
export const emergencyOfficeHoursNoteEn =
  "Even for an emergency call during office hours we charge this normal fault rate — no surcharge.";
export const offHoursReasonNoteNl =
  "Na 18:00, in het weekend en op feestdagen — dit is het tarief dat we onze monteurs voor die uren betalen.";
export const offHoursReasonNoteEn =
  "After 18:00, at weekends and on public holidays — this is the rate we pay our engineers for those hours.";


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
      label: "Uurtarief kantooruren",
      price: perHourNl(prices.hourly),
      note: "Ma–vr 08:00–18:00, voorrijden binnen Amsterdam inbegrepen.",
    },
    {
      label: "Storing (ook spoed binnen kantooruren)",
      price: firstHourAllInNl(prices.emergencyFirstHour),
      note: `${emergencyOfficeHoursNoteNl} ${allInSublabelNl}. ${firstHourNoteNl}`,
    },
    {
      label: "Avond, nacht & weekend",
      price: firstHourAllInNl(prices.offHoursFirstHour),
      note: `${offHoursReasonNoteNl} ${allInSublabelNl}. ${firstHourNoteNl}`,
    },
    {
      label: "Garantie",
      price: "Op installatiewerk",
      note: "Garantie op installatiewerk, 2 jaar fabrieksgarantie op geplaatste materialen.",
    },
  ],
  footnote: `${vatConsumerNoteNl} Vaste diensten (perilex, groepenkast) krijgen een vaste prijs vooraf.`,
};

export const ratesEn: RatesContent = {
  title: "Rates & warranty",
  intro:
    "Transparent, quotable rates for our electrician in Amsterdam. You know where you stand up front.",

  items: [
    {
      label: "Hourly rate — office hours",
      price: perHourEn(prices.hourly),
      note: "Mon–Fri 08:00–18:00, call-out within Amsterdam included.",
    },
    {
      label: "Fault (incl. emergency in office hours)",
      price: firstHourAllInEn(prices.emergencyFirstHour),
      note: `${emergencyOfficeHoursNoteEn} ${allInSublabelEn}. ${firstHourNoteEn}`,
    },
    {
      label: "Evening, night & weekend",
      price: firstHourAllInEn(prices.offHoursFirstHour),
      note: `${offHoursReasonNoteEn} ${allInSublabelEn}. ${firstHourNoteEn}`,
    },
    {
      label: "Warranty",
      price: "On installation work",
      note: "Warranty on installation work, 2 year manufacturer warranty on installed materials.",
    },
  ],

  footnote: `${vatConsumerNoteEn} Fixed services (perilex, fuse box) get a fixed quote up front.`,
};
