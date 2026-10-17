import { describe, expect, it } from 'vitest'
import { euroInputToCents, pastedLeadPrices } from './lead-price-input'

describe('separate lead and customer prices', () => {
  it('keeps the €145 customer agreement separate from the €20 lead fee', () => {
    expect(pastedLeadPrices('20', '145')).toEqual({ price_cents: 2000, customer_price_cents: 14500 })
  })
  it('supports correcting the lead fee from €145 to €20', () => {
    expect(euroInputToCents('145')).toBe(14500)
    expect(euroInputToCents('20')).toBe(2000)
  })
  it('does not invent a customer price when unknown', () => {
    expect(pastedLeadPrices('20', '')).toEqual({ price_cents: 2000, customer_price_cents: null })
  })
  it('preserves cents and rejects invalid monetary input', () => {
    expect(euroInputToCents('145,50')).toBe(14550)
    expect(euroInputToCents('-20')).toBeNull()
    expect(() => pastedLeadPrices('', '145')).toThrow()
  })
})