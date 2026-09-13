import { breakdownFromExVat, type MoneyBreakdown } from './money';
import { perilexCatalog, perilexCatalogVersion, type PerilexPriceRuleId } from './pricing-catalog';

/**
 * Interne Perilex-beoordeling (fase 5A) — pure regels, geen database en geen UI-tekst.
 *
 * Deze module is de enige plek waar een interne uitkomst en een bedrag ontstaan.
 * De server gebruikt hem; de browser mag hetzelfde rekenen om te tonen, maar
 * nooit om te beslissen. Alles wat hier uitkomt zijn stabiele codes.
 */

/* -------------------------------------------------------------------------- */
/* Statussen en overgangen                                                     */
/* -------------------------------------------------------------------------- */

export const assessmentStatuses = [
  'new',
  'in_review',
  'waiting_customer',
  'ready_fixed_price',
  'survey_proposed',
  'survey_scheduled',
  'quote_required',
  'safety_contact_required',
  'scheduled',
  'completed',
  'cancelled',
] as const;
export type AssessmentStatus = (typeof assessmentStatuses)[number];

export function isAssessmentStatus(value: unknown): value is AssessmentStatus {
  return typeof value === 'string' && (assessmentStatuses as readonly string[]).includes(value);
}

/**
 * Toegestane overgangen. `cancelled` en `safety_contact_required` zijn vanuit
 * elke actieve status bereikbaar; afgeronde en geannuleerde beoordelingen zijn
 * eindstations (heropenen kan alleen naar `in_review`).
 */
const transitions: Record<AssessmentStatus, readonly AssessmentStatus[]> = {
  new: ['in_review', 'waiting_customer', 'cancelled', 'safety_contact_required'],
  in_review: [
    'waiting_customer',
    'ready_fixed_price',
    'survey_proposed',
    'quote_required',
    'safety_contact_required',
    'cancelled',
  ],
  waiting_customer: ['in_review', 'ready_fixed_price', 'survey_proposed', 'quote_required', 'safety_contact_required', 'cancelled'],
  ready_fixed_price: ['scheduled', 'in_review', 'waiting_customer', 'safety_contact_required', 'cancelled'],
  survey_proposed: ['survey_scheduled', 'in_review', 'waiting_customer', 'safety_contact_required', 'cancelled'],
  survey_scheduled: ['in_review', 'quote_required', 'ready_fixed_price', 'completed', 'safety_contact_required', 'cancelled'],
  quote_required: ['in_review', 'waiting_customer', 'scheduled', 'safety_contact_required', 'cancelled'],
  safety_contact_required: ['in_review', 'waiting_customer', 'survey_proposed', 'quote_required', 'cancelled'],
  scheduled: ['completed', 'in_review', 'cancelled'],
  completed: [],
  cancelled: ['in_review'],
};

export function allowedAssessmentTransitions(from: AssessmentStatus): readonly AssessmentStatus[] {
  return transitions[from];
}

export function canTransitionAssessment(from: AssessmentStatus, to: AssessmentStatus): boolean {
  if (from === to) return true;
  return transitions[from].includes(to);
}

/* -------------------------------------------------------------------------- */
/* Technische checklist                                                        */
/* -------------------------------------------------------------------------- */

/** Standaard keuzeset voor ja/nee-vragen. */
export const ternaryOptions = ['yes', 'no', 'unclear', 'na'] as const;
export type TernaryAnswer = (typeof ternaryOptions)[number];

export const checklistItems = {
  existing_perilex_socket: ternaryOptions,
  socket_condition: ['good', 'damaged', 'unknown'],
  working_suitable_circuit: ternaryOptions,
  supply_phase: ['single_phase', 'three_phase', 'unknown'],
  circuit_type: ['cooking_2x16a', 'power_3x16a', 'other', 'unknown'],
  protection_suitable: ['yes', 'no', 'to_measure'],
  cable_suitable: ['yes', 'no', 'to_check'],
  appliance_model_known: ternaryOptions,
  manufacturer_diagram_available: ternaryOptions,
  install_location_ready: ternaryOptions,
  kitchen_drawing_available: ['yes', 'no', 'na'],
  extra_survey_or_measurement_needed: ternaryOptions,
} as const;

export type ChecklistCode = keyof typeof checklistItems;
export const checklistCodes = Object.keys(checklistItems) as ChecklistCode[];

export type ChecklistAnswers = Partial<{ [K in ChecklistCode]: (typeof checklistItems)[K][number] }>;

export function isChecklistAnswerValid<K extends ChecklistCode>(code: K, value: unknown): boolean {
  return typeof value === 'string' && (checklistItems[code] as readonly string[]).includes(value);
}

/** Verwijdert onbekende codes en ongeldige waarden; laat de rest ongemoeid. */
export function normaliseChecklist(input: unknown): ChecklistAnswers {
  const out: Record<string, string> = {};
  if (input && typeof input === 'object') {
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      if ((checklistCodes as string[]).includes(key) && isChecklistAnswerValid(key as ChecklistCode, value)) {
        out[key] = value as string;
      }
    }
  }
  return out as ChecklistAnswers;
}

/* -------------------------------------------------------------------------- */
/* Mogelijke werkzaamheden                                                     */
/* -------------------------------------------------------------------------- */

export const workItems = [
  'connect_plug_only',
  'measure_and_verify',
  'replace_perilex_socket',
  'new_cable',
  'new_circuit',
  'consumer_unit_change',
  'move_connection_point',
  'construction_work',
  'other_unclear',
] as const;
export type WorkItem = (typeof workItems)[number];

/** Werk dat een automatische vaste prijs uitsluit. */
export const heavyWorkItems: readonly WorkItem[] = [
  'replace_perilex_socket',
  'new_cable',
  'new_circuit',
  'consumer_unit_change',
  'move_connection_point',
  'construction_work',
  'other_unclear',
];

export function isWorkItem(value: unknown): value is WorkItem {
  return typeof value === 'string' && (workItems as readonly string[]).includes(value);
}

/* -------------------------------------------------------------------------- */
/* Veiligheid                                                                  */
/* -------------------------------------------------------------------------- */

export const safetyFlags = [
  'circuit_trips',
  'socket_or_plug_hot',
  'burning_smell_sparks_discolouration',
  'loose_or_damaged_connection',
  'unsafe_situation_suspected',
  'direct_phone_contact_needed',
] as const;
export type SafetyFlag = (typeof safetyFlags)[number];

/** Kritiek: blokkeert elke automatische vaste prijs. */
export const criticalSafetyFlags: readonly SafetyFlag[] = [
  'socket_or_plug_hot',
  'burning_smell_sparks_discolouration',
  'unsafe_situation_suspected',
  'direct_phone_contact_needed',
];

export function isSafetyFlag(value: unknown): value is SafetyFlag {
  return typeof value === 'string' && (safetyFlags as readonly string[]).includes(value);
}

export function hasCriticalSafetyFlag(flags: readonly string[]): boolean {
  return flags.some(flag => (criticalSafetyFlags as readonly string[]).includes(flag));
}

/* -------------------------------------------------------------------------- */
/* Ontbrekende informatie                                                      */
/* -------------------------------------------------------------------------- */

export const missingInfoItems = [
  'photo_consumer_unit',
  'photo_existing_outlet',
  'photo_installation_location',
  'photo_appliance_label',
  'kitchen_plan',
  'manufacturer_diagram',
  'appliance_model',
  'phone_contact_safety',
  'access_details',
] as const;
export type MissingInfoItem = (typeof missingInfoItems)[number];

export function isMissingInfoItem(value: unknown): value is MissingInfoItem {
  return typeof value === 'string' && (missingInfoItems as readonly string[]).includes(value);
}

/* -------------------------------------------------------------------------- */
/* Beslissing                                                                  */
/* -------------------------------------------------------------------------- */

export const assessmentDecisions = [
  'fixed_existing_standard',
  'fixed_existing_priority_24h',
  'site_survey',
  'additional_information_required',
  'custom_quote_required',
  'safety_contact_required',
  'outside_service_area',
  'declined',
] as const;
export type AssessmentDecision = (typeof assessmentDecisions)[number];

export function isAssessmentDecision(value: unknown): value is AssessmentDecision {
  return typeof value === 'string' && (assessmentDecisions as readonly string[]).includes(value);
}

/** Reden waarom een beslissing geweigerd is — stabiele code, geen UI-tekst. */
export const decisionRejections = [
  'safety_flag_blocks_fixed_price',
  'insufficient_technical_certainty',
  'heavy_work_requires_quote',
  'priority_not_requested_by_customer',
  'priority_availability_not_confirmed',
  'unknown_decision',
] as const;
export type DecisionRejection = (typeof decisionRejections)[number];

export type DecisionInput = {
  decision: AssessmentDecision;
  checklist: ChecklistAnswers;
  safetyFlags: readonly string[];
  workItems: readonly string[];
  /** Heeft de klant zelf voorrang binnen 24 uur gevraagd (uit de intake)? */
  customerRequestedPriority: boolean;
  /** Wie heeft de beschikbaarheid bevestigd; verplicht bij €145. */
  availabilityConfirmedBy?: string | null;
  availabilityConfirmedAt?: string | null;
};

export type DecisionOutcome =
  | {
      ok: true;
      decision: AssessmentDecision;
      status: AssessmentStatus;
      priceRuleId: PerilexPriceRuleId | null;
      amountExVatCents: number | null;
      money: MoneyBreakdown | null;
      deductible: boolean;
      catalogVersion: string;
    }
  | { ok: false; reason: DecisionRejection };

/**
 * Is er genoeg technische zekerheid voor het simpelweg aansluiten van de
 * stekker op een bestaande, bruikbare aansluiting en groep?
 */
export function fixedPriceEligible(input: Pick<DecisionInput, 'checklist' | 'safetyFlags' | 'workItems'>): boolean {
  if (hasCriticalSafetyFlag(input.safetyFlags)) return false;
  if (input.workItems.some(item => (heavyWorkItems as readonly string[]).includes(item))) return false;
  const c = input.checklist;
  return (
    c.existing_perilex_socket === 'yes' &&
    c.socket_condition === 'good' &&
    c.working_suitable_circuit === 'yes' &&
    c.protection_suitable === 'yes' &&
    c.cable_suitable === 'yes' &&
    c.install_location_ready === 'yes' &&
    c.extra_survey_or_measurement_needed === 'no'
  );
}

function money(ruleId: PerilexPriceRuleId): MoneyBreakdown {
  const rule = perilexCatalog.rules[ruleId];
  return breakdownFromExVat({
    amountExVatCents: rule.amountExVatCents,
    vatRateBps: perilexCatalog.vatRateBps,
    displayTaxMode: 'ex_vat',
    catalogVersion: perilexCatalogVersion,
    priceRuleId: rule.id,
  });
}

const priced = (ruleId: PerilexPriceRuleId, decision: AssessmentDecision, status: AssessmentStatus): DecisionOutcome => ({
  ok: true,
  decision,
  status,
  priceRuleId: ruleId,
  amountExVatCents: perilexCatalog.rules[ruleId].amountExVatCents,
  money: money(ruleId),
  deductible: perilexCatalog.rules[ruleId].deductible,
  catalogVersion: perilexCatalogVersion,
});

const unpriced = (decision: AssessmentDecision, status: AssessmentStatus): DecisionOutcome => ({
  ok: true,
  decision,
  status,
  priceRuleId: null,
  amountExVatCents: null,
  money: null,
  deductible: false,
  catalogVersion: perilexCatalogVersion,
});

/**
 * Serverbeslissing. Bedragen komen uitsluitend uit `perilexCatalog`; een
 * handmatig bedrag bestaat niet.
 */
export function decideAssessment(input: DecisionInput): DecisionOutcome {
  const critical = hasCriticalSafetyFlag(input.safetyFlags);

  switch (input.decision) {
    case 'fixed_existing_standard': {
      if (critical) return { ok: false, reason: 'safety_flag_blocks_fixed_price' };
      if (input.workItems.some(item => (heavyWorkItems as readonly string[]).includes(item))) {
        return { ok: false, reason: 'heavy_work_requires_quote' };
      }
      if (!fixedPriceEligible(input)) return { ok: false, reason: 'insufficient_technical_certainty' };
      return priced('existing_connection_standard', input.decision, 'ready_fixed_price');
    }
    case 'fixed_existing_priority_24h': {
      if (critical) return { ok: false, reason: 'safety_flag_blocks_fixed_price' };
      if (input.workItems.some(item => (heavyWorkItems as readonly string[]).includes(item))) {
        return { ok: false, reason: 'heavy_work_requires_quote' };
      }
      if (!fixedPriceEligible(input)) return { ok: false, reason: 'insufficient_technical_certainty' };
      if (!input.customerRequestedPriority) return { ok: false, reason: 'priority_not_requested_by_customer' };
      if (!input.availabilityConfirmedBy || !input.availabilityConfirmedAt) {
        return { ok: false, reason: 'priority_availability_not_confirmed' };
      }
      return priced('existing_connection_priority_24h', input.decision, 'ready_fixed_price');
    }
    case 'site_survey':
      return priced('site_survey', input.decision, 'survey_proposed');
    case 'additional_information_required':
      return unpriced(input.decision, 'waiting_customer');
    case 'custom_quote_required':
      return unpriced(input.decision, 'quote_required');
    case 'safety_contact_required':
      return unpriced(input.decision, 'safety_contact_required');
    case 'outside_service_area':
    case 'declined':
      return unpriced(input.decision, 'cancelled');
    default:
      return { ok: false, reason: 'unknown_decision' };
  }
}

/* -------------------------------------------------------------------------- */
/* Telegram-payload (geen bestanden, geen opslagpaden)                          */
/* -------------------------------------------------------------------------- */

export type AssessmentNotificationPayload = {
  service: 'perilex';
  intent: string | null;
  route: string | null;
  price_status: string | null;
  priority_requested: boolean;
  postal_area: string | null;
  attachment_count: number;
  attachment_categories: string[];
  review_url: string;
};

/**
 * Bouwt de veilige meldingspayload. Bewust géén bestanden, opslagpaden,
 * signed URL's, keukentekening, fabrikantschema of interne notities.
 */
export function buildAssessmentNotification(input: {
  quoteRequestId: string;
  leadId?: string | null;
  intent?: string | null;
  route?: string | null;
  priceStatus?: string | null;
  priorityRequested?: boolean;
  postalArea?: string | null;
  attachmentCategories?: readonly string[];
  baseUrl: string;
}): AssessmentNotificationPayload {
  const categories = Array.from(new Set(input.attachmentCategories ?? [])).sort();
  const base = input.baseUrl.replace(/\/+$/, '');
  return {
    service: 'perilex',
    intent: input.intent ?? null,
    route: input.route ?? null,
    price_status: input.priceStatus ?? null,
    priority_requested: Boolean(input.priorityRequested),
    postal_area: input.postalArea ?? null,
    attachment_count: categories.length === 0 ? 0 : (input.attachmentCategories ?? []).length,
    attachment_categories: categories,
    review_url: `${base}/admin/leads?aanvraag=${encodeURIComponent(input.quoteRequestId)}`,
  };
}
