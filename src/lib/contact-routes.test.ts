import { describe, expect, it } from 'vitest'
import { groupContactRoutes, parseEuroToCents, revenueTotals, routeIdentity, type ContactEvent, type RawEvent } from './contact-routes'

// Gepseudonimiseerde kopie van echte acties (oktober 2026); klik-id's vervangen.
type Fx = RawEvent & { at: string; name: string; source: string }
const fx = (id: string, at: string, name: string, p: Partial<RawEvent> = {}, source = 'google-ads'): Fx =>
  ({ id, at, name, source, gclid: null, gbraid: null, wbraid: null, click_ref: null, lead_id: null, ...p })

const REAL: Fx[] = [
  fx('a1', '2026-10-09T20:59:21Z', 'contact_call', { gclid: 'G-CCV', gbraid: 'B1', click_ref: 'CCVHDKF4' }),
  fx('a2', '2026-10-09T21:00:57Z', 'contact_whatsapp', { gclid: 'G-CCV', gbraid: 'B1', click_ref: 'CCVHDKF4' }),
  fx('b1', '2026-10-10T17:15:25Z', 'contact_call'),
  fx('c0', '2026-10-11T08:12:12Z', 'contact_whatsapp', { gbraid: 'B2', click_ref: 'JPSNVPC6' }),
  fx('c1', '2026-10-11T08:43:05Z', 'request_quote'),
  fx('d1', '2026-10-13T09:07:26Z', 'contact_whatsapp', { gclid: 'G-GZN', gbraid: 'B3', click_ref: 'GZNW4CW9' }),
  fx('d2', '2026-10-13T09:08:00Z', 'contact_whatsapp', { gclid: 'G-GZN', gbraid: 'B3', click_ref: 'GZNW4CW9' }),
  fx('e1', '2026-10-19T18:56:29Z', 'request_quote', { gclid: 'G-QGP', gbraid: 'B4', click_ref: 'QGP4BJMD' }),
  fx('e2', '2026-10-19T18:58:37Z', 'quote_submitted', { gclid: 'G-QGP', gbraid: 'B4', click_ref: 'QGP4BJMD', lead_id: 'L1133' }),
  fx('f1', '2026-10-19T21:16:36Z', 'request_quote', { gclid: 'G-7QQ', gbraid: 'B4', click_ref: '7QQPGGSD' }),
  fx('f2', '2026-10-19T21:16:42Z', 'request_quote', { gclid: 'G-7QQ', gbraid: 'B4', click_ref: '7QQPGGSD' }),
  ...['g1', 'g2', 'g3', 'g4'].map((id, i) => fx(id, `2026-10-22T04:5${4 + i}:00Z`, 'contact_call', { gclid: 'G-NSS', gbraid: 'B5', click_ref: 'NSSLW3ZV' })),
  fx('g5', '2026-10-22T04:59:43Z', 'contact_whatsapp', { gclid: 'G-NSS', gbraid: 'B5', click_ref: 'NSSLW3ZV' }),
]

function build(list: Fx[], refGclids = new Map<string, Set<string>>()) {
  const events: ContactEvent[] = list.map((e) => ({
    id: e.id, createdAt: e.at, eventName: e.name, source: e.source, device: 'mobile', pagePath: '/', leadId: e.lead_id,
    clickRef: e.click_ref, hasGclid: !!e.gclid, hasBraid: !!(e.gbraid || e.wbraid), routeKey: routeIdentity(e, refGclids),
  }))
  return groupContactRoutes(events)
}
const routeOf = (rs: ReturnType<typeof build>, id: string) => rs.find((r) => r.events.some((e) => e.id === id))!

describe('contactroutes met echte oktoberdata', () => {
  const rs = build(REAL)
  it('9 okt 22:59 bel + WhatsApp is één route', () => expect(routeOf(rs, 'a1').events.map((e) => e.id)).toEqual(['a1', 'a2']))
  it('13 okt 11:07 twee WhatsApp-klikken is één route', () => expect(routeOf(rs, 'd1').events).toHaveLength(2))
  it('22 okt 06:54 vier belklikken + WhatsApp is één route', () => expect(routeOf(rs, 'g1').events).toHaveLength(5))
  it('19 okt: twee gclids met identieke braid blijven twee routes', () => expect(routeOf(rs, 'e1').key).not.toBe(routeOf(rs, 'f1').key))
  it('10 okt 19:15 en 11 okt 10:43 alleen bronlabel = onbewezen Ads', () => {
    expect(routeOf(rs, 'b1').evidence).toBe('ads_label')
    expect(routeOf(rs, 'c1').evidence).toBe('ads_label')
  })
  it('19 okt 23:16 geopende offerteknop zonder verzending is zichtbaar', () => expect(routeOf(rs, 'f1').actions).toEqual(['request_quote']))
  it('alleen braid + referentie is voorzichtig bewijs, apart van gclid', () => expect(routeOf(rs, 'c0').evidence).toBe('braid_only'))
  it('event-koppeling aan dossier geeft hoogste bewijs', () => expect(routeOf(rs, 'e2').evidence).toBe('lead_linked'))
})

describe('groeperingsregels', () => {
  it('braid alleen groepeert nooit', () => {
    const rs = build([fx('x1', '2026-10-01T10:00:00Z', 'contact_call', { gbraid: 'B' }), fx('x2', '2026-10-01T10:01:00Z', 'contact_call', { gbraid: 'B' })])
    expect(rs).toHaveLength(2)
  })
  it('referentie zonder gclid sluit aan bij de enige gclid met die referentie, niet bij meerdere', () => {
    const e = fx('y', '2026-10-01T10:00:00Z', 'contact_call', { click_ref: 'R1' })
    expect(routeIdentity(e, new Map([['R1', new Set(['G1'])]]))).toBe('g:G1')
    expect(routeIdentity(e, new Map([['R1', new Set(['G1', 'G2'])]]))).toBe('e:y')
  })
})

describe('opbrengst', () => {
  it('telt alleen echt contact met ingevuld bedrag; ontbrekend is onbekend', () => {
    expect(revenueTotals([
      { contact_status: 'real_contact', revenue_cents: 2000 },
      { contact_status: 'real_contact', revenue_cents: null },
      { contact_status: 'no_contact', revenue_cents: 5000 },
      { contact_status: 'unknown', revenue_cents: 700 },
    ])).toEqual({ cents: 2000, unknown: 1 })
  })
  it('lege invoer is onbekend, 0 is expliciet nul', () => {
    expect(parseEuroToCents('')).toBeNull()
    expect(parseEuroToCents('0')).toBe(0)
  })
})
