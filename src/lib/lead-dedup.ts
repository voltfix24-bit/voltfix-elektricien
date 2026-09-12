/**
 * Gedeelde regels voor de zachte dubbelcontrole op leads.
 *
 * Eén definitie, twee aanroepers:
 *  - `createLead` (autoriteit op het moment van opslaan, vult `duplicate_of_id`);
 *  - `findPossibleDuplicates` (read-only vooruitblik tijdens het invullen).
 *
 * Bewust puur: geen Supabase, geen datums uit de omgeving behalve wat je
 * meegeeft. Zo blijft dit testbaar en identiek aan beide kanten.
 */

/** Venster waarbinnen een tweede aanvraag als mogelijk duplicaat telt. */
export const DEDUP_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

/** Aantal recente leads dat we maximaal tegen de invoer leggen. */
export const DEDUP_SCAN_LIMIT = 200

/** Laatste 9 cijfers: zo blijven +31 6… en 06… hetzelfde nummer. */
export const phoneTail = (phone: string | null | undefined) => (phone ?? '').replace(/\D/g, '').slice(-9)

const normPostal = (value: string | null | undefined) => (value ?? '').replace(/\s+/g, '').toUpperCase()
const normAddress = (value: string | null | undefined) => (value ?? '').trim().toLowerCase()

export type DedupInput = {
  phone?: string | null
  postalCode?: string | null
  address?: string | null
}

export type DedupCandidate = {
  id: string
  customer_phone?: string | null
  postal_code?: string | null
  address?: string | null
}

/** Startmoment van het venster als ISO-string, voor een `gte('created_at', …)`. */
export const dedupSince = (now: number = Date.now()) => new Date(now - DEDUP_WINDOW_MS).toISOString()

/** Is er genoeg ingevuld om überhaupt te kunnen matchen? */
export function hasUsableDedupInput(input: DedupInput): boolean {
  if (phoneTail(input.phone).length >= 8) return true
  return Boolean(normPostal(input.postalCode) && normAddress(input.address))
}

/** Eén kandidaat tegen de invoer leggen: zelfde telefoon óf zelfde postcode + adres. */
export function matchesDedup(candidate: DedupCandidate, input: DedupInput): boolean {
  const tail = phoneTail(input.phone)
  if (tail.length >= 8 && phoneTail(candidate.customer_phone) === tail) return true

  const postal = normPostal(input.postalCode)
  const address = normAddress(input.address)
  if (!postal || !address) return false
  return normPostal(candidate.postal_code) === postal && normAddress(candidate.address) === address
}

/**
 * Kandidaten filteren op volgorde van binnenkomst (nieuwste eerst, zoals de
 * query ze aanlevert) en optioneel afkappen.
 */
export function filterDuplicates<T extends DedupCandidate>(candidates: T[], input: DedupInput, limit?: number): T[] {
  if (!hasUsableDedupInput(input)) return []
  const hits: T[] = []
  for (const candidate of candidates) {
    if (!matchesDedup(candidate, input)) continue
    hits.push(candidate)
    if (limit !== undefined && hits.length >= limit) break
  }
  return hits
}

/** Eerste treffer, of null. Dit is wat `createLead` in `duplicate_of_id` zet. */
export function firstDuplicateId(candidates: DedupCandidate[], input: DedupInput): string | null {
  return filterDuplicates(candidates, input, 1)[0]?.id ?? null
}

/** Tekens die de PostgREST-`or`-syntax zouden breken, worden een wildcard. */
const pgrstSafe = (value: string) => value.replace(/[,()*.:"'\\%]/g, '*')

/**
 * Dezelfde regel, maar als PostgREST-`or`-filter zodat de database filtert en
 * niet het geheugen. Grof bedoeld: `filterDuplicates` blijft de laatste zeef.
 *
 * Let op: het telefoonsuffix is een LIKE met leidende wildcard en kan dus geen
 * index gebruiken. Efficiënt wordt dit pas met een functionele index op
 * `right(regexp_replace(customer_phone,'\D','','g'), 9)`.
 */
export function dedupOrFilter(input: DedupInput): string | null {
  const clauses: string[] = []

  const tail = phoneTail(input.phone)
  if (tail.length >= 8) {
    // Zonder scheidingstekens in de staart…
    clauses.push(`customer_phone.like.*${tail}`)
    // …en met willekeurige scheidingstekens ertussen (06-12 34 56 78).
    clauses.push(`customer_phone.like.*${tail.split('').join('*')}`)
  }

  const postal = normPostal(input.postalCode)
  const address = normAddress(input.address)
  if (postal && address) {
    const postalPattern = pgrstSafe(postal.replace(/^(\d{4})([A-Z]{2})$/, '$1*$2'))
    clauses.push(`and(postal_code.ilike.${postalPattern},address.ilike.${pgrstSafe(address)})`)
  }

  return clauses.length ? clauses.join(',') : null
}
