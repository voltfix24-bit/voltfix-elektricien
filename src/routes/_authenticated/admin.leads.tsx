import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { ClipboardList, List, MessageCircle, Phone, Plus, RefreshCw, Search, Send } from 'lucide-react'
import { toast } from 'sonner'
import { euro } from '@/components/admin/admin-nav'
import { AdminShell } from '@/components/admin/admin-shell'
import { UnifiedLeadForm } from '@/components/admin/unified-lead-form'
import { LeadSheet } from '@/components/admin/lead-sheet'
import { ReviewTextDialog } from '@/components/admin/review-text-dialog'
import { InstallAdminApp } from '@/components/admin/install-app'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { dispatchLead, listLeads } from '@/lib/admin.functions'
import { isEmergencyLead, isLeadOverdue } from '@/lib/lead-overdue'
import { needsReminder } from '@/lib/review-followup'

export const Route = createFileRoute('/_authenticated/admin/leads')({
  validateSearch: (search: Record<string, unknown>): { q?: string } => {
    const q = typeof search['q'] === 'string' ? search['q'].slice(0, 100) : ''
    return q ? { q } : {}
  },
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

const STATUS_VARIANT: Record<string, 'outline' | 'default' | 'success' | 'secondary' | 'warning' | 'destructive'> = {
  new: 'outline',
  dispatched: 'default',
  claimed: 'success',
  cancelled: 'secondary',
  spam_review: 'warning',
  blocked_spam: 'destructive',
}

function phoneHref(phone: string | null) {
  return `tel:${String(phone ?? '').replace(/[^+\d]/g, '')}`
}

function waHref(phone: string | null) {
  return `https://wa.me/${String(phone ?? '').replace(/\D/g, '').replace(/^0/, '31')}`
}

function isOpenLead(lead: any) {
  return !['claimed', 'cancelled', 'blocked_spam'].includes(lead.status)
}

function openSinceAnchor(lead: any) {
  return lead.dispatched_at ? Date.parse(lead.dispatched_at) : Date.parse(lead.created_at)
}

function openSinceText(lead: any, now: number) {
  const minutes = Math.floor((now - openSinceAnchor(lead)) / 60_000)
  if (minutes < 60) return `open sinds ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `open sinds ${hours} u`
  const days = Math.floor(hours / 24)
  return `open sinds ${days} d`
}

function openSinceColor(lead: any, now: number) {
  const thresholdMs = (isEmergencyLead(lead) ? 1 : 24) * 3_600_000
  const elapsed = now - openSinceAnchor(lead)
  if (elapsed > thresholdMs) return 'text-destructive'
  if (elapsed > thresholdMs / 2) return 'text-warning'
  return 'text-muted-foreground'
}

/** Zelfde retrylimiet als de bezorgwachtrij; hier alleen om "x van y" te tonen. */
const MAX_DISPATCH_ATTEMPTS = 6

/** Alleen tonen wanneer er iets aan de hand is — geslaagd zegt de statusbadge al. */
function dispatchBadge(dispatch: any): { variant: 'secondary' | 'warning' | 'destructive'; label: string } | null {
  if (!dispatch || dispatch.state === 'sent') return null
  if (dispatch.state === 'queued') return { variant: 'secondary', label: 'In wachtrij' }
  if (dispatch.attempts >= MAX_DISPATCH_ATTEMPTS) return { variant: 'destructive', label: 'Verzenden mislukt' }
  return { variant: 'warning', label: `Poging ${dispatch.attempts} van ${MAX_DISPATCH_ATTEMPTS}` }
}

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
    onSuccess: (_result, leadId) => {
      toast.success('Naar Telegram verstuurd.')
      // Foutbadge meteen weg, zonder de hele lijst opnieuw op te halen.
      queryClient.setQueryData(['admin', 'leads', filter, search], (old: any) =>
        old
          ? {
              ...old,
              pages: old.pages.map((page: any) => ({
                ...page,
                rows: page.rows.map((row: any) =>
                  row.id === leadId
                    ? { ...row, status: row.status === 'new' ? 'dispatched' : row.status, dispatch: row.dispatch ? { ...row.dispatch, state: 'sent', lastError: null } : null }
                    : row,
                ),
              })),
            }
          : old,
      )
      queryClient.invalidateQueries({ queryKey: ['admin', 'leads'], refetchType: 'none' })
    },
    onError: () => toast.error('Versturen mislukt. Probeer opnieuw.'),
  })
  const sendingLeadId = dispatchMut.isPending ? (dispatchMut.variables as string | undefined) : undefined

  return (
    <AdminShell title="Leads" context="Telefoon- en WhatsApp-leads invoeren en opvolgen." actions={<InstallAdminApp />}>

        <div role="tablist" aria-label="Leadweergave" className="mb-6 grid grid-cols-2 gap-2 border-b border-border pb-4 sm:max-w-md">
          <Button role="tab" aria-selected={view === 'new'} aria-controls="new-lead-panel" id="new-lead-tab" variant={view === 'new' ? 'default' : 'outline'} className="min-h-12" onClick={() => setView('new')}><Plus className="size-4" /> Nieuwe lead</Button>
          <Button role="tab" aria-selected={view === 'list'} aria-controls="lead-list-panel" id="lead-list-tab" variant={view === 'list' ? 'default' : 'outline'} className="min-h-12" onClick={() => setView('list')}><List className="size-4" /> Overzicht</Button>
        </div>

        <div role="tabpanel" aria-labelledby="new-lead-tab" id="new-lead-panel" hidden={view !== 'new'} className="max-w-2xl">
          <UnifiedLeadForm onOpenLead={(id) => setOpenLead(id)} />
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

          {leadsQuery.isLoading && (
            <>
              <span className="sr-only" role="status">Leads laden</span>
              <ul className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <li key={i}>
                    <article className="min-w-0 rounded-xl border border-border bg-card">
                      <div className="flex gap-3 p-4">
                        <div className="min-w-0 flex-1 space-y-3">
                          <Skeleton className="h-5 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                          <div className="flex gap-2">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col gap-2">
                          <Skeleton className="h-12 w-12 rounded-md" />
                          <Skeleton className="h-12 w-12 rounded-md" />
                        </div>
                      </div>
                      <div className="flex gap-1 border-t border-border px-4 py-2">
                        <Skeleton className="h-12 w-28 rounded-md" />
                        <Skeleton className="h-12 w-28 rounded-md" />
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            </>
          )}
          {leadsQuery.error && <p role="alert" className="text-destructive">Leads ophalen mislukt. Vernieuw of log opnieuw in.</p>}
          {!leadsQuery.isLoading && !rows.length && <p className="py-6 text-muted-foreground">Geen leads gevonden.</p>}

          <ul className="divide-y divide-border border-y border-border">
            {rows.map((lead: any) => {
              const overdue = isLeadOverdue(lead, now)
              const urgent = isEmergencyLead(lead)
              const badge = dispatchBadge(lead.dispatch)
              const accent = overdue || urgent ? 'bg-destructive' : badge ? 'bg-warning' : 'bg-border'
              const meta = [lead.job_type, lead.city].filter(Boolean).join(' · ')
              const signal = overdue
                ? `Te laat · ${openSinceText(lead, now).replace('open sinds ', '')}`
                : urgent
                  ? `Spoed · ${openSinceText(lead, now).replace('open sinds ', '')}`
                  : badge
                    ? badge.label
                    : lead.contractors?.name
                      ? `${lead.contractors.name} · ${openSinceText(lead, now).replace('open sinds ', '')}`
                      : isOpenLead(lead)
                        ? openSinceText(lead, now)
                        : new Date(lead.created_at).toLocaleString('nl-NL', { dateStyle: 'short', timeStyle: 'short' })
              return (
                <li key={lead.id} className="relative">
                  <span aria-hidden className={`absolute inset-y-0 left-0 w-[3px] ${accent}`} />
                  <div className="flex min-w-0 items-start gap-3 py-[13px] pl-[15px] pr-[15px]">
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      aria-label={`Open lead van ${lead.customer_name}`}
                      onClick={() => setOpenLead(lead.id)}
                    >
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <span className="min-w-0 break-words text-[14.5px] font-bold">{lead.customer_name}</span>
                        <Badge variant={STATUS_VARIANT[lead.status] ?? 'secondary'} className="text-[11.5px] font-bold">{STATUS_LABEL[lead.status] ?? lead.status}</Badge>
                        <Badge variant="secondary" className="text-[11.5px] font-bold" title={lead.customer_language === 'en' ? 'Engelstalige klant' : 'Nederlandstalige klant'}>{lead.customer_language === 'en' ? 'EN' : 'NL'}</Badge>
                      </div>
                      {meta && <p className="mt-1 break-words text-[13px] text-muted-foreground">{meta}</p>}
                      <p className={`mt-1 text-[11.5px] font-bold tabular-nums ${overdue || urgent ? 'text-destructive' : badge ? 'text-warning' : openSinceColor(lead, now)}`}>
                        {signal}
                        <span className="font-normal text-muted-foreground"> · {euro(lead.price_cents)}</span>
                      </p>
                    </button>
                    <div className="flex shrink-0 flex-col gap-2">
                      <Button asChild variant="call" size="icon" className="size-12 rounded-lg md:size-11" aria-label={`Bel ${lead.customer_name}`} onClick={(event) => event.stopPropagation()}>
                        <a href={phoneHref(lead.customer_phone)}><Phone className="size-5" /></a>
                      </Button>
                      <Button asChild variant="whatsapp" size="icon" className="size-12 rounded-lg md:size-11" aria-label={`WhatsApp ${lead.customer_name}`} onClick={(event) => event.stopPropagation()}>
                        <a href={waHref(lead.customer_phone)} target="_blank" rel="noreferrer"><MessageCircle className="size-5" /></a>
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 pb-2 pl-[11px] pr-[15px]">
                    {lead.status !== 'claimed' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="min-h-11 text-[13px]"
                        disabled={dispatchMut.isPending}
                        aria-busy={sendingLeadId === lead.id}
                        title={lead.dispatch?.state === 'failed' && lead.dispatch.lastError ? `Vorige poging mislukt: ${lead.dispatch.lastError}` : undefined}
                        onClick={() => dispatchMut.mutate(lead.id)}
                      >
                        <Send className="size-4" />
                        {lead.dispatch?.state === 'failed' ? 'Opnieuw versturen' : lead.status === 'dispatched' ? 'Opnieuw sturen' : 'Naar Telegram'}
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="min-h-11 text-[13px]" onClick={() => setReviewLead({ row: lead, mode: 'request' })}>
                      <ClipboardList className="size-4" /> Review tekst
                    </Button>
                    {needsReminder(lead) && (
                      <Button size="sm" variant="ghost" className="min-h-11 text-[13px] text-warning" onClick={() => setReviewLead({ row: lead, mode: 'reminder' })}>
                        Stuur herinnering
                      </Button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>

          {leadsQuery.hasNextPage && (
            <Button variant="outline" className="mt-4 min-h-12 w-full" disabled={leadsQuery.isFetchingNextPage} onClick={() => leadsQuery.fetchNextPage()}>
              {leadsQuery.isFetchingNextPage ? 'Laden…' : 'Meer leads laden'}
            </Button>
          )}
        </section>

      <LeadSheet leadId={openLead} onClose={() => setOpenLead(null)} />
      {reviewLead && (
        <ReviewTextDialog
          key={`${reviewLead.row.id}-${reviewLead.mode}`}
          open={Boolean(reviewLead)}
          onOpenChange={(open) => !open && setReviewLead(null)}
          mode={reviewLead.mode}
          leadId={reviewLead.row.id}
          customerName={reviewLead.row.customer_name}
          customerPhone={reviewLead.row.customer_phone}
          jobType={reviewLead.row.job_type}
          city={reviewLead.row.city}
          monteurName={reviewLead.row.contractors?.name}
          reviewRequested={Boolean(reviewLead.row.review_requested_at)}
          language={reviewLead.row.customer_language}
          onMarked={() => queryClient.invalidateQueries({ queryKey: ['admin', 'leads'] })}
        />
      )}
    </AdminShell>
  )
}
