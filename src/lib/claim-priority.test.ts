import { describe, expect, it } from 'vitest'

import {
  busyMinutesLeft,
  canClaimNow,
  claimDelaySeconds,
  DEFAULT_CLAIM_PRIORITY,
  isOnStoring,
  tooEarlyNotice,
  waitText,
} from '@/lib/claim-priority'

const now = new Date('2026-01-08T13:52:00.000Z')
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60000).toISOString()

const busy = { id: 'a', isActive: true, lastStoringClaimAt: minutesAgo(42) }
const free = { id: 'b', isActive: true, lastStoringClaimAt: minutesAgo(300) }
const never = { id: 'c', isActive: true, lastStoringClaimAt: null }

describe('isOnStoring', () => {
  it('telt een storing binnen twee uur als bezig', () => {
    expect(isOnStoring(busy, now)).toBe(true)
    expect(isOnStoring(free, now)).toBe(false)
    expect(isOnStoring(never, now)).toBe(false)
  })

  it('geeft de resterende bezettijd', () => {
    expect(busyMinutesLeft(busy, now)).toBe(78)
    expect(busyMinutesLeft(free, now)).toBe(0)
  })
})

describe('claimDelaySeconds', () => {
  const storing = { isEmergency: true }
  const gepland = { isEmergency: false }

  it('remt een bezige monteur als iemand vrij is', () => {
    expect(claimDelaySeconds(storing, busy, [busy, free], now)).toBe(120)
  })

  it('remt niemand bij gepland werk', () => {
    expect(claimDelaySeconds(gepland, busy, [busy, free], now)).toBe(0)
  })

  it('remt een vrije monteur nooit', () => {
    expect(claimDelaySeconds(storing, free, [busy, free], now)).toBe(0)
  })

  it('remt niemand als iedereen bezig is', () => {
    const other = { id: 'd', isActive: true, lastStoringClaimAt: minutesAgo(10) }
    expect(claimDelaySeconds(storing, busy, [busy, other], now)).toBe(0)
  })

  it('telt inactieve monteurs niet als vrij', () => {
    const slaper = { id: 'e', isActive: false, lastStoringClaimAt: null }
    expect(claimDelaySeconds(storing, busy, [busy, slaper], now)).toBe(0)
  })

  it('doet niets als de regel uit staat', () => {
    expect(
      claimDelaySeconds(storing, busy, [busy, free], now, { ...DEFAULT_CLAIM_PRIORITY, enabled: false }),
    ).toBe(0)
  })
})

describe('canClaimNow', () => {
  it('laat wachten tot de vertraging voorbij is', () => {
    const lead = { isEmergency: true, dispatchedAt: new Date(now.getTime() - 40_000).toISOString() }
    const res = canClaimNow(lead, busy, [busy, free], now)
    expect(res.allowed).toBe(false)
    if (!res.allowed) {
      expect(res.secondsLeft).toBe(80)
      expect(res.since).toBe(busy.lastStoringClaimAt)
    }
  })

  it('laat door zodra de twee minuten voorbij zijn', () => {
    const lead = { isEmergency: true, dispatchedAt: new Date(now.getTime() - 130_000).toISOString() }
    expect(canClaimNow(lead, busy, [busy, free], now).allowed).toBe(true)
  })

  it('kan nooit een escalatie veroorzaken: plafond blijft onder 15 minuten', () => {
    const lead = { isEmergency: true, dispatchedAt: now.toISOString() }
    const res = canClaimNow(lead, busy, [busy, free], now)
    expect(res.allowed).toBe(false)
    if (!res.allowed) expect(res.secondsLeft).toBeLessThanOrEqual(120)
  })
})

describe('teksten', () => {
  it('schrijft de wachttijd kort op', () => {
    expect(waitText(45)).toBe('45 sec')
    expect(waitText(80)).toBe('1 min 20')
    expect(waitText(120)).toBe('2 min')
  })

  it('legt uit waarom er gewacht wordt', () => {
    expect(tooEarlyNotice(80, '2026-01-08T12:10:00.000Z')).toContain('Nog 1 min 20.')
    expect(tooEarlyNotice(80, null)).toBe('Nog 1 min 20.\nProbeer het daarna opnieuw.')
  })
})
