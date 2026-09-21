/**
 * Transactionele wachtrij voor conversieterugmeldingen.
 *
 * Elke fase van een dossier — aanvraag ontvangen, aanvraag gekwalificeerd,
 * klus uitgevoerd — is een eigen gebeurtenis met een eigen tijdstip en een
 * eigen bestemming. Precies één regel per dossier én fase. Een aparte worker
 * verzendt en volgt de status op, zodat een mislukte verzending het dossier
 * nooit blokkeert en niets stil verdwijnt.
 */

import {
  MAX_ATTEMPTS,
  PHASE_LABEL,
  PHASE_SOURCE,
  PHASE_SOURCE_LABEL,
  conversionEligibility,
  isRetryable,
  isStaleInFlight,
  nextAttemptDelayMs,
  type ConversionPhase,
  type OutboxStatus,
  type PhaseSource,
} from './ads-outbox'
import {
  ADS_ACCOUNT_ID,
  adsConfigured,
  adsExportEnabled,
  conversionActionForPhase,
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
  created_at: string | null
  claimed_at: string | null
  qualified_at: string | null
  disqualified_at: string | null
  ad_click_evidence: string | null
  ad_consent_ad_user_data: string | null
}

const LEAD_FIELDS =
  'id, gclid, gbraid, wbraid, is_test, customer_price_cents, outcome, outcome_at, created_at, claimed_at, qualified_at, disqualified_at, ad_click_evidence, ad_consent_ad_user_data'

/**
 * Het daadwerkelijke tijdstip van déze fase — nooit "nu" bij een herhaling.
 *
 * Let op het onderscheid: "gekwalificeerd" is het moment waarop de aanvraag
 * als echte, bereikbare klant met een passende klus is beoordeeld. Dat een
 * monteur de klus aanneemt is een andere gebeurtenis met een eigen tijdstip.
 */
function phaseEventTime(lead: LeadRow, phase: ConversionPhase): string | null {
  if (phase === 'request_received') return lead.created_at
  if (phase === 'request_qualified') return lead.qualified_at
  if (phase === 'job_accepted') return lead.claimed_at
  return lead.outcome_at
}

function eligibilityFor(lead: LeadRow, phase: ConversionPhase): OutboxStatus {
  return conversionEligibility({
    isTest: Boolean(lead.is_test),
    gclid: lead.gclid,
    gbraid: lead.gbraid,
    wbraid: lead.wbraid,
    evidence: lead.ad_click_evidence,
    consentAdUserData: lead.ad_consent_ad_user_data,
    exportEnabled: adsExportEnabled(),
    configured: adsConfigured(),
    conversionActionId: conversionActionForPhase(phase),
  })
}

/**
 * Zet de conversie van dit dossier voor deze fase klaar (of werkt de status
 * bij wanneer hij er al staat). Nooit twee regels voor dezelfde fase.
 */
export async function enqueueAdsConversion(
  leadId: string,
  phase: ConversionPhase = 'job_completed',
): Promise<{ status: OutboxStatus; phase: ConversionPhase }> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const { data, error } = await supabaseAdmin.from('leads').select(LEAD_FIELDS).eq('id', leadId).maybeSingle()
  if (error) throw new Error(error.message)
  const lead = data as LeadRow | null
  if (!lead) throw new Error('Lead niet gevonden')

  const status = eligibilityFor(lead, phase)
  const actionId = conversionActionForPhase(phase) ?? 'unconfigured'
  const eventTime = phaseEventTime(lead, phase)

  const existing = await supabaseAdmin
    .from('ads_conversion_outbox')
    .select('id, status, event_time')
    .eq('lead_id', leadId)
    .eq('phase', phase)
    .eq('account_id', ADS_ACCOUNT_ID)
    .maybeSingle()

  const row = existing.data as { id: string; status: string; event_time: string } | null

  if (row) {
    // Een al ingediende of verwerkte conversie nooit opnieuw klaarzetten.
    if (['submitted', 'processed', 'processing_unknown'].includes(row.status)) {
      return { status: row.status as OutboxStatus, phase }
    }
    await supabaseAdmin
      .from('ads_conversion_outbox')
      .update({
        status,
        conversion_action_id: actionId,
        gclid: lead.gclid,
        gbraid: lead.gbraid,
        wbraid: lead.wbraid,
        evidence: lead.ad_click_evidence,
        consent_ad_user_data: lead.ad_consent_ad_user_data,
        value_cents: lead.customer_price_cents,
        is_test: Boolean(lead.is_test),
        // Oorspronkelijk tijdstip van de fase behouden.
        event_time: row.event_time ?? eventTime,
        next_attempt_at: new Date().toISOString(),
      })
      .eq('id', row.id)
    return { status, phase }
  }

  await supabaseAdmin.from('ads_conversion_outbox').insert({
    lead_id: leadId,
    phase,
    account_id: ADS_ACCOUNT_ID,
    conversion_action_id: actionId,
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
  return { status, phase }
}

/** Fase "aanvraag ontvangen": meteen bij het vastleggen van de aanvraag. */
export async function enqueueRequestReceived(leadId: string) {
  return enqueueAdsConversion(leadId, 'request_received')
}

/** Fase "aanvraag gekwalificeerd": zodra een monteur de klus aanneemt. */
export async function enqueueRequestQualified(leadId: string) {
  return enqueueAdsConversion(leadId, 'request_qualified')
}

/** Zet de conversie klaar zodra een dossier is afgerond; stil bij andere uitkomsten. */
export async function enqueueIfCompleted(leadId: string) {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const { data } = await supabaseAdmin.from('leads').select('outcome').eq('id', leadId).maybeSingle()
  if ((data as { outcome: string | null } | null)?.outcome !== 'done') return null
  return enqueueAdsConversion(leadId, 'job_completed')
}

/**
 * Zet alle fasen bij die inmiddels van toepassing zijn. Handig na het koppelen
 * van een advertentieklik aan een ouder dossier: de eerdere fasen krijgen dan
 * alsnog hun eigen gebeurtenis, elk met het eigen tijdstip.
 */
export async function enqueueApplicablePhases(leadId: string) {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const { data } = await supabaseAdmin.from('leads').select(LEAD_FIELDS).eq('id', leadId).maybeSingle()
  const lead = data as LeadRow | null
  if (!lead) return []
  const phases: ConversionPhase[] = ['request_received']
  if (lead.claimed_at) phases.push('request_qualified')
  if (lead.outcome === 'done') phases.push('job_completed')
  const out: { phase: ConversionPhase; status: OutboxStatus }[] = []
  for (const phase of phases) {
    const result = await enqueueAdsConversion(leadId, phase)
    out.push({ phase, status: result.status })
  }
  return out
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

const OUTBOX_FIELDS =
  'id, lead_id, phase, status, event_time, value_cents, gclid, gbraid, wbraid, consent_ad_user_data, attempts'

/**
 * Verzendt de openstaande conversies. Draait vanuit de beveiligde
 * achtergrondtaak; nooit als losse fetch tijdens een gebruikersrequest.
 *
 * Gelijktijdigheid: elke regel wordt eerst geclaimd met een voorwaardelijke
 * update op de status en het pogingsnummer. Een tweede run die dezelfde regel
 * oppakt claimt niets meer en slaat hem over — dus nooit twee indieningen.
 */
export async function processAdsOutbox(limit = 20) {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

  if (!adsExportEnabled()) {
    return { processed: 0, submitted: 0, failed: 0, skipped: 'export_disabled' as const, blocked: 0 }
  }

  const { data, error } = await supabaseAdmin
    .from('ads_conversion_outbox')
    .select(OUTBOX_FIELDS)
    .in('status', ['pending', 'failed_temporary'])
    .lte('next_attempt_at', new Date().toISOString())
    .order('next_attempt_at', { ascending: true })
    .limit(limit)
  if (error) throw new Error(error.message)

  let submitted = 0
  let failed = 0
  let blocked = 0
  const rows = (data ?? []) as OutboxRow[]

  for (const row of rows) {
    if (!isRetryable(row.status as OutboxStatus)) continue
    const phase = row.phase as ConversionPhase
    const attempts = row.attempts + 1

    // 1. Claim: alleen wie de regel in deze staat aantreft, mag verzenden.
    const claim = await supabaseAdmin
      .from('ads_conversion_outbox')
      .update({
        attempts,
        last_attempt_at: new Date().toISOString(),
        next_attempt_at: new Date(Date.now() + nextAttemptDelayMs(attempts)).toISOString(),
      })
      .eq('id', row.id)
      .eq('status', row.status)
      .eq('attempts', row.attempts)
      .select('id')
      .maybeSingle()
    if (!claim.data) continue

    // 2. Toestemming en bewijs opnieuw lezen: een latere intrekking telt.
    const leadRead = await supabaseAdmin.from('leads').select(LEAD_FIELDS).eq('id', row.lead_id).maybeSingle()
    const lead = leadRead.data as LeadRow | null
    const current = lead ? eligibilityFor(lead, phase) : 'skipped_no_click'
    if (current !== 'pending') {
      blocked += 1
      await supabaseAdmin
        .from('ads_conversion_outbox')
        .update({ status: current, last_error: null })
        .eq('id', row.id)
      continue
    }

    const result = await uploadOfflineConversion({
      leadId: row.lead_id,
      phase,
      conversionActionId: conversionActionForPhase(phase)!,
      gclid: lead!.gclid,
      gbraid: lead!.gbraid,
      wbraid: lead!.wbraid,
      eventTime: row.event_time,
      valueCents: row.value_cents,
      consentAdUserData: lead!.ad_consent_ad_user_data === 'granted' ? 'granted' : 'denied',
    })

    let status = result.status
    if (status === 'failed_temporary' && attempts >= MAX_ATTEMPTS) status = 'failed_permanent'
    if (status === 'submitted' || status === 'processing_unknown') submitted += 1
    if (status === 'failed_temporary' || status === 'failed_permanent') failed += 1

    const update = await supabaseAdmin
      .from('ads_conversion_outbox')
      .update({
        status,
        submitted_at:
          status === 'submitted' || status === 'processing_unknown' ? new Date().toISOString() : null,
        request_id: result.requestId,
        warnings: (result.warnings ?? null) as never,
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

  return { processed: rows.length, submitted, failed, blocked, skipped: null }
}

export type ExportPreviewRow = {
  id: string
  leadId: string
  leadRef: number | null
  customerName: string | null
  phase: ConversionPhase
  phaseLabel: string
  eventTime: string
  status: OutboxStatus
  evidence: string | null
  consent: string | null
  destination: string
  attempts: number
  lastError: string | null
  requestId: string | null
  submittedAt: string | null
}

/**
 * Proefoverzicht: wat zou er verzonden worden als de export aan gaat, en wat
 * blijft geblokkeerd en waarom. Leest alleen; verzendt niets.
 */
export async function listAdsExportQueue(limit = 200): Promise<{
  exportEnabled: boolean
  configured: boolean
  rows: ExportPreviewRow[]
}> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const { data, error } = await supabaseAdmin
    .from('ads_conversion_outbox')
    .select(
      'id, lead_id, phase, status, event_time, evidence, consent_ad_user_data, conversion_action_id, attempts, last_error, request_id, submitted_at, leads:lead_id(ref_number, customer_name)',
    )
    .order('event_time', { ascending: false })
    .limit(limit)
  if (error) throw new Error(error.message)

  const rows = ((data ?? []) as any[]).map((row): ExportPreviewRow => {
    const lead = Array.isArray(row.leads) ? row.leads[0] : row.leads
    const phase = row.phase as ConversionPhase
    return {
      id: row.id,
      leadId: row.lead_id,
      leadRef: lead?.ref_number ?? null,
      customerName: lead?.customer_name ?? null,
      phase,
      phaseLabel: PHASE_LABEL[phase] ?? row.phase,
      eventTime: row.event_time,
      status: row.status as OutboxStatus,
      evidence: row.evidence ?? null,
      consent: row.consent_ad_user_data ?? null,
      destination:
        row.conversion_action_id && row.conversion_action_id !== 'unconfigured'
          ? 'Google Ads · conversieactie ingesteld'
          : 'Nog geen conversieactie voor deze fase',
      attempts: row.attempts ?? 0,
      lastError: row.last_error ?? null,
      requestId: row.request_id ?? null,
      submittedAt: row.submitted_at ?? null,
    }
  })

  return { exportEnabled: adsExportEnabled(), configured: adsConfigured(), rows }
}

/**
 * Herstelt een definitief mislukte gebeurtenis: pogingen terug op nul en
 * opnieuw beoordelen. Alleen voor definitief mislukte regels — een ingediende
 * of nog lopende indiening sturen we nooit uit onszelf opnieuw.
 */
export async function resetFailedAdsExport(id: string): Promise<{ ok: boolean; status: OutboxStatus | null }> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const { data } = await supabaseAdmin
    .from('ads_conversion_outbox')
    .select('id, lead_id, phase, status')
    .eq('id', id)
    .maybeSingle()
  const row = data as { id: string; lead_id: string; phase: string; status: string } | null
  if (!row || row.status !== 'failed_permanent') return { ok: false, status: null }
  await supabaseAdmin
    .from('ads_conversion_outbox')
    .update({ status: 'pending', attempts: 0, last_error: null, next_attempt_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'failed_permanent')
  const again = await enqueueAdsConversion(row.lead_id, row.phase as ConversionPhase)
  return { ok: true, status: again.status }
}

/**
 * Compatibele ingang voor bestaande aanroepen: zet de conversie klaar en meldt
 * de status terug. Verzendt zelf niets meer.
 */
export async function reportLeadToGoogleAds(
  leadId: string,
  opts: { force?: boolean; phase?: ConversionPhase } = {},
) {
  const phase = opts.phase ?? 'job_completed'
  const result = await enqueueAdsConversion(leadId, phase)
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  if (opts.force && result.status === 'pending') {
    await supabaseAdmin
      .from('ads_conversion_outbox')
      .update({ next_attempt_at: new Date().toISOString(), status: 'pending' })
      .eq('lead_id', leadId)
      .eq('phase', phase)
  }
  await supabaseAdmin.from('leads').update({ ads_upload_status: result.status }).eq('id', leadId)
  return { status: result.status, error: null as string | null }
}
