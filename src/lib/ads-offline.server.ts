/**
 * Verzending van één conversie naar Google (Data Manager).
 *
 * Belangrijk: een HTTP 200 betekent "ingediend", niet "verwerkt". Google geeft
 * een request-nummer terug; de verwerking is een aparte vraag. Deze module
 * meldt daarom nooit uit zichzelf "verwerkt".
 *
 * De export staat standaard UIT (ADS_EXPORT_ENABLED). Zolang die uitstaat
 * blijven gebeurtenissen netjes in de wachtrij staan, zodat er niets verloren
 * gaat en er niets ongevraagd naar het echte advertentieaccount gaat.
 */

import { classifyUploadResponse, type UploadClassification } from './ads-outbox'

const GATEWAY = 'https://connector-gateway.lovable.dev/google_ads/datamanager/v1/events:ingest'

/** Het advertentieaccount van VoltFix. */
export const ADS_ACCOUNT_ID = '9084464909'
/** Conversieactie "VoltFix - Klus bevestigd (offline)". */
export const OFFLINE_CONVERSION_ACTION_ID = '7779910497'

/**
 * Bestemming per fase. Alleen de afgeronde klus heeft vandaag een bestaande
 * conversieactie; de twee eerdere fasen krijgen er pas één na jouw akkoord in
 * het advertentieaccount. Tot die tijd wachten ze zichtbaar met de status
 * "configuratie ontbreekt" — ze verdwijnen niet en gaan nergens heen.
 */
export function conversionActionForPhase(phase: string): string | null {
  if (phase === 'job_completed') return OFFLINE_CONVERSION_ACTION_ID
  if (phase === 'request_received') return process.env['ADS_ACTION_ID_REQUEST_RECEIVED'] ?? null
  if (phase === 'request_qualified') return process.env['ADS_ACTION_ID_REQUEST_QUALIFIED'] ?? null
  return null
}

/** Staat de export naar het echte account aan? */
export function adsExportEnabled(): boolean {
  return process.env['ADS_EXPORT_ENABLED'] === 'true'
}

/** Zijn de sleutels aanwezig om überhaupt te kunnen verzenden? */
export function adsConfigured(): boolean {
  return Boolean(process.env['LOVABLE_API_KEY'] && process.env['GOOGLE_ADS_API_KEY'])
}

export type OfflineUploadInput = {
  leadId: string
  phase: string
  /** Bestemming: de conversieactie die bij deze fase hoort. */
  conversionActionId: string
  gclid: string | null
  gbraid: string | null
  wbraid: string | null
  /** Oorspronkelijk tijdstip van de gebeurtenis (RFC 3339) — nooit "nu" bij een retry. */
  eventTime: string
  valueCents: number | null
  /** Vastgelegde advertentietoestemming bij de klik. */
  consentAdUserData: 'granted' | 'denied'
  /** Alleen valideren, niet echt indienen (voor controles). */
  validateOnly?: boolean
}

/** Heeft dit dossier een klik-id waarmee Google de klus kan plaatsen? */
export function hasAdClickId(input: Pick<OfflineUploadInput, 'gclid' | 'gbraid' | 'wbraid'>): boolean {
  return Boolean(input.gclid || input.gbraid || input.wbraid)
}

/** Bouwt het gebeurtenisobject zoals Google het verwacht. */
export function buildEvent(input: OfflineUploadInput): Record<string, unknown> {
  const adIdentifiers: Record<string, string> = {}
  if (input.gclid) adIdentifiers['gclid'] = input.gclid
  else if (input.gbraid) adIdentifiers['gbraid'] = input.gbraid
  else if (input.wbraid) adIdentifiers['wbraid'] = input.wbraid

  const event: Record<string, unknown> = {
    // Stabiele sleutel per dossier én fase: opnieuw indienen telt nooit dubbel.
    transactionId: `${input.leadId}:${input.phase}`,
    eventTimestamp: input.eventTime,
    // Een telefonische of handmatig ingevoerde klus is geen webgebeurtenis.
    eventSource: 'OFFLINE',
    adIdentifiers,
    consent: {
      adUserData: input.consentAdUserData === 'granted' ? 'CONSENT_GRANTED' : 'CONSENT_DENIED',
      adPersonalization: 'CONSENT_DENIED',
    },
  }
  if (input.valueCents != null && input.valueCents > 0) {
    event['conversionValue'] = Math.round(input.valueCents) / 100
    event['currency'] = 'EUR'
  }
  return event
}

/** Dient één conversie in en leest het antwoord strikt. */
export async function uploadOfflineConversion(input: OfflineUploadInput): Promise<UploadClassification> {
  const lovableKey = process.env['LOVABLE_API_KEY']
  const adsKey = process.env['GOOGLE_ADS_API_KEY']
  if (!lovableKey || !adsKey) {
    return {
      status: 'config_missing',
      requestId: null,
      warnings: null,
      error: 'De koppeling met Google Ads ontbreekt in deze omgeving.',
    }
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
            productDestinationId: input.conversionActionId,
          },
        ],
        events: [buildEvent(input)],
        encoding: 'HEX',
        ...(input.validateOnly ? { validateOnly: true } : {}),
      }),
    })
  } catch (err) {
    // Netwerkfout: mogelijk wél aangekomen. Tijdelijk mislukt, zelfde sleutel
    // en zelfde tijd bij een volgende poging, dus nooit een dubbele conversie.
    return {
      status: 'failed_temporary',
      requestId: null,
      warnings: null,
      error: err instanceof Error ? err.message : 'Verbinding met Google mislukt.',
    }
  }

  let body: unknown = null
  let parseFailed = false
  const text = await response.text().catch(() => '')
  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      parseFailed = true
    }
  } else {
    parseFailed = true
  }

  const result = classifyUploadResponse(response.status, body, parseFailed)
  if (result.status === 'failed_temporary' || result.status === 'failed_permanent') {
    console.error('Google Ads conversie-indiening mislukt', response.status, result.error)
  }
  return result
}
