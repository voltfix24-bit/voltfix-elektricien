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
  inFlightRecoveryDecision,
  isRetryable,
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
  eventSourceForLead,
  uploadOfflineConversion,
} from './ads-offline.server'

type LeadRow = {
  id: string
  source: string | null
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
  'id, source, gclid, gbraid, wbraid, is_test, customer_price_cents, outcome, outcome_at, created_at, claimed_at, qualified_at, disqualified_at, ad_click_evidence, ad_consent_ad_user_data'

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

/**
 * Geldt de grond onder deze gebeurtenis nog steeds? Een beoordeling die wordt
 * teruggedraaid vóór verzending maakt de gebeurtenis ongeldig; die mag dan niet
 * alsnog als gekwalificeerde aanvraag naar Google. Dit is een correctie van een
 * eerdere beoordeling — géén latere bedrijfsuitkomst zoals "klant haakte af".
 */
export function phaseStillValid(lead: LeadRow, phase: ConversionPhase): boolean {
  if (phase === 'request_qualified') return Boolean(lead.qualified_at) && !lead.disqualified_at
  if (phase === 'job_accepted') return Boolean(lead.claimed_at)
  if (phase === 'job_completed') return lead.outcome === 'done' && Boolean(lead.outcome_at)
  return Boolean(lead.created_at)
}

function eligibilityFor(lead: LeadRow, phase: ConversionPhase): OutboxStatus {
  if (!phaseStillValid(lead, phase)) return 'phase_reverted'
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

/** Statussen die niet meer mogen veranderen zonder expliciete correctie. */
const TERMINAL_STATUSES = ['submitted', 'processed', 'processing_unknown', 'in_flight']

/**
 * Statussen die wél opnieuw beoordeeld mogen worden: alles wat nog niet de
 * deur uit is. Zo komen gebeurtenissen die ooit strandden op een ontbrekende
 * configuratie of een uitgeschakelde export vanzelf weer in aanmerking zodra
 * dat is opgelost — zonder dat het een poging kost.
 */
export const REVALIDATE_STATUSES = [
  'export_disabled',
  'config_missing',
  'blocked_consent',
  'no_evidence',
  'skipped_no_click',
  'phase_reverted',
]

/**
 * Zet de conversie van dit dossier voor deze fase klaar (of werkt de status
 * bij wanneer hij er al staat). Nooit twee regels voor dezelfde fase.
 */
export async function enqueueAdsConversion(
  leadId: string,
  phase: ConversionPhase = 'job_completed',
): Promise<{ status: OutboxStatus; phase: ConversionPhase; skipped?: 'phase_not_reached' }> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const { data, error } = await supabaseAdmin.from('leads').select(LEAD_FIELDS).eq('id', leadId).maybeSingle()
  if (error) throw new Error(error.message)
  const lead = data as LeadRow | null
  if (!lead) throw new Error('Lead niet gevonden')

  // Geen tijdstip betekent: deze fase heeft nog niet plaatsgevonden. We
  // verzinnen dan geen moment ("nu") maar zetten simpelweg niets klaar.
  const eventTime = phaseEventTime(lead, phase)
  if (!eventTime) return { status: 'skipped_no_click', phase, skipped: 'phase_not_reached' }

  const status = eligibilityFor(lead, phase)
  const actionId = conversionActionForPhase(phase) ?? 'unconfigured'

  const existing = await supabaseAdmin
    .from('ads_conversion_outbox')
    .select('id, status, event_time')
    .eq('lead_id', leadId)
    .eq('phase', phase)
    .eq('account_id', ADS_ACCOUNT_ID)
    .maybeSingle()
  // Een leesfout hier mag nooit als "niets gevonden" doorgaan: dan zouden we
  // een tweede regel voor dezelfde fase aanmaken.
  if (existing.error) throw new Error(existing.error.message)

  const row = existing.data as { id: string; status: string; event_time: string } | null

  if (row) {
    // Een al ingediende, lopende of verwerkte conversie nooit opnieuw
    // klaarzetten: die zou dan een tweede keer de deur uit kunnen gaan.
    if (TERMINAL_STATUSES.includes(row.status)) {
      return { status: row.status as OutboxStatus, phase }
    }
    const updated = await supabaseAdmin
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
      .select('id')
      .maybeSingle()
    // Stil falen is hier het gevaar: dan meldt deze functie "klaargezet"
    // terwijl er niets is opgeslagen.
    if (updated.error) throw new Error(updated.error.message)
    if (!updated.data) throw new Error('Conversiegebeurtenis kon niet worden bijgewerkt')
    return { status, phase }
  }

  const inserted = await supabaseAdmin
    .from('ads_conversion_outbox')
    .insert({
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
      // Waarop deze gebeurtenis berust; wordt later nooit herschreven.
      phase_source: PHASE_SOURCE[phase] as PhaseSource,
    })
    .select('id')
    .maybeSingle()
  if (inserted.error) {
    // Twee gelijktijdige aanroepen voor dezelfde fase: de database weigert de
    // tweede. Dat is precies de bedoeling en geen verlies.
    if ((inserted.error as { code?: string }).code === '23505') return { status, phase }
    throw new Error(inserted.error.message)
  }
  if (!inserted.data) throw new Error('Conversiegebeurtenis kon niet worden opgeslagen')
  return { status, phase }
}

/**
 * Beoordeelt wachtende, geblokkeerde gebeurtenissen opnieuw — zonder te
 * verzenden en zonder een poging te verbruiken. Nodig omdat een gebeurtenis
 * anders voor altijd blijft hangen op "export staat uit" of "configuratie
 * ontbreekt", ook nadat dat is opgelost.
 *
 * Al ingediende gebeurtenissen blijven onaangeroerd.
 */
export async function revalidateBlockedAdsExports(limit = 200): Promise<{
  checked: number
  released: number
  changed: { id: string; from: OutboxStatus; to: OutboxStatus }[]
}> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const { data, error } = await supabaseAdmin
    .from('ads_conversion_outbox')
    .select('id, lead_id, phase, status')
    .in('status', REVALIDATE_STATUSES)
    .limit(limit)
  if (error) throw new Error(error.message)

  const rows = (data ?? []) as { id: string; lead_id: string; phase: string; status: string }[]
  const changed: { id: string; from: OutboxStatus; to: OutboxStatus }[] = []
  let released = 0

  for (const row of rows) {
    const leadRead = await supabaseAdmin.from('leads').select(LEAD_FIELDS).eq('id', row.lead_id).maybeSingle()
    if (leadRead.error) continue
    const lead = leadRead.data as LeadRow | null
    if (!lead) continue
    const phase = row.phase as ConversionPhase
    const next = eligibilityFor(lead, phase)
    if (next === row.status) continue
    const upd = await supabaseAdmin
      .from('ads_conversion_outbox')
      .update({
        status: next,
        conversion_action_id: conversionActionForPhase(phase) ?? 'unconfigured',
        consent_ad_user_data: lead.ad_consent_ad_user_data,
        evidence: lead.ad_click_evidence,
        next_attempt_at: new Date().toISOString(),
      })
      .eq('id', row.id)
      // Alleen wanneer de regel nog in dezelfde stand staat: een nieuwere
      // claim mag nooit door deze ronde worden overschreven.
      .eq('status', row.status)
      .select('id')
      .maybeSingle()
    if (upd.data) {
      changed.push({ id: row.id, from: row.status as OutboxStatus, to: next })
      if (next === 'pending') released += 1
    }
  }

  return { checked: rows.length, released, changed }
}

/**
 * Draait de beoordeling terug: een aanvraag die vóór verzending wordt
 * afgekeurd, mag niet alsnog als gekwalificeerd naar Google. De gebeurtenis
 * verdwijnt niet — hij blijft staan als "vervallen", met zijn oorspronkelijke
 * tijdstip en herkomst, zodat de geschiedenis leesbaar blijft.
 *
 * Al ingediende gebeurtenissen blijven staan zoals ze zijn: die vragen een
 * expliciete correctie bij Google, geen nieuwe conversie met een andere naam.
 */
export async function cancelRevertedPhase(
  leadId: string,
  phase: ConversionPhase,
  reason = 'Beoordeling teruggedraaid vóór verzending.',
): Promise<{ cancelled: boolean; alreadySubmitted: boolean }> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const { data, error } = await supabaseAdmin
    .from('ads_conversion_outbox')
    .select('id, status')
    .eq('lead_id', leadId)
    .eq('phase', phase)
    .eq('account_id', ADS_ACCOUNT_ID)
    .maybeSingle()
  if (error) throw new Error(error.message)
  const row = data as { id: string; status: string } | null
  if (!row) return { cancelled: false, alreadySubmitted: false }
  if (TERMINAL_STATUSES.includes(row.status) || row.status === 'processed') {
    return { cancelled: false, alreadySubmitted: true }
  }
  const upd = await supabaseAdmin
    .from('ads_conversion_outbox')
    .update({ status: 'phase_reverted', last_error: reason })
    .eq('id', row.id)
    .eq('status', row.status)
    .select('id')
    .maybeSingle()
  if (upd.error) throw new Error(upd.error.message)
  return { cancelled: Boolean(upd.data), alreadySubmitted: false }
}

/**
 * Vult ontbrekende fasegebeurtenissen aan. Is het klaarzetten ooit mislukt
 * (databasefout, afgebroken verzoek), dan staat het dossier er wel maar de
 * gebeurtenis niet. Deze herstelronde is idempotent: bestaande regels blijven
 * zoals ze zijn en er wordt nooit een tijdstip verzonnen — een fase zonder
 * vastgelegd moment wordt overgeslagen.
 */
export async function reconcileAdsOutbox(sinceDays = 30, limit = 200): Promise<{
  checked: number
  created: number
}> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const since = new Date(Date.now() - sinceDays * 86_400_000).toISOString()
  const { data, error } = await supabaseAdmin
    .from('leads')
    .select(LEAD_FIELDS)
    .gte('created_at', since)
    .or('gclid.not.is.null,gbraid.not.is.null,wbraid.not.is.null')
    .limit(limit)
  if (error) throw new Error(error.message)

  const leads = (data ?? []) as LeadRow[]
  let created = 0
  for (const lead of leads) {
    if (lead.is_test) continue
    const phases: ConversionPhase[] = ['request_received']
    if (lead.qualified_at && !lead.disqualified_at) phases.push('request_qualified')
    if (lead.claimed_at) phases.push('job_accepted')
    if (lead.outcome === 'done' && lead.outcome_at) phases.push('job_completed')

    const known = await supabaseAdmin
      .from('ads_conversion_outbox')
      .select('phase')
      .eq('lead_id', lead.id)
      .eq('account_id', ADS_ACCOUNT_ID)
    if (known.error) continue
    const have = new Set(((known.data ?? []) as { phase: string }[]).map((r) => r.phase))

    for (const phase of phases) {
      if (have.has(phase)) continue
      if (!phaseEventTime(lead, phase)) continue
      try {
        await enqueueAdsConversion(lead.id, phase)
        created += 1
      } catch (err) {
        console.error('Ontbrekende conversiegebeurtenis aanvullen mislukt', lead.id, phase, err)
      }
    }
  }
  return { checked: leads.length, created }
}

/** Fase "aanvraag ontvangen": meteen bij het vastleggen van de aanvraag. */
export async function enqueueRequestReceived(leadId: string) {
  return enqueueAdsConversion(leadId, 'request_received')
}

/**
 * Fase "aanvraag gekwalificeerd": pas nadat de aanvraag expliciet is beoordeeld
 * als echte, bereikbare klant met een passende klus binnen het werkgebied,
 * zonder spam of dubbel dossier. Dit is uitdrukkelijk NIET het aannemen door
 * een monteur.
 */
export async function enqueueRequestQualified(leadId: string) {
  return enqueueAdsConversion(leadId, 'request_qualified')
}

/** Fase "klus aangenomen": een monteur heeft de klus geclaimd. */
export async function enqueueJobAccepted(leadId: string) {
  return enqueueAdsConversion(leadId, 'job_accepted')
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
  // Alleen fasen die aantoonbaar hebben plaatsgevonden, elk op eigen grond.
  if (lead.qualified_at) phases.push('request_qualified')
  if (lead.claimed_at) phases.push('job_accepted')
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
  inflight_since: string | null
  recovered_count: number | null
  /** De bevroren verzendgegevens: vanaf de eerste poging onveranderlijk. */
  conversion_action_id: string | null
  event_source: string | null
  currency: string | null
  payload_frozen_at: string | null
}

const OUTBOX_FIELDS =
  'id, lead_id, phase, status, event_time, value_cents, gclid, gbraid, wbraid, consent_ad_user_data, attempts, inflight_since, recovered_count, conversion_action_id, event_source, currency, payload_frozen_at'

export const DEFAULT_CURRENCY = 'EUR'

/**
 * De verzending die bij deze regel hoort — precies één keer vastgelegd.
 *
 * Waarom dit moet: bestemming, bedrag, valuta en bron zijn onderdeel van wat
 * Google als één gebeurtenis ziet. Wie die bij een tweede poging opnieuw uit
 * de instellingen leest, kan halverwege een andere conversieactie of een ander
 * bedrag sturen — en dan is het geen herhaling meer maar een nieuwe conversie.
 * Vanaf de eerste poging staat alles daarom vast.
 */
export function frozenPayloadFor(
  row: OutboxRow,
  lead: LeadRow,
  phase: ConversionPhase,
): {
  conversionActionId: string
  eventSource: string
  currency: string
  valueCents: number | null
} {
  return {
    conversionActionId: row.payload_frozen_at
      ? (row.conversion_action_id ?? '')
      : (conversionActionForPhase(phase) ?? ''),
    eventSource: row.payload_frozen_at ? (row.event_source ?? 'OTHER') : eventSourceForLead(lead.source),
    currency: row.currency ?? DEFAULT_CURRENCY,
    valueCents: row.value_cents,
  }
}

/**
 * Verzendt de openstaande conversies. Draait vanuit de beveiligde
 * achtergrondtaak; nooit als losse fetch tijdens een gebruikersrequest.
 *
 * Gelijktijdigheid: elke regel wordt eerst geclaimd met een voorwaardelijke
 * update op status én pogingsnummer. Een tweede run die dezelfde regel oppakt
 * claimt niets meer en slaat hem over — dus nooit twee indieningen.
 *
 * Uitval halverwege: de regel staat vóór het verzenden op "onderweg". Crasht
 * het proces daarna, dan blijft die stand staan en pakt een latere ronde hem
 * opnieuw op. Omdat de transactie-identiteit (dossier + fase) en het
 * gebeurtenistijdstip onveranderlijk zijn, ziet Google exact dezelfde
 * gebeurtenis en telt die niet dubbel.
 */
export async function processAdsOutbox(limit = 20) {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

  // Ontbrekende gebeurtenissen aanvullen en geblokkeerde opnieuw beoordelen.
  // Dit verzendt niets en kost geen poging, maar zorgt er wel voor dat een
  // gebeurtenis die ooit strandde op een ontbrekende instelling weer meedoet
  // zodra die instelling er is.
  const reconciled = await reconcileAdsOutbox().catch((err) => {
    console.error('Aanvullen van ontbrekende conversiegebeurtenissen mislukt', err)
    return { checked: 0, created: 0 }
  })
  const revalidated = await revalidateBlockedAdsExports().catch((err) => {
    console.error('Opnieuw beoordelen van geblokkeerde conversies mislukt', err)
    return { checked: 0, released: 0, changed: [] }
  })

  if (!adsExportEnabled()) {
    return {
      processed: 0,
      submitted: 0,
      failed: 0,
      skipped: 'export_disabled' as const,
      blocked: 0,
      recovered: 0,
      abandoned: 0,
      reconciled: reconciled.created,
      revalidated: revalidated.released,
    }
  }

  const nowIso = new Date().toISOString()

  // Blijven hangen verzendingen terughalen voordat we nieuwe oppakken.
  const stale = await supabaseAdmin
    .from('ads_conversion_outbox')
    .select('id, attempts, inflight_since, recovered_count')
    .eq('status', 'in_flight')
    .limit(limit)
  let recovered = 0
  let abandoned = 0
  for (const row of (stale.data ?? []) as OutboxRow[]) {
    const decision = inFlightRecoveryDecision({
      inflightSince: row.inflight_since,
      attempts: row.attempts ?? 0,
      recoveredCount: row.recovered_count ?? 0,
    })
    if (decision === 'wait') continue
    // Begrensd herstel: is het pogingsbudget op of hebben we deze onzekere
    // verzending al te vaak teruggehaald, dan komt er geen extra poging bij.
    // De gebeurtenis blijft staan met dezelfde identiteit en hetzelfde
    // tijdstip, zichtbaar voor een handmatige beoordeling.
    const patch =
      decision === 'give_up'
        ? {
            status: 'failed_permanent',
            inflight_since: null,
            last_error:
              'Verzending afgebroken vóór bevestiging en het herstelbudget is op. Mogelijk heeft Google de gebeurtenis al ontvangen: eerst controleren, daarna eventueel met de hand vrijgeven.',
          }
        : {
            status: 'failed_temporary',
            inflight_since: null,
            recovered_count: (row.recovered_count ?? 0) + 1,
            last_error:
              'Verzending afgebroken vóór bevestiging; opnieuw geprobeerd met exact dezelfde gebeurtenis.',
            next_attempt_at: nowIso,
          }
    const back = await supabaseAdmin
      .from('ads_conversion_outbox')
      .update(patch)
      .eq('id', row.id)
      .eq('status', 'in_flight')
      // Een nieuwere claim heeft het pogingsnummer al verhoogd: die mag deze
      // oudere ronde nooit overschrijven.
      .eq('attempts', row.attempts)
      .select('id')
      .maybeSingle()
    if (back.data) {
      if (decision === 'give_up') abandoned += 1
      else recovered += 1
    }
  }

  const { data, error } = await supabaseAdmin
    .from('ads_conversion_outbox')
    .select(OUTBOX_FIELDS)
    .in('status', ['pending', 'failed_temporary'])
    .lte('next_attempt_at', nowIso)
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

    // 1. Toestemming en bewijs opnieuw lezen vóór de claim: een latere
    //    intrekking of een ontbrekende configuratie mag geen poging kosten.
    const leadRead = await supabaseAdmin.from('leads').select(LEAD_FIELDS).eq('id', row.lead_id).maybeSingle()
    const lead = leadRead.data as LeadRow | null
    const current = lead ? eligibilityFor(lead, phase) : 'skipped_no_click'
    if (current !== 'pending') {
      blocked += 1
      await supabaseAdmin
        .from('ads_conversion_outbox')
        .update({ status: current, last_error: null, inflight_since: null })
        .eq('id', row.id)
        .eq('status', row.status)
      continue
    }

    // 2. Claim: alleen wie de regel in deze staat aantreft, mag verzenden.
    //    Het pogingsnummer gaat pas hier omhoog — bij een echte verzendpoging.
    const attempts = row.attempts + 1
    const claim = await supabaseAdmin
      .from('ads_conversion_outbox')
      .update({
        status: 'in_flight',
        inflight_since: new Date().toISOString(),
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

    const result = await uploadOfflineConversion({
      leadId: row.lead_id,
      phase,
      conversionActionId: conversionActionForPhase(phase)!,
      // Onveranderlijk tijdens herstel: dezelfde bestemming, dezelfde klik en
      // hetzelfde tijdstip als bij de eerste poging.
      gclid: row.gclid,
      gbraid: row.gbraid,
      wbraid: row.wbraid,
      eventTime: row.event_time,
      valueCents: row.value_cents,
      consentAdUserData: lead!.ad_consent_ad_user_data === 'granted' ? 'granted' : 'denied',
      // Waar de gebeurtenis plaatsvond, volgens het contract van Google.
      eventSource: eventSourceForLead(lead!.source),
    })

    let status = result.status
    if (status === 'failed_temporary' && attempts >= MAX_ATTEMPTS) status = 'failed_permanent'
    if (status === 'submitted' || status === 'processing_unknown') submitted += 1
    if (status === 'failed_temporary' || status === 'failed_permanent') failed += 1

    const update = await supabaseAdmin
      .from('ads_conversion_outbox')
      .update({
        status,
        inflight_since: null,
        submitted_at:
          status === 'submitted' || status === 'processing_unknown' ? new Date().toISOString() : null,
        request_id: result.requestId,
        warnings: (result.warnings ?? null) as never,
        last_error: result.error,
      })
      .eq('id', row.id)
      // Alleen de eigen claim bijwerken: een nieuwere ronde met een hoger
      // pogingsnummer mag deze oudere uitkomst nooit onder zich krijgen.
      .eq('attempts', attempts)
      .eq('status', 'in_flight')
    if (update.error) {
      // Een mislukte statusupdate is een echt probleem: de regel blijft dan op
      // "onderweg" staan en wordt later hersteld — met dezelfde identiteit.
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

  return {
    processed: rows.length,
    submitted,
    failed,
    blocked,
    recovered,
    abandoned,
    reconciled: reconciled.created,
    revalidated: revalidated.released,
    skipped: null,
  }
}

export type ExportPreviewRow = {
  id: string
  leadId: string
  leadRef: number | null
  customerName: string | null
  phase: ConversionPhase
  phaseLabel: string
  /** Waarop deze gebeurtenis berust; vastgelegd bij het aanmaken. */
  phaseSource: string | null
  eventTime: string
  /** Hoe vaak deze gebeurtenis na een afgebroken verzending is hersteld. */
  recoveredCount: number
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
      'id, lead_id, phase, phase_source, status, event_time, evidence, consent_ad_user_data, conversion_action_id, attempts, recovered_count, last_error, request_id, submitted_at, leads:lead_id(ref_number, customer_name)',
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
      phaseSource: row.phase_source
        ? (PHASE_SOURCE_LABEL[row.phase_source as PhaseSource] ?? row.phase_source)
        : null,
      eventTime: row.event_time,
      recoveredCount: row.recovered_count ?? 0,
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
