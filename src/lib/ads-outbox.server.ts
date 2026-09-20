/**
 * Transactionele wachtrij voor conversieterugmeldingen.
 *
 * Elke dossierroute — beheerder zet op "gedaan", handtekening van de klant,
 * later bewezen koppeling — zet dezelfde gebeurtenis in deze wachtrij. Precies
 * één regel per dossier en fase, met het oorspronkelijke tijdstip. Een aparte
 * worker verzendt en volgt de status op, zodat een mislukte verzending het
 * dossier nooit blokkeert en niets stil verdwijnt.
 */

import {
  MAX_ATTEMPTS,
  conversionEligibility,
  isRetryable,
  nextAttemptDelayMs,
  type ConversionPhase,
  type OutboxStatus,
} from './ads-outbox'
import {
  ADS_ACCOUNT_ID,
  OFFLINE_CONVERSION_ACTION_ID,
  adsConfigured,
  adsExportEnabled,
  uploadOfflineConversion,
} from './ads-offline.server'

type LeadRow = {
  id: string
  gclid: string | null
  gbraid: string | null
  wbraid: string | null
  is_test: boolean | null
  customer_price_cents: number | null
  outcome: string | null
  outcome_at: string | null
  ad_click_evidence: string | null
  ad_consent_ad_user_data: string | null
}

const LEAD_FIELDS =
  'id, gclid, gbraid, wbraid, is_test, customer_price_cents, outcome, outcome_at, ad_click_evidence, ad_consent_ad_user_data'

/**
 * Zet de conversie van dit dossier klaar (of werkt de status bij wanneer hij er
 * al staat). Nooit twee regels voor dezelfde fase.
 */
export async function enqueueAdsConversion(
  leadId: string,
  phase: ConversionPhase = 'job_completed',
): Promise<{ status: OutboxStatus }> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const { data, error } = await supabaseAdmin.from('leads').select(LEAD_FIELDS).eq('id', leadId).maybeSingle()
  if (error) throw new Error(error.message)
  const lead = data as LeadRow | null
  if (!lead) throw new Error('Lead niet gevonden')

  const status = conversionEligibility({
    isTest: Boolean(lead.is_test),
    gclid: lead.gclid,
    gbraid: lead.gbraid,
    wbraid: lead.wbraid,
    evidence: lead.ad_click_evidence,
    consentAdUserData: lead.ad_consent_ad_user_data,
    exportEnabled: adsExportEnabled(),
    configured: adsConfigured(),
  })

  // Het oorspronkelijke tijdstip van de klus, niet het moment van deze poging.
  const eventTime = lead.outcome_at ?? new Date().toISOString()

  const existing = await supabaseAdmin
    .from('ads_conversion_outbox')
    .select('id, status, event_time')
    .eq('lead_id', leadId)
    .eq('phase', phase)
    .eq('account_id', ADS_ACCOUNT_ID)
    .eq('conversion_action_id', OFFLINE_CONVERSION_ACTION_ID)
    .maybeSingle()

  const row = existing.data as { id: string; status: string; event_time: string } | null

  if (row) {
    // Een al ingediende of verwerkte conversie nooit opnieuw klaarzetten.
    if (['submitted', 'processed', 'processing_unknown'].includes(row.status)) {
      return { status: row.status as OutboxStatus }
    }
    await supabaseAdmin
      .from('ads_conversion_outbox')
      .update({
        status,
        gclid: lead.gclid,
        gbraid: lead.gbraid,
        wbraid: lead.wbraid,
        evidence: lead.ad_click_evidence,
        consent_ad_user_data: lead.ad_consent_ad_user_data,
        value_cents: lead.customer_price_cents,
        is_test: Boolean(lead.is_test),
        // Oorspronkelijk tijdstip behouden.
        event_time: row.event_time ?? eventTime,
        next_attempt_at: new Date().toISOString(),
      })
      .eq('id', row.id)
    return { status }
  }

  await supabaseAdmin.from('ads_conversion_outbox').insert({
    lead_id: leadId,
    phase,
    account_id: ADS_ACCOUNT_ID,
    conversion_action_id: OFFLINE_CONVERSION_ACTION_ID,
    status,
    event_time: eventTime,
    value_cents: lead.customer_price_cents,
    gclid: lead.gclid,
    gbraid: lead.gbraid,
    wbraid: lead.wbraid,
    evidence: lead.ad_click_evidence,
    consent_ad_user_data: lead.ad_consent_ad_user_data,
    is_test: Boolean(lead.is_test),
  })
  return { status }
}

/** Zet de conversie klaar zodra een dossier is afgerond; stil bij andere uitkomsten. */
export async function enqueueIfCompleted(leadId: string): Promise<{ status: OutboxStatus } | null> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const { data } = await supabaseAdmin.from('leads').select('outcome').eq('id', leadId).maybeSingle()
  if ((data as { outcome: string | null } | null)?.outcome !== 'done') return null
  return enqueueAdsConversion(leadId)
}

type OutboxRow = {
  id: string
  lead_id: string
  phase: string
  status: string
  event_time: string
  value_cents: number | null
  gclid: string | null
  gbraid: string | null
  wbraid: string | null
  consent_ad_user_data: string | null
  attempts: number
}

/**
 * Verzendt de openstaande conversies. Draait vanuit de beveiligde
 * achtergrondtaak; nooit als losse fetch tijdens een gebruikersrequest.
 */
export async function processAdsOutbox(limit = 20) {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

  if (!adsExportEnabled()) {
    return { processed: 0, submitted: 0, failed: 0, skipped: 'export_disabled' as const }
  }

  const { data, error } = await supabaseAdmin
    .from('ads_conversion_outbox')
    .select('id, lead_id, phase, status, event_time, value_cents, gclid, gbraid, wbraid, consent_ad_user_data, attempts')
    .in('status', ['pending', 'failed_temporary'])
    .lte('next_attempt_at', new Date().toISOString())
    .order('next_attempt_at', { ascending: true })
    .limit(limit)
  if (error) throw new Error(error.message)

  let submitted = 0
  let failed = 0
  const rows = (data ?? []) as OutboxRow[]

  for (const row of rows) {
    if (!isRetryable(row.status as OutboxStatus)) continue
    const attempts = row.attempts + 1

    const result = await uploadOfflineConversion({
      leadId: row.lead_id,
      phase: row.phase,
      gclid: row.gclid,
      gbraid: row.gbraid,
      wbraid: row.wbraid,
      eventTime: row.event_time,
      valueCents: row.value_cents,
      consentAdUserData: row.consent_ad_user_data === 'granted' ? 'granted' : 'denied',
    })

    let status = result.status
    if (status === 'failed_temporary' && attempts >= MAX_ATTEMPTS) status = 'failed_permanent'
    if (status === 'submitted' || status === 'processing_unknown') submitted += 1
    if (status === 'failed_temporary' || status === 'failed_permanent') failed += 1

    const update = await supabaseAdmin
      .from('ads_conversion_outbox')
      .update({
        status,
        attempts,
        last_attempt_at: new Date().toISOString(),
        next_attempt_at: new Date(Date.now() + nextAttemptDelayMs(attempts)).toISOString(),
        submitted_at:
          status === 'submitted' || status === 'processing_unknown' ? new Date().toISOString() : null,
        request_id: result.requestId,
        warnings: result.warnings,
        last_error: result.error,
      })
      .eq('id', row.id)
    if (update.error) {
      // Een mislukte statusupdate is een echt probleem: anders wordt dezelfde
      // conversie straks nog eens ingediend.
      console.error('Status van conversiewachtrij bijwerken mislukt', update.error.message)
    }

    // De dossierweergave leest de samenvatting van het dossier zelf.
    await supabaseAdmin
      .from('leads')
      .update({
        ads_upload_status: status,
        ads_uploaded_at: status === 'submitted' ? new Date().toISOString() : null,
        ads_upload_error: result.error,
      })
      .eq('id', row.lead_id)
  }

  return { processed: rows.length, submitted, failed, skipped: null }
}

/**
 * Compatibele ingang voor bestaande aanroepen: zet de conversie klaar en meldt
 * de status terug. Verzendt zelf niets meer.
 */
export async function reportLeadToGoogleAds(leadId: string, opts: { force?: boolean } = {}) {
  const result = await enqueueAdsConversion(leadId)
  if (opts.force && result.status === 'pending') {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    await supabaseAdmin
      .from('ads_conversion_outbox')
      .update({ next_attempt_at: new Date().toISOString(), status: 'pending' })
      .eq('lead_id', leadId)
  }
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  await supabaseAdmin.from('leads').update({ ads_upload_status: result.status }).eq('id', leadId)
  return { status: result.status, error: null as string | null }
}
