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
export type ConversionPhase = 'request_received' | 'request_qualified' | 'job_completed'

export const CONVERSION_PHASES: ConversionPhase[] = [
  'request_received',
  'request_qualified',
  'job_completed',
]

export const PHASE_LABEL: Record<ConversionPhase, string> = {
  request_received: 'Aanvraag ontvangen',
  request_qualified: 'Aanvraag gekwalificeerd',
  job_completed: 'Klus uitgevoerd',
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

/** Oplopende wachttijd tussen pogingen: 1, 5, 15, 60 minuten, daarna 6 uur. */
export function nextAttemptDelayMs(attempts: number): number {
  const ladder = [60_000, 300_000, 900_000, 3_600_000]
  return ladder[Math.min(attempts, ladder.length - 1)] ?? 21_600_000
}

/** Na zoveel mislukte pogingen geven we het op. */
export const MAX_ATTEMPTS = 6

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
  submitted: 'Ingediend · verwerking nog onbekend',
  processing_unknown: 'Ingediend · bevestiging onbekend',
  processed: 'Door Google verwerkt',
  failed_temporary: 'Tijdelijk mislukt · nieuwe poging volgt',
  failed_permanent: 'Definitief mislukt',
}
