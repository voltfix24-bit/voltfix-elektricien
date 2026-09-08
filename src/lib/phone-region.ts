// Blokkeert telefoonnummers uit Zuidoost-Azië en aangrenzende spamregio's.
// Toegestaan blijven: NL, UK, EU, VS en Canada.
export function isBlockedPhoneRegion(phone: string): boolean {
  const normalized = phone.replace(/[\s()-]/g, '')
  const blockedCountryCodes = [
    '91', // India
    '880', // Bangladesh
    '92', // Pakistan
    '93', // Afghanistan
    '94', // Sri Lanka
    '95', // Myanmar
    '66', // Thailand
    '84', // Vietnam
    '856', // Laos
    '855', // Cambodia
    '60', // Malaysia
    '65', // Singapore
    '62', // Indonesia
    '63', // Philippines
    '673', // Brunei
    '670', // Timor-Leste
    '975', // Bhutan
    '977', // Nepal
  ]
  // Alleen blokkeren bij een expliciete internationale prefix (+ of 00).
  // Nationale nummers zonder landcode (bv. VS "917 555 1234" of ES "632 12 34 56")
  // mogen nooit geraakt worden.
  const match = normalized.match(/^(?:\+|00)(\d+)$/)
  if (!match) return false
  const digits = match[1]
  return blockedCountryCodes.some((code) => digits.startsWith(code))
}
