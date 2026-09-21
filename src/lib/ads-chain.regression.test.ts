/**
 * Regressietests voor de meetketen van dossier naar Google.
 *
 * Deze tests lopen door de echte functies heen, met een nagebootste database
 * en nagebootste netwerkantwoorden. Elke test hoort bij een bevinding uit de
 * onafhankelijke hercontrole en faalt op de oude code.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createFakeSupabase, type FakeDb } from '@/test/fake-supabase'

const db: FakeDb = {}
const fake = createFakeSupabase(db)
const state: { failures: Record<string, { code?: string; message: string }> } = { failures: {} }

vi.mock('@/integrations/supabase/client.server', () => ({
  get supabaseAdmin() {
    return createFakeSupabase(db, { failures: state.failures }) as never
  },
}))

const ACCOUNT = '9084464909'
const NOW = '2026-09-20T10:00:00.000Z'

function seedLead(extra: Record<string, unknown> = {}) {
  const lead = {
    id: 'lead-1',
    source: 'website_form',
    customer_name: 'Testklant',
    gclid: 'nagebootst-klik-id-123',
    gbraid: null,
    wbraid: null,
    is_test: false,
    customer_price_cents: 45000,
    outcome: null,
    outcome_at: null,
    created_at: NOW,
    claimed_at: null,
    qualified_at: null,
    disqualified_at: null,
    ad_click_evidence: 'form',
    ad_consent_ad_user_data: 'granted',
    ...extra,
  }
  db['leads'] = [lead]
  return lead
}

beforeEach(() => {
  for (const key of Object.keys(db)) delete db[key]
  state.failures = {}
  process.env['ADS_EXPORT_ENABLED'] = 'false'
  process.env['LOVABLE_API_KEY'] = 'nagebootste-sleutel'
  process.env['GOOGLE_ADS_API_KEY'] = 'nagebootste-sleutel'
  delete process.env['ADS_ACTION_ID_REQUEST_RECEIVED']
  vi.resetModules()
})

describe('bevinding 1 — geen impliciete toestemming', () => {
  it('blokkeert de export wanneer de bezoeker geen cookiekeuze maakte', async () => {
    seedLead({ ad_consent_ad_user_data: null, outcome: 'done', outcome_at: NOW })
    const { enqueueAdsConversion } = await import('./ads-outbox.server')
    const result = await enqueueAdsConversion('lead-1', 'job_completed')
    expect(result.status).toBe('blocked_consent')
  })
})

describe('bevinding 6 — geen stil verloren gebeurtenissen', () => {
  it('meldt een mislukte opslag als fout in plaats van "klaargezet"', async () => {
    seedLead({ outcome: 'done', outcome_at: NOW })
    state.failures['ads_conversion_outbox:insert'] = { message: 'database niet bereikbaar' }
    const { enqueueAdsConversion } = await import('./ads-outbox.server')
    await expect(enqueueAdsConversion('lead-1', 'job_completed')).rejects.toThrow('database niet bereikbaar')
  })

  it('vult een ontbrekende fasegebeurtenis achteraf aan, zonder tijdstip te verzinnen', async () => {
    seedLead({ outcome: 'done', outcome_at: NOW, qualified_at: null })
    db['ads_conversion_outbox'] = []
    const { reconcileAdsOutbox } = await import('./ads-outbox.server')
    const first = await reconcileAdsOutbox()
    expect(first.created).toBe(2) // aanvraag ontvangen + klus uitgevoerd
    // Geen gekwalificeerde aanvraag: die fase heeft geen eigen tijdstip.
    expect(db['ads_conversion_outbox']!.map((r) => r['phase']).sort()).toEqual([
      'job_completed',
      'request_received',
    ])
    // Nog eens draaien maakt niets dubbel.
    const second = await reconcileAdsOutbox()
    expect(second.created).toBe(0)
  })
})

describe('bevinding 4 — geblokkeerde wachtrij opnieuw beoordelen', () => {
  it('geeft een gebeurtenis vrij zodra de export aangaat, zonder poging te verbruiken', async () => {
    seedLead({ outcome: 'done', outcome_at: NOW })
    const { enqueueAdsConversion, revalidateBlockedAdsExports } = await import('./ads-outbox.server')
    const queued = await enqueueAdsConversion('lead-1', 'job_completed')
    expect(queued.status).toBe('export_disabled')

    process.env['ADS_EXPORT_ENABLED'] = 'true'
    const again = await revalidateBlockedAdsExports()
    expect(again.released).toBe(1)
    const row = db['ads_conversion_outbox']![0]!
    expect(row['status']).toBe('pending')
    expect(row['attempts'] ?? 0).toBe(0)
  })

  it('geeft een gebeurtenis vrij zodra de ontbrekende conversieactie er is', async () => {
    seedLead({ created_at: NOW })
    process.env['ADS_EXPORT_ENABLED'] = 'true'
    const { enqueueAdsConversion, revalidateBlockedAdsExports } = await import('./ads-outbox.server')
    const queued = await enqueueAdsConversion('lead-1', 'request_received')
    expect(queued.status).toBe('config_missing')

    process.env['ADS_ACTION_ID_REQUEST_RECEIVED'] = '1234567890'
    const again = await revalidateBlockedAdsExports()
    expect(again.released).toBe(1)
    expect(db['ads_conversion_outbox']![0]!['status']).toBe('pending')
  })
})

describe('bevinding 2 — intrekking werkt door tot in de wachtrij', () => {
  it('blokkeert een wachtende export nadat de bezoeker zijn toestemming intrekt', async () => {
    seedLead({ outcome: 'done', outcome_at: NOW })
    process.env['ADS_EXPORT_ENABLED'] = 'true'
    const { enqueueAdsConversion } = await import('./ads-outbox.server')
    expect((await enqueueAdsConversion('lead-1', 'job_completed')).status).toBe('pending')

    const { applyConsentDecision } = await import('./ads-consent.server')
    const result = await applyConsentDecision({
      gclid: 'nagebootst-klik-id-123',
      gbraid: null,
      wbraid: null,
      clickRef: null,
      adUserData: 'denied',
      adStorage: 'denied',
    })
    expect(result.blocked).toBe(1)
    expect(db['leads']![0]!['ad_consent_ad_user_data']).toBe('denied')
    expect(db['ads_conversion_outbox']![0]!['status']).toBe('blocked_consent')
  })
})

describe('bevinding 7 — ingetrokken kwalificatie', () => {
  it('laat een teruggedraaide beoordeling vervallen in plaats van verzenden', async () => {
    seedLead({ qualified_at: NOW })
    process.env['ADS_EXPORT_ENABLED'] = 'true'
    process.env['ADS_ACTION_ID_REQUEST_QUALIFIED'] = '999'
    const { enqueueRequestQualified, cancelRevertedPhase } = await import('./ads-outbox.server')
    expect((await enqueueRequestQualified('lead-1')).status).toBe('pending')

    const cancelled = await cancelRevertedPhase('lead-1', 'request_qualified')
    expect(cancelled).toEqual({ cancelled: true, alreadySubmitted: false })
    expect(db['ads_conversion_outbox']![0]!['status']).toBe('phase_reverted')
    delete process.env['ADS_ACTION_ID_REQUEST_QUALIFIED']
  })

  it('draait een al ingediende gebeurtenis niet terug', async () => {
    seedLead({ qualified_at: NOW })
    db['ads_conversion_outbox'] = [
      {
        id: 'ev-1',
        lead_id: 'lead-1',
        phase: 'request_qualified',
        account_id: ACCOUNT,
        status: 'submitted',
        event_time: NOW,
        attempts: 1,
      },
    ]
    const { cancelRevertedPhase } = await import('./ads-outbox.server')
    expect(await cancelRevertedPhase('lead-1', 'request_qualified')).toEqual({
      cancelled: false,
      alreadySubmitted: true,
    })
    expect(db['ads_conversion_outbox']![0]!['status']).toBe('submitted')
  })
})

describe('bevinding 11 — uitval tussen verzenden en opslaan', () => {
  it('pakt een blijven hangen verzending opnieuw op met dezelfde identiteit en tijd', async () => {
    seedLead({ outcome: 'done', outcome_at: NOW })
    process.env['ADS_EXPORT_ENABLED'] = 'true'
    db['ads_conversion_outbox'] = [
      {
        id: 'ev-1',
        lead_id: 'lead-1',
        phase: 'job_completed',
        account_id: ACCOUNT,
        status: 'in_flight',
        event_time: NOW,
        value_cents: 45000,
        gclid: 'nagebootst-klik-id-123',
        gbraid: null,
        wbraid: null,
        attempts: 1,
        recovered_count: 0,
        inflight_since: '2026-09-20T08:00:00.000Z',
        next_attempt_at: '2026-09-20T08:00:00.000Z',
      },
    ]

    const sent: any[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init: any) => {
        sent.push(JSON.parse(init.body))
        return new Response(JSON.stringify({ requestId: 'nagebootst-verzoek-1' }), { status: 200 })
      }),
    )

    const { processAdsOutbox } = await import('./ads-outbox.server')
    const result = await processAdsOutbox()
    expect(result.recovered).toBe(1)
    expect(sent).toHaveLength(1)
    const event = sent[0].events[0]
    expect(event.transactionId).toBe('lead-1:job_completed')
    expect(event.eventTimestamp).toBe(NOW)
    // Bevinding 3: OFFLINE bestaat niet in het contract van Google.
    expect(event.eventSource).toBe('WEB')
    expect(db['ads_conversion_outbox']![0]!['status']).toBe('submitted')
    vi.unstubAllGlobals()
  })

  it('geeft een onzekere verzending op zodra het pogingsbudget op is', async () => {
    seedLead({ outcome: 'done', outcome_at: NOW })
    process.env['ADS_EXPORT_ENABLED'] = 'true'
    db['ads_conversion_outbox'] = [
      {
        id: 'ev-1',
        lead_id: 'lead-1',
        phase: 'job_completed',
        account_id: ACCOUNT,
        status: 'in_flight',
        event_time: NOW,
        attempts: 6,
        recovered_count: 1,
        inflight_since: '2026-09-20T02:00:00.000Z',
        next_attempt_at: NOW,
      },
    ]
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const { processAdsOutbox } = await import('./ads-outbox.server')
    const result = await processAdsOutbox()
    expect(result.abandoned).toBe(1)
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(db['ads_conversion_outbox']![0]!['status']).toBe('failed_permanent')
    vi.unstubAllGlobals()
  })
})

describe('bevinding 3 — het contract van Google', () => {
  it('leest ook veldwaarschuwingen uit het antwoord', async () => {
    const { classifyUploadResponse } = await import('./ads-outbox')
    const classified = classifyUploadResponse(200, {
      requestId: 'nagebootst-verzoek-2',
      fieldWarnings: { field: 'conversionValue', message: 'genegeerd' },
    })
    expect(classified.status).toBe('submitted')
    expect(classified.warnings).toHaveLength(1)
  })

  it('houdt "ingediend" en "verwerkt" gescheiden', async () => {
    const { classifyUploadResponse } = await import('./ads-outbox')
    expect(classifyUploadResponse(200, {}).status).toBe('processing_unknown')
    expect(classifyUploadResponse(200, { requestId: 'x' }).status).toBe('submitted')
    expect(classifyUploadResponse(200, { requestId: 'x' }).status).not.toBe('processed')
  })

  it('gebruikt alleen bronwaarden die Google kent', async () => {
    const { buildEvent, eventSourceForLead } = await import('./ads-offline.server')
    expect(eventSourceForLead('phone_manual')).toBe('PHONE')
    expect(eventSourceForLead('whatsapp_manual')).toBe('MESSAGE')
    expect(eventSourceForLead('website_form')).toBe('WEB')
    expect(eventSourceForLead(null)).toBe('OTHER')
    const event = buildEvent({
      leadId: 'lead-1',
      phase: 'job_completed',
      conversionActionId: '1',
      gclid: 'nagebootst',
      gbraid: null,
      wbraid: null,
      eventTime: NOW,
      valueCents: 1000,
      consentAdUserData: 'granted',
      eventSource: 'PHONE',
    })
    expect(event['eventSource']).toBe('PHONE')
    expect(event['eventSource']).not.toBe('OFFLINE')
  })
})
