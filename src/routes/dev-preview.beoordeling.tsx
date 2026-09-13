import { createFileRoute, notFound } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PerilexAssessmentPanel } from '@/components/admin/perilex-assessment-panel'
import { assessmentScenario, assessmentScenarios } from '@/lib/booking/perilex-assessment-fixtures'

/**
 * Visuele controle van het beoordelingspaneel met vaste, verzonnen data.
 *
 * De echte component wordt gerenderd, maar de gegevens komen uit een fixture:
 * geen database, geen bijlage-URL's, geen Telegrambericht. In een
 * productiebuild geeft deze route 404 en hij staat op noindex.
 */
export const Route = createFileRoute('/dev-preview/beoordeling')({
  ssr: false,
  beforeLoad: () => {
    if (import.meta.env.PROD) throw notFound()
  },
  head: () => ({
    meta: [
      { title: 'Beoordeling preview (dev only)' },
      { name: 'robots', content: 'noindex, nofollow' },
      { name: 'description', content: 'Local preview of the internal assessment panel with fixture data.' },
    ],
  }),
  component: AssessmentPreview,
})

function AssessmentPreview() {
  const params = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search)
  const [id, setId] = useState(params?.get('scenario') ?? 'fixed_price')
  const scenario = assessmentScenario(id)

  // Eigen cache per scenario: de vraag wordt nooit echt uitgevoerd.
  const client = useMemo(() => {
    const next = new QueryClient({
      defaultOptions: { queries: { staleTime: Infinity, gcTime: Infinity, retry: false, refetchOnMount: false, refetchOnWindowFocus: false } },
    })
    next.setQueryData(['admin', 'assessment', scenario.data.assessment ? (scenario.data.assessment as any).quote_request_id : ''], scenario.data)
    return next
  }, [scenario])

  return (
    <main className="mx-auto max-w-3xl p-4">
      <h1 className="text-xl font-extrabold">Beoordeling — lokale preview</h1>
      <p className="mt-1 text-[13px] text-muted-foreground">Verzonnen testdata. Niets wordt opgeslagen of verstuurd.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {assessmentScenarios.map(item => (
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
      <div className="mt-5 rounded-xl border border-border bg-card p-4">
        <QueryClientProvider client={client}>
          <PerilexAssessmentPanel
            key={scenario.id}
            quoteRequestId={(scenario.data.assessment as any).quote_request_id}
            phone={scenario.phone}
          />
        </QueryClientProvider>
      </div>
    </main>
  )
}
