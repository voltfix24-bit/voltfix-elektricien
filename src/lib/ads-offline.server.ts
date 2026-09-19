/**
 * Terugmelding van een bevestigde klus aan Google Ads.
 *
 * Een klant die via een advertentie belt of appt, komt met de hand in de
 * backoffice. Google ziet die klus dus nooit — tenzij we hem terugmelden met
 * het klik-id dat bij het bezoek hoorde. Dat doen we hier, één keer per
 * dossier, en alleen voor echte dossiers met een klik-id.
 *
 * We sturen géén klantgegevens mee: alleen het klik-id van Google zelf, het
 * tijdstip van de klus en eventueel het bedrag. Daarom staat de toestemming
 * voor klantgegevens en personalisatie op geweigerd.
 */

const GATEWAY = 'https://connector-gateway.lovable.dev/google_ads/datamanager/v1/events:ingest'

/** Het advertentieaccount van VoltFix. */
const ADS_ACCOUNT_ID = '9084464909'
/** Conversieactie "VoltFix - Klus bevestigd (offline)". */
const OFFLINE_CONVERSION_ACTION_ID = '7779910497'

export type OfflineUploadInput = {
  leadId: string
  gclid: string | null
  gbraid: string | null
  wbraid: string | null
  /** Tijdstip waarop de klus is bevestigd (RFC 3339). */
  eventTime: string
  /** Klantprijs in centen, of null wanneer die niet bekend is. */
  valueCents: number | null
  isTest: boolean
}

export type OfflineUploadResult =
  | { status: 'uploaded'; error: null }
  | { status: 'skipped'; error: null; reason: 'test' | 'no_click_id' }
  | { status: 'failed'; error: string }

/** Heeft dit dossier een klik-id waarmee Google de klus kan plaatsen? */
export function hasAdClickId(input: Pick<OfflineUploadInput, 'gclid' | 'gbraid' | 'wbraid'>): boolean {
  return Boolean(input.gclid || input.gbraid || input.wbraid)
}

export async function uploadOfflineConversion(input: OfflineUploadInput): Promise<OfflineUploadResult> {
  // Testdossiers gaan nooit naar Google.
  if (input.isTest) return { status: 'skipped', error: null, reason: 'test' }
  if (!hasAdClickId(input)) return { status: 'skipped', error: null, reason: 'no_click_id' }

  const lovableKey = process.env['LOVABLE_API_KEY']
  const adsKey = process.env['GOOGLE_ADS_API_KEY']
  if (!lovableKey || !adsKey) {
    return { status: 'failed', error: 'De koppeling met Google Ads ontbreekt in deze omgeving.' }
  }

  const adIdentifiers: Record<string, string> = {}
  if (input.gclid) adIdentifiers['gclid'] = input.gclid
  else if (input.gbraid) adIdentifiers['gbraid'] = input.gbraid
  else if (input.wbraid) adIdentifiers['wbraid'] = input.wbraid

  const event: Record<string, unknown> = {
    transactionId: input.leadId,
    eventTimestamp: input.eventTime,
    eventSource: 'WEB',
    adIdentifiers,
    consent: {
      // Geen klantgegevens en geen personalisatie: we sturen alleen Google's
      // eigen klik-id mee.
      adUserData: 'CONSENT_DENIED',
      adPersonalization: 'CONSENT_DENIED',
    },
  }
  if (input.valueCents != null && input.valueCents > 0) {
    event['conversionValue'] = Math.round(input.valueCents) / 100
    event['currency'] = 'EUR'
  }

  let response: Response
  try {
    response = await fetch(GATEWAY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${lovableKey}`,
        'X-Connection-Api-Key': adsKey,
      },
      body: JSON.stringify({
        destinations: [
          {
            operatingAccount: { accountType: 'GOOGLE_ADS', accountId: ADS_ACCOUNT_ID },
            productDestinationId: OFFLINE_CONVERSION_ACTION_ID,
          },
        ],
        events: [event],
        encoding: 'HEX',
      }),
    })
  } catch (err) {
    return { status: 'failed', error: err instanceof Error ? err.message : 'Verbinding met Google mislukt.' }
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    console.error('Google Ads offline upload mislukt', response.status, body)
    return { status: 'failed', error: `Google gaf ${response.status} terug: ${body.slice(0, 300)}` }
  }

  return { status: 'uploaded', error: null }
}

type LeadRow = {
  id: string
  gclid: string | null
  gbraid: string | null
  wbraid: string | null
  is_test: boolean | null
  customer_price_cents: number | null
  outcome: string | null
  outcome_at: string | null
  ads_upload_status: string | null
}

/**
 * Meldt de klus van dit dossier terug en schrijft de uitkomst in het dossier.
 * Nooit dubbel: een dossier dat al gemeld is, wordt overgeslagen tenzij het
 * met de hand opnieuw wordt geprobeerd.
 */
export async function reportLeadToGoogleAds(leadId: string, opts: { force?: boolean } = {}) {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const { data, error } = await supabaseAdmin
    .from('leads')
    .select('id, gclid, gbraid, wbraid, is_test, customer_price_cents, outcome, outcome_at, ads_upload_status')
    .eq('id', leadId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  const lead = data as LeadRow | null
  if (!lead) throw new Error('Lead niet gevonden')

  if (lead.outcome !== 'done') {
    return { status: 'skipped' as const, reason: 'not_done' as const }
  }
  if (lead.ads_upload_status === 'uploaded' && !opts.force) {
    return { status: 'skipped' as const, reason: 'already' as const }
  }

  const result = await uploadOfflineConversion({
    leadId: lead.id,
    gclid: lead.gclid,
    gbraid: lead.gbraid,
    wbraid: lead.wbraid,
    // Het echte tijdstip van de klus, ook wanneer we later opnieuw proberen.
    eventTime: lead.outcome_at ?? new Date().toISOString(),
    valueCents: lead.customer_price_cents,
    isTest: Boolean(lead.is_test),
  })

  const status =
    result.status === 'uploaded'
      ? 'uploaded'
      : result.status === 'failed'
        ? 'failed'
        : result.reason === 'test'
          ? 'skipped_test'
          : 'skipped_no_click'

  await supabaseAdmin
    .from('leads')
    .update({
      ads_upload_status: status,
      ads_uploaded_at: result.status === 'uploaded' ? new Date().toISOString() : null,
      ads_upload_error: result.status === 'failed' ? result.error : null,
      ads_conversion_value_cents: result.status === 'uploaded' ? lead.customer_price_cents : null,
    })
    .eq('id', lead.id)

  return { status, error: result.status === 'failed' ? result.error : null }
}
