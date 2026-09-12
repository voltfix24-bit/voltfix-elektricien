// Gedeelde typen voor de service-intake engine.
// Geen UI, geen React — deze laag is puur logica en is los te testen.

export type ServiceId = 'groepenkast' | 'laadpaal' | 'perilex' | 'storing' | 'keuring';

export type Intent = 'spoed' | 'vasteprijs' | 'foto' | 'schouw';

/** Wat een pagina aan de engine meegeeft. Zie routing.ts → getIntakeContext(). */
export type IntakeContext = {
  service: ServiceId | null;
  intent: Intent | null;
  sourcePage: string;
};

export type QuestionType = 'single' | 'multi';

export type QuestionOption = {
  id: string;
  naam: string;
  sub: string;
  /** All-in bedrag in hele euro's. Bij 'multi' is dit een meerprijs. */
  prijs: number;
};

export type Question = {
  id: string;
  type: QuestionType;
  titel: string;
  sub: string;
  opties: QuestionOption[];
};

export type PhotoGuidance = {
  titel: string;
  instructies: string[];
  /** Veiligheidsregel — altijd tonen, nooit inkorten. */
  waarschuwing: string;
};

export type ServiceConfig = {
  id: ServiceId;
  naam: string;
  /** Feature flag: staat de dienst live? Uit = zichtbaar als "binnenkort". */
  actief: boolean;
  /** Alleen bel-/WhatsApp-route, nooit een wizard. */
  alleenSpoed?: boolean;
  vanaf: number;
  vragen: Question[];
  foto?: PhotoGuidance;
  /** "Wat zit er niet in" — getoond op het overzicht, waar de twijfel ontstaat. */
  trust: string;
};

export type Step =
  | 'dienst'
  | 'intent'
  | 'spoed'
  | 'gebied'
  | 'foto'
  | 'planning'
  | 'contact'
  | 'overzicht'
  | `vraag:${string}`;

export type Dagdeel = 'ocht' | 'mid' | 'flex';

export type IntakeState = {
  service: ServiceId | null;
  intent: Intent | null;
  /** Antwoorden per vraag-id: string bij 'single', string[] bij 'multi'. */
  keuzeData: Record<string, string | string[]>;
  postcode: string;
  huisnummer: string;
  fotos: string[];
  planDatum: Date | null;
  planDagdeel: Dagdeel | null;
  naam: string;
  telefoon: string;
  email: string;
  akkoord: boolean;
};

export type PriceStatus = 'vast' | 'na-foto' | 'schouw' | 'tarief' | 'open';

export type PriceResult = {
  status: PriceStatus;
  label: string;
  /** Geformatteerd bedrag, of een zin als "Volgt na je foto". */
  bedrag: string;
  /** null wanneer er geen hard bedrag is — gebruik dit, niet het label. */
  bedragCent: number | null;
  toelichting: string;
};

export const emptyState = (ctx: IntakeContext): IntakeState => ({
  service: ctx.service,
  intent: ctx.intent,
  keuzeData: {},
  postcode: '',
  huisnummer: '',
  fotos: [],
  planDatum: null,
  planDagdeel: null,
  naam: '',
  telefoon: '',
  email: '',
  akkoord: false,
});
