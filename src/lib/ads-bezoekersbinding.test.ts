/**
 * Regressietests bij de beoordeling van 22 september 2026 (ronde d).
 *
 * Vier ketens: bezoekersbinding van de bon, gezaghebbende keuze vóór verzenden,
 * historische grens op elke ingang, en verouderde herbeoordeling.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createFakeSupabase, type FakeDb } from '@/test/fake-supabase'

const db: FakeDb = {}

vi.mock('@/integrations/supabase/client.server', () => ({
  get supabaseAdmin() {
    return createFakeSupabase(db) as never
  },
}))

const dagen = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString()

function lead(id: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    created_at: dagen(1),
    gclid: `klik-${id}`,
    gbraid: null,
    wbraid: null,
    is_test: false,
    status: 'new',
    disqualified_at: null,
    claimed_at: null,
    outcome: null,
    outcome_at: null,
    ad_click_evidence: 'form',
    ad_consent_ad_user_data: 'granted',
    customer_price_cents: 45000,
    source: 'website',
    ...extra,
  }
}

beforeEach(() => {
  for (const key of Object.keys(db)) delete db[key]
  db['ads_worker_checkpoint'] = [{ name: 'ads_measurement_start', cursor_value: '2020-01-01T00:00:00.000Z' }]
  process.env['ADS_EXPORT_ENABLED'] = 'true'
  process.env['ADS_ACTION_ID_REQUEST_RECEIVED'] = '1111111111'
  process.env['ADS_ACTION_ID_JOB_COMPLETED'] = '2222222222'
  vi.resetModules()
})

describe('keten 1 — de bon hoort bij één browser', () => {
  it('geeft dezelfde bon terug als hetzelfde apparaat het antwoord kwijtraakt', async () => {
    const { issueConsentTicket } = await import('./ads-consent.server')
    const eerste = await issueConsentTicket({ gclid: 'klik-x', visitorToken: 'a'.repeat(32) })
    const opnieuw = await issueConsentTicket({ gclid: 'klik-x', visitorToken: 'a'.repeat(32) })
    expect(eerste).not.toBeNull()
    expect(opnieuw?.resumed).toBe(true)
    expect(db['ad_consent_tickets']!.length).toBe(1)
  })

  it('laat een vreemde browser met hetzelfde klik-id niets intrekken', async () => {
    const { issueConsentTicket, applyConsentDecision } = await import('./ads-consent.server')
    await issueConsentTicket({ gclid: 'klik-y', visitorToken: 'a'.repeat(32) })
    const vreemde = await issueConsentTicket({ gclid: 'klik-y', visitorToken: 'b'.repeat(32) })
    db['leads'] = [lead('van-a', { gclid: 'klik-y', created_at: new Date().toISOString() })]
    const res = await applyConsentDecision({
      token: vreemde!.token,
      adUserData: 'denied',
      adStorage: 'denied',
      seq: 1,
    })
    expect(res).toMatchObject({ ok: true, leads: 0 })
    expect(db['leads']![0]!['ad_consent_ad_user_data']).toBe('granted')
  })

  it('bereikt met de vingerafdruk ook een dossier van vóór de bon', async () => {
    const { issueConsentTicket, applyConsentDecision } = await import('./ads-consent.server')
    const { visitorHashFrom } = await import('./ads-consent.server')
    const hash = await visitorHashFrom('c'.repeat(32))
    db['leads'] = [lead('eigen-oud', { gclid: 'klik-z', created_at: dagen(3), consent_visitor_hash: hash })]
    const ticket = await issueConsentTicket({ gclid: 'klik-z', visitorToken: 'c'.repeat(32) })
    const res = await applyConsentDecision({
      token: ticket!.token,
      adUserData: 'denied',
      adStorage: 'denied',
      seq: 1,
    })
    expect(res.ok).toBe(true)
    expect(db['leads']![0]!['ad_consent_ad_user_data']).toBe('denied')
  })
})

describe('keten 2 — de keuze zelf is doorslaggevend vóór verzenden', () => {
  it('verzendt niet wanneer de vastgelegde keuze geweigerd is, ook als het dossier nog toestemming toont', async () => {
    const { issueConsentTicket } = await import('./ads-consent.server')
    const ticket = await issueConsentTicket({ gclid: 'klik-w', visitorToken: 'd'.repeat(32) })
    // Besluit is vastgelegd, maar het dossier is bij een storing niet bijgewerkt.
    db['ad_consent_decisions'] = [
      { id: 'd1', ticket_id: db['ad_consent_tickets']![0]!['id'], ad_user_data: 'denied', ad_storage: 'denied', seq: 1, created_at: new Date().toISOString() },
    ]
    expect(ticket).not.toBeNull()
    db['leads'] = [lead('l1', { gclid: 'klik-w', outcome: 'completed', outcome_at: new Date().toISOString() })]
    db['ads_conversion_outbox'] = [
      {
        id: 'o1',
        lead_id: 'l1',
        phase: 'job_completed',
        status: 'pending',
        attempts: 0,
        gclid: 'klik-w',
        event_time: new Date().toISOString(),
        conversion_action_id: '2222222222',
        value_cents: 45000,
        is_test: false,
        next_attempt_at: dagen(1),
      },
    ]
    const calls: string[] = []
    vi.stubGlobal('fetch', async (url: string) => {
      calls.push(String(url))
      return new Response('{}', { status: 200 })
    })
    const { runAdsOutboxWorker } = await import('./ads-outbox.server')
    await runAdsOutboxWorker(5)
    expect(calls).toEqual([])
    expect(db['ads_conversion_outbox']![0]!['status']).toBe('blocked_consent')
    vi.unstubAllGlobals()
  })
})

describe('keten 3 — de historische grens geldt op elke ingang', () => {
  it('zet een gebeurtenis van vóór de meetperiode nooit klaar', async () => {
    db['ads_worker_checkpoint'] = [{ name: 'ads_measurement_start', cursor_value: new Date().toISOString() }]
    db['leads'] = [lead('oud', { created_at: dagen(200) })]
    const { enqueueAdsConversion } = await import('./ads-outbox.server')
    await enqueueAdsConversion('oud', 'request_received', dagen(200))
    expect(db['ads_conversion_outbox']![0]!['status']).toBe('skipped_historical')
  })

  it('houdt een oud dossier historisch, ook bij een recente fase', async () => {
    db['ads_migration_policy'] = [{ id: 1, backfill_start_at: dagen(5) }]
    db['leads'] = [lead('oud2', { created_at: dagen(90), legacy_import: true })]
    const { enqueueAdsConversion } = await import('./ads-outbox.server')
    await enqueueAdsConversion('oud2', 'job_completed', new Date().toISOString())
    expect(db['ads_conversion_outbox']![0]!['status']).toBe('skipped_historical')
  })
})

describe('keten 4 — een verouderde herbeoordeling schrijft niets terug', () => {
  it('laat de bevroren verzendgegevens met rust zodra er een poging is geweest', async () => {
    db['leads'] = [lead('l9', { gclid: 'nieuw-klik' })]
    db['ads_conversion_outbox'] = [
      {
        id: 'o9',
        lead_id: 'l9',
        phase: 'request_received',
        status: 'blocked_consent',
        attempts: 2,
        payload_frozen_at: dagen(1),
        gclid: 'oud-klik',
        value_cents: 10000,
        conversion_action_id: '1111111111',
        event_time: new Date().toISOString(),
        is_test: false,
      },
    ]
    const { revalidateBlockedAdsExports } = await import('./ads-outbox.server')
    await revalidateBlockedAdsExports()
    expect(db['ads_conversion_outbox']![0]!['gclid']).toBe('oud-klik')
    expect(db['ads_conversion_outbox']![0]!['value_cents']).toBe(10000)
  })
})
