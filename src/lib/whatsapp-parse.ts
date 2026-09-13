/**
 * Pure herkenning van een geplakt WhatsApp-gesprek.
 *
 * Bewust conservatief: liever "niet gevonden" dan een verkeerd ingevuld veld.
 * Deze module raakt geen database en geen netwerk; alles is te testen.
 */
import { JOBS } from '@/lib/lead-jobs'

/** Hoe zeker is de herkenning? Bepaalt het label in de UI. */
export type Confidence = 'certain' | 'suggested' | 'missing'

export type Guess<T> = { value: T | null; confidence: Confidence }

export type WhatsAppParse = {
  phone: Guess<string>
  postalCode: Guess<string>
  houseNumber: Guess<string>
  address: Guess<string>
  name: Guess<string>
  language: Guess<'nl' | 'en'>
  urgent: Guess<boolean>
  jobType: Guess<string>
}

function missing<T>(): Guess<T> {
  return { value: null, confidence: 'missing' }
}

function found<T>(value: T, confidence: Confidence = 'certain'): Guess<T> {
  return { value, confidence }
}

/* ---------------- Telefoon ---------------- */

const PHONE_PATTERN = /(?:\+31|0031)[\s.\-()]*\(?0?\)?[\s.\-()]*[1-9](?:[\s.\-]?\d){8}|\b0\d(?:[\s.\-]?\d){8}\b/g

/** Maakt er een Nederlands nummer van in de vorm 0612345678. */
export function normalisePhone(raw: string): string | null {
  let digits = raw.replace(/\D/g, '')
  if (digits.startsWith('0031')) digits = `0${digits.slice(4)}`
  else if (digits.startsWith('31') && digits.length >= 11) digits = `0${digits.slice(2)}`
  // +31 (0)6 … levert een dubbele nul op.
  if (digits.startsWith('00') && digits.length === 11) digits = digits.slice(1)
  if (!/^0\d{9}$/.test(digits)) return null
  return digits
}

function parsePhone(text: string): Guess<string> {
  const hits: string[] = []
  for (const match of text.matchAll(PHONE_PATTERN)) {
    const normalised = normalisePhone(match[0])
    if (normalised && !hits.includes(normalised)) hits.push(normalised)
  }
  if (!hits.length) return missing()
  // Meerdere nummers: waarschijnlijk staat ook ons eigen nummer in het gesprek.
  return found(hits[0]!, hits.length === 1 ? 'certain' : 'suggested')
}

/* ---------------- Postcode ---------------- */

const POSTCODE_PATTERN = /\b([1-9][0-9]{3})\s?([A-Za-z]{2})\b/

function parsePostcode(text: string): Guess<string> {
  const match = POSTCODE_PATTERN.exec(text)
  if (!match) return missing()
  return found(`${match[1]} ${match[2]!.toUpperCase()}`)
}

/* ---------------- Adres ---------------- */

const STREET_SUFFIX = 'straat|laan|weg|plein|kade|gracht|dijk|hof|pad|singel|dreef|park|baan|steeg|markt|wal|burg|hoek'
// Huisnummer met toevoeging: 118-2, 42 hs, 3 hoog, 12B, 7 bis.
const HOUSE_NUMBER = '\\d{1,4}\\s?[a-zA-Z]?(?:\\s?[-/]\\s?\\d{1,3}|\\s(?:hs|hoog|bis|zw|bg))?'
const ADDRESS_STRONG = new RegExp(`\\b([A-Z][\\wäëïöüáéíóú'’.-]*(?:${STREET_SUFFIX})[\\w]*)\\s+(${HOUSE_NUMBER})\\b`, 'i')
const ADDRESS_WEAK = new RegExp(`\\b([A-Z][a-zäëïöüáéíóú'’.-]{2,}(?:\\s[A-Z][a-zäëïöüáéíóú'’.-]{2,})?)\\s+(${HOUSE_NUMBER})\\b`)

function cleanNumber(value: string) {
  return value.replace(/\s*([-/])\s*/, '$1').replace(/\s+/g, ' ').trim()
}

function parseAddress(text: string): { address: Guess<string>; houseNumber: Guess<string> } {
  const strong = ADDRESS_STRONG.exec(text)
  const match = strong ?? ADDRESS_WEAK.exec(text)
  if (!match) return { address: missing(), houseNumber: missing() }
  const street = match[1]!.trim()
  const number = cleanNumber(match[2]!)
  const confidence: Confidence = strong ? 'certain' : 'suggested'
  return {
    address: found(`${street} ${number}`, confidence),
    houseNumber: found(number, confidence),
  }
}

/* ---------------- Taal ---------------- */

const EN_WORDS = /\b(hello|hi there|please|thanks|thank you|could you|i have|i need|my name is|the power|socket|fuse box|appointment|tomorrow|kitchen|apartment|address is)\b/gi
const NL_WORDS = /\b(hallo|goedemiddag|goedemorgen|alstublieft|bedankt|dank je|graag|ik heb|ik wil|stopcontact|groepenkast|stroom|afspraak|morgen|keuken|woning|adres is)\b/gi

function parseLanguage(text: string): Guess<'nl' | 'en'> {
  const en = (text.match(EN_WORDS) ?? []).length
  const nl = (text.match(NL_WORDS) ?? []).length
  if (!en && !nl) return { value: 'nl', confidence: 'suggested' }
  if (en > nl) return found('en', en >= nl * 2 ? 'certain' : 'suggested')
  return found('nl', nl >= en * 2 ? 'certain' : 'suggested')
}

/* ---------------- Spoed ---------------- */

const URGENT_NO = /\b(hoeft niet vandaag|niet vandaag|geen haast|geen spoed|deze week|volgende week|kan wachten|no rush|not urgent|next week)\b/i
const URGENT_YES = /\b(geen stroom|stroom uitgevallen|stroomuitval|kortsluiting|kort sluiting|spoed|vandaag nog|zo snel mogelijk|noodgeval|brandlucht|vonken|no power|power is out|short circuit|urgent|emergency|today still)\b/i

function parseUrgent(text: string): Guess<boolean> {
  // Ontkenning wint: "hoeft niet vandaag" bevat ook "vandaag".
  if (URGENT_NO.test(text)) return found(false)
  if (URGENT_YES.test(text)) return found(true)
  return missing()
}

/* ---------------- Klus ---------------- */

const JOB_HINTS: { job: string; pattern: RegExp }[] = [
  { job: 'Storing / geen stroom', pattern: /\b(geen stroom|storing|stroomuitval|kortsluiting|aardlek|no power|power (is )?out|short circuit|fuse (keeps )?trip)/i },
  { job: 'Groepenkast vervangen', pattern: /\b(groepenkast|meterkast vervangen|verdeelkast|fuse box|consumer unit)/i },
  { job: 'Perilex aansluiten', pattern: /\b(perilex|krachtstroom|kookplaat aansluiten|inductie(kookplaat)?|oven aansluiten|fornuis)/i },
  { job: 'Laadpaal installeren', pattern: /\b(laadpaal|laadpunt|wallbox|ev charger|auto ?lader)/i },
  { job: 'Stopcontact / schakelaar', pattern: /\b(stopcontact|wandcontactdoos|schakelaar|dimmer|socket|outlet|switch)/i },
  { job: 'Verlichting ophangen', pattern: /\b(verlichting|lamp(en)?|plafondlamp|spot(jes)?|light fitting|chandelier)/i },
  { job: 'Inspectie / keuring', pattern: /\b(inspectie|keuring|nen ?3140|certificaat|inspection|safety check)/i },
]

function parseJob(text: string): Guess<string> {
  const hits = JOB_HINTS.filter((hint) => hint.pattern.test(text))
  if (!hits.length) return missing()
  // Bij meerdere treffers wint de eerste uit de vaste volgorde, maar minder zeker.
  return found(hits[0]!.job, hits.length === 1 ? 'certain' : 'suggested')
}

/* ---------------- Naam ---------------- */

const NAME_SAID = /\b(?:ik ben|mijn naam is|met|this is|my name is|i am|i'm)\s+([A-Z][a-zäëïöüáéíóú'’-]{1,20}(?:\s[A-Z][a-zäëïöüáéíóú'’-]{1,20})?)/
// WhatsApp-export: "[12-09-2026 13:21] Jan de Vries: bericht"
const NAME_SPEAKER = /^\s*(?:\[[^\]]{4,40}\]\s*)?([A-Z][a-zäëïöüáéíóú'’-]{1,20}(?:\s[A-Za-zäëïöüáéíóú'’-]{1,20}){0,2})\s*:\s+\S/m

function parseName(text: string): Guess<string> {
  const said = NAME_SAID.exec(text)
  if (said) return found(said[1]!.trim())
  const speaker = NAME_SPEAKER.exec(text)
  if (speaker) return found(speaker[1]!.trim(), 'suggested')
  return missing()
}

/* ---------------- Alles samen ---------------- */

export function parseWhatsApp(raw: string): WhatsAppParse {
  const text = (raw ?? '').slice(0, 20_000)
  if (!text.trim()) {
    return {
      phone: missing(),
      postalCode: missing(),
      houseNumber: missing(),
      address: missing(),
      name: missing(),
      language: missing(),
      urgent: missing(),
      jobType: missing(),
    }
  }
  const { address, houseNumber } = parseAddress(text)
  return {
    phone: parsePhone(text),
    postalCode: parsePostcode(text),
    houseNumber,
    address,
    name: parseName(text),
    language: parseLanguage(text),
    urgent: parseUrgent(text),
    jobType: parseJob(text),
  }
}

/** Labels horend bij de zekerheid; de UI vult nooit stilzwijgend iets in. */
export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  certain: 'Zeker',
  suggested: 'Voorstel',
  missing: 'Niet gevonden',
}

export { JOBS }
