import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ClipboardList, List, MessageCircle, Phone, Plus, RefreshCw, Search, Send } from 'lucide-react'
import { toast } from 'sonner'
import { euro } from '@/components/admin/admin-nav'
import { AdminShell } from '@/components/admin/admin-shell'
import { UnifiedLeadForm } from '@/components/admin/unified-lead-form'
import { LeadDetail, LeadSheet } from '@/components/admin/lead-sheet'
import { ReviewTextDialog } from '@/components/admin/review-text-dialog'
import { InstallAdminApp } from '@/components/admin/install-app'
import { BulkBar } from '@/components/admin/bulk-bar'
import { Pagination } from '@/components/admin/pagination'
import { ViewPicker } from '@/components/admin/view-picker'
import { actionError, EmptyState, ListError } from '@/components/admin/list-ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  bulkLeadAction,
  deleteAdminView,
  dispatchLead,
  listAdminViews,
  listContractors,
  listLeads,
  markFirstContact,
  saveAdminView,
} from '@/lib/admin.functions'
import { leadUrgency, openSinceColor, openSinceText, URGENCY_BORDER, urgencyLine } from '@/lib/lead-overdue'
import { LeadStatusBadge } from '@/components/admin/lead-status-badge'
import { useMediaQuery } from '@/lib/use-media-query'
import { useSelection } from '@/lib/use-selection'
import { needsReminder } from '@/lib/review-followup'
import {
  BUILTIN_VIEWS,
  FILTER_LABEL,
  isBuiltin,
  SORT_LABEL,
  type LeadFilter,
  type LeadSort,
  type ViewFilters,
} from '@/lib/admin-views'

const PAGE_SIZE = 50

const FILTERS: LeadFilter[] = ['all', 'open', 'urgent', 'overdue', 'no-outcome']
const SORTS: LeadSort[] = ['newest', 'oldest', 'urgency']

type Search = {
  q?: string
  view?: 'list'
  lead?: string
  quote?: string
  page?: number
  filter?: LeadFilter
  sort?: LeadSort
  viewId?: string
}

export const Route = createFileRoute('/_authenticated/admin/leads')({
  validateSearch: (search: Record<string, unknown>): Search => {
    const q = typeof search['q'] === 'string' ? search['q'].slice(0, 100) : ''
    const view = search['view'] === 'list' ? ('list' as const) : undefined
    const uuid = /^[0-9a-f-]{36}$/i
    const lead = typeof search['lead'] === 'string' && uuid.test(search['lead']) ? search['lead'] : undefined
    // Oudere interne links wijzen naar het aanvraag-ID; dat lossen we in de
    // pagina op naar de juiste lead.
    const quote = typeof search['quote'] === 'string' && uuid.test(search['quote']) ? search['quote'] : undefined
    const pageRaw = Number(search['page'])
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.min(Math.floor(pageRaw), 10000) : undefined
    const filter = FILTERS.includes(search['filter'] as LeadFilter) ? (search['filter'] as LeadFilter) : undefined
    const sort = SORTS.includes(search['sort'] as LeadSort) ? (search['sort'] as LeadSort) : undefined
    const viewId = typeof search['viewId'] === 'string' ? search['viewId'].slice(0, 60) : undefined
    return {
      ...(q ? { q } : {}),
      ...(view ? { view } : {}),
      ...(lead ? { lead } : {}),
      ...(quote ? { quote } : {}),
      ...(page ? { page } : {}),
      ...(filter ? { filter } : {}),
      ...(sort ? { sort } : {}),
      ...(viewId ? { viewId } : {}),
    }
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

function phoneHref(phone: string | null) {
  return `tel:${String(phone ?? '').replace(/[^+\d]/g, '')}`
}

function waHref(phone: string | null) {
  return `https://wa.me/${String(phone ?? '').replace(/\D/g, '').replace(/^0/, '31')}`
}

function isOpenLead(lead: any) {
  return !['claimed', 'cancelled', 'blocked_spam'].includes(lead.status)
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

type BulkAction = 'dispatch' | 'assign' | 'spam' | 'cancel'

/** Alleen bevestigen wat je niet kunt terugdraaien. */
const NEEDS_CONFIRM: Record<BulkAction, boolean> = { dispatch: false, assign: false, spam: true, cancel: true }

const CONFIRM_TEXT: Record<'spam' | 'cancel', { title: (n: number) => string; body: string; action: string }> = {
  spam: {
    title: (n) => `${n} leads als spam markeren?`,
    body: 'Ze verdwijnen uit de werklijst en gaan niet meer naar Telegram. Dit kun je niet terugdraaien.',
    action: 'Als spam markeren',
  },
  cancel: {
    title: (n) => `${n} leads annuleren?`,
    body: 'Geannuleerde leads worden niet meer opgevolgd. Dit kun je niet terugdraaien.',
    action: 'Annuleren',
  },
}

function LeadsPage() {
  const queryClient = useQueryClient()
  const fetchLeads = useServerFn(listLeads)
  const sendLead = useServerFn(dispatchLead)
  const runBulk = useServerFn(bulkLeadAction)
  const fetchViews = useServerFn(listAdminViews)
  const storeView = useServerFn(saveAdminView)
  const removeView = useServerFn(deleteAdminView)
  const fetchContractors = useServerFn(listContractors)
  const firstContact = useServerFn(markFirstContact)
  const { q = '', view: viewParam, lead: leadParam, page = 0, filter = 'all', sort = 'newest', viewId } = Route.useSearch()
  const navigate = useNavigate()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [view, setView] = useState<'new' | 'list'>(q || viewParam === 'list' ? 'list' : 'new')
  const [searchInput, setSearchInput] = useState(q)
  const [reviewLead, setReviewLead] = useState<any | null>(null)
  const [now, setNow] = useState(Date.now())
  const [confirm, setConfirm] = useState<'spam' | 'cancel' | null>(null)
  const [assignOpen, setAssignOpen] = useState(false)
  const [assignTo, setAssignTo] = useState('')
  const [saveOpen, setSaveOpen] = useState(false)
  const [saveName, setSaveName] = useState('')

  const filters: ViewFilters = { filter, search: q, sort }

  const patchSearch = (patch: Partial<Search>, replace = true) =>
    navigate({ to: '.', search: (prev: any) => ({ ...prev, view: 'list', ...patch }), replace })

  // Selectie staat in de URL zodat een gedeelde link het juiste detail opent.
  const setOpenLead = (id: string | null) =>
    navigate({
      to: '.',
      search: (prev: any) => ({ ...prev, view: 'list', ...(id ? { lead: id } : { lead: undefined }) }),
      replace: !id,
    })

  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 60_000); return () => clearInterval(timer) }, [])
  // Zoekterm in de URL: een gedeelde weergave levert bij een ander exact dezelfde lijst.
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchInput.trim()
      if (trimmed !== q) patchSearch({ q: trimmed || undefined, page: undefined })
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput])
  useEffect(() => { setSearchInput(q) }, [q])
  useEffect(() => {
    if (!q && viewParam !== 'list') return
    setView('list')
  }, [q, viewParam])

  const leadsQuery = useQuery({
    queryKey: ['admin', 'leads', filter, q, sort, page],
    queryFn: () => fetchLeads({ data: { status: filter, search: q, sort, page, limit: PAGE_SIZE } }),
    refetchInterval: 60_000,
  })
  const rows = (leadsQuery.data?.rows ?? []) as any[]
  const total = leadsQuery.data?.total ?? 0

  const visibleIds = useMemo(() => rows.map((row) => String(row.id)), [rows])
  const selection = useSelection(visibleIds)

  // Selectie geldt alleen voor de zichtbare pagina; bij wisselen wissen we hem
  // en zeggen we dat ook. Vasthouden over pagina's leidt tot bulkacties op
  // leads die je niet meer in beeld had.
  const shownPage = useRef(page)
  useEffect(() => {
    if (shownPage.current === page) return
    shownPage.current = page
    if (selection.count > 0) {
      selection.clear()
      toast('Selectie gewist bij het wisselen van pagina')
    }
  }, [page, selection])

  const viewsQuery = useQuery({ queryKey: ['admin', 'views'], queryFn: () => fetchViews() })
  const savedViews = ((viewsQuery.data ?? []) as any[]).map((row) => ({
    id: String(row.id),
    name: String(row.name),
    filters: row.filters as ViewFilters,
    is_shared: Boolean(row.is_shared),
  }))
  const allViews = [...BUILTIN_VIEWS, ...savedViews]
  const activeView = allViews.find((item) => item.id === viewId) ?? null

  const contractorsQuery = useQuery({
    queryKey: ['admin', 'contractors', 'assign'],
    queryFn: () => fetchContractors(),
    enabled: assignOpen,
  })

  const applyView = (id: string | null) => {
    const picked = id ? allViews.find((item) => item.id === id) : null
    if (!picked) {
      patchSearch({ viewId: undefined, filter: undefined, q: undefined, sort: undefined, page: undefined }, false)
      return
    }
    patchSearch(
      {
        viewId: picked.id,
        filter: picked.filters.filter === 'all' ? undefined : picked.filters.filter,
        q: picked.filters.search || undefined,
        sort: picked.filters.sort === 'newest' ? undefined : picked.filters.sort,
        page: undefined,
      },
      false,
    )
  }

  const saveViewMut = useMutation({
    mutationFn: (input: { id: string | null; name: string }) =>
      storeView({ data: { id: input.id, name: input.name, filters, isShared: true } }),
    onSuccess: (result: any, input) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'views'] })
      toast.success(input.id ? 'Weergave bijgewerkt.' : 'Weergave bewaard.')
      setSaveOpen(false)
      setSaveName('')
      if (!input.id && result?.id) patchSearch({ viewId: String(result.id) }, false)
    },
    onError: () => actionError('Weergave niet bewaard.'),
  })

  const deleteViewMut = useMutation({
    mutationFn: (id: string) => removeView({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'views'] })
      patchSearch({ viewId: undefined }, false)
      toast.success('Weergave verwijderd.')
    },
    onError: () => actionError('Weergave niet verwijderd.'),
  })

  const dispatchMut = useMutation({
    mutationFn: (leadId: string) => sendLead({ data: { leadId } }),
    onSuccess: () => {
      toast.success('Naar Telegram verstuurd.')
      queryClient.invalidateQueries({ queryKey: ['admin', 'leads'] })
    },
    onError: () => actionError('Niet verzonden naar Telegram.'),
  })
  const sendingLeadId = dispatchMut.isPending ? (dispatchMut.variables as string | undefined) : undefined

  // Bellen of WhatsApp vanuit de lijst telt net zo goed als eerste contact
  // als vanuit het detailpaneel; anders is de mediaan te rooskleurig.
  const contactMut = useMutation({
    mutationFn: (input: { leadId: string; channel: 'call' | 'whatsapp' }) => firstContact({ data: input }),
    onSuccess: (result: any) => {
      if (result?.marked) queryClient.invalidateQueries({ queryKey: ['admin', 'leads'] })
    },
    onError: () => {
      // Het contact gaat door; alleen de meting mist. Geen melding aan de gebruiker.
    },
  })

  const bulkMut = useMutation({
    mutationFn: (input: { action: BulkAction; ids: string[]; contractorId?: string }) =>
      runBulk({ data: { action: input.action, ids: input.ids, contractorId: input.contractorId ?? null } }),
    onSuccess: (result: any, input) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'leads'] })
      const ok = (result?.ok ?? []) as string[]
      const failed = (result?.failed ?? []) as string[]
      const verb = input.action === 'dispatch' ? 'verzonden' : 'verwerkt'
      if (failed.length === 0) {
        toast.success(`${ok.length} ${verb}`)
        selection.clear()
        return
      }
      // Mislukte gevallen blijven geselecteerd, zodat je ze meteen opnieuw kunt proberen.
      selection.keepOnly(failed)
      toast.error(`${ok.length} ${verb} · ${failed.length} mislukt`, {
        description: 'De mislukte leads staan nog geselecteerd.',
        style: { borderColor: 'var(--destructive)' },
      })
    },
    onError: () => actionError('Bulkactie niet uitgevoerd.'),
  })

  const startBulk = (action: BulkAction) => {
    const ids = [...selection.selected]
    if (!ids.length) return
    if (action === 'assign') { setAssignOpen(true); return }
    if (NEEDS_CONFIRM[action]) { setConfirm(action as 'spam' | 'cancel'); return }
    bulkMut.mutate({ action, ids })
  }

  const filtersActive = filter !== 'all' || Boolean(q)
  const clearFilters = () => patchSearch({ filter: undefined, q: undefined, page: undefined, viewId: undefined }, false)

  // Op brede schermen is zonder expliciete selectie de bovenste lead geselecteerd.
  const selectedLeadId = leadParam ?? (isDesktop && rows.length ? rows[0].id : null)

  return (
    <AdminShell title="Leads" context="Telefoon- en WhatsApp-leads invoeren en opvolgen." actions={<InstallAdminApp />}>

        <div role="tablist" aria-label="Leadweergave" className="mb-6 grid grid-cols-2 gap-2 border-b border-border pb-4 sm:max-w-md">
          <Button role="tab" aria-selected={view === 'new'} aria-controls="new-lead-panel" id="new-lead-tab" variant={view === 'new' ? 'default' : 'outline'} className="min-h-12" onClick={() => setView('new')}><Plus className="size-4" /> Nieuwe lead</Button>
          <Button role="tab" aria-selected={view === 'list'} aria-controls="lead-list-panel" id="lead-list-tab" variant={view === 'list' ? 'default' : 'outline'} className="min-h-12" onClick={() => setView('list')}><List className="size-4" /> Overzicht</Button>
        </div>

        <div role="tabpanel" aria-labelledby="new-lead-tab" id="new-lead-panel" hidden={view !== 'new'} className="max-w-2xl">
          <UnifiedLeadForm onOpenLead={(id) => setOpenLead(id)} />
        </div>

        <section role="tabpanel" aria-labelledby="lead-list-tab" id="lead-list-panel" hidden={view !== 'list'} className="lg:flex lg:h-[calc(100dvh-182px)] lg:min-h-[420px] lg:overflow-hidden lg:rounded-xl lg:border lg:border-border lg:bg-card">
          <div className="lg:flex lg:min-h-0 lg:w-[380px] lg:shrink-0 lg:flex-col lg:border-r lg:border-border">
          <div className="sticky top-0 z-10 -mx-4 mb-4 border-b border-border bg-background px-4 pb-3 pt-1 lg:static lg:mx-0 lg:mb-0 lg:bg-card lg:pt-3">
            <div className="mb-3 flex items-center gap-2">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input type="search" aria-label="Zoek in leads" placeholder="Naam, telefoon, postcode of plaats" className="pl-9 text-base" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} />
              </div>
              <Button variant="outline" size="icon" className="min-h-12 min-w-12" aria-label="Leads vernieuwen" disabled={leadsQuery.isFetching} onClick={() => leadsQuery.refetch()}><RefreshCw className={leadsQuery.isFetching ? 'size-4 animate-spin' : 'size-4'} /></Button>
            </div>

            <ViewPicker
              views={allViews}
              activeId={viewId ?? null}
              filters={filters}
              onSelect={applyView}
              onSaveNew={() => { setSaveName(activeView ? `${activeView.name} (kopie)` : ''); setSaveOpen(true) }}
              onUpdate={() => activeView && !isBuiltin(activeView.id) && saveViewMut.mutate({ id: activeView.id, name: activeView.name })}
              onDelete={() => activeView && !isBuiltin(activeView.id) && deleteViewMut.mutate(activeView.id)}
            />

            <div role="group" aria-label="Filter op status" className="flex flex-wrap gap-2">
              {FILTERS.map((key) => (
                <Button
                  key={key}
                  size="sm"
                  className="min-h-11 shrink-0 rounded-full"
                  aria-pressed={filter === key}
                  variant={filter === key ? 'default' : 'outline'}
                  onClick={() => patchSearch({ filter: key === 'all' ? undefined : key, page: undefined, viewId: undefined }, false)}
                >
                  {FILTER_LABEL[key]}
                </Button>
              ))}
              <label className="sr-only" htmlFor="lead-sort">Sortering</label>
              <select
                id="lead-sort"
                value={sort}
                onChange={(event) => patchSearch({ sort: event.target.value === 'newest' ? undefined : (event.target.value as LeadSort), page: undefined, viewId: undefined }, false)}
                className="h-11 rounded-lg border border-input bg-card px-3 text-[14px] font-semibold"
              >
                {SORTS.map((key) => (
                  <option key={key} value={key}>{SORT_LABEL[key]}</option>
                ))}
              </select>
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
                    </article>
                  </li>
                ))}
              </ul>
            </>
          )}
          {leadsQuery.error && <ListError title="Leads ophalen mislukt" onRetry={() => leadsQuery.refetch()} />}
          {!leadsQuery.isLoading && !leadsQuery.error && !rows.length && (
            filtersActive ? (
              <EmptyState title="Geen resultaten" description="Geen leads met deze filters." onClearFilters={clearFilters} />
            ) : (
              <EmptyState title="Niets te doen" description="Er staan nog geen leads in het overzicht." />
            )
          )}

          {rows.length > 0 && (
            <div className="flex items-center gap-3 border-b border-border px-[15px] py-2.5">
              <input
                type="checkbox"
                aria-label={`Alles op deze pagina selecteren (${visibleIds.length})`}
                checked={selection.allVisibleSelected}
                onChange={selection.toggleAllVisible}
                className="size-[18px] rounded border-input"
              />
              <span className="text-[13px] text-muted-foreground">Alles op deze pagina ({visibleIds.length})</span>
            </div>
          )}

          <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pb-4">
          <ul className="divide-y divide-border border-y border-border lg:border-y-0">
            {rows.map((lead: any, index: number) => {
              const urgency = leadUrgency(lead, now)
              const badge = dispatchBadge(lead.dispatch)
              const meta = [lead.job_type, lead.city].filter(Boolean).join(' · ')
              const signal =
                urgencyLine(lead, now) ??
                (badge
                  ? badge.label
                  : lead.contractors?.name
                    ? `${lead.contractors.name} · ${openSinceText(lead, now).replace('open sinds ', '')}`
                    : isOpenLead(lead)
                      ? openSinceText(lead, now)
                      : new Date(lead.created_at).toLocaleString('nl-NL', { dateStyle: 'short', timeStyle: 'short' }))
              const active = lead.id === selectedLeadId
              const checked = selection.selected.has(String(lead.id))
              return (
                <li key={lead.id} className={`relative border-l-[3px] ${URGENCY_BORDER[urgency]} ${checked ? 'bg-secondary' : active ? 'lg:bg-secondary' : ''}`} aria-current={active ? 'true' : undefined}>
                  <div className="flex min-w-0 items-start gap-1 py-[13px] pl-[3px] pr-[15px]">
                    <label className="flex size-11 shrink-0 items-center justify-center sm:size-9">
                      <span className="sr-only">Selecteer lead van {lead.customer_name}</span>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) =>
                          selection.toggle(String(lead.id), index, Boolean((event.nativeEvent as MouseEvent).shiftKey))
                        }
                        className="size-[18px] rounded border-input"
                      />
                    </label>
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      aria-label={`Open lead van ${lead.customer_name}`}
                      onClick={() => setOpenLead(lead.id)}
                    >
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <span className="min-w-0 break-words text-[14.5px] font-bold">{lead.customer_name}</span>
                        <LeadStatusBadge lead={lead} now={now} />
                        {lead.customer_language === 'en' && (
                          <span className="inline-flex items-center rounded-md bg-secondary px-[7px] py-0.5 text-[11.5px] font-bold text-muted-foreground" title="Engelstalige klant">EN</span>
                        )}
                      </div>
                      {meta && <p className="mt-1 break-words text-[13px] text-muted-foreground">{meta}</p>}
                      <p className={`mt-1 text-[11.5px] font-bold tabular-nums ${urgency === 'escalated' || urgency === 'emergency' ? 'text-destructive' : urgency === 'failed' || urgency === 'step_overdue' || badge ? 'text-warning' : openSinceColor(lead, now)}`}>
                        {signal}
                        <span className="font-normal text-muted-foreground"> · {euro(lead.price_cents)}</span>
                      </p>
                    </button>
                    <div className="flex shrink-0 flex-col gap-2">
                      <Button asChild variant="call" size="icon" className="size-12 rounded-lg md:size-11" aria-label={`Bel ${lead.customer_name}`} onClick={(event) => { event.stopPropagation(); contactMut.mutate({ leadId: lead.id, channel: 'call' }) }}>
                        <a href={phoneHref(lead.customer_phone)}><Phone className="size-5" /></a>
                      </Button>
                      <Button asChild variant="whatsapp" size="icon" className="size-12 rounded-lg md:size-11" aria-label={`WhatsApp ${lead.customer_name}`} onClick={(event) => { event.stopPropagation(); contactMut.mutate({ leadId: lead.id, channel: 'whatsapp' }) }}>
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
                    {urgency === 'step_overdue' && (
                      <Button
                        asChild
                        size="sm"
                        variant={lead.next_step_kind === 'whatsapp' ? 'whatsapp' : 'default'}
                        className="min-h-11 text-[13px]"
                        onClick={() => contactMut.mutate({ leadId: lead.id, channel: lead.next_step_kind === 'whatsapp' ? 'whatsapp' : 'call' })}
                      >
                        {lead.next_step_kind === 'whatsapp' ? (
                          <a href={waHref(lead.customer_phone)} target="_blank" rel="noreferrer"><MessageCircle className="size-4" /> WhatsApp</a>
                        ) : (
                          <a href={phoneHref(lead.customer_phone)}><Phone className="size-4" /> Bellen</a>
                        )}
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

          {(total > 0 || page > 0) && (
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={(next) => patchSearch({ page: next > 0 ? next : undefined }, false)} />
          )}

          <BulkBar
            count={selection.count}
            busy={bulkMut.isPending}
            onClear={selection.clear}
            onDispatch={() => startBulk('dispatch')}
            onAssign={() => startBulk('assign')}
            onSpam={() => startBulk('spam')}
            onCancel={() => startBulk('cancel')}
          />
          </div>
          </div>
          <div className="hidden lg:block lg:min-h-0 lg:min-w-0 lg:flex-1 lg:overflow-y-auto lg:bg-background lg:px-[22px] lg:py-5">
            {selectedLeadId ? (
              <LeadDetail key={selectedLeadId} leadId={selectedLeadId} onClosed={() => setOpenLead(null)} />
            ) : (
              <EmptyState title="Niets geselecteerd" description="Kies links een lead om de details te zien." />
            )}
          </div>
        </section>

      {!isDesktop && <LeadSheet leadId={leadParam ?? null} onClose={() => setOpenLead(null)} />}

      <AlertDialog open={confirm !== null} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm ? CONFIRM_TEXT[confirm].title(selection.count) : ''}</AlertDialogTitle>
            <AlertDialogDescription>{confirm ? CONFIRM_TEXT[confirm].body : ''}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-11">Terug</AlertDialogCancel>
            <AlertDialogAction
              className="min-h-11 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!confirm) return
                bulkMut.mutate({ action: confirm, ids: [...selection.selected] })
                setConfirm(null)
              }}
            >
              {confirm ? CONFIRM_TEXT[confirm].action : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={assignOpen} onOpenChange={(open) => { setAssignOpen(open); if (!open) setAssignTo('') }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selection.count} leads toewijzen</DialogTitle>
          </DialogHeader>
          <label className="text-[13px] font-bold" htmlFor="assign-contractor">ZZP&apos;er</label>
          <select
            id="assign-contractor"
            value={assignTo}
            onChange={(event) => setAssignTo(event.target.value)}
            className="h-12 rounded-lg border border-input bg-card px-3 text-[14px]"
          >
            <option value="">Kies een ZZP&apos;er</option>
            {((contractorsQuery.data ?? []) as any[]).map((contractor) => (
              <option key={contractor.id} value={contractor.id}>{contractor.name}</option>
            ))}
          </select>
          <DialogFooter>
            <Button variant="outline" className="min-h-11" onClick={() => setAssignOpen(false)}>Terug</Button>
            <Button
              className="min-h-11"
              disabled={!assignTo || bulkMut.isPending}
              onClick={() => {
                bulkMut.mutate({ action: 'assign', ids: [...selection.selected], contractorId: assignTo })
                setAssignOpen(false)
                setAssignTo('')
              }}
            >
              Toewijzen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Weergave bewaren</DialogTitle>
          </DialogHeader>
          <label className="text-[13px] font-bold" htmlFor="view-name">Naam</label>
          <Input id="view-name" value={saveName} maxLength={60} className="text-base" onChange={(event) => setSaveName(event.target.value)} placeholder="Bijvoorbeeld: Spoed Noord" />
          <DialogFooter>
            <Button variant="outline" className="min-h-11" onClick={() => setSaveOpen(false)}>Terug</Button>
            <Button className="min-h-11" disabled={!saveName.trim() || saveViewMut.isPending} onClick={() => saveViewMut.mutate({ id: null, name: saveName.trim() })}>
              Bewaren
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
