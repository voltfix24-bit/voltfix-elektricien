import { beforeEach, describe, expect, it, vi } from 'vitest'

import { __resetStoredSource, getConversionContext } from './conversion-context'

/** Zet de browser op een bepaalde pagina met een bepaalde verwijzer. */
function visit(url: string, referrer: string) {
  const parsed = new URL(url)
  vi.stubGlobal('window', {
    location: { search: parsed.search, hostname: parsed.hostname, pathname: parsed.pathname },
    sessionStorage: store,
  })
  vi.stubGlobal('document', { referrer })
  vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (iPhone) Mobile', languages: ['nl'] })
}

const data = new Map<string, string>()
const store = {
  getItem: (k: string) => data.get(k) ?? null,
  setItem: (k: string, v: string) => void data.set(k, v),
  removeItem: (k: string) => void data.delete(k),
}

describe('bron van een bezoek', () => {
  beforeEach(() => {
    data.clear()
    visit('https://www.voltfix.nl/?gclid=abc', '')
    __resetStoredSource()
  })

  it('herkent een advertentieklik op de eerste pagina', () => {
    visit('https://www.voltfix.nl/?gclid=abc', '')
    expect(getConversionContext().source).toBe('google-ads')
  })

  it('houdt de advertentieklik vast na doorklikken binnen de site', () => {
    visit('https://www.voltfix.nl/?gclid=abc', '')
    getConversionContext()
    visit('https://www.voltfix.nl/groepenkast-amsterdam', 'https://www.voltfix.nl/?gclid=abc')
    expect(getConversionContext().source).toBe('google-ads')
  })

  it('houdt de bron vast na een taalwissel', () => {
    visit('https://www.voltfix.nl/?utm_source=nieuwsbrief', '')
    getConversionContext()
    visit('https://www.voltfix.nl/en-gb/', 'https://www.voltfix.nl/')
    expect(getConversionContext().source).toBe('campaign')
  })

  it('noemt een onbekende herkomst niet "rechtstreeks"', () => {
    // Nieuw tabblad midden in de site, zonder vastgelegde bron.
    visit('https://www.voltfix.nl/contact', 'https://www.voltfix.nl/')
    expect(getConversionContext().source).toBe('unknown')
  })

  it('houdt organisch verkeer gescheiden van onbekend', () => {
    visit('https://www.voltfix.nl/', 'https://www.google.com/search?q=elektricien')
    expect(getConversionContext().source).toBe('google-organic')
  })
})
