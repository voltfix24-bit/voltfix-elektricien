import type { GroupLocale } from '@/lib/groepenkast';

/** Alle diensten die (later) door de centrale booking-engine bediend worden. */
export type BookingServiceId = 'groepenkast' | 'laadpaal' | 'perilex' | 'spoed' | 'stopcontact' | 'algemeen';

/** Type flow bepaalt de opzet: geplande klus, spoed, vrije offerte of vaste prijs. */
export type BookingFlowType = 'planned' | 'emergency' | 'quote' | 'fixed-price';

/** Intentie waarmee de flow geopend wordt (knopcontext). */
export type BookingIntent = 'price' | 'survey' | 'photo' | 'emergency' | 'quote';

/** Gedeelde en dienstspecifieke stappen. */
export type BookingStepId =
  | 'package'      // dienstspecifiek: pakketkeuze
  | 'options'      // dienstspecifiek: opties
  | 'intake'       // dienstspecifiek: technische intakevragen
  | 'fault'        // spoed: storingstype
  | 'photo'        // gedeeld
  | 'address'      // gedeeld (postcode/adres + planning)
  | 'contact'      // gedeeld
  | 'summary';     // gedeeld

/** Context waarmee de flow geopend wordt vanaf een pagina. */
export type BookingContext = {
  initialService: BookingServiceId;
  initialIntent?: BookingIntent;
  sourcePage?: string;
  initialPackage?: string;
};

/** Waarden die de gedeelde stappen verzamelen. */
export type BookingState = {
  packageId: string;
  optionIds: readonly string[];
  /** Aantal extra groepen dat de klant bijbestelt (0 wanneer niet van toepassing). */
  extraGroups?: number;
  photoRoute: 'photo' | 'survey' | 'later';
  photoCount: number;
};

export type ServiceOption = { id: string; price: number; nl: string; en: string };

export type BookingPayload = {
  jobType: string;
  message: string;
  /** Extra veld dat als JSON meegaat naar /api/public/quote-request. */
  bookingField?: { name: string; value: unknown };
};

export type ServiceConfig = {
  id: BookingServiceId;
  /** Route-slug per taal; gebruikt voor tracking en "dienst wijzigen". */
  slug: { nl: string; en: string };
  name: { nl: string; en: string };
  flowType: BookingFlowType;
  /** Placeholderdiensten staan uit en worden nergens getoond. */
  enabled: boolean;
  steps: readonly BookingStepId[];
  stepLabels: (lang: GroupLocale) => string[];
  stepCta: (lang: GroupLocale) => string[];
  photo?: {
    allowLater: boolean;
    allowSurvey: boolean;
    surveyFee: number | null;
    instructions: (lang: GroupLocale) => { title: string; note: string };
  };
  packages?: readonly { id: string; price: number; nl: string; en: string }[];
  options?: readonly ServiceOption[];
  /** Prijslogica: null = "prijs na controle". */
  price?: (state: Pick<BookingState, 'packageId' | 'optionIds' | 'extraGroups'>) => { base: number | null; extras: number; total: number | null };
  /** Statuslabel in de sticky footer. */
  status: (state: BookingState, lang: GroupLocale) => string;
  /** Tekst op het bedankscherm. */
  successCopy: (state: BookingState, lang: GroupLocale) => string;
  /** Vertaling naar de aanvraag die de server ontvangt. */
  payload: (input: unknown, lang: GroupLocale) => BookingPayload;
};
