/**
 * De datumvoorkeur van de klant komt als losse zin in de omschrijving binnen
 * (er is geen apart veld in de intake). Hier halen we die zin eruit, zodat het
 * dossier "klant wil" naast "afgesproken" kan tonen.
 */

const MARKERS = [
  'voorkeur', 'liefst', 'graag', 'bij voorkeur', 'wil ', 'kan alleen', 'schikt',
  'beschikbaar', 'preferably', 'prefers', 'available', 'would like',
]

const WHEN = [
  'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag',
  'vandaag', 'morgen', 'overmorgen', 'ochtend', 'middag', 'avond', 'weekend',
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  'today', 'tomorrow', 'morning', 'afternoon', 'evening',
]

const TIME = /\b\d{1,2}([:.]\d{2})?\s*(uur|u|am|pm)\b|\b\d{1,2}[-/]\d{1,2}\b/i

/** Eerste zin uit de omschrijving die over een gewenst moment gaat, of null. */
export function extractDatePreference(description?: string | null): string | null {
  if (!description) return null
  const sentences = String(description)
    .split(/(?<=[.!?\n])\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
  for (const sentence of sentences) {
    const lower = sentence.toLowerCase()
    const hasMarker = MARKERS.some((marker) => lower.includes(marker))
    const hasWhen = WHEN.some((word) => lower.includes(word)) || TIME.test(lower)
    if (hasMarker && hasWhen) return sentence.length > 160 ? `${sentence.slice(0, 157)}…` : sentence
  }
  return null
}
