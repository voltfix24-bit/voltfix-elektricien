/** Separate monetary inputs: the customer agreement never determines the claim fee. */
export function euroInputToCents(value: string): number | null {
  const normalized = value.trim().replace(',', '.')
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null
  const cents = Math.round(Number(normalized) * 100)
  return Number.isSafeInteger(cents) ? cents : null
}

export function pastedLeadPrices(leadEuro: string, customerEuro: string) {
  const price = euroInputToCents(leadEuro)
  const customerPrice = customerEuro.trim() ? euroInputToCents(customerEuro) : null
  if (price === null || price > 100000) throw new Error('Vul een geldige leadprijs in (maximaal € 1.000).')
  if (customerEuro.trim() && (customerPrice === null || customerPrice > 10000000)) throw new Error('Vul een geldige klantprijs in (maximaal € 100.000).')
  return { price_cents: price, customer_price_cents: customerPrice }
}