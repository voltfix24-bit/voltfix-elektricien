import { describe, expect, it } from 'vitest'

import {
  BURST_MAX_PER_SENDER,
  BURST_MAX_TOTAL,
  BURST_WINDOW_MINUTES,
  burstDecision,
  burstWindowStart,
} from '@/lib/burst-guard'

describe('burstDecision', () => {
  it('laat normaal verkeer door', () => {
    expect(burstDecision({ sameSender: 0, total: 0 }).hold).toBe(false)
    expect(burstDecision({ sameSender: BURST_MAX_PER_SENDER - 1, total: 2 }).hold).toBe(false)
  })

  it('houdt een reeks van dezelfde afzender tegen', () => {
    const res = burstDecision({ sameSender: BURST_MAX_PER_SENDER, total: 4 })
    expect(res.hold).toBe(true)
    if (res.hold) expect(res.reason).toContain('burst_same_sender')
  })

  it('houdt een reeks over de hele site tegen, ook van verschillende afzenders', () => {
    const res = burstDecision({ sameSender: 0, total: BURST_MAX_TOTAL })
    expect(res.hold).toBe(true)
    if (res.hold) expect(res.reason).toContain('burst_site_wide')
  })

  it('telt terug over het juiste venster', () => {
    const now = new Date('2026-09-13T14:27:00.000Z')
    expect(burstWindowStart(now)).toBe(
      new Date(now.getTime() - BURST_WINDOW_MINUTES * 60_000).toISOString(),
    )
  })
})
