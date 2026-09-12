import { describe, expect, it } from 'vitest'
import {
  DEDUP_WINDOW_MS,
  dedupSince,
  filterDuplicates,
  firstDuplicateId,
  hasUsableDedupInput,
  matchesDedup,
  phoneTail,
} from './lead-dedup'

describe('lead-dedup', () => {
  it('ziet +31 6… en 06… als hetzelfde nummer', () => {
    expect(phoneTail('+31 6 83 83 06 70')).toBe(phoneTail('06 83830670'))
    expect(matchesDedup({ id: 'a', customer_phone: '+31683830670' }, { phone: '06-83830670' })).toBe(true)
  })

  it('matcht op postcode + adres ongeacht spaties en hoofdletters', () => {
    const candidate = { id: 'a', postal_code: '1012 AB', address: 'Damstraat 1' }
    expect(matchesDedup(candidate, { postalCode: '1012ab', address: '  damstraat 1 ' })).toBe(true)
    expect(matchesDedup(candidate, { postalCode: '1012AB', address: 'Damstraat 2' })).toBe(false)
  })

  it('matcht niet op een te kort telefoonnummer', () => {
    expect(hasUsableDedupInput({ phone: '0612' })).toBe(false)
    expect(matchesDedup({ id: 'a', customer_phone: '0612' }, { phone: '0612' })).toBe(false)
  })

  it('lege invoer levert geen treffers', () => {
    expect(filterDuplicates([{ id: 'a', customer_phone: '0683830670' }], {})).toEqual([])
    expect(hasUsableDedupInput({ postalCode: '1012AB' })).toBe(false)
  })

  it('kapt af op de limiet en behoudt de volgorde', () => {
    const rows = [
      { id: 'nieuwste', customer_phone: '0683830670' },
      { id: 'midden', customer_phone: '31683830670' },
      { id: 'anders', customer_phone: '0611111111' },
      { id: 'oudste', customer_phone: '0683830670' },
    ]
    expect(filterDuplicates(rows, { phone: '0683830670' }, 3).map(r => r.id)).toEqual(['nieuwste', 'midden', 'oudste'])
    expect(firstDuplicateId(rows, { phone: '0683830670' })).toBe('nieuwste')
  })

  it('het venster is zeven dagen', () => {
    const now = Date.UTC(2026, 0, 15)
    expect(DEDUP_WINDOW_MS).toBe(7 * 24 * 60 * 60 * 1000)
    expect(dedupSince(now)).toBe(new Date(Date.UTC(2026, 0, 8)).toISOString())
  })
})

describe('dedupOrFilter', () => {
  it('geeft null zonder bruikbare invoer', () => {
    expect(dedupOrFilter({})).toBeNull()
    expect(dedupOrFilter({ phone: '06 12' })).toBeNull()
  })

  it('zet het telefoonsuffix in de query, met en zonder scheidingstekens', () => {
    const filter = dedupOrFilter({ phone: '+31 6 12345678' })!
    expect(filter).toContain('customer_phone.like.*612345678')
    expect(filter).toContain('customer_phone.like.*6*1*2*3*4*5*6*7*8')
  })

  it('combineert postcode en adres in één and()-clausule', () => {
    const filter = dedupOrFilter({ postalCode: '1015 AB', address: 'Keizersgracht 1' })!
    expect(filter).toContain('and(postal_code.ilike.1015*AB,address.ilike.keizersgracht 1)')
  })

  it('maakt van syntaxbrekende tekens een wildcard', () => {
    const filter = dedupOrFilter({ postalCode: '1015AB', address: 'Straat 1, (bel)' })!
    expect(filter).not.toMatch(/address\.ilike\.[^,]*\(/)
  })
})
