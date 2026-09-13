import { createFileRoute } from '@tanstack/react-router'

import { InfoRequestPage } from '@/components/info-request/info-request-page'

/**
 * Klantpagina voor een gerichte aanvulling (NL). Alleen bereikbaar met een
 * geldige tijdelijke link; zonder sessie toont hij een neutrale melding.
 * Niet indexeerbaar en zonder verwijzende links vanuit de site.
 */
export const Route = createFileRoute('/aanvullen')({
  ssr: false,
  head: () => ({
    meta: [
      { title: 'Aanvulling op je aanvraag | VoltFix' },
      { name: 'description', content: 'Lever hier de gevraagde aanvullende informatie voor je VoltFix-aanvraag aan.' },
      { name: 'robots', content: 'noindex, nofollow' },
      { name: 'referrer', content: 'no-referrer' },
      { property: 'og:title', content: 'Aanvulling op je aanvraag | VoltFix' },
      { property: 'og:description', content: 'Lever de gevraagde aanvullende informatie aan.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
    ],
  }),
  component: () => <InfoRequestPage language="nl" />,
})
