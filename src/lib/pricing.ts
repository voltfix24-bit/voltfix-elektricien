// Centrale, citeerbare prijs- en garantiedata voor VoltFix.
// Wijzigingen hier werken door in de RatesTable, PriceIndicator-blokken en llms.txt.

export type RateItem = {
  label: string;
  price: string;
  note: string;
};

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
      price: "€ 90 / uur",
      note: "Binnen kantooruren, voorrijkosten binnen Amsterdam inbegrepen.",
    },
    {
      label: "Spoed / 24-7",
      price: "vanaf € 120",
      note: "Starttarief bij spoed, avond, nacht en weekend.",
    },
    {
      label: "Storing oplossen",
      price: "€ 120 eerste uur",
      note: "Meerprijs voor tijd of materiaal wordt vooraf gecommuniceerd — nooit meer dan € 120 extra zonder overleg.",
    },
    {
      label: "Garantie",
      price: "12 mnd installatiewerk",
      note: "12 maanden garantie op installatiewerk, 2 jaar fabrieksgarantie op geplaatste materialen.",
    },
  ],
  footnote: "Alle bedragen incl. 21% btw. Vaste diensten (perilex, groepenkast) krijgen een vaste prijs vooraf.",
};

export const ratesEn: RatesContent = {
  title: "Rates & warranty",
  intro:
    "Transparent, quotable rates for our electrician in Amsterdam. You know where you stand up front.",
  items: [
    {
      label: "Hourly rate",
      price: "€ 90 / hour",
      note: "Office hours, call-out costs within Amsterdam included.",
    },
    {
      label: "Emergency / 24-7",
      price: "from € 120",
      note: "Start rate for emergency, evening, night and weekend.",
    },
    {
      label: "Fault finding",
      price: "€ 120 first hour",
      note: "Any extra time or materials is agreed up front — never more than € 120 extra without confirmation.",
    },
    {
      label: "Warranty",
      price: "12 mo. on install work",
      note: "12 months warranty on installation work, 2 year manufacturer warranty on installed materials.",
    },
  ],
  footnote: "All amounts incl. 21% VAT. Fixed services (perilex, fuse box) get a fixed quote up front.",
};

// Vaste vanaf-prijzen per dienst (gebruikt in PriceIndicator en llms.txt).
export const servicePricing = {
  perilexFrom: 120,
  groepenkastFrom: 450,
  groepenkastTo: 850,
  stroomstoringFirstHour: 120,
  hourly: 90,
  emergencyFrom: 120,
} as const;
