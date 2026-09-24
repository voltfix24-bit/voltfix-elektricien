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

// Ownership, rollback and concurrent choices now run against real PostgreSQL:
// scripts/test-consent-postgres.mjs. RPC contract tests: ads-consent.test.ts.

describe('keten 3 — de historische grens geldt op elke ingang', () => {
  it('zet een gebeurtenis van vóór de meetperiode nooit klaar', async () => {
    db['ads_worker_checkpoint'] = [{ name: 'ads_measurement_start', cursor_value: new Date().toISOString() }]
    db['leads'] = [lead('oud', { created_at: dagen(200) })]
    const { enqueueAdsConversion } = await import('./ads-outbox.server')
    await enqueueAdsConversion('oud', 'request_received')
    expect(db['ads_conversion_outbox']![0]!['status']).toBe('skipped_historical')
  })

  it('houdt een oud dossier historisch, ook bij een recente fase', async () => {
    db['ads_migration_policy'] = [{ id: 1, backfill_start_at: dagen(5) }]
    db['leads'] = [lead('oud2', { created_at: dagen(90), outcome: 'done', outcome_at: new Date().toISOString() })]
    // Dit dossier is eerder als historisch afgesloten.
    db['ads_conversion_outbox'] = [
      { id: 'oud-regel', lead_id: 'oud2', phase: 'request_received', status: 'skipped_historical', legacy_import: true, account_id: '9084464909' },
    ]
    const { enqueueAdsConversion } = await import('./ads-outbox.server')
    await enqueueAdsConversion('oud2', 'job_completed')
    const nieuw = db['ads_conversion_outbox']!.find((r: any) => r['phase'] === 'job_completed')
    expect(nieuw!['status']).toBe('skipped_historical')
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
