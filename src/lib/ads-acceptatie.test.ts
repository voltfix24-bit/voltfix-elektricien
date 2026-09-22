/**
 * Tests bij de zes acceptatiepunten van de onafhankelijke hercontrole
 * (22 september 2026). Elke test hoort bij één foutketen en faalt op de code
 * van vóór deze ronde.
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
    qualified_at: null,
    disqualified_at: null,
    claimed_at: null,
    outcome: null,
    outcome_at: null,
    ad_click_evidence: 'form',
    ad_consent_ad_user_data: 'granted',
    customer_price_cents: 45000,
    consent_ticket_id: null,
    source: 'website',
    ...extra,
  }
}

beforeEach(() => {
  for (const key of Object.keys(db)) delete db[key]
  db['ads_migration_policy'] = [{ id: 1, backfill_start_at: null }]
  db['ads_worker_checkpoint'] = [{ name: 'ads_measurement_start', cursor_value: '2020-01-01T00:00:00.000Z' }]
  db['ads_conversion_tickets'] = []
  db['ads_conversion_outbox'] = []
  db['conversion_events'] = []
  db['leads'] = []
  process.env['ADS_ACTION_ID_REQUEST_RECEIVED'] = '1111111111'
  process.env['ADS_ACTION_ID_JOB_COMPLETED'] = '2222222222'
  vi.resetModules()
})

describe('punt 1 — eigenaarschap van een klik-id', () => {
  it('laat de eigen bon wél de eigen, later ontstane aanvraag intrekken', async () => {
    const { issueConsentTicket, applyConsentDecision } = await import('./ads-consent.server')
    const ticket = await issueConsentTicket({ gclid: 'klik-eigen' })
    expect(ticket).not.toBeNull()
    // Het dossier ontstaat ná de advertentieklik — de normale volgorde.
    db['leads'] = [lead('eigen', { gclid: 'klik-eigen', created_at: new Date().toISOString() })]
    const res = await applyConsentDecision({
      token: ticket!.token,
      adUserData: 'denied',
      adStorage: 'denied',
      seq: 1,
    })
    expect(res).toMatchObject({ ok: true, leads: 1 })
    expect(db['leads']![0]!['ad_consent_ad_user_data']).toBe('denied')
  })

  it('geeft een tweede bon op hetzelfde klik-id geen zeggenschap', async () => {
    const { issueConsentTicket, applyConsentDecision } = await import('./ads-consent.server')
    await issueConsentTicket({ gclid: 'klik-gedeeld' })
    const tweede = await issueConsentTicket({ gclid: 'klik-gedeeld' })
    db['leads'] = [
      lead('van-a', { gclid: 'klik-gedeeld', created_at: new Date().toISOString(), ad_consent_ad_user_data: 'granted' }),
    ]
    const res = await applyConsentDecision({
      token: tweede!.token,
      adUserData: 'denied',
      adStorage: 'denied',
      seq: 1,
    })
    expect(res).toMatchObject({ ok: true, leads: 0 })
    expect(db['leads']![0]!['ad_consent_ad_user_data']).toBe('granted')
  })
})

describe('punt 2 — één keuze tegelijk, geen halve verwerking', () => {
  it('weigert hetzelfde volgnummer met een andere keuze', async () => {
    const { issueConsentTicket, applyConsentDecision } = await import('./ads-consent.server')
    const ticket = await issueConsentTicket({ gclid: 'klik-seq' })
    await applyConsentDecision({ token: ticket!.token, adUserData: 'denied', adStorage: 'denied', seq: 3 })
    const conflict = await applyConsentDecision({
      token: ticket!.token,
      adUserData: 'granted',
      adStorage: 'granted',
      seq: 3,
    })
    expect(conflict).toEqual({ ok: false, reason: 'conflict' })
  })

  it('bevestigt niets terwijl er al een keuze van dezelfde bezoeker loopt', async () => {
    const { issueConsentTicket, applyConsentDecision } = await import('./ads-consent.server')
    const ticket = await issueConsentTicket({ gclid: 'klik-bezet' })
    const id = db['ad_consent_tickets']![0]!['id']
    // Er loopt een verwerking: de grendel staat vers.
    db['ads_worker_checkpoint']!.push({
      name: `consent_lock:${id}`,
      cursor_value: '1',
      updated_at: new Date().toISOString(),
    })
    const busy = await applyConsentDecision({
      token: ticket!.token,
      adUserData: 'denied',
      adStorage: 'denied',
      seq: 1,
    })
    expect(busy).toEqual({ ok: false, reason: 'busy' })
  })

  it('geeft de grendel na afloop weer vrij', async () => {
    const { issueConsentTicket, applyConsentDecision } = await import('./ads-consent.server')
    const ticket = await issueConsentTicket({ gclid: 'klik-vrij' })
    await applyConsentDecision({ token: ticket!.token, adUserData: 'denied', adStorage: 'denied', seq: 1 })
    expect(db['ads_worker_checkpoint']!.some((r) => String(r['name']).startsWith('consent_lock:'))).toBe(false)
    // En een volgende keuze komt er gewoon doorheen.
    const later = await applyConsentDecision({
      token: ticket!.token,
      adUserData: 'granted',
      adStorage: 'granted',
      seq: 2,
    })
    expect(later.ok).toBe(true)
  })
})

describe('punt 4 — een verzonden regel gaat nooit opnieuw de deur uit', () => {
  it('heropent een al ingediende regel niet bij handmatig opnieuw melden', async () => {
    db['leads'] = [lead('klaar', { outcome: 'done', outcome_at: dagen(0) })]
    db['ads_conversion_outbox'] = [
      {
        id: 'ob-1',
        lead_id: 'klaar',
        phase: 'job_completed',
        account_id: null,
        status: 'submitted',
        attempts: 1,
        event_time: dagen(0),
        payload_frozen_at: dagen(0),
      },
    ]
    const { reportLeadToGoogleAds } = await import('./ads-outbox.server')
    await reportLeadToGoogleAds('klaar', { force: true })
    expect(db['ads_conversion_outbox']![0]!['status']).toBe('submitted')
  })
})

describe('punt 5 — hetzelfde historische beleid bij het koppelen achteraf', () => {
  it('zet bij een oud dossier geen fase van vóór de grens klaar', async () => {
    db['leads'] = [
      lead('oud', {
        created_at: dagen(120),
        qualified_at: dagen(119),
        claimed_at: dagen(118),
        outcome: 'done',
        outcome_at: dagen(118),
      }),
    ]
    const { enqueueApplicablePhases } = await import('./ads-outbox.server')
    const out = await enqueueApplicablePhases('oud')
    expect(out.every((entry) => entry.status === 'skipped_historical')).toBe(true)
    expect(db['ads_conversion_outbox']).toHaveLength(0)
  })

  it('houdt een historisch gemarkeerd dossier historisch', async () => {
    db['leads'] = [lead('legacy', { outcome: 'done', outcome_at: dagen(0) })]
    db['ads_conversion_outbox'] = [
      { id: 'ob-1', lead_id: 'legacy', phase: 'job_completed', account_id: null, status: 'submitted', legacy_import: true },
    ]
    const { enqueueApplicablePhases } = await import('./ads-outbox.server')
    const out = await enqueueApplicablePhases('legacy')
    expect(out.every((entry) => entry.status === 'skipped_historical')).toBe(true)
    expect(db['ads_conversion_outbox']).toHaveLength(1)
  })
})

describe('punt 6 — de beoordelingsronde komt voorbij de eerste tweehonderd', () => {
  it('werkt met een bladwijzer door over drie ronden heen', async () => {
    // 450 geblokkeerde regels; het dossier ontbreekt, dus geen enkele regel
    // verandert van stand. Alleen de bladwijzer zorgt dan voor voortgang.
    db['ads_conversion_outbox'] = Array.from({ length: 450 }, (_, i) => ({
      id: `rij-${String(i + 1).padStart(4, '0')}`,
      lead_id: 'bestaat-niet',
      phase: 'request_received',
      status: 'config_missing',
      payload_frozen_at: null,
    }))
    const { revalidateBlockedAdsExports, REVALIDATE_CHECKPOINT } = await import('./ads-outbox.server')

    const eerste = await revalidateBlockedAdsExports()
    expect(eerste.checked).toBe(200)
    const mark = () => db['ads_worker_checkpoint']!.find((r) => r['name'] === REVALIDATE_CHECKPOINT)
    expect(mark()?.['cursor_value']).toBe('rij-0200')

    const tweede = await revalidateBlockedAdsExports()
    expect(tweede.checked).toBe(200)
    // Regel 201 komt dus wél aan de beurt.
    expect(mark()?.['cursor_value']).toBe('rij-0400')

    const derde = await revalidateBlockedAdsExports()
    expect(derde.checked).toBe(50)
    // Lijst uit: de volgende ronde begint weer vooraan.
    expect(mark()?.['cursor_value']).toBeNull()
  })

  it('loopt niet vast op een bladwijzer met een tijdstip uit een vorige versie', async () => {
    const { REVALIDATE_CHECKPOINT, revalidateBlockedAdsExports } = await import('./ads-outbox.server')
    db['ads_worker_checkpoint']!.push({ name: REVALIDATE_CHECKPOINT, cursor_value: dagen(3) })
    db['ads_conversion_outbox'] = [
      { id: 'rij-1', lead_id: 'bestaat-niet', phase: 'request_received', status: 'config_missing', payload_frozen_at: null },
    ]
    const res = await revalidateBlockedAdsExports()
    expect(res.checked).toBe(1)
  })
})
