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

// Ownership, rollback and concurrent choices now run against real PostgreSQL:
// scripts/test-consent-postgres.mjs. RPC contract tests: ads-consent.test.ts.

describe('punt 4 — een verzonden regel gaat nooit opnieuw de deur uit', () => {
  it('heropent een al ingediende regel niet bij handmatig opnieuw melden', async () => {
    db['leads'] = [lead('klaar', { outcome: 'done', outcome_at: dagen(0) })]
    db['ads_conversion_outbox'] = [
      {
        id: 'ob-1',
        lead_id: 'klaar',
        phase: 'job_completed',
        account_id: '9084464909',
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
      { id: 'ob-1', lead_id: 'legacy', phase: 'job_completed', account_id: '9084464909', status: 'submitted', legacy_import: true },
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
