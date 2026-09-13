import { createFileRoute, notFound } from '@tanstack/react-router'
import { useState } from 'react'

import { InfoRequestPage } from '@/components/info-request/info-request-page'
import { infoRequestPreviewScenario, infoRequestPreviewScenarios } from '@/lib/booking/info-request-fixtures'

/**
 * Visuele controle van de klantaanvulling met vaste, verzonnen data.
 * Geen database, geen token, geen upload, geen bericht. In een productiebuild
 * geeft deze route 404 en hij staat op noindex.
 */
export const Route = createFileRoute('/dev-preview/aanvullen')({
  ssr: false,
  beforeLoad: () => {
    if (import.meta.env.PROD) throw notFound()
  },
  head: () => ({
    meta: [
      { title: 'Aanvulling preview (dev only)' },
      { name: 'robots', content: 'noindex, nofollow' },
      { name: 'description', content: 'Local preview of the customer follow-up page with fixture data.' },
    ],
  }),
  component: Preview,
})

function Preview() {
  const params = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search)
  const [id, setId] = useState(params?.get('scenario') ?? 'nl_open')
  const scenario = infoRequestPreviewScenario(id)

  return (
    <div>
      <div className="flex flex-wrap gap-2 border-b border-border px-4 py-3" data-preview-chrome>
        {infoRequestPreviewScenarios.map(item => (
          <button
            key={item.id}
            type="button"
            aria-pressed={item.id === scenario.id}
            onClick={() => setId(item.id)}
            className={`min-h-12 rounded-full border px-4 text-[13.5px] font-semibold ${item.id === scenario.id ? 'border-primary bg-secondary text-primary' : 'border-input'}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <InfoRequestPage key={scenario.id} language={scenario.state.language} previewState={scenario.state as never} />
    </div>
  )
}
