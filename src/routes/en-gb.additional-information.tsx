import { createFileRoute } from '@tanstack/react-router'

import { InfoRequestPage } from '@/components/info-request/info-request-page'

/** Customer page for a targeted follow-up (EN). Requires a valid temporary link. */
export const Route = createFileRoute('/en-gb/additional-information')({
  ssr: false,
  head: () => ({
    meta: [
      { title: 'Additional information for your request | VoltFix' },
      { name: 'description', content: 'Send us the additional information we need for your VoltFix request.' },
      { name: 'robots', content: 'noindex, nofollow' },
      { name: 'referrer', content: 'no-referrer' },
      { property: 'og:title', content: 'Additional information for your request | VoltFix' },
      { property: 'og:description', content: 'Send us the additional information we need.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
    ],
  }),
  component: () => <InfoRequestPage language="en" />,
})
