/**
 * Regressietests bij de hercontrole van 22 september 2026.
 *
 * Elke test loopt door de echte functies met een nagebootste database en hoort
 * bij één concrete bevinding. Ze falen op de oude code.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createFakeSupabase, type FakeDb } from '@/test/fake-supabase'

const db: FakeDb = {}
const state: {
  failures: Record<string, { code?: string; message: string }>
  /** Bootst een andere ronde na die tussen lezen en schrijven toeslaat. */
  afterOutboxRead: (() => void) | null
} = { failures: {}, afterOutboxRead: null }

function client() {
  const fake = createFakeSupabase(db, { failures: state.failures }) as any
  const realFrom = fake.from.bind(fake)
  fake.from = (table: string) => {
    const builder = realFrom(table)
    if (table !== 'ads_conversion_outbox') return builder
    const realMaybe = builder.maybeSingle.bind(builder)
    builder.maybeSingle = () => {
      const result = realMaybe()
      return {
        then: (ok: any, fail: any) =>
          Promise.resolve(result)
            .then((value: any) => {
              state.afterOutboxRead?.()
              return value
            })
            .then(ok, fail),
      }
    }
    return builder
  }
  return fake
}

vi.mock('@/integrations/supabase/client.server', () => ({
  get supabaseAdmin() {
    return client() as never
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
    source: 'website',
    ...extra,
  }
}

beforeEach(() => {
  for (const key of Object.keys(db)) delete db[key]
  state.failures = {}
  state.afterOutboxRead = null
  // De meting is in deze tests allang in gebruik; het standaardvenster van 30
  // dagen bepaalt dan de grens.
  db['ads_worker_checkpoint'] = [{ name: 'ads_measurement_start', cursor_value: '2020-01-01T00:00:00.000Z' }]
  process.env['ADS_EXPORT_ENABLED'] = 'true'
  process.env['ADS_ACTION_ID_REQUEST_RECEIVED'] = '1111111111'
  process.env['ADS_ACTION_ID_JOB_COMPLETED'] = '2222222222'
  process.env['LOVABLE_API_KEY'] = 'nagebootste-sleutel'
  vi.resetModules()
})

describe('bevinding 1 — een verse bon neemt geen vreemd dossier over', () => {
  it('kan een bestaand dossier van een andere bezoeker niet eerst blokkeren en daarna vrijgeven', async () => {
    const { issueConsentTicket, applyConsentDecision } = await import('./ads-consent.server')
    // Dossier van bezoeker A bestaat al, mét toestemming.
    db['leads'] = [lead('lead-a', { gclid: 'klik-van-a', ad_consent_ad_user_data: 'granted' })]
    db['conversion_events'] = [
      { id: 'ev-1', gclid: 'klik-van-a', consent_ad_user_data: 'granted', created_at: dagen(2) },
    ]
    // Bezoeker B kent het klik-id en haalt er nu een verse bon bij.
    const ticket = await issueConsentTicket({ gclid: 'klik-van-a' })
    expect(ticket).not.toBeNull()

    const deny = await applyConsentDecision({
      token: ticket!.token,
      adUserData: 'denied',
      adStorage: 'denied',
      seq: 1,
    })
    expect(deny.ok).toBe(true)
    expect(db['leads']![0]!['ad_consent_ad_user_data']).toBe('granted')

    const grant = await applyConsentDecision({
      token: ticket!.token,
      adUserData: 'granted',
      adStorage: 'granted',
      seq: 2,
    })
    expect(grant.ok).toBe(true)
    // Niets van bezoeker A is aangeraakt, ook niet via de omweg.
    expect(db['leads']![0]!['ad_consent_ad_user_data']).toBe('granted')
    expect(db['conversion_events']![0]!['consent_ad_user_data']).toBe('granted')
  })
})

describe('bevinding 2 — een half verwerkt besluit geldt niet als voltooid', () => {
  it('maakt na een databasefout dezelfde intrekking bij een herhaling alsnog af', async () => {
    const { issueConsentTicket, applyConsentDecision } = await import('./ads-consent.server')
    const ticket = await issueConsentTicket({ gclid: 'klik-eigen' })
    // Het eigen dossier ontstaat ná de klik: dat is precies wat deze bon dekt.
    db['leads'] = [lead('lead-1', { gclid: 'klik-eigen', created_at: new Date(Date.now() + 1000).toISOString() })]

    state.failures['leads:update'] = { message: 'database niet bereikbaar' }
    await expect(
      applyConsentDecision({ token: ticket!.token, adUserData: 'denied', adStorage: 'denied', seq: 1 }),
    ).rejects.toThrow('database niet bereikbaar')
    // Het volgnummer is niet opgeschoven: het besluit is niet afgerond.
    expect(db['ad_consent_tickets']![0]!['last_seq']).toBe(0)

    delete state.failures['leads:update']
    const retry = await applyConsentDecision({
      token: ticket!.token,
      adUserData: 'denied',
      adStorage: 'denied',
      seq: 1,
    })
    expect(retry.ok).toBe(true)
    expect(db['leads']![0]!['ad_consent_ad_user_data']).toBe('denied')
    expect(db['ad_consent_tickets']![0]!['last_seq']).toBe(1)
  })

  it('laat een trage toestemming een nieuwere weigering niet terugdraaien', async () => {
    const { issueConsentTicket, applyConsentDecision } = await import('./ads-consent.server')
    const ticket = await issueConsentTicket({ gclid: 'klik-eigen' })
    // Het eigen dossier ontstaat ná de klik: dat is precies wat deze bon dekt.
    db['leads'] = [lead('lead-1', { gclid: 'klik-eigen', created_at: new Date(Date.now() + 1000).toISOString() })]

    // De nieuwere weigering (3) is al verwerkt; de oudere toestemming (2) komt
    // daarna alsnog binnen.
    await applyConsentDecision({ token: ticket!.token, adUserData: 'denied', adStorage: 'denied', seq: 3 })
    const late = await applyConsentDecision({
      token: ticket!.token,
      adUserData: 'granted',
      adStorage: 'granted',
      seq: 2,
    })
    expect(late.ok).toBe(false)
    expect(db['leads']![0]!['ad_consent_ad_user_data']).toBe('denied')
  })
})

describe('bevinding 4 — bevroren verzending en gelijktijdigheid', () => {
  it('herschrijft na de eerste poging geen bestemming, klik-id of bedrag meer', async () => {
    const { enqueueAdsConversion } = await import('./ads-outbox.server')
    db['leads'] = [lead('lead-1')]
    await enqueueAdsConversion('lead-1', 'request_received')
    const row = db['ads_conversion_outbox']![0]!
    // Eerste poging gedaan: de verzending ligt vast.
    row['payload_frozen_at'] = new Date().toISOString()
    row['status'] = 'failed_temporary'
    row['attempts'] = 1

    // Dossier verandert: ander klik-id, ander bedrag.
    db['leads']![0]!['gclid'] = 'heel-ander-klik-id'
    db['leads']![0]!['customer_price_cents'] = 99900
    process.env['ADS_ACTION_ID_REQUEST_RECEIVED'] = '3333333333'

    await enqueueAdsConversion('lead-1', 'request_received')
    expect(row['gclid']).toBe('klik-lead-1')
    expect(row['value_cents']).toBe(45000)
    expect(row['conversion_action_id']).toBe('1111111111')
  })

  it('zet een gelijktijdig ingediende verzending niet terug naar wachtend', async () => {
    const { enqueueAdsConversion } = await import('./ads-outbox.server')
    db['leads'] = [lead('lead-1', { outcome: 'done', outcome_at: dagen(0) })]
    await enqueueAdsConversion('lead-1', 'job_completed')
    const row = db['ads_conversion_outbox']![0]!
    row['status'] = 'failed_temporary'
    row['attempts'] = 1

    // Tussen lezen en schrijven pakt de verzendronde de regel op: nieuwe stand,
    // nieuw pogingsnummer.
    state.afterOutboxRead = () => {
      row['status'] = 'in_flight'
      row['attempts'] = 2
      state.afterOutboxRead = null
    }
    const result = await enqueueAdsConversion('lead-1', 'job_completed')
    expect(row['status']).toBe('in_flight')
    expect(result.status).toBe('in_flight')
  })
})

describe('bevinding 5 — volledige momentopname bij herbeoordelen', () => {
  it('werkt een nooit verzonden regel volledig bij, niet alleen de bestemming', async () => {
    const { enqueueAdsConversion, revalidateBlockedAdsExports } = await import('./ads-outbox.server')
    delete process.env['ADS_ACTION_ID_REQUEST_RECEIVED']
    db['leads'] = [lead('lead-1', { gclid: null })]
    // Zonder klik-id en zonder bestemming: de regel blijft geblokkeerd staan.
    await enqueueAdsConversion('lead-1', 'request_received')
    const row = db['ads_conversion_outbox']![0]!
    expect(row['gclid'] ?? null).toBeNull()

    // Later wordt de advertentieklik alsnog gekoppeld en komt de bestemming er.
    db['leads']![0]!['gclid'] = 'later-gekoppeld'
    db['leads']![0]!['customer_price_cents'] = 51000
    process.env['ADS_ACTION_ID_REQUEST_RECEIVED'] = '1111111111'
    await revalidateBlockedAdsExports()

    expect(row['gclid']).toBe('later-gekoppeld')
    expect(row['value_cents']).toBe(51000)
    expect(row['conversion_action_id']).toBe('1111111111')
  })

  it('laat een bevroren regel ongemoeid', async () => {
    const { enqueueAdsConversion, revalidateBlockedAdsExports } = await import('./ads-outbox.server')
    db['leads'] = [lead('lead-1', { outcome: 'done', outcome_at: dagen(0) })]
    await enqueueAdsConversion('lead-1', 'job_completed')
    const row = db['ads_conversion_outbox']![0]!
    row['payload_frozen_at'] = new Date().toISOString()
    row['status'] = 'failed_temporary'
    db['leads']![0]!['gclid'] = 'gewijzigd-na-verzending'

    await revalidateBlockedAdsExports()
    expect(row['gclid']).toBe('klik-lead-1')
  })

  it('loopt door voorbij de eerste tweehonderd regels', async () => {
    const { revalidateBlockedAdsExports } = await import('./ads-outbox.server')
    db['leads'] = []
    db['ads_conversion_outbox'] = []
    for (let i = 0; i < 250; i += 1) {
      const id = `lead-${String(i).padStart(4, '0')}`
      db['leads']!.push(lead(id, { outcome: 'done', outcome_at: dagen(0) }))
      db['ads_conversion_outbox']!.push({
        id: `rij-${String(i).padStart(4, '0')}`,
        lead_id: id,
        phase: 'job_completed',
        account_id: '9084464909',
        status: 'export_disabled',
        attempts: 0,
        event_time: dagen(0),
        payload_frozen_at: null,
      })
    }
    const result = await revalidateBlockedAdsExports(1000)
    expect(result.checked).toBe(250)
    expect(result.released).toBe(250)
  })
})

describe('bevinding 6 — herstelronde: grens per fase en gegarandeerde voortgang', () => {
  it('vult zonder goedgekeurde startgrens geen fase van vóór het venster aan', async () => {
    const { reconcileAdsOutbox } = await import('./ads-outbox.server')
    db['leads'] = [lead('lead-oud', { created_at: dagen(60), outcome: 'done', outcome_at: dagen(45) })]
    db['ads_conversion_outbox'] = []
    const result = await reconcileAdsOutbox()
    expect(result.created).toBe(0)
  })

  it('pakt een oud dossier met een recente afronding wel op, maar alleen die fase', async () => {
    const { reconcileAdsOutbox } = await import('./ads-outbox.server')
    db['leads'] = [lead('lead-oud', { created_at: dagen(60), outcome: 'done', outcome_at: dagen(1) })]
    db['ads_conversion_outbox'] = []
    await reconcileAdsOutbox()
    expect(db['ads_conversion_outbox']!.map((r) => r['phase'])).toEqual(['job_completed'])
  })

  it('rekt een goedgekeurde grens van twee dagen niet op tot dertig dagen', async () => {
    const { reconcileAdsOutbox } = await import('./ads-outbox.server')
    db['ads_migration_policy'] = [{ id: 1, backfill_start_at: dagen(2) }]
    db['leads'] = [
      lead('lead-a', { created_at: dagen(10), outcome: 'done', outcome_at: dagen(10) }),
      lead('lead-b', { created_at: dagen(1), outcome: 'done', outcome_at: dagen(1) }),
    ]
    db['ads_conversion_outbox'] = []
    await reconcileAdsOutbox()
    expect(db['ads_conversion_outbox']!.map((r) => r['lead_id'])).toEqual(['lead-b', 'lead-b'])
  })

  it('vult bij een historisch gemarkeerd dossier geen eerdere fasen aan', async () => {
    const { reconcileAdsOutbox } = await import('./ads-outbox.server')
    db['leads'] = [lead('lead-1', { outcome: 'done', outcome_at: dagen(0) })]
    db['ads_conversion_outbox'] = [
      {
        id: 'rij-1',
        lead_id: 'lead-1',
        phase: 'job_completed',
        account_id: '9084464909',
        status: 'skipped',
        legacy_import: true,
      },
    ]
    const result = await reconcileAdsOutbox()
    expect(result.created).toBe(0)
  })

  it('maakt voortgang bij dossiers met exact hetzelfde tijdstip', async () => {
    const { reconcileAdsOutbox } = await import('./ads-outbox.server')
    const zelfde = dagen(1)
    db['leads'] = [
      lead('lead-a', { created_at: zelfde }),
      lead('lead-b', { created_at: zelfde }),
      lead('lead-c', { created_at: zelfde }),
    ]
    db['ads_conversion_outbox'] = []
    const first = await reconcileAdsOutbox(30, 2)
    expect(first.created).toBe(2)
    expect(first.cursor).toBe('lead-b')
    const second = await reconcileAdsOutbox(30, 2)
    expect(second.created).toBe(1)
    expect(db['ads_conversion_outbox']!.map((r) => r['lead_id']).sort()).toEqual([
      'lead-a',
      'lead-b',
      'lead-c',
    ])
  })
})
