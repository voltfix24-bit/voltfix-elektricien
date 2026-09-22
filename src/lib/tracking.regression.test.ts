/**
 * Regressietests voor de meting in de browser: eigen beheerklikken, de bron van
 * een bezoek, de WhatsApp-code en het contract tussen browser en server.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { normalizeClickRef, pickClickByRef, AD_CLICK_REF_LENGTH, makeClickRef } from './ad-click'
import { isInternalTraffic, sendTrackingBeacon, trackConversion } from './analytics'
import { withClickRef } from './contact-click-fallback'
import { __resetStoredSource, getConversionContext, readSourceHistory } from './conversion-context'
import { bodySchema } from '@/routes/api/public/track/conversion'

const data = new Map<string, string>()
const store = {
  getItem: (k: string) => data.get(k) ?? null,
  setItem: (k: string, v: string) => void data.set(k, v),
  removeItem: (k: string) => void data.delete(k),
}

function visit(url: string, referrer: string, extra: Record<string, unknown> = {}) {
  const parsed = new URL(url)
  vi.stubGlobal('window', {
    location: { href: url, search: parsed.search, hostname: parsed.hostname, pathname: parsed.pathname },
    sessionStorage: store,
    localStorage: store,
    ...extra,
  })
  vi.stubGlobal('document', { referrer })
  vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (iPhone) Mobile Safari', languages: ['nl'] })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('bevinding 5 — eigen beheerklikken tellen niet mee', () => {
  beforeEach(() => data.clear())

  it('herkent beheerpagina’s, ook wanneer een component een ouder pad meegeeft', () => {
    visit('https://www.voltfix.nl/admin/leads', '')
    expect(isInternalTraffic('/admin/leads')).toBe(true)
    // Oud pad meegegeven bij navigatie binnen de app: de browser staat al op beheer.
    expect(isInternalTraffic('/groepenkast-amsterdam')).toBe(true)
  })

  it('stuurt vanaf een beheerpagina niets naar de tagcontainer of de eigen meting', () => {
    const pushed: unknown[] = []
    const beacon = vi.fn(() => true)
    visit('https://www.voltfix.nl/admin/leads', '', {
      dataLayer: { push: (v: unknown) => pushed.push(v) },
      gtag: (...args: unknown[]) => pushed.push(args),
    })
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (iPhone) Mobile Safari', sendBeacon: beacon })
    trackConversion({ type: 'whatsapp', language: 'nl', pagePath: '/admin/leads', location: 'beheer' })
    expect(pushed).toHaveLength(0)
    expect(beacon).not.toHaveBeenCalled()
  })

  it('zet geen advertentiecode in een WhatsApp-link zonder klik', () => {
    const href = 'https://wa.me/31612345678?text=Hallo'
    expect(withClickRef(href, { gclid: null, gbraid: null, wbraid: null, ref: null } as never)).toBe(href)
  })
})

describe('bevinding 9 — de WhatsApp-code is ondubbelzinnig', () => {
  it('gebruikt acht tekens in plaats van vier', () => {
    expect(AD_CLICK_REF_LENGTH).toBe(8)
    expect(makeClickRef()).toHaveLength(8)
    expect(normalizeClickRef('k7qp m3bd')).toBe('K7QPM3BD')
    expect(normalizeClickRef('K7Q')).toBeNull()
  })

  it('kiest niet zelf wanneer één code bij twee klikken hoort', () => {
    const rows = [{ gclid: 'klik-a' }, { gclid: 'klik-b' }]
    const picked = pickClickByRef(rows)
    expect(picked.ambiguous).toBe(true)
    expect(picked.click).toBeNull()
    expect(picked.candidates).toHaveLength(2)
  })

  it('koppelt wel wanneer dezelfde klik meerdere keren is gemeten', () => {
    const picked = pickClickByRef([{ gclid: 'klik-a' }, { gclid: 'klik-a' }])
    expect(picked.ambiguous).toBe(false)
    expect(picked.click).toEqual({ gclid: 'klik-a' })
  })
})

/** Toestemming voor advertentieopslag: anders mag het klik-id niet bewaard worden. */
function grantAdStorage() {
  data.set(
    'voltfix.consent',
    JSON.stringify({
      analytics_storage: 'granted',
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
      personalization_storage: 'granted',
      timestamp: new Date().toISOString(),
      version: 2,
    }),
  )
}

describe('bevinding 8 — bron bij echte appnavigatie', () => {
  beforeEach(() => {
    data.clear()
    grantAdStorage()
    visit('https://www.voltfix.nl/?gclid=klik-a', 'https://www.google.com/')
    __resetStoredSource()
  })

  it('houdt een advertentiebezoek vast bij navigatie met dezelfde Google-verwijzer', () => {
    visit('https://www.voltfix.nl/?gclid=klik-a', 'https://www.google.com/')
    expect(getConversionContext().source).toBe('google-ads')
    // Navigatie binnen de app: de documentverwijzer blijft Google.
    visit('https://www.voltfix.nl/groepenkast-amsterdam', 'https://www.google.com/')
    expect(getConversionContext().source).toBe('google-ads')
    expect(readSourceHistory()).toHaveLength(1)
  })

  it('ziet twee verschillende klik-ids met dezelfde campagne als twee aanrakingen', () => {
    visit('https://www.voltfix.nl/?gclid=klik-a&utm_campaign=groepenkast', 'https://www.google.com/')
    getConversionContext()
    visit('https://www.voltfix.nl/?gclid=klik-b&utm_campaign=groepenkast', 'https://www.google.com/')
    expect(getConversionContext().source).toBe('google-ads')
    const history = readSourceHistory()
    expect(history).toHaveLength(2)
    expect(history[0]?.clickId).toBe('klik-b')
    expect(history[1]?.clickId).toBe('klik-a')
  })
})

describe('bevinding 3 — zonder toestemming geen bewaard klik-id', () => {
  beforeEach(() => {
    data.clear()
    visit('https://www.voltfix.nl/?gclid=klik-a', 'https://www.google.com/')
    __resetStoredSource()
  })

  it('bewaart wel de herkomst, maar niet het klik-id', () => {
    visit('https://www.voltfix.nl/?gclid=klik-a', 'https://www.google.com/')
    expect(getConversionContext().source).toBe('google-ads')
    const stored = JSON.parse(data.get('voltfix_src') ?? '{}')
    expect(stored.source).toBe('google-ads')
    expect(stored.clickId).toBeNull()
    expect(readSourceHistory()[0]?.clickId).toBeNull()
  })

  it('ruimt bij een weigering elk bewaard advertentie-id op', async () => {
    visit('https://www.voltfix.nl/?gclid=klik-a', 'https://www.google.com/')
    data.set('voltfix_ad_click', JSON.stringify({ gclid: 'klik-a', ref: 'K7QPM3BD' }))
    data.set('voltfix_src', JSON.stringify({ source: 'google-ads', clickId: 'klik-a' }))
    data.set('voltfix_src_history', JSON.stringify([{ source: 'google-ads', clickId: 'klik-a' }]))
    const { purgeAdIdentifiers } = await import('./ad-identifier-storage')
    purgeAdIdentifiers()
    expect(data.get('voltfix_ad_click')).toBeUndefined()
    expect(JSON.parse(data.get('voltfix_src')!).clickId).toBeNull()
    expect(JSON.parse(data.get('voltfix_src_history')!)[0].clickId).toBeNull()
    // Het bronlabel blijft: dat wijst niemand aan.
    expect(JSON.parse(data.get('voltfix_src')!).source).toBe('google-ads')
  })
})

describe('bevinding 10 — browser en server delen hetzelfde contract', () => {
  it('accepteert de bedoelde bron "onbekend" en de gebeurtenis-id', () => {
    const parsed = bodySchema.safeParse({
      conversionType: 'quote',
      eventName: 'offerte_aanvraag',
      eventId: 'offerte_aanvraag:lead-1',
      leadId: '11111111-1111-4111-8111-111111111111',
      pagePath: '/groepenkast-amsterdam',
      source: 'unknown',
    })
    expect(parsed.success).toBe(true)
    expect(parsed.success && parsed.data.source).toBe('unknown')
  })

  it('valt terug op een gewone verzending wanneer sendBeacon weigert', () => {
    const fetchSpy = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })))
    vi.stubGlobal('navigator', { sendBeacon: () => false })
    vi.stubGlobal('fetch', fetchSpy)
    vi.stubGlobal('Blob', class {})
    sendTrackingBeacon('{"a":1}')
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('valt terug op een gewone verzending wanneer sendBeacon een fout geeft', () => {
    const fetchSpy = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })))
    vi.stubGlobal('navigator', {
      sendBeacon: () => {
        throw new Error('kapot')
      },
    })
    vi.stubGlobal('fetch', fetchSpy)
    vi.stubGlobal('Blob', class {})
    sendTrackingBeacon('{"a":1}')
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('verstuurt niet dubbel wanneer sendBeacon slaagt', () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('navigator', { sendBeacon: () => true })
    vi.stubGlobal('fetch', fetchSpy)
    vi.stubGlobal('Blob', class {})
    sendTrackingBeacon('{"a":1}')
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
