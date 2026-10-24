import { describe, expect, it } from 'vitest'
import { clickIdentity, groupContactRoutes, parseEuroToCents, type ContactEvent } from './contact-routes'

const ev = (id: string, clickKey: string | null, eventName = 'contact_call', at = `2026-10-13T10:0${id}:00Z`): ContactEvent => ({
  id, createdAt: at, eventName, source: clickKey ? 'google-ads' : 'direct', device: 'mobile', pagePath: '/',
  leadId: null, clickKey, hasClickId: Boolean(clickKey),
})

describe('contactroutes', () => {
  it('twee belklikken binnen exact dezelfde klik worden één route met één actiesoort', () => {
    const r = groupContactRoutes([ev('1', 'k1'), ev('2', 'k1'), ev('3', 'k1', 'contact_whatsapp')])
    expect(r).toHaveLength(1)
    expect(r[0].actions).toEqual(['contact_call', 'contact_whatsapp'])
  })
  it('verschillende gclids met gedeelde gbraid worden niet samengevoegd', () => {
    expect(clickIdentity({ gclid: 'A', gbraid: 'X' })).not.toBe(clickIdentity({ gclid: 'B', gbraid: 'X' }))
  })
  it('acties zonder klik-id blijven losse routes', () => {
    expect(groupContactRoutes([ev('1', null), ev('2', null)])).toHaveLength(2)
  })
  it('gekoppeld dossier op dezelfde klik geeft het hoogste bewijsniveau', () => {
    const r = groupContactRoutes([ev('1', 'k1')], new Map([['k1', ['lead-1']]]))
    expect(r[0].evidence).toBe('lead_linked')
  })
  it('lege opbrengst is onbekend, 0 is expliciet nul', () => {
    expect(parseEuroToCents('')).toBeNull()
    expect(parseEuroToCents('0')).toBe(0)
    expect(parseEuroToCents('€ 145,50')).toBe(14550)
  })
})
