/**
 * Advertentiecontacten: losse website-acties (belklik, WhatsApp-klik,
 * geslaagd formulier/afspraak) gegroepeerd tot te beoordelen contactroutes.
 * Belklik ≠ gesprek, WhatsApp-klik ≠ bericht: dit zijn alleen intenties.
 */

export const CONTACT_EVENT_NAMES = ['contact_call', 'contact_whatsapp', 'quote_submitted', 'schedule_request_success'] as const

export const ACTION_LABEL: Record<string, string> = {
  contact_call: 'Belklik (geen bewezen gesprek)',
  contact_whatsapp: 'WhatsApp-klik (geen bewezen bericht)',
  quote_submitted: 'Offerteformulier verzonden',
  schedule_request_success: 'Afspraakformulier verzonden',
}

export type ContactEvent = {
  id: string
  createdAt: string
  eventName: string
  source: string
  device: string
  pagePath: string
  leadId: string | null
  /** Gehashte sleutel van de klik; nooit de ruwe advertentie-id. */
  clickKey: string | null
  hasClickId: boolean
}

export type Evidence = 'lead_linked' | 'click_id' | 'ads_label' | 'none'

export const EVIDENCE_LABEL: Record<Evidence, string> = {
  lead_linked: 'Advertentieklik + gekoppeld dossier',
  click_id: 'Advertentieklik bewezen, contact niet',
  ads_label: 'Gelabeld als Ads, zonder klik-id',
  none: 'Geen advertentiebewijs',
}

export type ContactRoute = {
  key: string
  firstAt: string
  lastAt: string
  source: string
  device: string
  evidence: Evidence
  leadIds: string[]
  /** Unieke actiesoorten; dezelfde soort binnen één klik telt één keer. */
  actions: string[]
  events: ContactEvent[]
}

/**
 * Sleutel per klik: exact dezelfde gclid ⇒ één route. Zonder gclid alleen
 * gbraid/wbraid. Verschillende gclids worden nooit op een gedeelde gbraid
 * samengevoegd. Zonder klik-id: elke actie een eigen route.
 */
export function clickIdentity(e: { gclid?: string | null; gbraid?: string | null; wbraid?: string | null }): string | null {
  if (e.gclid) return `g:${e.gclid}`
  if (e.gbraid) return `b:${e.gbraid}`
  if (e.wbraid) return `w:${e.wbraid}`
  return null
}

export function groupContactRoutes(events: ContactEvent[], leadIdsByClick: Map<string, string[]> = new Map()): ContactRoute[] {
  const map = new Map<string, ContactEvent[]>()
  for (const e of events) {
    const k = e.clickKey ? `c:${e.clickKey}` : `e:${e.id}`
    const list = map.get(k) ?? []
    list.push(e)
    map.set(k, list)
  }
  const routes: ContactRoute[] = []
  for (const [key, list] of map) {
    list.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    const leadIds = new Set<string>()
    for (const e of list) if (e.leadId) leadIds.add(e.leadId)
    const ck = list[0].clickKey
    if (ck) for (const id of leadIdsByClick.get(ck) ?? []) leadIds.add(id)
    const hasClick = list.some((e) => e.hasClickId)
    const adsLabel = list.some((e) => e.source === 'google-ads')
    const evidence: Evidence = hasClick && leadIds.size ? 'lead_linked' : hasClick ? 'click_id' : adsLabel ? 'ads_label' : 'none'
    routes.push({
      key,
      firstAt: list[0].createdAt,
      lastAt: list[list.length - 1].createdAt,
      source: list[0].source,
      device: list[0].device,
      evidence,
      leadIds: [...leadIds],
      actions: [...new Set(list.map((e) => e.eventName))],
      events: list,
    })
  }
  return routes.sort((a, b) => b.firstAt.localeCompare(a.firstAt))
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
