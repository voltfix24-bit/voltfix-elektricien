/**
 * Tests bij de toestemmingsbon.
 *
 * Elke test hoort bij een bevinding uit de hercontrole van 22 september 2026 en
 * faalt op de oude code, waarin een meegestuurd klik-id genoeg was om de keuze
 * van een bezoeker te wijzigen.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createFakeSupabase, type FakeDb } from '@/test/fake-supabase'

const db: FakeDb = {}

vi.mock('@/integrations/supabase/client.server', () => ({
  get supabaseAdmin() {
    return createFakeSupabase(db) as never
  },
}))

const GCLID = 'klik-id-van-de-bezoeker'

async function seedTicket(token: string, extra: Record<string, unknown> = {}) {
  const { hashConsentToken } = await import('./ads-consent.server')
  db['ad_consent_tickets'] = [
    {
      id: 'ticket-1',
      token_hash: await hashConsentToken(token),
      gclid: GCLID,
      gbraid: null,
      wbraid: null,
      last_seq: 0,
      ...extra,
    },
  ]
}

beforeEach(() => {
  for (const key of Object.keys(db)) delete db[key]
  db['leads'] = [
    { id: 'lead-1', gclid: GCLID, ad_consent_ad_user_data: 'granted', consent_ticket_id: null },
    { id: 'lead-van-iemand-anders', gclid: 'ander-klik-id', ad_consent_ad_user_data: 'granted' },
  ]
  db['conversion_events'] = [{ id: 'ev-1', gclid: GCLID, consent_ad_user_data: 'granted' }]
  db['ads_conversion_outbox'] = [{ id: 'ob-1', lead_id: 'lead-1', status: 'pending' }]
})

describe('bevinding 1 — alleen de eigen bezoeker mag zijn keuze wijzigen', () => {
  it('weigert een keuze zonder geldige bon, ook met het juiste klik-id', async () => {
    const { applyConsentDecision } = await import('./ads-consent.server')
    await seedTicket('a'.repeat(64))
    const result = await applyConsentDecision({
      token: 'b'.repeat(64),
      adUserData: 'denied',
      adStorage: 'denied',
      seq: 1,
    })
    expect(result).toEqual({ ok: false, reason: 'unknown_ticket' })
    expect(db['leads']![0]!['ad_consent_ad_user_data']).toBe('granted')
  })

  it('geeft geen bon uit zonder geldig klik-id', async () => {
    const { issueConsentTicket } = await import('./ads-consent.server')
    expect(await issueConsentTicket({ gclid: 'te kort', gbraid: null, wbraid: null })).toBeNull()
    expect(db['ad_consent_tickets'] ?? []).toHaveLength(0)
  })

  it('bewaart de bon alleen als vingerafdruk', async () => {
    const { issueConsentTicket } = await import('./ads-consent.server')
    const issued = await issueConsentTicket({ gclid: GCLID })
    expect(issued?.token).toMatch(/^[0-9a-f]{64}$/)
    const stored = db['ad_consent_tickets']![0]!
    expect(stored['token_hash']).not.toBe(issued!.token)
  })
})

describe('bevinding 2 — een intrekking werkt door tot in de wachtrij', () => {
  it('zet klik, dossier en wachtrij in één keer op geweigerd', async () => {
    const token = 'c'.repeat(64)
    await seedTicket(token)
    const { applyConsentDecision } = await import('./ads-consent.server')
    const result = await applyConsentDecision({
      token,
      adUserData: 'denied',
      adStorage: 'denied',
      seq: 1,
    })
    expect(result).toMatchObject({ ok: true, events: 1, leads: 1, blocked: 1 })
    expect(db['conversion_events']![0]!['consent_ad_user_data']).toBe('denied')
    expect(db['ads_conversion_outbox']![0]!['status']).toBe('blocked_consent')
    // Het dossier van een ander blijft ongemoeid.
    expect(db['leads']![1]!['ad_consent_ad_user_data']).toBe('granted')
  })

  it('negeert een herhaald of ouder besluit', async () => {
    const token = 'd'.repeat(64)
    await seedTicket(token)
    const { applyConsentDecision } = await import('./ads-consent.server')
    await applyConsentDecision({ token, adUserData: 'denied', adStorage: 'denied', seq: 2 })
    const replay = await applyConsentDecision({ token, adUserData: 'granted', adStorage: 'granted', seq: 1 })
    expect(replay).toEqual({ ok: false, reason: 'stale' })
    expect(db['leads']![0]!['ad_consent_ad_user_data']).toBe('denied')
  })

  it('laat "weer toestaan" alleen los op wat deze bon zelf blokkeerde', async () => {
    const token = 'e'.repeat(64)
    await seedTicket(token)
    const { applyConsentDecision } = await import('./ads-consent.server')
    await applyConsentDecision({ token, adUserData: 'denied', adStorage: 'denied', seq: 1 })
    // Een dossier dat om een andere reden geblokkeerd staat, hoort niet vrij te komen.
    db['ads_conversion_outbox']!.push({ id: 'ob-2', lead_id: 'lead-anders', status: 'blocked_consent' })
    const back = await applyConsentDecision({ token, adUserData: 'granted', adStorage: 'granted', seq: 2 })
    expect(back).toMatchObject({ ok: true, unblocked: 1 })
    expect(db['ads_conversion_outbox']![1]!['consent_ad_user_data']).toBeUndefined()
  })
})

describe('bevinding 8 — invoer van de bezoeker komt nooit in een filter terecht', () => {
  it('weigert een klik-id met filtertekens bij het uitgeven van een bon', async () => {
    const { sanitizeTicketIds } = await import('./ads-consent.server')
    const cleaned = sanitizeTicketIds({
      gclid: 'abc,gclid.neq.null',
      gbraid: null,
      wbraid: null,
      clickRef: 'AAA',
    })
    expect(cleaned.gclid).toBeNull()
    expect(cleaned.clickRef).toBeNull()
  })
})

describe('afscherming tussen bezoekers', () => {
  it('laat de bon van bezoeker A het dossier van bezoeker B ongemoeid', async () => {
    const token = 'f'.repeat(64)
    await seedTicket(token)
    const { applyConsentDecision } = await import('./ads-consent.server')
    const result = await applyConsentDecision({ token, adUserData: 'denied', adStorage: 'denied', seq: 1 })
    expect(result).toMatchObject({ ok: true, leads: 1 })
    expect(db['leads']![0]!['ad_consent_ad_user_data']).toBe('denied')
    expect(db['leads']![1]!['ad_consent_ad_user_data']).toBe('granted')
  })

  it('werkt alleen op de klik-id\u2019s die aan de bon zelf hangen', async () => {
    const token = 'g'.repeat(64)
    await seedTicket(token, { gclid: 'ander-klik-id' })
    const { applyConsentDecision } = await import('./ads-consent.server')
    const result = await applyConsentDecision({ token, adUserData: 'denied', adStorage: 'denied', seq: 1 })
    expect(result).toMatchObject({ ok: true, leads: 1 })
    expect(db['leads']![0]!['ad_consent_ad_user_data']).toBe('granted')
    expect(db['leads']![1]!['ad_consent_ad_user_data']).toBe('denied')
  })

  it('meldt een databasefout in plaats van hem stil te slikken', async () => {
    const token = 'h'.repeat(64)
    await seedTicket(token)
    const { createFakeSupabase } = await import('@/test/fake-supabase')
    const broken = createFakeSupabase(db, { failures: { 'leads:update': { message: 'database weg' } } })
    const mod = await import('@/integrations/supabase/client.server')
    const spy = vi.spyOn(mod, 'supabaseAdmin', 'get').mockReturnValue(broken as never)
    const { applyConsentDecision } = await import('./ads-consent.server')
    await expect(
      applyConsentDecision({ token, adUserData: 'denied', adStorage: 'denied', seq: 1 }),
    ).rejects.toThrow('database weg')
    spy.mockRestore()
  })
})
