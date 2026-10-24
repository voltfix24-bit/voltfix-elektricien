/**
 * Advertentiecontacten: losse website-acties gegroepeerd tot te beoordelen
 * contactroutes. Belklik ≠ gesprek, WhatsApp-klik ≠ bericht, formulierknop
 * geopend ≠ verzonden.
 */

export const CONTACT_EVENT_NAMES = [
  'contact_call', 'contact_whatsapp', 'quote_submitted', 'schedule_request_success', 'request_quote', 'request_appointment',
] as const

export const ACTION_LABEL: Record<string, string> = {
  contact_call: 'Belklik (geen bewezen gesprek)',
  contact_whatsapp: 'WhatsApp-klik (geen bewezen bericht)',
  quote_submitted: 'Offerteformulier verzonden',
  schedule_request_success: 'Afspraakformulier verzonden',
  request_quote: 'Offerteknop geopend, niet verzonden',
  request_appointment: 'Afspraakknop geopend, niet verzonden',
}

export type RawEvent = {
  id: string
  gclid: string | null
  gbraid: string | null
  wbraid: string | null
  click_ref: string | null
  lead_id: string | null
}

/**
 * Ruwe route-identiteit (wordt daarna gehasht, nooit naar de browser):
 * 1. exact gclid;
 * 2. zonder gclid: click_ref — samengevoegd met een gclid alleen als die
 *    referentie bij precies één gclid hoort; bij meerdere gclids losse actie;
 * 3. anders lead_id;
 * 4. anders losse actie. gbraid/wbraid groeperen nooit (niet uniek per klant).
 * `refGclids`: alle gclids die in de database bij een click_ref horen.
 */
export function routeIdentity(e: RawEvent, refGclids: Map<string, Set<string>> = new Map()): string {
  if (e.gclid) return `g:${e.gclid}`
  if (e.click_ref) {
    const g = refGclids.get(e.click_ref)
    if (!g || g.size === 0) return `r:${e.click_ref}`
    if (g.size === 1) return `g:${[...g][0]}`
    return `e:${e.id}`
  }
  if (e.lead_id) return `l:${e.lead_id}`
  return `e:${e.id}`
}

export type ContactEvent = {
  id: string
  createdAt: string
  eventName: string
  source: string
  device: string
  pagePath: string
  leadId: string | null
  clickRef: string | null
  hasGclid: boolean
  hasBraid: boolean
  /** Gehashte route-sleutel. */
  routeKey: string
}

export type Evidence = 'lead_linked' | 'click_id' | 'braid_only' | 'ads_label' | 'none'

export const EVIDENCE_LABEL: Record<Evidence, string> = {
  lead_linked: 'Advertentieklik + automatisch gekoppeld dossier',
  click_id: 'Advertentieklik bewezen (gclid), contact niet',
  braid_only: 'Alleen braid-code: advertentie waarschijnlijk, voorzichtig',
  ads_label: 'Alleen bronlabel Ads: onbewezen',
  none: 'Geen advertentiebewijs',
}

export type ContactRoute = {
  key: string
  firstAt: string
  lastAt: string
  source: string
  device: string
  evidence: Evidence
  /** Automatisch (zelfde gclid of event-koppeling); handmatige koppeling telt niet als bewijs. */
  leadIds: string[]
  clickRefs: string[]
  actions: string[]
  events: ContactEvent[]
}

export function groupContactRoutes(events: ContactEvent[], leadIdsByKey: Map<string, string[]> = new Map()): ContactRoute[] {
  const map = new Map<string, ContactEvent[]>()
  for (const e of events) {
    const list = map.get(e.routeKey) ?? []
    list.push(e)
    map.set(e.routeKey, list)
  }
  const routes: ContactRoute[] = []
  for (const [key, list] of map) {
    list.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    const leadIds = new Set<string>()
    for (const e of list) if (e.leadId) leadIds.add(e.leadId)
    for (const id of leadIdsByKey.get(key) ?? []) leadIds.add(id)
    const gclid = list.some((e) => e.hasGclid)
    const braid = list.some((e) => e.hasBraid)
    const adsLabel = list.some((e) => e.source === 'google-ads')
    const evidence: Evidence = gclid && leadIds.size ? 'lead_linked' : gclid ? 'click_id' : braid ? 'braid_only' : adsLabel ? 'ads_label' : 'none'
    routes.push({
      key,
      firstAt: list[0].createdAt,
      lastAt: list[list.length - 1].createdAt,
      source: list[0].source,
      device: list[0].device,
      evidence,
      leadIds: [...leadIds],
      clickRefs: [...new Set(list.map((e) => e.clickRef).filter(Boolean) as string[])],
      actions: [...new Set(list.map((e) => e.eventName))],
      events: list,
    })
  }
  return routes.sort((a, b) => b.firstAt.localeCompare(a.firstAt))
}

/** Opbrengst telt alleen bij echt contact met een ingevuld bedrag. */
export function revenueTotals(reviews: { contact_status: string; revenue_cents: number | null }[]) {
  let cents = 0, unknown = 0
  for (const r of reviews) {
    if (r.contact_status !== 'real_contact') continue
    if (r.revenue_cents == null) unknown++
    else cents += r.revenue_cents
  }
  return { cents, unknown }
}

export function amsterdamTime(iso: string) {
  return new Date(iso).toLocaleString('nl-NL', {
    timeZone: 'Europe/Amsterdam', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

/** Euro-invoer → centen. Leeg = onbekend (null); "0" = expliciet nul. */
export function parseEuroToCents(input: string): number | null {
  const t = input.trim().replace(/\s|€/g, '').replace(',', '.')
  if (t === '') return null
  if (!/^\d+(\.\d{1,2})?$/.test(t)) throw new Error('Ongeldig bedrag')
  return Math.round(Number(t) * 100)
}

/** SHA-256 → eerste 12 bytes hex; zelfde in SQL: encode(substring(sha256(..) from 1 for 12),'hex'). */
export async function hashIdentity(raw: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw))
  return 'c:' + [...new Uint8Array(buf)].slice(0, 12).map((b) => b.toString(16).padStart(2, '0')).join('')
}
