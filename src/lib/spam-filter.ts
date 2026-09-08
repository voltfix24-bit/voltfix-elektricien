// Eenvoudige spamdetectie voor publieke formulieren.
// Wordt zowel client-side (directe feedback) als server-side (harde blokkade)
// gebruikt, zodat SEO-/backlink-/reviewspam nooit in Telegram belandt.

import { isBlockedPhoneRegion } from './phone-region'

const SPAM_KEYWORDS = [
  'seo',
  'search engine optimi',
  'backlink',
  'back link',
  'link building',
  'linkbuilding',
  'guest post',
  'guestpost',
  'domain authority',
  'da/pa',
  'google ranking',
  'rank your website',
  'first page of google',
  'buy reviews',
  'reviews kopen',
  'google reviews',
  'trustpilot',
  'digital marketing',
  'marketing agency',
  'marketing bureau',
  'web design services',
  'website redesign',
  'app development',
  'software development company',
  'outsourcing',
  'offshore team',
  'dedicated developers',
  'cryptocurrency',
  'bitcoin',
  'forex',
  'investment opportunity',
  'lead generation service',
  'cold email',
  'bulk email',
  'whatsapp marketing',
  'social media growth',
  'followers',
  'increase traffic',
  'traffic to your website',
  'i came across your website',
  'i visited your website',
  'partnership proposal',
  'business proposal',
]

const URL_RE = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|io|xyz|info|biz|ru|cn|in)\b)/i

export type SpamCheckInput = {
  name?: string | null
  phone?: string | null
  email?: string | null
  message?: string | null
  jobType?: string | null
}

export type SpamCheckResult = { spam: false } | { spam: true; reason: string }

export function checkSpam(input: SpamCheckInput): SpamCheckResult {
  if (input.phone && isBlockedPhoneRegion(input.phone)) {
    return { spam: true, reason: 'phone_region' }
  }

  const haystack = [input.name, input.message, input.jobType, input.email]
    .filter(Boolean)
    .join(' \n ')
    .toLowerCase()

  if (!haystack) return { spam: false }

  for (const keyword of SPAM_KEYWORDS) {
    if (haystack.includes(keyword)) return { spam: true, reason: `keyword:${keyword}` }
  }

  // Links in het vrije tekstveld zijn bij een klusaanvraag vrijwel altijd spam.
  const message = (input.message ?? '').toLowerCase()
  if (URL_RE.test(message)) return { spam: true, reason: 'url_in_message' }

  return { spam: false }
}

export function spamMessage(locale: 'nl' | 'en'): string {
  return locale === 'en'
    ? 'Your message looks like an automated or commercial enquiry and was not sent. Please call us if this is a real job request.'
    : 'Uw bericht lijkt op een geautomatiseerde of commerciële aanvraag en is niet verstuurd. Bel ons gerust als het om een echte klus gaat.'
}
