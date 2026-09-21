// ---------------------------------------------------------------------------
// Regels voor de terugmelding van conversies aan Google (pure logica)
// ---------------------------------------------------------------------------
// Alles wat beslist óf, wanneer en met welke status een dossier aan Google mag
// worden teruggemeld staat hier, zonder database of netwerk, zodat het
// testbaar is. De uitvoering staat in ads-outbox.server.ts.
// ---------------------------------------------------------------------------

/**
 * Fase van het dossier waarop de terugmelding slaat. Elke fase is een eigen
 * gebeurtenis met een eigen tijdstip en een eigen bestemming bij Google; een
 * gekwalificeerde aanvraag wacht dus nooit op een afgeronde klus.
 */
export type ConversionPhase =
  | 'request_received'
  | 'request_qualified'
  | 'job_accepted'
  | 'job_completed'

export const CONVERSION_PHASES: ConversionPhase[] = [
  'request_received',
  'request_qualified',
  'job_accepted',
  'job_completed',
]

export const PHASE_LABEL: Record<ConversionPhase, string> = {
  request_received: 'Aanvraag ontvangen',
  request_qualified: 'Aanvraag gekwalificeerd (beoordeeld)',
  job_accepted: 'Klus aangenomen door monteur',
  job_completed: 'Klus uitgevoerd',
}

/**
 * Waarop een gebeurtenis berust. Dit wordt bij het aanmaken vastgelegd en
 * daarna nooit meer herschreven, zodat oudere gebeurtenissen niet stilzwijgend
 * een andere betekenis krijgen als de regels veranderen.
 */
export type PhaseSource =
  /** Aanvraag vastgelegd bij binnenkomst. */
  | 'intake_created'
  /** Beheerder heeft de aanvraag expliciet als echte klant beoordeeld. */
  | 'intake_assessment'
  /** Monteur heeft de klus aangenomen. */
  | 'contractor_accept'
  /** Dossier afgerond met uitkomst "gedaan". */
  | 'outcome_done'
  /** Van vóór de scheiding tussen kwalificatie en aanname. */
  | 'legacy_pre_split'

export const PHASE_SOURCE_LABEL: Record<PhaseSource, string> = {
  intake_created: 'aanvraag binnengekomen',
  intake_assessment: 'beoordeeld als echte klant',
  contractor_accept: 'aangenomen door monteur',
  outcome_done: 'klus afgerond',
  legacy_pre_split: 'oude registratie (vóór de scheiding)',
}

export const PHASE_SOURCE: Record<ConversionPhase, PhaseSource> = {
  request_received: 'intake_created',
  request_qualified: 'intake_assessment',
  job_accepted: 'contractor_accept',
  job_completed: 'outcome_done',
}

export type OutboxStatus =
  /** Klaar om verzonden te worden. */
  | 'pending'
  /** Geen toestemming voor advertentiemeting. */
  | 'blocked_consent'
  /** Testdossier: gaat nooit naar Google. */
  | 'skipped_test'
  /** Geen klik-id: niets om aan te koppelen. */
  | 'skipped_no_click'
  /** Wel een klik-id, maar zonder bewijs van de koppeling. */
  | 'no_evidence'
  /** Sleutels of conversieactie ontbreken in deze omgeving. */
  | 'config_missing'
  /** Export staat uit tot akkoord. */
  | 'export_disabled'
  /**
   * Verzending is begonnen. Deze stand wordt vastgelegd vóórdat het verzoek
   * de deur uitgaat, zodat een crash halverwege zichtbaar blijft in plaats van
   * onopgemerkt te verdwijnen.
   */
  | 'in_flight'
  /** Ingediend bij Google; verwerking nog onbekend. */
  | 'submitted'
  /** Ingediend, maar Google gaf geen bruikbaar antwoord terug. */
  | 'processing_unknown'
  /** Door Google verwerkt (apart opgevraagd). */
  | 'processed'
  /** Tijdelijke fout; wordt opnieuw geprobeerd. */
  | 'failed_temporary'
  /** Definitieve fout; niet opnieuw proberen. */
  | 'failed_permanent'

/**
 * Soorten bewijs voor de koppeling tussen dossier en advertentieklik.
 * Alleen onderbouwd bewijs mag naar Google; een vermoeden nooit.
 */
export type ClickEvidence =
  /** Het klik-id kwam mee met het ingediende formulier. */
  | 'form'
  /** De klant noemde de referentie/het klik-id in het WhatsApp-bericht. */
  | 'whatsapp_ref'
  /** Beheerder plakte het volledige klik-id uit het ontvangen bericht. */
  | 'click_id'
  /** Handmatig gekozen uit een lijst met kandidaten: vermoeden. */
  | 'manual_guess'

export const PROVEN_EVIDENCE: ClickEvidence[] = ['form', 'whatsapp_ref', 'click_id']

export function isProvenEvidence(evidence: string | null | undefined): boolean {
  return PROVEN_EVIDENCE.includes(evidence as ClickEvidence)
}

export type EligibilityInput = {
  isTest: boolean
  gclid: string | null
  gbraid: string | null
  wbraid: string | null
  /** Bewijssoort van de koppeling; null wanneer onbekend. */
  evidence: string | null
  /** Vastgelegde advertentietoestemming bij de klik ('granted' | 'denied' | null). */
  consentAdUserData: string | null
  /** Staat de export naar Google aan in deze omgeving? */
  exportEnabled: boolean
  /** Zijn de sleutels aanwezig? */
  configured: boolean
  /**
   * De conversieactie voor déze fase. Zonder actie is er geen bestemming en
   * blijft de gebeurtenis zichtbaar wachten in plaats van te verdwijnen.
   */
  conversionActionId?: string | null
}

/**
 * Bepaalt de status waarmee een dossier in de wachtrij komt. Een dossier dat
 * niet mag, verdwijnt niet: het krijgt een eerlijke, zichtbare status.
 */
export function conversionEligibility(input: EligibilityInput): OutboxStatus {
  if (input.isTest) return 'skipped_test'
  if (!input.gclid && !input.gbraid && !input.wbraid) return 'skipped_no_click'
  if (!isProvenEvidence(input.evidence)) return 'no_evidence'
  if (input.consentAdUserData !== 'granted') return 'blocked_consent'
  if (!input.configured) return 'config_missing'
  if (input.conversionActionId === null || input.conversionActionId === '') return 'config_missing'
  if (!input.exportEnabled) return 'export_disabled'
  return 'pending'
}

/** Statussen waarbij een nieuwe poging zinvol is. */
export function isRetryable(status: OutboxStatus): boolean {
  return status === 'pending' || status === 'failed_temporary'
}

/**
 * Wachttijd tot de volgende poging. De verwerkende taak draait één keer per
 * uur, dus wachttijden korter dan een uur bestaan alleen op papier: de
 * eerstvolgende gelegenheid is toch pas over een uur. De reeks volgt daarom de
 * taak: 1 uur, 2 uur, 6 uur, 12 uur, daarna 24 uur.
 */
export const RETRY_LADDER_MS = [3_600_000, 7_200_000, 21_600_000, 43_200_000]
export const RETRY_LADDER_TAIL_MS = 86_400_000

export function nextAttemptDelayMs(attempts: number): number {
  if (attempts >= RETRY_LADDER_MS.length + 1) return RETRY_LADDER_TAIL_MS
  return RETRY_LADDER_MS[Math.max(0, attempts - 1)] ?? RETRY_LADDER_TAIL_MS
}

/** Dezelfde reeks in woorden, voor de backoffice. */
export const RETRY_SCHEDULE_TEXT =
  'Nieuwe poging na 1 uur, 2 uur, 6 uur, 12 uur en daarna elke 24 uur; de verwerking draait elk uur.'

/** Na zoveel mislukte pogingen geven we het op. */
export const MAX_ATTEMPTS = 6

/**
 * Een gebeurtenis waarvan de verzending is begonnen maar die daarna niets meer
 * van zich liet horen (crash tussen verzenden en opslaan). Na deze tijd pakken
 * we hem opnieuw op; de transactie-identiteit en het gebeurtenistijdstip zijn
 * onveranderlijk, dus Google ziet exact dezelfde gebeurtenis en telt niet dubbel.
 */
export const INFLIGHT_RECOVERY_MS = 15 * 60_000

export function isStaleInFlight(inflightSince: string | null, now = Date.now()): boolean {
  if (!inflightSince) return true
  const started = Date.parse(inflightSince)
  if (Number.isNaN(started)) return true
  return now - started >= INFLIGHT_RECOVERY_MS
}

/**
 * De onveranderlijke identiteit van een gebeurtenis bij Google. Dezelfde
 * gebeurtenis levert altijd dezelfde sleutel op, ook na herstel van een crash.
 */
export function transactionIdFor(leadId: string, phase: ConversionPhase | string): string {
  return `${leadId}:${phase}`
}

/**
 * Statussen die geen pogingen mogen opsouperen: niet toegestane, uitgesloten
 * of nog niet geconfigureerde gebeurtenissen wachten gewoon, zonder dat hun
 * retrybudget opraakt.
 */
export function consumesRetryBudget(status: OutboxStatus): boolean {
  return status === 'failed_temporary' || status === 'in_flight'
}

export type UploadClassification = {
  status: OutboxStatus
  requestId: string | null
  warnings: unknown[] | null
  error: string | null
}

/**
 * Leest het antwoord van Google strikt. Een HTTP 200 betekent "ingediend",
 * niet "verwerkt": de verwerkingsstatus is een aparte vraag aan Google.
 */
export function classifyUploadResponse(
  httpStatus: number,
  body: unknown,
  parseFailed = false,
): UploadClassification {
  const record = (body ?? {}) as Record<string, unknown>
  const requestId =
    typeof record['requestId'] === 'string'
      ? (record['requestId'] as string)
      : typeof record['request_id'] === 'string'
        ? (record['request_id'] as string)
        : null
  const warnings = Array.isArray(record['warnings']) ? (record['warnings'] as unknown[]) : null

  if (httpStatus >= 200 && httpStatus < 300) {
    if (parseFailed || !requestId) {
      return {
        status: 'processing_unknown',
        requestId,
        warnings,
        error: 'Google gaf geen bruikbare bevestiging terug; indiening is niet te bevestigen.',
      }
    }
    return { status: 'submitted', requestId, warnings, error: null }
  }

  const message = typeof record['error'] === 'object' && record['error']
    ? String((record['error'] as Record<string, unknown>)['message'] ?? '')
    : ''
  const detail = message || `HTTP ${httpStatus}`

  // 408/429 en 5xx zijn tijdelijk; 4xx is een validatie- of rechtenprobleem.
  if (httpStatus === 408 || httpStatus === 429 || httpStatus >= 500) {
    return { status: 'failed_temporary', requestId, warnings, error: detail }
  }
  return { status: 'failed_permanent', requestId, warnings, error: detail }
}

/** Nederlandse labels voor de backoffice. */
export const OUTBOX_LABEL: Record<OutboxStatus, string> = {
  pending: 'Klaar om terug te melden',
  blocked_consent: 'Niet toegestaan · geen advertentietoestemming',
  skipped_test: 'Niet teruggemeld · testdossier',
  skipped_no_click: 'Niet teruggemeld · geen advertentieklik',
  no_evidence: 'Wacht op bewijs van de koppeling',
  config_missing: 'Configuratie ontbreekt',
  export_disabled: 'Export staat uit tot akkoord',
  in_flight: 'Verzending onderweg',
  submitted: 'Ingediend · verwerking nog onbekend',
  processing_unknown: 'Ingediend · bevestiging onbekend',
  processed: 'Door Google verwerkt',
  failed_temporary: 'Tijdelijk mislukt · nieuwe poging volgt',
  failed_permanent: 'Definitief mislukt',
}
