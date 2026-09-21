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
    expect(nextAttemptDelayMs(0)).toBeLessThan(nextAttemptDelayMs(1))
    expect(nextAttemptDelayMs(3)).toBeLessThanOrEqual(nextAttemptDelayMs(9))
  })

  it('probeert alleen wat zinvol is opnieuw', () => {
    expect(isRetryable('pending')).toBe(true)
    expect(isRetryable('failed_temporary')).toBe(true)
    expect(isRetryable('submitted')).toBe(false)
    expect(isRetryable('blocked_consent')).toBe(false)
    expect(MAX_ATTEMPTS).toBeGreaterThan(1)
  })
})

describe('fasen', () => {
  it('kent drie afzonderlijke fasen met eigen label', () => {
    expect(CONVERSION_PHASES).toEqual(['request_received', 'request_qualified', 'job_completed'])
    expect(PHASE_LABEL.request_qualified).toBe('Aanvraag gekwalificeerd')
  })

  it('meldt een fase zonder conversieactie als configuratie ontbreekt', () => {
    expect(conversionEligibility({ ...base, conversionActionId: null })).toBe('config_missing')
    expect(conversionEligibility({ ...base, conversionActionId: '' })).toBe('config_missing')
    expect(conversionEligibility({ ...base, conversionActionId: '123' })).toBe('pending')
  })
})
