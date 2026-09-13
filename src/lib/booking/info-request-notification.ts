/* Geen import nodig: labels staan hieronder expliciet. */

/**
 * Gedeeld contract voor de interne melding "aanvulling ontvangen".
 *
 * De databasefunctie schrijft deze payload; de meldingsverwerker leest hem.
 * Beide kanten gebruiken dit bestand, zodat een ontbrekend punt nooit meer als
 * `[object Object]` in een bericht belandt.
 */

export type ReportedMissing = { code: string; reason?: string | null }

export type InfoRequestReceivedPayload = {
  infoRequestRevision?: number
  receivedCategories?: unknown
  missingItems?: unknown
  callbackRequested?: unknown
}

const categoryLabels: Record<string, string> = {
  consumer_unit: 'Groepenkast',
  existing_outlet: 'Bestaand stopcontact',
  installation_location: 'Plek van de aansluiting',
  appliance_label: 'Typeplaatje / model',
  kitchen_plan: 'Keukentekening',
  other: 'Overig',
}

const reasonLabels: Record<string, string> = {
  dont_know: 'weet het niet',
  dont_have: 'heeft het niet',
  later: 'levert later aan',
}

export function categoryLabel(code: string): string {
  return categoryLabels[code] ?? code
}

/** Ontbrekende punten uit de database zijn objecten; hier worden het labels. */
export function missingLabels(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map(entry => {
      if (typeof entry === 'string') return itemLabel(entry)
      if (entry && typeof entry === 'object') {
        const row = entry as ReportedMissing
        const reason = row.reason ? reasonLabels[row.reason] ?? row.reason : null
        return row.code ? `${itemLabel(row.code)}${reason ? ` (${reason})` : ''}` : null
      }
      return null
    })
    .filter((label): label is string => Boolean(label))
}

export function receivedLabels(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((entry): entry is string => typeof entry === 'string').map(categoryLabel)
}

const itemLabels: Record<string, string> = {
  photo_consumer_unit: 'Foto groepenkast',
  photo_existing_outlet: 'Foto bestaand stopcontact',
  photo_installation_location: 'Foto plek van de aansluiting',
  photo_appliance_label: 'Foto typeplaatje / model',
  kitchen_plan: 'Keukentekening',
  socket_present_choice: 'Stopcontact aanwezig?',
  extra_question: 'Aanvullende vraag',
}

export function itemLabel(code: string): string {
  return itemLabels[code] ?? code
}
