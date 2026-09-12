import { breakdownFromExVat, type MoneyBreakdown } from './money';
import { perilexCatalog, perilexCatalogVersion, type PerilexPriceRuleId } from './pricing-catalog';
import type { GroupLocale } from '@/lib/groepenkast';

/**
 * Pure route- en prijsbeslissing voor Perilex/inductie.
 *
 * Deze module bevat GEEN bedragen: alle prijzen komen uit `perilexCatalog`
 * (fase 2). Componenten en de server gebruiken dezelfde functie, zodat de
 * klant, het overzicht en de opslag nooit uit elkaar kunnen lopen.
 *
 * Alles wat hier uitkomt zijn stabiele codes — nooit vertaalde UI-teksten.
 */

/* -------------------------------------------------------------------------- */
/* Antwoorden (stabiele codes)                                                 */
/* -------------------------------------------------------------------------- */

export const perilexIntents = [
  'connect_existing',
  'new_installation',
  'kitchen_renovation',
  'fault_or_issue',
  'unsure',
] as const;
export type PerilexIntent = (typeof perilexIntents)[number];

/** Is alles al aanwezig en werkend? */
export const perilexPreparations = ['yes', 'unsure', 'no'] as const;
export type PerilexPreparation = (typeof perilexPreparations)[number];

/** Wanneer wil je geholpen worden? */
export const perilexUrgencies = ['standard', 'priority_24h'] as const;
export type PerilexUrgency = (typeof perilexUrgencies)[number];

/** Hoe wil je verder? */
export const perilexReviewChoices = ['photo_review', 'site_survey'] as const;
export type PerilexReviewChoice = (typeof perilexReviewChoices)[number];

/** Storingstype. */
export const perilexIssueTypes = [
  'circuit_trips_or_error',
  'connection_hot',
  'burning_smell_or_sparks',
  'other',
] as const;
export type PerilexIssueType = (typeof perilexIssueTypes)[number];

/** Storingstypes die direct veiligheidsadvies en bellen vragen. */
export const perilexSafetyIssueTypes: readonly PerilexIssueType[] = ['connection_hot', 'burning_smell_or_sparks'];

export type PerilexAnswers = {
  intent: PerilexIntent | null;
  preparation?: PerilexPreparation | null;
  urgency?: PerilexUrgency | null;
  reviewChoice?: PerilexReviewChoice | null;
  issueType?: PerilexIssueType | null;
};

export const emptyPerilexAnswers: PerilexAnswers = {
  intent: null,
  preparation: null,
  urgency: null,
  reviewChoice: null,
  issueType: null,
};

/* -------------------------------------------------------------------------- */
/* Uitkomsten                                                                  */
/* -------------------------------------------------------------------------- */

export const perilexBookingRoutes = [
  'fixed_existing_standard',
  'fixed_existing_priority',
  'site_survey',
  'photo_review',
  'fault_review',
  'safety_call',
] as const;
export type PerilexBookingRoute = (typeof perilexBookingRoutes)[number];

/**
 * `fixed`         → vast bedrag uit de catalogus.
 * `review_needed` → beoordeling nodig, geen automatisch bedrag.
 * `none`          → geen boekingsprijs (veiligheidsroute: bellen).
 */
export type PerilexPriceStatus = 'fixed' | 'review_needed' | 'none';

/** Welke vervolgvraag nog beantwoord moet worden voordat de route vaststaat. */
export type PerilexPendingQuestion = 'intent' | 'preparation' | 'urgency' | 'review_choice' | 'issue_type' | null;

export type PerilexBookingResult = {
  /** Definitieve route, of null zolang een zichtbare verplichte keuze ontbreekt. */
  route: PerilexBookingRoute | null;
  complete: boolean;
  pendingQuestion: PerilexPendingQuestion;
  priceStatus: PerilexPriceStatus;
  priceRuleId: PerilexPriceRuleId | null;
  /** Bedrag EXCL. btw in integer eurocenten; null bij beoordeling of bellen. */
  amountExVatCents: number | null;
  subjectToAvailability: boolean;
  deductible: boolean;
  /** Veiligheidsroute: veiligheidsadvies + bellen, geen installatieprijs. */
  safety: boolean;
  /** De fotostap is nooit verplicht bij Perilex (fase 3). */
  photoRequired: boolean;
  /** Keukentekening-hint tonen op de fotostap. */
  showKitchenDrawingHint: boolean;
  /** Terugbelverzoek aanbieden. */
  offerCallback: boolean;
};

const reviewResult = (route: 'photo_review' | 'fault_review', showKitchenDrawingHint: boolean): PerilexBookingResult => ({
  route,
  complete: true,
  pendingQuestion: null,
  priceStatus: 'review_needed',
  priceRuleId: null,
  amountExVatCents: null,
  subjectToAvailability: false,
  deductible: false,
  safety: false,
  photoRequired: false,
  showKitchenDrawingHint,
  offerCallback: route === 'fault_review',
});

const pending = (question: Exclude<PerilexPendingQuestion, null>): PerilexBookingResult => ({
  route: null,
  complete: false,
  pendingQuestion: question,
  priceStatus: 'review_needed',
  priceRuleId: null,
  amountExVatCents: null,
  subjectToAvailability: false,
  deductible: false,
  safety: false,
  photoRequired: false,
  showKitchenDrawingHint: false,
  offerCallback: false,
});

const fromRule = (
  route: PerilexBookingRoute,
  ruleId: PerilexPriceRuleId,
  showKitchenDrawingHint: boolean,
): PerilexBookingResult => {
  const rule = perilexCatalog.rules[ruleId];
  return {
    route,
    complete: true,
    pendingQuestion: null,
    priceStatus: 'fixed',
    priceRuleId: rule.id,
    amountExVatCents: rule.amountExVatCents,
    subjectToAvailability: rule.subjectToAvailability,
    deductible: rule.deductible,
    safety: false,
    photoRequired: false,
    showKitchenDrawingHint,
    offerCallback: false,
  };
};

/**
 * Beslisboom. Enige plek waar route, prijsstatus en prijsregel worden bepaald.
 *
 * - Alleen `connect_existing` + voorbereiding `yes` kan een vaste aansluitprijs
 *   krijgen. `unsure`/`no` komen altijd in de beoordelings-/schouwroute.
 * - Storingen krijgen nooit een installatieprijs.
 * - Warmte, brandlucht of vonken → veiligheidsroute zonder boekingsprijs.
 */
export function derivePerilexBookingResult(answers: PerilexAnswers): PerilexBookingResult {
  const intent = answers.intent;
  if (!intent) return pending('intent');

  const kitchenHint = intent === 'kitchen_renovation';

  if (intent === 'fault_or_issue') {
    const issue = answers.issueType ?? null;
    if (!issue) return pending('issue_type');
    if (perilexSafetyIssueTypes.includes(issue)) {
      return {
        route: 'safety_call',
        complete: true,
        pendingQuestion: null,
        priceStatus: 'none',
        priceRuleId: null,
        amountExVatCents: null,
        subjectToAvailability: false,
        deductible: false,
        safety: true,
        photoRequired: false,
        showKitchenDrawingHint: false,
        offerCallback: true,
      };
    }
    return reviewResult('fault_review', false);
  }

  if (intent === 'connect_existing') {
    const preparation = answers.preparation ?? null;
    if (!preparation) return pending('preparation');
    if (preparation === 'yes') {
      const urgency = answers.urgency ?? null;
      if (!urgency) return pending('urgency');
      return urgency === 'priority_24h'
        ? fromRule('fixed_existing_priority', 'existing_connection_priority_24h', false)
        : fromRule('fixed_existing_standard', 'existing_connection_standard', false);
    }
    // `no` en `unsure`: nooit een vaste aansluitprijs.
    const choice = answers.reviewChoice ?? null;
    if (!choice) return pending('review_choice');
    return choice === 'site_survey'
      ? fromRule('site_survey', 'site_survey', false)
      : reviewResult('photo_review', false);
  }

  // new_installation, kitchen_renovation, unsure
  const choice = answers.reviewChoice ?? null;
  if (!choice) return pending('review_choice');
  return choice === 'site_survey'
    ? fromRule('site_survey', 'site_survey', kitchenHint)
    : reviewResult('photo_review', kitchenHint);
}

/* -------------------------------------------------------------------------- */
/* Server-side herberekening                                                   */
/* -------------------------------------------------------------------------- */

export type PerilexPriceSnapshot = {
  service: 'perilex';
  catalogVersion: string;
  route: PerilexBookingRoute | null;
  status: PerilexPriceStatus;
  priceRuleId: PerilexPriceRuleId | null;
  amountExVatCents: number | null;
  subjectToAvailability: boolean;
  deductible: boolean;
  currency: 'EUR';
  displayTaxMode: 'ex_vat';
  money: MoneyBreakdown | null;
  /** Stabiele antwoordcodes zoals opgeslagen in `service_answers`. */
  answers: PerilexAnswers;
};

/**
 * Perilex-variant naast `recalculateGroepenkastPrice`. De groepenkastberekening
 * blijft bewust dienstspecifiek en ongewijzigd; er wordt niets generiek gemaakt.
 * Bedragen komen uitsluitend uit de catalogus — clientbedragen tellen niet mee.
 */
export function recalculatePerilexPrice(answers: PerilexAnswers): PerilexPriceSnapshot {
  const result = derivePerilexBookingResult(answers);
  const money =
    result.priceStatus === 'fixed' && result.amountExVatCents !== null && result.priceRuleId
      ? breakdownFromExVat({
          amountExVatCents: result.amountExVatCents,
          vatRateBps: perilexCatalog.vatRateBps,
          displayTaxMode: 'ex_vat',
          catalogVersion: perilexCatalogVersion,
          priceRuleId: `perilex:${result.priceRuleId}`,
        })
      : null;
  return {
    service: 'perilex',
    catalogVersion: perilexCatalogVersion,
    route: result.route,
    status: result.priceStatus,
    priceRuleId: result.priceRuleId,
    amountExVatCents: result.amountExVatCents,
    subjectToAvailability: result.subjectToAvailability,
    deductible: result.deductible,
    currency: 'EUR',
    displayTaxMode: 'ex_vat',
    money,
    answers: normalisePerilexAnswers(answers),
  };
}

/** Alleen bekende codes overnemen; onbekende waarden worden null. */
export function normalisePerilexAnswers(answers: Partial<PerilexAnswers> | null | undefined): PerilexAnswers {
  const pick = <T extends string>(allowed: readonly T[], value: unknown): T | null =>
    typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : null;
  return {
    intent: pick(perilexIntents, answers?.intent),
    preparation: pick(perilexPreparations, answers?.preparation),
    urgency: pick(perilexUrgencies, answers?.urgency),
    reviewChoice: pick(perilexReviewChoices, answers?.reviewChoice),
    issueType: pick(perilexIssueTypes, answers?.issueType),
  };
}

/* -------------------------------------------------------------------------- */
/* Weergave (NL/EN)                                                            */
/* -------------------------------------------------------------------------- */

/** Bedrag EXCL. btw als "€ 120 excl. btw" / "€120 excl. VAT". */
export function perilexMoney(amountExVatCents: number, lang: GroupLocale): string {
  const euro = amountExVatCents / 100;
  const formatted = Number.isInteger(euro) ? String(euro) : euro.toFixed(2).replace('.', lang === 'en' ? '.' : ',');
  return lang === 'en' ? `€${formatted} excl. VAT` : `€${formatted} excl. btw`;
}

export const perilexAvailabilityNote = {
  nl: 'Op basis van beschikbaarheid. VoltFix bevestigt het definitieve tijdstip.',
  en: 'Subject to availability. VoltFix confirms the final time slot.',
} as const;

export const perilexDeductibleNote = {
  nl: 'Volledig verrekenbaar wanneer VoltFix de geoffreerde werkzaamheden uitvoert.',
  en: 'Fully deductible when VoltFix carries out the quoted work.',
} as const;

export const perilexReviewNote = {
  nl: 'Prijs na beoordeling',
  en: 'Price after review',
} as const;

export const perilexSafetyAdvice = {
  nl: 'Gebruik het apparaat niet meer en schakel de betreffende groep uit als dit veilig kan.',
  en: 'Stop using the appliance and switch off the relevant circuit if you can do so safely.',
} as const;

/** Statuslabel voor de sticky footer; routeafhankelijk. */
export function perilexStatusLabel(result: PerilexBookingResult, lang: GroupLocale): string {
  const en = lang === 'en';
  if (result.safety) return en ? 'Call VoltFix' : 'Bel VoltFix';
  if (result.priceStatus === 'fixed' && result.amountExVatCents !== null) {
    const amount = perilexMoney(result.amountExVatCents, lang);
    return result.priceRuleId === 'site_survey' ? `${en ? 'Survey' : 'Schouw'} ${amount}` : amount;
  }
  return perilexReviewNote[en ? 'en' : 'nl'];
}
