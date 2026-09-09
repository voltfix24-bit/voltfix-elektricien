/** Presentation-only redaction: never change the stored lead or private details. */
type CustomerDetails = {
  customer_name: string
  customer_phone: string
  customer_email: string | null
  address: string | null
}

const HIDDEN = '[afgeschermd]'

function literalPattern(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*')
}

export function redactLeadText(text: string, customer: CustomerDetails): string {
  let result = text
  // Explicit contact/address lines, including the English website form.
  result = result.replace(/^([\t ]*(?:[-•]\s*)?(?:adres|address|locatie|location|woonadres|telefoon(?:nummer)?|phone|mobile|mobiel|e-?mail|contact(?:gegevens| details)?|naam|name)\s*:\s*)[^\n]*/gim, `$1${HIDDEN}`)

  for (const value of [customer.address, customer.customer_email, customer.customer_name]) {
    const clean = value?.trim()
    if (clean && clean.length >= 2) {
      result = result.replace(new RegExp(`(?<![\\p{L}\\p{N}])${literalPattern(clean)}(?![\\p{L}\\p{N}])`, 'giu'), HIDDEN)
    }
  }

  // URLs can contain a maps pin, WhatsApp number, or another contact channel.
  result = result.replace(/(?:https?:\/\/|www\.)[^\s<>]+/gi, HIDDEN)
  result = result.replace(/[\w.!#$%&'*+/=?^`{|}~-]+@[\w-]+(?:\.[\w-]+)+/gi, HIDDEN)

  const digits = customer.customer_phone.replace(/\D/g, '')
  if (digits.length >= 7) {
    result = result.replace(new RegExp(`(?<!\\d)\\+?${digits.split('').join('[\\s().-]*')}(?!\\d)`, 'g'), HIDDEN)
  }
  // Phone-like sequences; leave measurements, quantities, prices and ISO dates alone.
  result = result.replace(/(?<![\p{L}\d])(?:\+|00)?\d(?:[\s().-]*\d){6,14}(?![\p{L}\d])/gu, (match) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(match) || /^\d{2}[-/]\d{2}[-/]\d{4}$/.test(match)) return match
    return HIDDEN
  })

  // Unlabelled Dutch street + house number and common English address notation.
  result = result.replace(/\b(?:[\p{L}'’.-]+\s+){0,3}[\p{L}'’.-]*(?:straat|laan|plein|weg|gracht|kade|dijk|singel|steeg|hof|park|plantsoen|dreef|pad|wal)\s+\d{1,5}(?:\s*[-/]\s*\d{1,4})?(?:\s?[a-z](?![\p{L}]))?\b/giu, HIDDEN)
  result = result.replace(/\b\d{1,5}\s+(?:[\p{L}'’.-]+\s+){1,4}(?:street|road|avenue|lane|drive|court|square|place|st\.|rd\.)\b/giu, HIDDEN)
  result = result.replace(/\b\d{4}\s?[a-z]{2}\b/gi, HIDDEN)
  return result
}

/** Only a broad postal area is public, never the complete customer postcode. */
export function publicPostalArea(raw: string | null): string | null {
  return raw?.trim().match(/^(\d{4})\s?[a-z]{2}$/i)?.[1] ?? null
}