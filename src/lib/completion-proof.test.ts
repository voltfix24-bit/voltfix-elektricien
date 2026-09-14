import { describe, expect, it } from 'vitest'
import { canFinalizeCompletionProof, hashSignatureToken, newSignatureToken } from './completion-proof.server'

describe('afrondingsbewijs', () => {
  it('maakt onvoorspelbare tokens en bewaart alleen een vaste hash', async () => {
    const first = newSignatureToken()
    const second = newSignatureToken()
    expect(first).not.toBe(second)
    expect(first).toMatch(/^[A-Za-z0-9_-]{40,60}$/)
    expect(await hashSignatureToken(first)).toMatch(/^[a-f0-9]{64}$/)
  })

  it('laat afronden alleen toe na resultaatfoto en vóór ondertekening', () => {
    expect(canFinalizeCompletionProof({ state: 'awaiting_signature', result_photo_path: 'lead/result.jpg', signed_at: null })).toBe(true)
    expect(canFinalizeCompletionProof({ state: 'awaiting_result', result_photo_path: null, signed_at: null })).toBe(false)
    expect(canFinalizeCompletionProof({ state: 'awaiting_signature', result_photo_path: null, signed_at: null })).toBe(false)
    expect(canFinalizeCompletionProof({ state: 'awaiting_signature', result_photo_path: 'lead/result.jpg', signed_at: '2026-09-14T10:00:00Z' })).toBe(false)
  })
})