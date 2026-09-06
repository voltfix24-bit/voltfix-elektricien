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
  for (const code of blockedCountryCodes) {
    if (new RegExp(`^(?:\\+|00)?${code}`).test(normalized)) return true
  }
  return false
}
