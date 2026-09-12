import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { ChevronRight, ClipboardList, List, Plus, RefreshCw, Search, Send } from 'lucide-react'
import { toast } from 'sonner'
import { AdminNav, euro } from '@/components/admin/admin-nav'
import { UnifiedLeadForm } from '@/components/admin/unified-lead-form'
import { LeadSheet } from '@/components/admin/lead-sheet'
import { ReviewTextDialog } from '@/components/admin/review-text-dialog'
import { InstallAdminApp } from '@/components/admin/install-app'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { dispatchLead, listLeads } from '@/lib/admin.functions'
import { isEmergencyLead, isLeadOverdue } from '@/lib/lead-overdue'

export const Route = createFileRoute('/_authenticated/admin/leads')({
  head: () => ({
    meta: [
      { title: 'Leads beheren | VoltFix backoffice' },
      { name: 'description', content: 'Voer telefoon- en WhatsApp-leads in, volg ze op en stuur ze door naar Telegram.' },
      { name: 'robots', content: 'noindex, nofollow' },
      { property: 'og:title', content: 'Leads beheren | VoltFix backoffice' },
      { property: 'og:description', content: 'Leads invoeren en openstaande klussen opvolgen.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-title', content: 'VoltFix Leads' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
    ],
    links: [{ rel: 'manifest', href: '/admin.webmanifest' }],
  }),
  component: LeadsPage,
})

const STATUS_LABEL: Record<string, string> = { new: 'Open', dispatched: 'Doorgezet', claimed: 'Opgepakt', cancelled: 'Geannuleerd', spam_review: 'Spam-controle', blocked_spam: 'Spam geblokkeerd' }
type Filter = 'all' | 'open' | 'urgent' | 'overdue'
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Alles' },
  { key: 'open', label: 'Open' },
  { key: 'urgent', label: 'Spoed' },
  { key: 'overdue', label: 'Te laat' },
]

function LeadsPage() {
  const queryClient = useQueryClient()
  const fetchLeads = useServerFn(listLeads)
  const sendLead = useServerFn(dispatchLead)
  const [view, setView] = useState<'new' | 'list'>('new')
  const [filter, setFilter] = useState<Filter>('all')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [openLead, setOpenLead] = useState<string | null>(null)
  const [reviewLead, setReviewLead] = useState<any | null>(null)
  const [now, setNow] = useState(Date.now())

  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 60_000); return () => clearInterval(timer) }, [])
  useEffect(() => { const timer = setTimeout(() => setSearch(searchInput.trim()), 400); return () => clearTimeout(timer) }, [searchInput])

  const leadsQuery = useInfiniteQuery({
    queryKey: ['admin', 'leads', filter, search],
    initialPageParam: null as { created_at: string; id: string } | null,
    queryFn: ({ pageParam }) => fetchLeads({ data: { status: filter, search, cursor: pageParam, limit: 25 } }),
    getNextPageParam: (last) => last.nextCursor,
    refetchInterval: 60_000,
  })
  const rows = (leadsQuery.data?.pages ?? []).flatMap((page) => page.rows)

  const dispatchMut = useMutation({
    mutationFn: (leadId: string) => sendLead({ data: { leadId } }),
    onSuccess: () => { toast.success('Naar Telegram verstuurd.'); queryClient.invalidateQueries({ queryKey: ['admin', 'leads'] }) },
    onError: () => toast.error('Versturen mislukt. Probeer opnieuw.'),
  })

  return (
    <div className="admin-mobile min-h-dvh bg-background">
      <AdminNav />
      <main className="mx-auto max-w-4xl px-4 py-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:py-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Leads</h1>
          <InstallAdminApp />
        </div>

        <div role="tablist" aria-label="Leadweergave" className="mb-6 grid grid-cols-2 gap-2 border-b border-border pb-4 sm:max-w-md">
          <Button role="tab" aria-selected={view === 'new'} aria-controls="new-lead-panel" id="new-lead-tab" variant={view === 'new' ? 'default' : 'outline'} className="min-h-12" onClick={() => setView('new')}><Plus className="size-4" /> Nieuwe lead</Button>
          <Button role="tab" aria-selected={view === 'list'} aria-controls="lead-list-panel" id="lead-list-tab" variant={view === 'list' ? 'default' : 'outline'} className="min-h-12" onClick={() => setView('list')}><List className="size-4" /> Overzicht</Button>
        </div>

        <div role="tabpanel" aria-labelledby="new-lead-tab" id="new-lead-panel" hidden={view !== 'new'} className="max-w-2xl">
          <UnifiedLeadForm />
        </div>

        <section role="tabpanel" aria-labelledby="lead-list-tab" id="lead-list-panel" hidden={view !== 'list'}>
          <div className="sticky top-0 z-10 -mx-4 mb-4 border-b border-border bg-background px-4 pb-3 pt-1">
            <div className="mb-3 flex items-center gap-2">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input type="search" aria-label="Zoek in leads" placeholder="Naam, telefoon, postcode of plaats" className="pl-9 text-base" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} />
              </div>
              <Button variant="outline" size="icon" className="min-h-12 min-w-12" aria-label="Leads vernieuwen" disabled={leadsQuery.isFetching} onClick={() => leadsQuery.refetch()}><RefreshCw className={leadsQuery.isFetching ? 'size-4 animate-spin' : 'size-4'} /></Button>
            </div>
            <div role="group" aria-label="Filter op status" className="flex gap-2 overflow-x-auto">
              {FILTERS.map((item) => (
                <Button key={item.key} size="sm" className="min-h-11 shrink-0 rounded-full" aria-pressed={filter === item.key} variant={filter === item.key ? 'default' : 'outline'} onClick={() => setFilter(item.key)}>{item.label}</Button>
              ))}
            </div>
          </div>

          {leadsQuery.isLoading && <p role="status">Leads laden…</p>}
          {leadsQuery.error && <p role="alert" className="text-destructive">Leads ophalen mislukt. Vernieuw of log opnieuw in.</p>}
          {!leadsQuery.isLoading && !rows.length && <p className="py-6 text-muted-foreground">Geen leads gevonden.</p>}

          <ul className="space-y-3">
            {rows.map((lead: any) => (
              <li key={lead.id}>
                <article className="min-w-0 rounded-lg border border-border bg-card">
                  <button type="button" className="flex w-full min-w-0 items-start gap-3 p-4 text-left" aria-label={`Open lead van ${lead.customer_name}`} onClick={() => setOpenLead(lead.id)}>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="min-w-0 break-words font-semibold">{lead.customer_name}</span>
                        {lead.city && <span className="text-sm text-muted-foreground">{lead.city}</span>}
                        {isEmergencyLead(lead) && <Badge variant="destructive">Spoed</Badge>}
                        {isLeadOverdue(lead, now) && <Badge variant="destructive">Te laat</Badge>}
                        {lead.customer_language === 'en' && <Badge variant="outline">EN</Badge>}
                      </div>
                      <p className="mt-1 break-words text-sm">{lead.job_type}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant={lead.status === 'claimed' ? 'default' : 'secondary'}>{STATUS_LABEL[lead.status] ?? lead.status}</Badge>
                        <span>{euro(lead.price_cents)}</span>
                        <span>{new Date(lead.created_at).toLocaleString('nl-NL', { dateStyle: 'short', timeStyle: 'short' })}</span>
                        {lead.contractors?.name && <span>{lead.contractors.name}</span>}
                      </div>
                    </div>
                    <ChevronRight className="mt-1 size-5 shrink-0 text-muted-foreground" aria-hidden />
                  </button>
                  <div className="flex flex-wrap gap-1 border-t border-border px-4 py-2">
                    {lead.status !== 'claimed' && (
                      <Button size="sm" variant="ghost" className="min-h-12" disabled={dispatchMut.isPending} onClick={() => dispatchMut.mutate(lead.id)}>
                        <Send className="size-4" />{lead.status === 'dispatched' ? 'Opnieuw sturen' : 'Naar Telegram'}
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="min-h-12" onClick={() => setReviewLead(lead)}>
                      <ClipboardList className="size-4" /> Review tekst
                    </Button>
                  </div>
                </article>
              </li>
            ))}
          </ul>

          {leadsQuery.hasNextPage && (
            <Button variant="outline" className="mt-4 min-h-12 w-full" disabled={leadsQuery.isFetchingNextPage} onClick={() => leadsQuery.fetchNextPage()}>
              {leadsQuery.isFetchingNextPage ? 'Laden…' : 'Meer leads laden'}
            </Button>
          )}
        </section>
      </main>

      <LeadSheet leadId={openLead} onClose={() => setOpenLead(null)} />
      {reviewLead && (
        <ReviewTextDialog
          open={Boolean(reviewLead)}
          onOpenChange={(open) => !open && setReviewLead(null)}
          leadId={reviewLead.id}
          customerName={reviewLead.customer_name}
          customerPhone={reviewLead.customer_phone}
          jobType={reviewLead.job_type}
          city={reviewLead.city}
          monteurName={reviewLead.contractors?.name}
          reviewRequested={Boolean(reviewLead.review_requested_at)}
          language={reviewLead.customer_language}
        />
      )}
    </div>
  )
}
