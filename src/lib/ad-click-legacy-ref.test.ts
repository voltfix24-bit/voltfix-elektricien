import { describe, expect, it } from 'vitest'
import {
  AD_CLICK_REF_LENGTH,
  makeClickRef,
  normalizeClickRef,
  normalizeClickRefForLookup,
  pickClickByRef,
} from './ad-click'

describe('oude 4-tekencodes uit WhatsApp', () => {
  it('worden bij zoeken herkend als legacy', () => {
    expect(normalizeClickRefForLookup(' k7qp ')).toEqual({ ref: 'K7QP', legacy: true })
  })
  it('huidige codes blijven gewoon herkend', () => {
    expect(normalizeClickRefForLookup('k7qp-m3bd')).toEqual({ ref: 'K7QPM3BD', legacy: false })
  })
  it('ongeldige tekens of lengtes worden geweigerd', () => {
    expect(normalizeClickRefForLookup('K7Q')).toBeNull()
    expect(normalizeClickRefForLookup('K7QA')).toBeNull() // A zit niet in het alfabet
    expect(normalizeClickRefForLookup('K7QPM')).toBeNull()
  })
  it('normalizeClickRef zelf accepteert 4 tekens niet', () => {
    expect(normalizeClickRef('K7QP')).toBeNull()
  })
  it('nieuwe codes blijven 8 tekens', () => {
    for (let i = 0; i < 50; i += 1) expect(makeClickRef()).toHaveLength(AD_CLICK_REF_LENGTH)
    expect(AD_CLICK_REF_LENGTH).toBe(8)
  })
  it('een legacy code met twee verschillende klikken is geen bewezen koppeling', () => {
    const picked = pickClickByRef([
      { gclid: 'AAA', gbraid: null, wbraid: null },
      { gclid: null, gbraid: 'BBB', wbraid: null },
    ])
    expect(picked.ambiguous).toBe(true)
    expect(picked.click).toBeNull()
  })
  it('dezelfde klik twee keer vastgelegd blijft één kandidaat', () => {
    const picked = pickClickByRef([
      { gclid: 'AAA', gbraid: null, wbraid: null },
      { gclid: 'AAA', gbraid: null, wbraid: null },
    ])
    expect(picked.ambiguous).toBe(false)
    expect(picked.click?.gclid).toBe('AAA')
  })
})
