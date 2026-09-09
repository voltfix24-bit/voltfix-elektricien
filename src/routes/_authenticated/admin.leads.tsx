import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, List, Plus, RefreshCw, Phone, Send, X } from 'lucide-react'
import { toast } from 'sonner'
import { AdminNav, euro } from '@/components/admin/admin-nav'
import { MobileLeadForm } from '@/components/admin/mobile-lead-form'
import { LeadExtraPhotos } from '@/components/admin/lead-extra-photos'
import { InstallAdminApp } from '@/components/admin/install-app'
import { QuickWhatsAppLead } from '@/components/admin/quick-whatsapp-lead'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { cancelLead, dispatchLead, listLeads } from '@/lib/admin.functions'
import { isEmergencyLead, isLeadOverdue } from '@/lib/lead-overdue'

export const Route = createFileRoute('/_authenticated/admin/leads')({
  head: () => ({
    meta: [
      { title: 'Leads beheren | VoltFix backoffice' },
      { name: 'description', content: 'Voer leads in, voeg foto’s toe en volg openstaande klussen bij VoltFix op.' },
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

const STATUS_LABEL: Record<string, string> = { new: 'Concept', dispatched: 'Verstuurd', claimed: 'Geclaimd', cancelled: 'Geannuleerd', spam_review: 'Spam-controle', blocked_spam: 'Spam geblokkeerd' }
type Filter = 'all' | 'open' | 'claimed' | 'cancelled' | 'overdue'
const FILTERS: { key: Filter; label: string }[] = [{ key: 'all', label: 'Alles' }, { key: 'open', label: 'Open' }, { key: 'claimed', label: 'Geclaimd' }, { key: 'cancelled', label: 'Geannuleerd' }, { key: 'overdue', label: 'Opvolgen' }]
type Lead = Awaited<ReturnType<typeof listLeads>>[number]

function LeadsPage() {
  const queryClient = useQueryClient()
  const fetchLeads = useServerFn(listLeads)
  const sendLead = useServerFn(dispatchLead)
  const cancel = useServerFn(cancelLead)
  const [view, setView] = useState<'new' | 'list'>('new')
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [now, setNow] = useState(Date.now())
  const [cancelTarget, setCancelTarget] = useState<{ id: string; name: string } | null>(null)
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 60_000); return () => clearInterval(timer) }, [])
  const leadsQuery = useQuery({ queryKey: ['admin', 'leads'], queryFn: () => fetchLeads(), refetchInterval: 60_000 })
  const overdue = (leadsQuery.data ?? []).filter((lead) => isLeadOverdue(lead, now))
  const dispatchMut = useMutation({
    mutationFn: (leadId: string) => sendLead({ data: { leadId } }),
    onSuccess: () => { toast.success('Naar Telegram verstuurd.'); queryClient.invalidateQueries({ queryKey: ['admin', 'leads'] }) },
    onError: () => toast.error('Versturen mislukt. Probeer opnieuw.'),
  })
  const cancelMut = useMutation({
    mutationFn: (leadId: string) => cancel({ data: { leadId } }),
    onSuccess: () => { toast.success('Lead geannuleerd.'); setCancelTarget(null); queryClient.invalidateQueries({ queryKey: ['admin', 'leads'] }) },
    onError: () => toast.error('Annuleren mislukt. Probeer opnieuw.'),
  })
  const rows = useMemo(() => (leadsQuery.data ?? []).filter((lead) => {
    if (filter === 'open' && !['new', 'dispatched', 'spam_review'].includes(lead.status)) return false
    if (filter === 'claimed' && lead.status !== 'claimed') return false
    if (filter === 'cancelled' && !['cancelled', 'blocked_spam'].includes(lead.status)) return false
    if (filter === 'overdue' && !isLeadOverdue(lead, now)) return false
    const q = search.trim().toLowerCase()
    return !q || [lead.customer_name, lead.customer_phone, lead.city, lead.address, lead.postal_code, lead.job_type].some((value) => value?.toLowerCase().includes(q))
  }), [leadsQuery.data, filter, search, now])

  function actions(lead: Lead) {
    return <div className="flex flex-wrap gap-2">
      <LeadExtraPhotos leadId={lead.id} name={lead.customer_name} count={lead.image_urls?.length ?? 0} />
      {lead.status !== 'claimed' && <Button size="sm" variant="outline" className="min-h-11" disabled={dispatchMut.isPending} onClick={() => dispatchMut.mutate(lead.id)}><Send className="size-4" />{lead.status === 'dispatched' ? 'Opnieuw sturen' : lead.status === 'cancelled' ? 'Opnieuw aanbieden' : 'Naar Telegram'}</Button>}
      {!['claimed', 'cancelled'].includes(lead.status) && <Button size="icon" variant="ghost" className="min-h-11 min-w-11" aria-label={`Annuleer lead van ${lead.customer_name}`} title="Annuleren" onClick={() => setCancelTarget({ id: lead.id, name: lead.customer_name })}><X className="size-4" /></Button>}
    </div>
  }
  function status(lead: Lead) {
    return <div className="flex flex-wrap gap-2"><Badge variant={lead.status === 'claimed' ? 'default' : 'secondary'}>{STATUS_LABEL[lead.status] ?? lead.status}</Badge>{isEmergencyLead(lead) && <Badge variant="destructive">Storing / spoed</Badge>}{isLeadOverdue(lead, now) && <Badge variant="destructive">Opvolgen · &gt;{isEmergencyLead(lead) ? '1' : '24'} uur</Badge>}</div>
  }
  return <div className="admin-mobile min-h-dvh bg-background">
    <AdminNav />
    <main className="mx-auto max-w-6xl px-4 py-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:py-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold">Leads</h1><InstallAdminApp /></div>
      {overdue.length > 0 && <Button variant="outline" className="mb-5 flex h-auto min-h-12 w-full justify-between gap-3 whitespace-normal border-destructive/40 bg-destructive/5 py-3 text-left text-destructive" onClick={() => { setView('list'); setFilter('overdue') }}><AlertTriangle className="size-5 shrink-0" /><span className="flex-1">{overdue.length} {overdue.length === 1 ? 'lead wacht' : 'leads wachten'} te lang — opvolgen</span><List className="size-4 shrink-0" /></Button>}
      <div role="tablist" aria-label="Leadweergave" className="mb-6 grid grid-cols-2 gap-2 border-b border-border pb-4 sm:max-w-md">
        <Button role="tab" aria-selected={view === 'new'} aria-controls="new-lead-panel" id="new-lead-tab" variant={view === 'new' ? 'default' : 'outline'} className="min-h-12" onClick={() => setView('new')}><Plus className="size-4" /> Nieuwe lead</Button>
        <Button role="tab" aria-selected={view === 'list'} aria-controls="lead-list-panel" id="lead-list-tab" variant={view === 'list' ? 'default' : 'outline'} className="min-h-12" onClick={() => setView('list')}><List className="size-4" /> Overzicht</Button>
      </div>
      <div role="tabpanel" aria-labelledby="new-lead-tab" id="new-lead-panel" hidden={view !== 'new'} className="max-w-2xl">
        <MobileLeadForm />
        <div className="mt-6 border-t border-border pt-5"><QuickWhatsAppLead /></div>
      </div>
      <section role="tabpanel" aria-labelledby="lead-list-tab" id="lead-list-panel" hidden={view !== 'list'}>
        <div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-xl font-semibold">Leadoverzicht</h2><Button variant="outline" size="icon" className="min-h-11 min-w-11" aria-label="Leads vernieuwen" title="Vernieuwen" disabled={leadsQuery.isFetching} onClick={() => leadsQuery.refetch()}><RefreshCw className={leadsQuery.isFetching ? 'size-4 animate-spin' : 'size-4'} /></Button></div>
        <Input type="search" aria-label="Zoek in leads" placeholder="Naam, telefoon, plaats of straat" value={search} onChange={(event) => setSearch(event.target.value)} className="mb-3" />
        <div aria-label="Filter op status" className="mb-5 flex flex-wrap gap-2">{FILTERS.map((item) => <Button key={item.key} size="sm" className="min-h-11" variant={filter === item.key ? 'default' : 'outline'} aria-pressed={filter === item.key} onClick={() => setFilter(item.key)}>{item.label}</Button>)}</div>
        {leadsQuery.isLoading && <p role="status">Leads laden…</p>}
        {leadsQuery.error && <p role="alert" className="text-destructive">Leads ophalen mislukt. Vernieuw of log opnieuw in.</p>}
        {leadsQuery.data && !rows.length && <p className="py-6 text-muted-foreground">Geen leads gevonden.</p>}
        <div className="space-y-3 lg:hidden">{rows.map((lead) => <article key={lead.id} className="min-w-0 rounded-lg border border-border bg-card p-4">
          {status(lead)}
          <div className="mt-3 flex items-start justify-between gap-3"><h3 className="min-w-0 break-words font-semibold">{lead.customer_name}</h3><span className="shrink-0 text-sm font-semibold">{euro(lead.price_cents)}</span></div>
          <p className="mt-1 break-words text-sm">{lead.job_type}</p>
          <p className="mt-1 break-words text-sm text-muted-foreground">{[lead.address, lead.postal_code, lead.city].filter(Boolean).join(' · ')}</p>
          <Button asChild variant="link" className="min-h-11 px-0"><a href={`tel:${lead.customer_phone.replace(/[^+\d]/g, '')}`}><Phone className="size-4" />{lead.customer_phone}</a></Button>
          {lead.description && <details className="mb-3 text-sm"><summary className="min-h-9 cursor-pointer text-muted-foreground">Omschrijving</summary><p className="whitespace-pre-wrap break-words py-2">{lead.description}</p></details>}
          <p className="mb-3 text-xs text-muted-foreground">{new Date(lead.created_at).toLocaleString('nl-NL', { dateStyle: 'short', timeStyle: 'short' })}{lead.contractors?.name ? ` · ${lead.contractors.name}` : ''}</p>
          {actions(lead)}
        </article>)}</div>
        {rows.length > 0 && <div className="hidden overflow-x-auto lg:block"><table className="w-full text-left text-sm"><thead className="border-b text-muted-foreground"><tr><th className="p-3">Klant</th><th className="p-3">Klus / plaats</th><th className="p-3">Status</th><th className="p-3">Prijs ex. btw</th><th className="p-3">Acties</th></tr></thead><tbody>{rows.map((lead) => <tr key={lead.id} className="border-b align-top"><td className="p-3"><div className="font-semibold">{lead.customer_name}</div><a href={`tel:${lead.customer_phone.replace(/[^+\d]/g, '')}`}>{lead.customer_phone}</a><div className="text-xs text-muted-foreground">{new Date(lead.created_at).toLocaleDateString('nl-NL')}</div></td><td className="p-3"><div>{lead.job_type}</div><div className="text-muted-foreground">{lead.city}</div></td><td className="p-3">{status(lead)}<p className="mt-2 text-muted-foreground">{lead.contractors?.name}</p></td><td className="whitespace-nowrap p-3">{euro(lead.price_cents)}</td><td className="p-3">{actions(lead)}</td></tr>)}</tbody></table></div>}
      </section>
    </main>
    <AlertDialog open={cancelTarget !== null} onOpenChange={(open) => { if (!open && !cancelMut.isPending) setCancelTarget(null) }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Lead annuleren?</AlertDialogTitle><AlertDialogDescription>De lead van {cancelTarget?.name} kan daarna niet meer worden geclaimd.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={cancelMut.isPending}>Terug</AlertDialogCancel><AlertDialogAction disabled={cancelMut.isPending} onClick={(event) => { event.preventDefault(); if (cancelTarget) cancelMut.mutate(cancelTarget.id) }}>{cancelMut.isPending ? 'Bezig…' : 'Ja, annuleren'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>
}
