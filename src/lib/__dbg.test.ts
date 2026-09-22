import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createFakeSupabase, type FakeDb } from '@/test/fake-supabase'
const db: FakeDb = {}
vi.mock('@/integrations/supabase/client.server', () => ({ get supabaseAdmin() { return createFakeSupabase(db) as never } }))
it('dbg', async () => {
  db['leads'] = [{ id: 'lead-1', gclid: 'x', is_test: false, customer_price_cents: 100, outcome: 'done', outcome_at: '2026-09-20T10:00:00.000Z', created_at: '2026-09-20T10:00:00.000Z', ad_click_evidence: 'form', ad_consent_ad_user_data: 'granted' }]
  process.env['ADS_EXPORT_ENABLED'] = 'false'
  const m = await import('@/lib/ads-outbox.server')
  console.log(await m.enqueueAdsConversion('lead-1','job_completed'))
  console.log(JSON.stringify(db['ads_conversion_outbox']))
  process.env['ADS_EXPORT_ENABLED'] = 'true'
  console.log(await m.revalidateBlockedAdsExports())
})
it('dbg2', async () => {
  const m = await import('@/lib/ads-outbox.server')
  process.env['ADS_EXPORT_ENABLED'] = 'true'
  const lead = { id:'lead-1', gclid:'x', is_test:false, customer_price_cents:100, outcome:'done', outcome_at:'2026-09-20T10:00:00.000Z', created_at:'2026-09-20T10:00:00.000Z', ad_click_evidence:'form', ad_consent_ad_user_data:'granted' } as any
  console.log('elig', (m as any).eligibilityFor?.(lead, 'job_completed'))
})
