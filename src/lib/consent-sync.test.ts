/**
 * Tests bij het doorgeven van de toestemmingskeuze aan de server.
 *
 * Hier gaat het om de browserkant van bevinding 2: meerdere advertentieklikken
 * van dezelfde bezoeker, en een intrekking die de server niet bereikt.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { REJECT_ALL, ACCEPT_ALL } from './consent'

const store = new Map<string, string>()
const localStorageStub = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
}

function stubWindow() {
  vi.stubGlobal('window', { localStorage: localStorageStub, sessionStorage: localStorageStub })
  vi.stubGlobal('localStorage', localStorageStub)
}

beforeEach(() => {
  store.clear()
  vi.resetModules()
  stubWindow()
})

/** Verzamelt de verstuurde verzoeken en antwoordt zoals opgegeven. */
function fakeFetch(responder: (body: any) => { status: number }) {
  const calls: any[] = []
  vi.stubGlobal('fetch', async (_url: string, init: any) => {
    const body = JSON.parse(init.body)
    calls.push(body)
    const { status } = responder(body)
    return { ok: status >= 200 && status < 300, status } as Response
  })
  return calls
}

describe('meerdere advertentieklikken van dezelfde bezoeker', () => {
  it('stuurt een weigering voor elke bon, niet alleen voor de laatste klik', async () => {
    const { saveConsentTicket, readConsentTickets, syncAdConsentToServer } = await import('./consent')
    saveConsentTicket('bon-klik-a')
    saveConsentTicket('bon-klik-b')
    expect(readConsentTickets()).toEqual(['bon-klik-a', 'bon-klik-b'])

    const calls = fakeFetch(() => ({ status: 204 }))
    const result = await syncAdConsentToServer(REJECT_ALL)

    expect(result).toBe('synced')
    expect(calls.map((c) => c.token)).toEqual(['bon-klik-a', 'bon-klik-b'])
    expect(calls.every((c) => c.adUserData === 'denied')).toBe(true)
  })

  it('laat bij een zesde advertentieklik de eerste klik niet buiten de intrekking vallen', async () => {
    const { saveConsentTicket, readConsentTickets } = await import('./consent')
    for (const n of [1, 2, 3, 4, 5, 6]) saveConsentTicket(`bon-${n}`)
    expect(readConsentTickets()).toEqual(['bon-1', 'bon-2', 'bon-3', 'bon-4', 'bon-5', 'bon-6'])
  })

  it('houdt ook een lange reeks klikken compleet', async () => {
    const { saveConsentTicket, readConsentTickets } = await import('./consent')
    for (let n = 1; n <= 30; n += 1) saveConsentTicket(`bon-${n}`)
    expect(readConsentTickets()).toHaveLength(30)
    expect(readConsentTickets()[0]).toBe('bon-1')
  })
})

describe('mislukte intrekking', () => {
  it('bewaart de keuze en maakt die bij een volgend bezoek alsnog af', async () => {
    const mod = await import('./consent')
    mod.saveConsentTicket('bon-1')

    // Eerste poging: het netwerk ligt eruit.
    vi.stubGlobal('fetch', async () => {
      throw new Error('offline')
    })
    expect(await mod.syncAdConsentToServer(REJECT_ALL)).toBe('failed')
    const pending = mod.readPendingConsent()
    expect(pending?.tokens).toEqual(['bon-1'])
    expect(pending?.adUserData).toBe('denied')

    // Volgend bezoek: de server is er weer.
    const calls = fakeFetch(() => ({ status: 204 }))
    expect(await mod.flushPendingConsent()).toBe('synced')
    expect(calls).toHaveLength(1)
    expect(calls[0].adUserData).toBe('denied')
    expect(mod.readPendingConsent()).toBeNull()
  })

  it('houdt alleen de bon over die nog niet gelukt is', async () => {
    const mod = await import('./consent')
    mod.saveConsentTicket('bon-goed')
    mod.saveConsentTicket('bon-stuk')

    fakeFetch((body) => ({ status: body.token === 'bon-stuk' ? 500 : 204 }))
    expect(await mod.syncAdConsentToServer(REJECT_ALL)).toBe('failed')
    expect(mod.readPendingConsent()?.tokens).toEqual(['bon-stuk'])
  })

  it('probeert een afgewezen bon niet eindeloos opnieuw', async () => {
    const mod = await import('./consent')
    mod.saveConsentTicket('bon-onbekend')
    fakeFetch(() => ({ status: 401 }))
    expect(await mod.syncAdConsentToServer(ACCEPT_ALL)).toBe('rejected')
    expect(mod.readPendingConsent()).toBeNull()
  })

  it('doet niets zonder bon: er valt dan niets te wijzigen', async () => {
    const mod = await import('./consent')
    const calls = fakeFetch(() => ({ status: 204 }))
    expect(await mod.syncAdConsentToServer(REJECT_ALL)).toBe('skipped')
    expect(calls).toHaveLength(0)
  })
})
