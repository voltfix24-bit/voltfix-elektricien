import { describe, expect, it } from 'vitest'

import {
  MAX_ATTEMPTS,
  classifyUploadResponse,
  conversionEligibility,
  isProvenEvidence,
  isRetryable,
  nextAttemptDelayMs,
  type EligibilityInput,
  CONVERSION_PHASES,
  PHASE_LABEL,
  PHASE_SOURCE,
  consumesRetryBudget,
  isStaleInFlight,
  transactionIdFor,
} from './ads-outbox'

const base: EligibilityInput = {
  isTest: false,
  gclid: 'Cj0KCQabc123',
  gbraid: null,
  wbraid: null,
  evidence: 'form',
  consentAdUserData: 'granted',
  exportEnabled: true,
  configured: true,
}

describe('conversionEligibility', () => {
  it('laat een bewezen, toegestane klus door', () => {
    expect(conversionEligibility(base)).toBe('pending')
  })

  it('stuurt een testdossier nooit naar Google', () => {
    expect(conversionEligibility({ ...base, isTest: true })).toBe('skipped_test')
  })

  it('meldt niets zonder klik-id', () => {
    expect(conversionEligibility({ ...base, gclid: null })).toBe('skipped_no_click')
  })

  it('weigert een vermoeden als bewijs', () => {
    expect(conversionEligibility({ ...base, evidence: 'manual_guess' })).toBe('no_evidence')
    expect(conversionEligibility({ ...base, evidence: null })).toBe('no_evidence')
  })

  it('respecteert een geweigerde of ontbrekende toestemming', () => {
    expect(conversionEligibility({ ...base, consentAdUserData: 'denied' })).toBe('blocked_consent')
    expect(conversionEligibility({ ...base, consentAdUserData: null })).toBe('blocked_consent')
  })

  it('meldt ontbrekende configuratie en uitgeschakelde export apart', () => {
    expect(conversionEligibility({ ...base, configured: false })).toBe('config_missing')
    expect(conversionEligibility({ ...base, exportEnabled: false })).toBe('export_disabled')
  })

  it('kent alleen onderbouwd bewijs', () => {
    expect(isProvenEvidence('whatsapp_ref')).toBe(true)
    expect(isProvenEvidence('click_id')).toBe(true)
    expect(isProvenEvidence('manual_guess')).toBe(false)
  })
})

describe('classifyUploadResponse', () => {
  it('HTTP 200 met request-id is ingediend, niet verwerkt', () => {
    const result = classifyUploadResponse(200, { requestId: 'abc-123' })
    expect(result.status).toBe('submitted')
    expect(result.requestId).toBe('abc-123')
  })

  it('HTTP 200 zonder bruikbaar antwoord is "verwerking onbekend"', () => {
    expect(classifyUploadResponse(200, {}).status).toBe('processing_unknown')
    expect(classifyUploadResponse(200, null, true).status).toBe('processing_unknown')
  })

  it('bewaart waarschuwingen', () => {
    const result = classifyUploadResponse(200, { requestId: 'x', warnings: [{ code: 'A' }] })
    expect(result.warnings).toHaveLength(1)
  })

  it('scheidt tijdelijke van definitieve fouten', () => {
    expect(classifyUploadResponse(503, {}).status).toBe('failed_temporary')
    expect(classifyUploadResponse(429, {}).status).toBe('failed_temporary')
    expect(classifyUploadResponse(400, { error: { message: 'bad' } }).status).toBe('failed_permanent')
    expect(classifyUploadResponse(403, {}).status).toBe('failed_permanent')
  })
})

describe('herhaalpogingen', () => {
  it('wacht steeds langer', () => {
    expect(nextAttemptDelayMs(1)).toBeLessThan(nextAttemptDelayMs(2))
    expect(nextAttemptDelayMs(3)).toBeLessThanOrEqual(nextAttemptDelayMs(9))
  })

  it('wacht nooit korter dan de uurlijkse verwerking', () => {
    for (const attempt of [1, 2, 3, 4, 5, 6]) {
      expect(nextAttemptDelayMs(attempt)).toBeGreaterThanOrEqual(3_600_000)
    }
  })

  it('laat uitgesloten gebeurtenissen geen pogingen kosten', () => {
    expect(consumesRetryBudget('failed_temporary')).toBe(true)
    expect(consumesRetryBudget('in_flight')).toBe(true)
    for (const status of ['skipped_test', 'skipped_no_click', 'no_evidence', 'config_missing', 'export_disabled'] as const) {
      expect(consumesRetryBudget(status)).toBe(false)
    }
  })

  it('probeert alleen wat zinvol is opnieuw', () => {
    expect(isRetryable('pending')).toBe(true)
    expect(isRetryable('failed_temporary')).toBe(true)
    expect(isRetryable('submitted')).toBe(false)
    expect(isRetryable('blocked_consent')).toBe(false)
    expect(MAX_ATTEMPTS).toBeGreaterThan(1)
  })
})

describe('uitval halverwege een verzending', () => {
  it('houdt dezelfde transactie-identiteit aan bij herstel', () => {
    const first = transactionIdFor('lead-1', 'job_completed')
    const afterCrash = transactionIdFor('lead-1', 'job_completed')
    expect(afterCrash).toBe(first)
    expect(transactionIdFor('lead-1', 'request_received')).not.toBe(first)
  })

  it('pakt een blijven hangen verzending pas na de hersteltijd op', () => {
    const now = Date.now()
    expect(isStaleInFlight(new Date(now - 60_000).toISOString(), now)).toBe(false)
    expect(isStaleInFlight(new Date(now - 20 * 60_000).toISOString(), now)).toBe(true)
    expect(isStaleInFlight(null, now)).toBe(true)
  })
})

describe('fasen', () => {
  it('scheidt de beoordeling van de aanvraag van het aannemen door een monteur', () => {
    expect(CONVERSION_PHASES).toEqual([
      'request_received',
      'request_qualified',
      'job_accepted',
      'job_completed',
    ])
    expect(PHASE_LABEL.request_qualified).toBe('Aanvraag gekwalificeerd (beoordeeld)')
    expect(PHASE_LABEL.job_accepted).toBe('Klus aangenomen door monteur')
    expect(PHASE_SOURCE.request_qualified).toBe('intake_assessment')
    expect(PHASE_SOURCE.job_accepted).toBe('contractor_accept')
  })

  it('meldt een fase zonder conversieactie als configuratie ontbreekt', () => {
    expect(conversionEligibility({ ...base, conversionActionId: null })).toBe('config_missing')
    expect(conversionEligibility({ ...base, conversionActionId: '' })).toBe('config_missing')
    expect(conversionEligibility({ ...base, conversionActionId: '123' })).toBe('pending')
  })
})
