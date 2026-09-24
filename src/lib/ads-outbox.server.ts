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
  consent_visitor_hash?: string | null
}

const LEAD_FIELDS =
  '*'

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

async function consentCheckedEligibility(db: any, lead: LeadRow, phase: ConversionPhase): Promise<OutboxStatus> {
  const { authoritativeConsent } = await import('./ads-consent.server')
  try {
    const consent = await authoritativeConsent(db, lead)
    return eligibilityFor({ ...lead, ad_consent_ad_user_data: consent }, phase)
  } catch {
    return 'blocked_consent'
  }
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
 * Statussen die met de hand opnieuw aangeboden mogen worden. Bewust zonder
 * "onderweg" en zonder "ingediend": een regel die al bij Google ligt mag nooit
 * opnieuw vertrekken.
 */
export const REOPENABLE_STATUSES = [...REVALIDATE_STATUSES, 'pending', 'failed_temporary', 'failed_permanent']

/**
 * Valt deze gebeurtenis buiten de goedgekeurde meetperiode, of hoort hij bij
 * een dossier dat als historisch is afgesloten? Dan gaat hij nooit vanzelf de
 * deur uit. Een recente fase van een oud dossier maakt dat niet anders.
 */
export async function isHistoricalEvent(
  supabaseAdmin: any,
  leadId: string,
  eventTime: string,
): Promise<boolean> {
  if (await isLegacyLead(supabaseAdmin, leadId)) return true
  const floor = await adsHistoryFloor(supabaseAdmin)
  return eventTime < floor
}

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

  // Historisch beleid als centrale poort: deze functie is de enige plek waar
  // gebeurtenissen ontstaan of opnieuw worden klaargezet, dus hier hoort de
  // grens te liggen. Elke ingang — beheerder, herstelronde, koppelen achteraf —
  // valt daarmee onder hetzelfde beleid.
  const historical = await isHistoricalEvent(supabaseAdmin, leadId, eventTime)
  const status = historical ? ('skipped_historical' as OutboxStatus) : await consentCheckedEligibility(supabaseAdmin, lead, phase)
  const actionId = conversionActionForPhase(phase) ?? 'unconfigured'

  const existing = await supabaseAdmin
    .from('ads_conversion_outbox')
    .select('id, status, event_time, attempts, payload_frozen_at')
    .eq('lead_id', leadId)
    .eq('phase', phase)
    .eq('account_id', ADS_ACCOUNT_ID)
    .maybeSingle()
  // Een leesfout hier mag nooit als "niets gevonden" doorgaan: dan zouden we
  // een tweede regel voor dezelfde fase aanmaken.
  if (existing.error) throw new Error(existing.error.message)

  const row = existing.data as {
    id: string
    status: string
    event_time: string
    attempts: number | null
    payload_frozen_at: string | null
  } | null

  if (row) {
    // Een al ingediende, lopende of verwerkte conversie nooit opnieuw
    // klaarzetten: die zou dan een tweede keer de deur uit kunnen gaan.
    if (TERMINAL_STATUSES.includes(row.status)) {
      return { status: row.status as OutboxStatus, phase }
    }
    // Is er ooit een poging gedaan, dan ligt de verzending vast. Bestemming,
    // klik-id en bedrag mogen dan niet meer meebewegen: dat zou van een
    // herhaling een nieuwe conversie maken en de bewaking op een gewijzigde
    // bestemming omzeilen. Alleen de beoordeling zelf wordt bijgewerkt.
    const snapshot = row.payload_frozen_at
      ? {}
      : {
          conversion_action_id: actionId,
          gclid: lead.gclid,
          gbraid: lead.gbraid,
          wbraid: lead.wbraid,
          value_cents: lead.customer_price_cents,
          is_test: Boolean(lead.is_test),
        }
    const updated = await supabaseAdmin
      .from('ads_conversion_outbox')
      .update({
        status,
        ...snapshot,
        evidence: lead.ad_click_evidence,
        consent_ad_user_data: lead.ad_consent_ad_user_data,
        // Oorspronkelijk tijdstip van de fase behouden.
        event_time: row.event_time ?? eventTime,
        next_attempt_at: new Date().toISOString(),
      })
      .eq('id', row.id)
      // Voorwaardelijk op stand én pogingsnummer: een verzending die
      // ondertussen is geclaimd of afgerond mag deze update nooit terugzetten
      // naar "wachtend".
      .eq('status', row.status)
      .eq('attempts', row.attempts ?? 0)
      .select('id')
      .maybeSingle()
    // Stil falen is hier het gevaar: dan meldt deze functie "klaargezet"
    // terwijl er niets is opgeslagen.
    if (updated.error) throw new Error(updated.error.message)
    if (!updated.data) {
      // Een andere ronde was ons voor. Niet overschrijven, maar melden wat er
      // nu werkelijk staat.
      const again = await supabaseAdmin
        .from('ads_conversion_outbox')
        .select('status')
        .eq('id', row.id)
        .maybeSingle()
      const now = (again.data as { status: string } | null)?.status
      if (now) return { status: now as OutboxStatus, phase }
      throw new Error('Conversiegebeurtenis kon niet worden bijgewerkt')
    }
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
export async function revalidateBlockedAdsExports(limit = 200, pageSize = 200): Promise<{
  checked: number
  released: number
  changed: { id: string; from: OutboxStatus; to: OutboxStatus }[]
}> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const changed: { id: string; from: OutboxStatus; to: OutboxStatus }[] = []
  let released = 0
  let checked = 0
  // Doorlopen op oplopend rij-id, met een bladwijzer die de ronde overleeft.
  // Zonder die bladwijzer bleef deze ronde altijd op dezelfde eerste
  // tweehonderd regels hangen en kwam regel 201 nooit aan de beurt. Een
  // ongeldige of oude (datum)cursor telt niet mee: op een id-kolom is dat geen
  // geldige ondergrens.
  const mark = await supabaseAdmin
    .from('ads_worker_checkpoint')
    .select('cursor_value')
    .eq('name', REVALIDATE_CHECKPOINT)
    .maybeSingle()
  if (mark.error) throw new Error(mark.error.message)
  let after = asIdCursor((mark.data as { cursor_value: string | null } | null)?.cursor_value ?? null)
  let exhausted = false

  while (checked < limit) {
    const page = Math.min(pageSize, limit - checked)
    let query = supabaseAdmin
      .from('ads_conversion_outbox')
      .select('id, lead_id, phase, status, payload_frozen_at, attempts, event_time')
      .in('status', REVALIDATE_STATUSES)
    if (after) query = query.gt('id', after)
    const { data, error } = await query.order('id', { ascending: true }).limit(page)
    if (error) throw new Error(error.message)

    const rows = (data ?? []) as {
      id: string
      lead_id: string
      phase: string
      status: string
      payload_frozen_at: string | null
      attempts: number | null
      event_time: string
    }[]
    if (rows.length === 0) {
      exhausted = true
      break
    }
    checked += rows.length
    after = rows[rows.length - 1]!.id


    for (const row of rows) {
      const leadRead = await supabaseAdmin.from('leads').select(LEAD_FIELDS).eq('id', row.lead_id).maybeSingle()
      if (leadRead.error) continue
      const lead = leadRead.data as LeadRow | null
      if (!lead) continue
      const phase = row.phase as ConversionPhase
      // Stand vastleggen vóór het bijwerken: daarna vergelijken we met de
      // oorspronkelijke stand, niet met het resultaat.
      const before = row.status
      // Hetzelfde historische beleid als bij het klaarzetten: een bestaande
      // regel van vóór de grens komt niet alsnog in aanmerking, ook niet nadat
      // de export is ingeschakeld.
      const next = (await isHistoricalEvent(supabaseAdmin, row.lead_id, row.event_time))
        ? ('skipped_historical' as OutboxStatus)
        : await consentCheckedEligibility(supabaseAdmin, lead, phase)
      // Zolang er nog geen poging is gedaan, mag de momentopname mee-ademen met
      // het dossier — en dan wel volledig: bestemming, klik-id, bedrag en
      // testmarkering horen bij elkaar. Een halve verversing kon eerder een
      // gebeurtenis zonder advertentie-identifier klaarzetten. Is de
      // verzending eenmaal bevroren, dan blijft alles staan zoals het was.
      const snapshot = row.payload_frozen_at
        ? {}
        : {
            conversion_action_id: conversionActionForPhase(phase) ?? 'unconfigured',
            gclid: lead.gclid,
            gbraid: lead.gbraid,
            wbraid: lead.wbraid,
            value_cents: lead.customer_price_cents,
            is_test: Boolean(lead.is_test),
          }
      const sameSnapshot = row.payload_frozen_at != null
      if (next === before && sameSnapshot) continue
      let updateQuery = supabaseAdmin
        .from('ads_conversion_outbox')
        .update({
          status: next,
          ...snapshot,
          consent_ad_user_data: lead.ad_consent_ad_user_data,
          evidence: lead.ad_click_evidence,
          next_attempt_at: new Date().toISOString(),
        })
        .eq('id', row.id)
        // Alleen wanneer de regel nog in dezelfde stand staat én er intussen
        // geen poging is gedaan. Alleen op status vergelijken was niet genoeg:
        // een regel kan na een verzendpoging weer in dezelfde stand komen, en
        // dan zou deze verouderde ronde de inmiddels bevroren verzendgegevens
        // terugschrijven.
        .eq('status', before)
      if (typeof row.attempts === 'number') updateQuery = updateQuery.eq('attempts', row.attempts)
      // Zodra er ooit een poging is gedaan, blijven de verzendgegevens staan
      // zoals ze waren: dan mag deze ronde alleen nog de beoordeling bijwerken.
      if (!row.payload_frozen_at) updateQuery = updateQuery.is('payload_frozen_at', null)
      const upd = await updateQuery.select('id').maybeSingle()
      if (upd.error) throw new Error(upd.error.message)
      if (upd.data && next !== before) {
        changed.push({ id: row.id, from: before as OutboxStatus, to: next })
        if (next === 'pending') released += 1
      }
    }
    if (rows.length < page) {
      exhausted = true
      break
    }
  }

  // De bladwijzer opslaan: is de lijst uit, dan begint de volgende ronde weer
  // vooraan; anders gaat hij verder waar deze ronde stopte.
  await supabaseAdmin.from('ads_worker_checkpoint').upsert(
    {
      name: REVALIDATE_CHECKPOINT,
      cursor_value: exhausted ? null : after,
      updated_at: new Date().toISOString(),
    } as never,
    { onConflict: 'name' },
  )

  return { checked, released, changed }
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

/** Naam van het punt waar de herstelronde de vorige keer stopte. */
export const RECONCILE_CHECKPOINT = 'ads_reconcile_cursor'
/** Idem voor het opnieuw beoordelen van geblokkeerde regels. */
export const REVALIDATE_CHECKPOINT = 'ads_revalidate_cursor'
/** Het vastgelegde startmoment van de meting zelf. */
export const MEASUREMENT_START_CHECKPOINT = 'ads_measurement_start'

const TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T/

/**
 * Een bladwijzer is alleen bruikbaar als hij ook echt een rij-id is. Een lege
 * waarde of een tijdstip uit een vorige versie is dat niet: die zou de
 * vergelijking op een id-kolom ongeldig maken en de hele ronde laten
 * mislukken. In dat geval beginnen we gewoon vooraan.
 */
export function asIdCursor(value: string | null | undefined): string | null {
  const trimmed = (value ?? '').trim()
  if (!trimmed) return null
  if (TIMESTAMP_PATTERN.test(trimmed)) return null
  return trimmed
}

/**
 * Het historische beleid, op één plek.
 *
 * Twee dingen zijn hier bewust gescheiden. De meting is op een bepaald moment
 * in gebruik genomen; alles vanaf dat moment hoort erbij. Het alsnog
 * klaarzetten van oudere, historische gebeurtenissen is iets anders: dat is een
 * backfill, en die gaat pas lopen wanneer jij een startdatum hebt goedgekeurd.
 * "Dertig dagen terug" is geen bewijs dat de keten toen al gold, dus het
 * standaardvenster mag nooit verder terugkijken dan het vastgelegde startmoment.
 *
 * Deze grens geldt voor élke ingang die gebeurtenissen klaarzet, niet alleen
 * voor de herstelronde.
 */
export async function adsHistoryFloor(supabaseAdmin: any, sinceDays = 30): Promise<string> {
  const windowStart = new Date(Date.now() - sinceDays * 86_400_000).toISOString()
  const policy = await supabaseAdmin
    .from('ads_migration_policy')
    .select('backfill_start_at')
    .eq('id', 1)
    .maybeSingle()
  // Een onleesbaar beleid mag nooit als "alles mag" worden uitgelegd.
  if (policy.error) throw new Error(policy.error.message)
  const data = policy.data
  const approved = (data as { backfill_start_at: string | null } | null)?.backfill_start_at ?? null
  // Mét goedkeuring geldt precies die grens — ook als die korter is. Een
  // goedgekeurde grens van twee dagen mag nooit stilzwijgend tot dertig dagen
  // worden opgerekt.
  if (approved) return approved

  // Zonder goedkeuring: nooit verder terug dan het moment waarop de meting is
  // vastgelegd. Staat dat moment er nog niet, dan leggen we het nu vast.
  const mark = await supabaseAdmin
    .from('ads_worker_checkpoint')
    .select('cursor_value')
    .eq('name', MEASUREMENT_START_CHECKPOINT)
    .maybeSingle()
  if (mark.error) throw new Error(mark.error.message)
  const started = (mark.data as { cursor_value: string | null } | null)?.cursor_value ?? null
  if (!started) {
    const nowIso = new Date().toISOString()
    await supabaseAdmin.from('ads_worker_checkpoint').upsert(
      { name: MEASUREMENT_START_CHECKPOINT, cursor_value: nowIso, updated_at: nowIso } as never,
      { onConflict: 'name' },
    )
    return nowIso
  }
  return started > windowStart ? started : windowStart
}

/** Is dit dossier eerder als historisch afgesloten? Dan blijft het dat. */
export async function isLegacyLead(supabaseAdmin: any, leadId: string): Promise<boolean> {
  const known = await supabaseAdmin
    .from('ads_conversion_outbox')
    .select('legacy_import')
    .eq('lead_id', leadId)
    .eq('account_id', ADS_ACCOUNT_ID)
  // Een leesfout hier mag niet betekenen "dus niet historisch": dan zou een
  // oud dossier bij een storing alsnog kunnen vertrekken.
  if (known.error) throw new Error(known.error.message)
  return ((known.data ?? []) as { legacy_import: boolean | null }[]).some((r) => r.legacy_import)
}

async function reconcileFloor(supabaseAdmin: any, sinceDays: number): Promise<string> {
  return adsHistoryFloor(supabaseAdmin, sinceDays)
}


/**
 * Vult ontbrekende fasegebeurtenissen aan. Is het klaarzetten ooit mislukt
 * (databasefout, afgebroken verzoek), dan staat het dossier er wel maar de
 * gebeurtenis niet. Deze herstelronde is idempotent: bestaande regels blijven
 * zoals ze zijn en er wordt nooit een tijdstip verzonnen — een fase zonder
 * vastgelegd moment wordt overgeslagen.
 *
 * De ronde loopt met een bladwijzer verder waar de vorige stopte. Zonder dat
 * zou een limiet van 200 dossiers betekenen dat alles daarbuiten nooit aan de
 * beurt komt: dan lijkt de herstelronde te draaien terwijl een deel van de
 * dossiers structureel wordt overgeslagen.
 */
export async function reconcileAdsOutbox(sinceDays = 30, limit = 200): Promise<{
  checked: number
  created: number
  cursor: string | null
}> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const floor = await reconcileFloor(supabaseAdmin, sinceDays)

  const mark = await supabaseAdmin
    .from('ads_worker_checkpoint')
    .select('cursor_value')
    .eq('name', RECONCILE_CHECKPOINT)
    .maybeSingle()
  const rawSaved = (mark.data as { cursor_value: string | null } | null)?.cursor_value ?? null
  const saved = asIdCursor(rawSaved)

  // De bladwijzer staat op het laatst bekeken dossier-id, niet op een tijdstip.
  // Twee dossiers met exact hetzelfde tijdstip konden elkaar anders blijven
  // aanwijzen en de ronde liet dan geen voortgang meer zien. Een lege of oude
  // (datum)cursor is geen geldige ondergrens op een id-kolom: dan beginnen we
  // vooraan in plaats van de ronde te laten mislukken.
  let leadQuery = supabaseAdmin.from('leads').select(LEAD_FIELDS)
  if (saved) leadQuery = leadQuery.gt('id', saved)
  const { data, error } = await leadQuery

    // Selecteren op de fase zelf, niet alleen op de aanmaakdatum: een ouder
    // dossier dat deze week is afgerond hoort er gewoon bij.
    .or(
      `created_at.gte.${floor},qualified_at.gte.${floor},claimed_at.gte.${floor},outcome_at.gte.${floor}`,
    )
    .order('id', { ascending: true })
    .limit(limit)
  if (error) throw new Error(error.message)

  const all = (data ?? []) as LeadRow[]
  // Alleen dossiers met een echt klik-id: zonder dat valt er niets terug te
  // melden.
  const leads = all.filter((lead) => lead.gclid || lead.gbraid || lead.wbraid)
  let created = 0
  for (const lead of leads) {
    if (lead.is_test) continue
    const phases: ConversionPhase[] = ['request_received']
    if (lead.qualified_at && !lead.disqualified_at) phases.push('request_qualified')
    if (lead.claimed_at) phases.push('job_accepted')
    if (lead.outcome === 'done' && lead.outcome_at) phases.push('job_completed')

    const known = await supabaseAdmin
      .from('ads_conversion_outbox')
      .select('phase, legacy_import')
      .eq('lead_id', lead.id)
      .eq('account_id', ADS_ACCOUNT_ID)
    if (known.error) continue
    const rows = (known.data ?? []) as { phase: string; legacy_import: boolean | null }[]
    // Een dossier dat als historisch is gemarkeerd, blijft historisch: dan
    // mogen de eerdere fasen er niet alsnog bijkomen.
    if (rows.some((r) => r.legacy_import)) continue
    const have = new Set(rows.map((r) => r.phase))

    for (const phase of phases) {
      if (have.has(phase)) continue
      const at = phaseEventTime(lead, phase)
      if (!at) continue
      // De goedgekeurde grens geldt per fase: een fase van vóór die grens is
      // historisch en wordt niet zonder toestemming aangevuld.
      if (at < floor) continue
      try {
        await enqueueAdsConversion(lead.id, phase)
        created += 1
      } catch (err) {
        console.error('Ontbrekende conversiegebeurtenis aanvullen mislukt', lead.id, phase, err)
      }
    }
  }
  // De bladwijzer verschuift alleen wanneer de ronde vol was; anders zijn we
  // bij de actualiteit en begint de volgende ronde weer bij het begin.
  let cursor: string | null = saved
  if (all.length >= limit) {
    const last = all[all.length - 1]?.id ?? null
    if (last) {
      cursor = last
      await supabaseAdmin
        .from('ads_worker_checkpoint')
        .upsert({ name: RECONCILE_CHECKPOINT, cursor_value: last, updated_at: new Date().toISOString() }, {
          onConflict: 'name',
        })
    }
  } else if (rawSaved) {
    // Ronde afgemaakt: de volgende keer weer vanaf de ondergrens beginnen,
    // zodat later gewijzigde oudere dossiers niet buiten beeld blijven.
    cursor = null
    await supabaseAdmin
      .from('ads_worker_checkpoint')
      .upsert({ name: RECONCILE_CHECKPOINT, cursor_value: null, updated_at: new Date().toISOString() }, {
        onConflict: 'name',
      })
  }
  return { checked: leads.length, created, cursor }
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

  // Hetzelfde historische beleid als de herstelronde: ook deze ingang mag geen
  // oude gebeurtenissen alsnog klaarzetten. Een dossier dat als historisch is
  // afgesloten blijft historisch.
  const floor = await adsHistoryFloor(supabaseAdmin)
  if (await isLegacyLead(supabaseAdmin, leadId)) {
    return phases.map((phase) => ({ phase, status: 'skipped_historical' as const }))
  }

  const out: { phase: ConversionPhase; status: OutboxStatus | 'skipped_historical' }[] = []
  for (const phase of phases) {
    const at = phaseEventTime(lead, phase)
    if (!at || at < floor) {
      out.push({ phase, status: 'skipped_historical' })
      continue
    }
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
    return { checked: 0, created: 0, cursor: null }
  })
  const revalidated = await revalidateBlockedAdsExports().catch((err) => {
    console.error('Opnieuw beoordelen van geblokkeerde conversies mislukt', err)
    return { checked: 0, released: 0, changed: [] }
  })

  // Diagnostiek (geen geheimen): welke conversieactie deze server per fase
  // gebruikt. Alleen zichtbaar voor de beveiligde geplande taak.
  const destinations = {
    request_received: conversionActionForPhase('request_received'),
    request_qualified: conversionActionForPhase('request_qualified'),
    job_accepted: conversionActionForPhase('job_accepted'),
    job_completed: conversionActionForPhase('job_completed'),
  }

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
      destinations,
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
    const leadRead = await supabaseAdmin.from('leads').select('*').eq('id', row.lead_id).maybeSingle()
    const lead = leadRead.data as (LeadRow & { consent_visitor_hash?: string | null }) | null
    let current: OutboxStatus = leadRead.error ? 'blocked_consent' : lead ? await consentCheckedEligibility(supabaseAdmin, lead, phase) : 'skipped_no_click'
    if (lead && current === 'pending') {
      try {
        // Laatste poort vóór verzending. Drie controles die niet op een kopie
        // mogen leunen:
        //  1. het historische beleid — ook voor regels die hier al stonden;
        //  2. het gezaghebbende toestemmingsbesluit zelf, want het veld op het
        //     dossier is een kopie die bij een half verwerkte intrekking nog op
        //     "toegestaan" kan staan;
        //  3. een leesfout telt als "niet verzenden", nooit als toestemming.
        if (await isHistoricalEvent(supabaseAdmin, row.lead_id, row.event_time)) {
          current = 'skipped_historical'
        } else {
          const { authoritativeConsent } = await import('./ads-consent.server')
          const decided = await authoritativeConsent(supabaseAdmin, {
            consent_visitor_hash: lead.consent_visitor_hash ?? null,
            gclid: lead.gclid,
            gbraid: lead.gbraid,
            wbraid: lead.wbraid,
          })
          if (decided !== 'granted') current = 'blocked_consent'
        }
      } catch (err) {
        console.error('Veiligheidscontrole vóór verzending mislukt', row.id, err)
        current = 'blocked_consent'
      }
    }
    if (current !== 'pending') {
      blocked += 1
      await supabaseAdmin
        .from('ads_conversion_outbox')
        .update({ status: current, last_error: null, inflight_since: null })
        .eq('id', row.id)
        .eq('status', row.status)
        .eq('attempts', row.attempts)
      continue
    }

    // 2. De verzending vaststellen. Bij de eerste poging wordt alles wat de
    //    gebeurtenis bepaalt bevroren; daarna geldt alleen nog die versie.
    const frozen = frozenPayloadFor(row, lead!, phase)
    if (!frozen.conversionActionId) {
      blocked += 1
      await supabaseAdmin
        .from('ads_conversion_outbox')
        .update({ status: 'config_missing', inflight_since: null })
        .eq('id', row.id)
        .eq('status', row.status)
      continue
    }
    // Is de bestemming ná de eerste poging in de instellingen gewijzigd, dan
    // gaat er niets meer uit: dezelfde gebeurtenis naar een andere
    // conversieactie is een nieuwe conversie, geen herhaling.
    const configuredAction = conversionActionForPhase(phase)
    if (row.payload_frozen_at && configuredAction && configuredAction !== frozen.conversionActionId) {
      blocked += 1
      await supabaseAdmin
        .from('ads_conversion_outbox')
        .update({
          status: 'destination_changed',
          inflight_since: null,
          last_error:
            'De bestemming is gewijzigd nadat deze gebeurtenis al was klaargezet. Eerst met de hand beoordelen.',
        })
        .eq('id', row.id)
        .eq('status', row.status)
      continue
    }

    // 3. Claim: alleen wie de regel in deze staat aantreft, mag verzenden.
    //    Het pogingsnummer gaat pas hier omhoog — bij een echte verzendpoging.
    const attempts = row.attempts + 1
    // Decision and claim share a PostgreSQL row lock. No HTTP read/write gap.
    const claim = await (supabaseAdmin as any).rpc('ads_claim_v2', {
      p_id: row.id, p_attempts: row.attempts, p_status: row.status,
      p_action: frozen.conversionActionId,
      p_next_attempt: new Date(Date.now() + nextAttemptDelayMs(attempts)).toISOString(),
    })
    if (claim.error) {
      console.error('Database kon verzending niet veilig vrijgeven', claim.error.message)
      blocked += 1
      continue
    }
    if (!claim.data?.claimed) { blocked += 1; continue }
    const claimed = claim.data.row as OutboxRow

    const result = await uploadOfflineConversion({
      leadId: row.lead_id,
      phase,
      // Onveranderlijk tijdens herstel: dezelfde bestemming, dezelfde klik,
      // hetzelfde bedrag, dezelfde bron en hetzelfde tijdstip als bij de
      // eerste poging.
      conversionActionId: claimed.conversion_action_id!,
      gclid: claimed.gclid,
      gbraid: claimed.gbraid,
      wbraid: claimed.wbraid,
      eventTime: claimed.event_time,
      valueCents: claimed.value_cents,
      currency: claimed.currency!,
      consentAdUserData: 'granted',
      // Waar de gebeurtenis plaatsvond, volgens het contract van Google.
      eventSource: claimed.event_source as never,
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
    destinations,
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
  backfillStartAt: string | null
  historicalCandidates: { leadId: string; phase: ConversionPhase; phaseLabel: string; eventTime: string }[]
}> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const { data, error } = await supabaseAdmin
    .from('ads_conversion_outbox')
    .select(
      'id, lead_id, phase, phase_source, status, event_time, evidence, consent_ad_user_data, conversion_action_id, attempts, recovered_count, last_error, request_id, submitted_at, leads:lead_id(ref_number, customer_name, consent_visitor_hash)',
    )
    .order('event_time', { ascending: false })
    .limit(limit)
  if (error) throw new Error(error.message)

  const { consentForStorage } = await import('./ads-consent.server')
  const rows: ExportPreviewRow[] = []
  for (const row of (data ?? []) as any[]) {
    const lead = Array.isArray(row.leads) ? row.leads[0] : row.leads
    const phase = row.phase as ConversionPhase
    const consent = TERMINAL_STATUSES.includes(row.status) ? row.consent_ad_user_data ?? null
      : await consentForStorage(supabaseAdmin, lead?.consent_visitor_hash ?? null)
    rows.push({
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
      consent,
      destination:
        row.conversion_action_id && row.conversion_action_id !== 'unconfigured'
          ? 'Google Ads · conversieactie ingesteld'
          : 'Nog geen conversieactie voor deze fase',
      attempts: row.attempts ?? 0,
      lastError: row.last_error ?? null,
      requestId: row.request_id ?? null,
      submittedAt: row.submitted_at ?? null,
    })
  }

  const candidates = await listHistoricalCandidates(supabaseAdmin)

  return { exportEnabled: adsExportEnabled(), configured: adsConfigured(), rows, ...candidates }
}

/**
 * Historische kandidaten: dossiers met een advertentieklik waarvan een fase
 * vóór de goedgekeurde grens ligt en waarvoor nog geen gebeurtenis bestaat.
 * Puur informatief — deze worden nooit vanzelf aangemaakt of verzonden.
 */
async function listHistoricalCandidates(supabaseAdmin: any): Promise<{
  backfillStartAt: string | null
  historicalCandidates: { leadId: string; phase: ConversionPhase; phaseLabel: string; eventTime: string }[]
}> {
  const policy = await supabaseAdmin.from('ads_migration_policy').select('backfill_start_at').eq('id', 1).maybeSingle()
  const backfillStartAt = (policy.data as { backfill_start_at: string | null } | null)?.backfill_start_at ?? null
  const floor = backfillStartAt ?? new Date(Date.now() - 30 * 86_400_000).toISOString()

  const leadsRead = await supabaseAdmin
    .from('leads')
    .select(LEAD_FIELDS)
    .lt('created_at', floor)
    .order('created_at', { ascending: false })
    .limit(100)
  const leads = ((leadsRead.data ?? []) as LeadRow[]).filter(
    (lead) => !lead.is_test && (lead.gclid || lead.gbraid || lead.wbraid),
  )

  const out: { leadId: string; phase: ConversionPhase; phaseLabel: string; eventTime: string }[] = []
  for (const lead of leads) {
    const known = await supabaseAdmin
      .from('ads_conversion_outbox')
      .select('phase')
      .eq('lead_id', lead.id)
      .eq('account_id', ADS_ACCOUNT_ID)
    const have = new Set(((known.data ?? []) as { phase: string }[]).map((r) => r.phase))
    const phases: ConversionPhase[] = ['request_received', 'request_qualified', 'job_accepted', 'job_completed']
    for (const phase of phases) {
      if (have.has(phase)) continue
      const at = phaseEventTime(lead, phase)
      if (!at || at >= floor) continue
      out.push({ leadId: lead.id, phase, phaseLabel: PHASE_LABEL[phase] ?? phase, eventTime: at })
    }
  }
  return { backfillStartAt, historicalCandidates: out }
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
    // Opnieuw aanbieden mag alleen wat nog niet onderweg of ingediend is. De
    // oude, onvoorwaardelijke update kon een al verzonden regel heropenen en
    // daarmee dezelfde conversie een tweede keer laten vertrekken.
    await supabaseAdmin
      .from('ads_conversion_outbox')
      .update({ next_attempt_at: new Date().toISOString(), status: 'pending' })
      .eq('lead_id', leadId)
      .eq('phase', phase)
      .eq('account_id', ADS_ACCOUNT_ID)
      .in('status', REOPENABLE_STATUSES)
  }
  await supabaseAdmin.from('leads').update({ ads_upload_status: result.status }).eq('id', leadId)
  return { status: result.status, error: null as string | null }
}
