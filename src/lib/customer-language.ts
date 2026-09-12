// Taal van de klant: bepaalt in welke taal we het reviewverzoek sturen.
// Puur en zonder afhankelijkheden zodat server én client hem kunnen gebruiken.

export type CustomerLanguage = 'nl' | 'en'

const DUTCH_HINTS = [
  'groepenkast',
  'stopcontact',
  'aardlek',
  'storing',
  'stroom',
  'meterkast',
  'laadpaal',
  'schakelaar',
  'verlichting',
  'graag',
  'alstublieft',
  'woning',
  'badkamer',
  'keuken',
  'zolder',
  'huis',
  'kapot',
  'vervangen',
  'aansluiten',
  'ik heb',
  'mijn',
  'niet',
  'wij',
  'kunnen jullie',
]

const ENGLISH_HINTS = [
  'fuse box',
  'fusebox',
  'socket',
  'outlet',
  'power outage',
  'breaker',
  'switch',
  'lighting',
  'please',
  'thanks',
  'apartment',
  'kitchen',
  'bathroom',
  'i have',
  'we have',
  'my ',
  'could you',
  'can you',
  'would like',
  'installation',
  'charging point',
  'ev charger',
]

function score(text: string, hints: string[]) {
  return hints.reduce((n, hint) => (text.includes(hint) ? n + 1 : n), 0)
}

/**
 * Bepaalt de taal van een binnenkomende aanvraag.
 * Volgorde: expliciete keuze > Engelse pagina (/en-gb/) > tekstanalyse > NL.
 */
export function detectCustomerLanguage(input: {
  explicit?: CustomerLanguage | null
  locale?: string | null
  sourcePath?: string | null
  jobType?: string | null
  description?: string | null
}): CustomerLanguage {
  if (input.explicit === 'nl' || input.explicit === 'en') return input.explicit
  if (input.locale === 'en') return 'en'
  if (input.locale === 'nl') return 'nl'

  const path = (input.sourcePath ?? '').toLowerCase()
  if (path.includes('/en-gb') || path.startsWith('en-gb')) return 'en'

  const text = `${input.jobType ?? ''} ${input.description ?? ''}`.toLowerCase()
  if (!text.trim()) return 'nl'
  const nl = score(text, DUTCH_HINTS)
  const en = score(text, ENGLISH_HINTS)
  if (en > nl) return 'en'
  return 'nl'
}

export const languageLabel = (lang: CustomerLanguage | null | undefined) =>
  lang === 'en' ? 'Engels' : 'Nederlands'
