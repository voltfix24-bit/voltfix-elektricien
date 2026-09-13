import { describe, expect, it } from 'vitest'
import { OUTCOMES, OUTCOME_DOT, canSetOutcome, isOutcome, isOutcomeOverdue } from './lead-outcome'

const now = Date.parse('2026-03-10T12:00:00Z')

describe('lead-outcome', () => {
  it('kent precies vier uitkomsten', () => {
    expect(OUTCOMES).toEqual(['done', 'declined', 'no_deal', 'unreachable'])
  })

  it('kleurt alleen "gedaan" groen en de rest neutraal, nooit rood', () => {
    expect(OUTCOME_DOT.done).toBe('bg-success')
    for (const outcome of ['declined', 'no_deal', 'unreachable'] as const) {
      expect(OUTCOME_DOT[outcome]).toBe('bg-muted-foreground')
    }
  })

  it('staat afloop alleen toe bij een opgepakte lead zonder afloop', () => {
    expect(canSetOutcome({ status: 'claimed' })).toBe(true)
    expect(canSetOutcome({ status: 'dispatched' })).toBe(false)
    expect(canSetOutcome({ status: 'claimed', outcome: 'done' })).toBe(false)
  })

  it('meldt opgepakte leads ouder dan drie dagen zonder afloop', () => {
    const old = new Date(now - 4 * 86_400_000).toISOString()
    expect(isOutcomeOverdue({ status: 'claimed', claimed_at: old }, now)).toBe(true)
    expect(isOutcomeOverdue({ status: 'claimed', claimed_at: old, outcome: 'done' }, now)).toBe(false)
    expect(isOutcomeOverdue({ status: 'claimed', claimed_at: new Date(now - 3_600_000).toISOString() }, now)).toBe(false)
    expect(isOutcomeOverdue({ status: 'claimed', claimed_at: null }, now)).toBe(false)
  })

  it('herkent geldige waarden', () => {
    expect(isOutcome('no_deal')).toBe(true)
    expect(isOutcome('afgerond')).toBe(false)
  })
})
