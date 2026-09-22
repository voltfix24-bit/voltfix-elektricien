/**
 * Tests bij het standaardvenster, de goedgekeurde startgrens en de markering
 * van eerder verzonden dossiers (bevinding 4 en 7 uit de hercontrole).
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

function lead(id: string, createdDaysAgo: number, extra: Record<string, unknown> = {}) {
  return {
    id,
    created_at: dagen(createdDaysAgo),
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
    price_cents: 5000,
    customer_price_cents: null,
    source: 'website',
    ...extra,
  }
}

beforeEach(() => {
  for (const key of Object.keys(db)) delete db[key]
  db['ads_migration_policy'] = [{ id: 1, backfill_start_at: null }]
  db['ads_worker_checkpoint'] = []
  db['ads_conversion_outbox'] = []
  db['leads'] = []
})

describe('standaardvenster', () => {
  it('laat een dossier van buiten het venster met rust zolang er geen startgrens is goedgekeurd', async () => {
    db['leads'] = [lead('oud', 45), lead('recent', 5)]
    const { reconcileAdsOutbox } = await import('./ads-outbox.server')
    await reconcileAdsOutbox(30)
    const leadIds = db['ads_conversion_outbox']!.map((r) => r['lead_id'])
    expect(leadIds).toContain('recent')
    expect(leadIds).not.toContain('oud')
  })

  it('kijkt verder terug zodra jij een startgrens hebt goedgekeurd', async () => {
    db['leads'] = [lead('oud', 45)]
    db['ads_migration_policy'] = [{ id: 1, backfill_start_at: dagen(60) }]
    const { reconcileAdsOutbox } = await import('./ads-outbox.server')
    await reconcileAdsOutbox(30)
    expect(db['ads_conversion_outbox']!.map((r) => r['lead_id'])).toContain('oud')
  })

  it('zet niets klaar voor een testdossier', async () => {
    db['leads'] = [lead('test', 2, { is_test: true })]
    const { reconcileAdsOutbox } = await import('./ads-outbox.server')
    await reconcileAdsOutbox(30)
    expect(db['ads_conversion_outbox']).toHaveLength(0)
  })
})

describe('eerder verzonden dossiers (legacy_pre_split)', () => {
  it('meldt een dossier dat onder de oude identiteit al verzonden is niet opnieuw', async () => {
    db['leads'] = [lead('al-gemeld', 7, { outcome: 'done', outcome_at: dagen(6) })]
    // Zo staat het na de databasewijziging in de wachtrij: al ingediend,
    // gemarkeerd als import van vóór de splitsing in vier fasen.
    db['ads_conversion_outbox'] = [
      {
        id: 'legacy-1',
        lead_id: 'al-gemeld',
        phase: 'job_completed',
        account_id: '9084464909',
        status: 'submitted',
        phase_source: 'legacy_pre_split',
        legacy_import: true,
      },
    ]
    const { reconcileAdsOutbox } = await import('./ads-outbox.server')
    await reconcileAdsOutbox(30)
    const completed = db['ads_conversion_outbox']!.filter((r) => r['phase'] === 'job_completed')
    expect(completed).toHaveLength(1)
    expect(completed[0]!['status']).toBe('submitted')
  })
})

describe('voortgang van de herstelronde', () => {
  it('slaat een bladwijzer op wanneer de ronde vol was', async () => {
    db['leads'] = [lead('a', 9), lead('b', 8), lead('c', 7)]
    const { reconcileAdsOutbox, RECONCILE_CHECKPOINT } = await import('./ads-outbox.server')
    const result = await reconcileAdsOutbox(30, 2)
    expect(result.cursor).not.toBeNull()
    const mark = db['ads_worker_checkpoint']!.find((r) => r['name'] === RECONCILE_CHECKPOINT)
    expect(mark?.['cursor_value']).toBe(result.cursor)
  })

  it('begint na een afgemaakte ronde weer bij het begin van het venster', async () => {
    db['leads'] = [lead('a', 9)]
    const { reconcileAdsOutbox, RECONCILE_CHECKPOINT } = await import('./ads-outbox.server')
    db['ads_worker_checkpoint'] = [{ name: RECONCILE_CHECKPOINT, cursor_value: dagen(10) }]
    const result = await reconcileAdsOutbox(30, 50)
    expect(result.cursor).toBeNull()
    expect(db['ads_worker_checkpoint']![0]!['cursor_value']).toBeNull()
  })
})
