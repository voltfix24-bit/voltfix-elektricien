/**
 * Tests bij bevinding 3 en 8: een bewaarde klik moet altijd een bon hebben, en
 * een weigering moet ook het geheugen van de pagina echt leegmaken.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

const local = new Map<string, string>()
const session = new Map<string, string>()

function storage(map: Map<string, string>) {
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  }
}

function visit(search: string) {
  vi.stubGlobal('window', {
    location: { search, hostname: 'www.voltfix.nl', pathname: '/' },
    localStorage: storage(local),
    sessionStorage: storage(session),
  })
}

const CONSENT_KEY = 'voltfix.consent'

function setConsent(value: 'granted' | 'denied') {
  local.set(
    CONSENT_KEY,
    JSON.stringify({ ad_storage: value, ad_user_data: value, analytics_storage: value, version: 2 }),
  )
}

beforeEach(async () => {
  local.clear()
  session.clear()
  visit('')
  vi.resetModules()
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ ok: true, token: 'bon' }) })))
})

describe('geheugen echt opruimen', () => {
  it('laat na weigeren, navigeren en opnieuw accepteren geen oude klik terugkomen', async () => {
    const { captureAdClick, readAdClick } = await import('./ad-click')
    const { purgeAdIdentifiers } = await import('./ad-identifier-storage')

    setConsent('granted')
    visit('?gclid=klik-abc123')
    expect(captureAdClick().gclid).toBe('klik-abc123')

    // Bezoeker weigert alsnog: alles moet weg, ook wat alleen in het geheugen
    // van deze pagina stond.
    setConsent('denied')
    purgeAdIdentifiers()
    expect(readAdClick().gclid).toBeNull()

    // Volgende pagina, zonder nieuwe advertentieklik, en daarna alsnog
    // accepteren: de oude klik mag niet opnieuw opduiken.
    visit('/groepenkast-amsterdam')
    setConsent('granted')
    expect(readAdClick().gclid).toBeNull()
    expect(captureAdClick().gclid).toBeNull()
  })
})

describe('bon voor een al bewaarde klik', () => {
  it('haalt alsnog een bon op voor een klik die er al stond', async () => {
    const { captureAdClick } = await import('./ad-click')
    setConsent('granted')
    // Een klik die eerder is opgeslagen zonder bon (oude versie van de site).
    local.set(
      'voltfix_ad_click',
      JSON.stringify({ gclid: 'klik-zonder-bon', ref: 'BCDFGHJK', ts: Date.now() }),
    )
    visit('')

    captureAdClick()
    await Promise.resolve()
    await Promise.resolve()

    const calls = (globalThis.fetch as unknown as { mock: { calls: unknown[][] } }).mock.calls
    expect(calls.some((c) => String(c[0]).includes('/api/public/track/consent-ticket'))).toBe(true)
  })
})

describe('punt 3 — herladen op dezelfde advertentielink', () => {
  it('haalt alsnog een bon op wanneer de eerste uitgifte mislukte', async () => {
    const { captureAdClick } = await import('./ad-click')
    setConsent('granted')
    // Eerste bezoek: het ophalen van de bon mislukt (netwerk weg).
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('netwerk weg')
      }),
    )
    visit('?gclid=klik-herladen')
    captureAdClick()
    await Promise.resolve()
    await Promise.resolve()

    // De bezoeker herlaadt dezelfde advertentielink: dezelfde klik, dus geen
    // nieuwe referentie — maar wél alsnog een bon, anders valt juist deze klik
    // buiten een latere intrekking.
    const fetchOk = vi.fn(async (_url: string, _init?: unknown) => ({
      ok: true,
      json: async () => ({ ok: true, token: 'bon' }),
    }))
    vi.stubGlobal('fetch', fetchOk)
    const before = captureAdClick().ref
    await Promise.resolve()
    await Promise.resolve()

    expect(captureAdClick().ref).toBe(before)
    expect(
      fetchOk.mock.calls.some((c) => String(c[0] ?? '').includes('/api/public/track/consent-ticket')),
    ).toBe(true)
  })
})
