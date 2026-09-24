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
  it('stuurt een keuze voor de browser die alle eigen klikken dekt', async () => {
    const { saveConsentTicket, readConsentTickets, syncAdConsentToServer } = await import('./consent')
    saveConsentTicket('bon-klik-a')
    saveConsentTicket('bon-klik-b')
    expect(readConsentTickets()).toEqual(['bon-klik-a', 'bon-klik-b'])

    const calls = fakeFetch(() => ({ status: 204 }))
    const result = await syncAdConsentToServer(REJECT_ALL)

    expect(result).toBe('synced')
    expect(calls).toHaveLength(1)
    expect(calls[0].visitorToken).toMatch(/^[a-f0-9]{64}$/)
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
  it('bewaart een intrekking voordat het netwerk antwoord geeft', async () => {
    const mod = await import('./consent')
    let finish!: (response: Response) => void
    vi.stubGlobal('fetch', () => new Promise<Response>(resolve => { finish = resolve }))
    const request = mod.syncAdConsentToServer(REJECT_ALL)
    expect(mod.readPendingConsent()?.adUserData).toBe('denied')
    finish(new Response('{}', { status: 200 }))
    expect(await request).toBe('synced')
  })

  it('laat een oud antwoord een nieuwere mislukte intrekking niet wissen', async () => {
    const mod = await import('./consent')
    let finish!: (response: Response) => void
    vi.stubGlobal('fetch', vi.fn()
      .mockImplementationOnce(() => new Promise<Response>(resolve => { finish = resolve }))
      .mockRejectedValueOnce(new Error('offline')))
    const grant = mod.syncAdConsentToServer(ACCEPT_ALL)
    expect(await mod.syncAdConsentToServer(REJECT_ALL)).toBe('failed')
    const deniedSeq = mod.readPendingConsent()?.seq
    finish(new Response('{}', { status: 200 }))
    await grant
    expect(mod.readPendingConsent()).toMatchObject({ seq: deniedSeq, adUserData: 'denied' })
  })

  it('laat een oude mislukking geen afgehandelde nieuwere keuze vervangen', async () => {
    const mod = await import('./consent')
    let fail!: (error: Error) => void
    vi.stubGlobal('fetch', vi.fn()
      .mockImplementationOnce(() => new Promise<Response>((_resolve,reject) => { fail=reject }))
      .mockResolvedValueOnce(new Response('{}', { status: 200 })))
    const grant = mod.syncAdConsentToServer(ACCEPT_ALL)
    await mod.syncAdConsentToServer(REJECT_ALL)
    fail(new Error('late timeout')); await grant
    expect(mod.readPendingConsent()).toBeNull()
  })

  it('zet een oude opgeslagen toestemming niet om in een nieuw bewezen besluit', async () => {
    const mod = await import('./consent')
    store.set(mod.CONSENT_PENDING_KEY, JSON.stringify({tokens:['old'],seq:7,adUserData:'granted',adStorage:'granted'}))
    const calls = fakeFetch(() => ({ status: 200 }))
    expect(await mod.flushPendingConsent()).toBe('skipped')
    expect(calls).toHaveLength(0)
  })

  it('bewaart bij formulieren de keuze en het bijbehorende volgnummer samen', async () => {
    const mod = await import('./consent')
    fakeFetch(() => ({ status: 200 }))
    const saved=mod.saveConsent(ACCEPT_ALL)
    expect(saved.seq).toBeGreaterThan(0)
    expect(mod.readConsent()?.seq).toBe(saved.seq)
    const { appendAdClick } = await import('./ad-click')
    const form = new FormData(); appendAdClick(form)
    expect(form.get('adConsentSeq')).toBe(String(saved.seq))
    expect(form.get('adConsentAdStorage')).toBe('granted')
    expect(form.get('adVisitorToken')).toMatch(/^[a-f0-9]{64}$/)
  })

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

  it('bewaart de browserbinding bij een mislukte intrekking', async () => {
    const mod = await import('./consent')
    mod.saveConsentTicket('bon-goed')
    mod.saveConsentTicket('bon-stuk')

    const calls = fakeFetch(() => ({ status: 500 }))
    expect(await mod.syncAdConsentToServer(REJECT_ALL)).toBe('failed')
    expect(mod.readPendingConsent()?.visitorToken).toBe(calls[0].visitorToken)
  })

  it('gooit een onbevestigde keuze niet weg na een afgewezen bon', async () => {
    const mod = await import('./consent')
    mod.saveConsentTicket('bon-onbekend')
    fakeFetch(() => ({ status: 401 }))
    expect(await mod.syncAdConsentToServer(ACCEPT_ALL)).toBe('failed')
    expect(mod.readPendingConsent()).not.toBeNull()
  })

  it('kan intrekken zonder ooit een bonantwoord te hebben ontvangen', async () => {
    const mod = await import('./consent')
    const calls = fakeFetch(() => ({ status: 204 }))
    expect(await mod.syncAdConsentToServer(REJECT_ALL)).toBe('synced')
    expect(calls).toHaveLength(1)
  })
})
