import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'

import { AdminShell } from '@/components/admin/admin-shell'
import { EmptyState, ListError, actionError } from '@/components/admin/list-ui'
import { Pagination } from '@/components/admin/pagination'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ACTION_LABEL, EVIDENCE_LABEL, amsterdamTime, parseEuroToCents, type Evidence } from '@/lib/contact-routes'
import { getContactRouteHistory, listContactRoutes, saveContactRouteReview } from '@/lib/contact-routes.functions'

export const Route = createFileRoute('/_authenticated/admin/advertentiecontacten')({
  component: Page,
  head: () => ({
    meta: [
      { title: 'Advertentiecontacten · VoltFix backoffice' },
      { name: 'description', content: 'Beoordeel contactroutes na advertentieklikken.' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
})

const STATUS_LABEL: Record<string, string> = { real_contact: 'Echt contact', no_contact: 'Geen contact', unknown: 'Onbekend' }
const OUTCOME_LABEL: Record<string, string> = {
  remote_help: 'Op afstand geholpen', scheduled: 'Ingepland', completed: 'Uitgevoerd', dropped: 'Afgehaakt',
}
const VERIFY_LABEL: Record<string, string> = {
  call_history: 'Belhistorie', whatsapp: 'WhatsApp', form: 'Formulier', manual: 'Handmatig',
}
const SOURCE_LABEL: Record<string, string> = {
  'google-ads': 'Google Ads', 'google-organic': 'Google organisch', direct: 'Direct', referral: 'Verwijzing',
  'ai-search': 'AI-zoeker', bing: 'Bing', unknown: 'Onbekend',
}
// Zes historische imports zijn herkenbaar aan deze notitie-prefix; hun reviewed_by is een technische
// placeholder-admin, dus de UI toont de werkelijke herkomst in plaats van een reviewer-naam.
const HISTORICAL_NOTE_PREFIX = 'Historisch bevestigd door eigenaar'
export const isHistoricalImport = (rv: any) =>
  Boolean(rv?.historical_import) || String(rv?.note ?? '').startsWith(HISTORICAL_NOTE_PREFIX)
const euro = (c: number) => (c / 100).toLocaleString('nl-NL', { style: 'currency', currency: 'EUR' })
const amsDate = (d: Date) => d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Amsterdam' })
const daysAgo = (n: number) => amsDate(new Date(Date.now() - n * 86_400_000))

const sel = 'h-11 rounded-lg border border-input bg-card px-3 text-[14px]'

function Page() {
  const [f, setF] = useState({ from: daysAgo(30), to: daysAgo(0), source: 'google-ads' as 'google-ads' | 'all',
    action: 'all' as any, review: 'all' as any, search: '', page: 0 })
  const list = useServerFn(listContactRoutes)
  const q = useQuery({
    queryKey: ['admin', 'contact-routes', f],
    queryFn: () => list({ data: { ...f, pageSize: 20 } }),
    placeholderData: keepPreviousData,
  })
  const set = (p: Partial<typeof f>) => setF((o) => ({ ...o, page: 0, ...p }))
  const c = q.data?.counts

  return (
    <AdminShell title="Advertentiecontacten" context="Beoordeel per klik of er echt contact was. Deze pagina verstuurt niets naar Google.">
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <Input type="date" aria-label="Vanaf" value={f.from} onChange={(e) => set({ from: e.target.value })} className="h-11" />
          <Input type="date" aria-label="Tot en met" value={f.to} onChange={(e) => set({ to: e.target.value })} className="h-11" />
          <select aria-label="Bron" className={sel} value={f.source} onChange={(e) => set({ source: e.target.value as any })}>
            <option value="google-ads">Alleen advertentie</option><option value="all">Alle bronnen</option>
          </select>
          <select aria-label="Actie" className={sel} value={f.action} onChange={(e) => set({ action: e.target.value })}>
            <option value="all">Alle acties</option>
            {Object.entries(ACTION_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select aria-label="Beoordeling" className={sel} value={f.review} onChange={(e) => set({ review: e.target.value })}>
            <option value="all">Alle beoordelingen</option><option value="open">Nog niet beoordeeld</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <Input aria-label="Zoek referentie of dossiernummer" placeholder="Referentie of dossiernr." value={f.search}
            onChange={(e) => set({ search: e.target.value })} className="h-11" />
        </div>
        <Button variant="link" className="h-auto p-0 text-[13px]" onClick={() => set({ from: '2026-10-07' })}>
          Vanaf 7 oktober 2026 tonen (start nieuwe campagnes)
        </Button>

        {q.data?.truncated && (
          <p role="alert" className="rounded-xl border border-warning bg-card p-3 text-[13px]">
            Deze periode bevat meer dan {q.data.maxRows} acties; alleen de nieuwste zijn geladen, de resultaten kunnen onvolledig zijn. Kies een kortere periode.
          </p>
        )}

        {c && (
          <div className="grid grid-cols-2 gap-2 text-[13px] sm:grid-cols-4">
            {[['Contactroutes', c.routes], ['Met belklik', c.calls], ['Met WhatsApp-klik', c.whatsapp], ['Met verzonden formulier', c.forms],
              ['Nog te beoordelen', c.open], ['Echt contact', c.realContact], ['Geen contact', c.noContact], ['Onbekend', c.unknownContact],
              ['Opbrengst bij echt contact', euro(c.revenueCents) + (c.revenueUnknown ? ` + ${c.revenueUnknown}× onbekend` : '')]].map(([l, v]) => (
              <div key={l as string} className="rounded-xl border border-border bg-card p-3">
                <p className="text-muted-foreground">{l}</p><p className="text-[18px] font-bold tabular-nums">{v}</p>
              </div>
            ))}
          </div>
        )}
        <p className="text-[12px] text-muted-foreground">
          Een belklik is geen gesprek, een WhatsApp-klik geen bericht en een geopende formulierknop geen aanvraag. Een handmatig gekoppeld dossier is geen advertentiebewijs.
        </p>

        {q.isPending && <p className="text-[13px] text-muted-foreground">Laden…</p>}
        {q.isError && <ListError title={(q.error as Error).message || 'Overzicht laden mislukt'} onRetry={() => q.refetch()} />}
        {q.data && q.data.rows.length === 0 && (
          <EmptyState title="Geen contactroutes" description="Niets gevonden binnen deze filters."
            onClearFilters={() => set({ source: 'all', action: 'all', review: 'all', search: '' })} />
        )}
        <div className="space-y-2">
          {q.data?.rows.map((r) => <RouteCard key={r.key} r={r} leads={q.data!.leads} />)}
        </div>
        {q.data && q.data.total > 0 && (
          <div className="rounded-xl border border-border bg-card">
            <Pagination page={f.page} pageSize={20} total={q.data.total} onPage={(page) => setF((o) => ({ ...o, page }))} />
          </div>
        )}
      </div>
    </AdminShell>
  )
}

function LeadLink({ id, lead, manual }: { id: string; lead?: { ref: number; status: string }; manual?: boolean }) {
  return (
    <Link to="/admin/leads" search={{ view: 'list', lead: id } as any} className="font-bold underline">
      #{lead?.ref ?? '?'}{lead ? ` (${lead.status})` : ''}{manual ? ' · handmatig' : ''}
    </Link>
  )
}

function RouteCard({ r, leads }: { r: any; leads: Record<string, any> }) {
  const [open, setOpen] = useState(false)
  const manualLead = r.review?.lead_id && !r.leadIds.includes(r.review.lead_id) ? r.review.lead_id : null
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[14px] font-bold">{amsterdamTime(r.firstAt)}</p>
        <Badge variant={r.review ? 'secondary' : 'outline'}>{r.review ? STATUS_LABEL[r.review.contact_status] : 'Niet beoordeeld'}</Badge>
      </div>
      <p className="mt-1 text-[12.5px] text-muted-foreground">
        {SOURCE_LABEL[r.source] ?? r.source} · {r.device} · {EVIDENCE_LABEL[r.evidence as Evidence]}
        {r.clickRefs.length > 0 && <> · ref <span className="font-mono">{r.clickRefs.join(', ')}</span></>}
      </p>
      <ul className="mt-2 space-y-0.5 text-[12.5px]">
        {r.events.map((e: any) => (
          <li key={e.id}>{amsterdamTime(e.at).slice(-8)} · {ACTION_LABEL[e.eventName] ?? e.eventName} · <span className="text-muted-foreground">{e.pagePath}</span></li>
        ))}
      </ul>
      {(r.leadIds.length > 0 || manualLead) && (
        <p className="mt-2 flex flex-wrap gap-2 text-[12.5px]">
          Dossier: {r.leadIds.map((id: string) => <LeadLink key={id} id={id} lead={leads[id]} />)}
          {manualLead && <LeadLink id={manualLead} lead={leads[manualLead]} manual />}
        </p>
      )}
      {r.review && (
        <p className="mt-1 text-[12.5px] text-muted-foreground">
          <span className="font-bold">{isHistoricalImport(r.review)
            ? 'Historische eigenaarbevestiging (geïmporteerd), niet live door beheerder ingevoerd'
            : 'Beoordeeld door ingelogde admin'}</span>{' · '}
          {r.review.outcome ? OUTCOME_LABEL[r.review.outcome] + ' · ' : ''}
          {r.review.verification_source ? `bron ${VERIFY_LABEL[r.review.verification_source]} · ` : ''}
          Opbrengst {r.review.revenue_cents == null ? 'onbekend' : euro(r.review.revenue_cents)}
          {r.review.note ? ` · ${r.review.note}` : ''}
        </p>
      )}
      <Button variant="outline" className="mt-2 min-h-11 rounded-lg" onClick={() => setOpen((o) => !o)}>
        {open ? 'Sluiten' : r.review ? 'Beoordeling wijzigen' : 'Beoordelen'}
      </Button>
      {open && <ReviewForm r={r} leads={leads} onDone={() => setOpen(false)} />}
    </div>
  )
}

function ReviewForm({ r, leads, onDone }: { r: any; leads: Record<string, any>; onDone: () => void }) {
  const qc = useQueryClient()
  const save = useServerFn(saveContactRouteReview)
  const hist = useServerFn(getContactRouteHistory)
  const rv = r.review
  const defaultRef = rv?.lead_id ? leads[rv.lead_id]?.ref : r.leadIds[0] ? leads[r.leadIds[0]]?.ref : ''
  const [status, setStatus] = useState(rv?.contact_status ?? 'unknown')
  const [outcome, setOutcome] = useState(rv?.outcome ?? '')
  const [verify, setVerify] = useState(rv?.verification_source ?? '')
  const [note, setNote] = useState(rv?.note ?? '')
  const [ref, setRef] = useState(String(defaultRef ?? ''))
  const [rev, setRev] = useState(rv?.revenue_cents == null ? '' : String(rv.revenue_cents / 100).replace('.', ','))
  const history = useQuery({ queryKey: ['admin', 'contact-route-history', r.key], queryFn: () => hist({ data: { routeKey: r.key } }), enabled: !!rv })

  const m = useMutation({
    mutationFn: () => {
      const revenueCents = parseEuroToCents(rev)
      const leadRef = ref.trim() ? Number(ref.replace('#', '')) : null
      if (leadRef != null && !Number.isInteger(leadRef)) throw new Error('Ongeldig dossiernummer')
      return save({ data: { routeKey: r.key, eventId: r.anchorEventId, contactStatus: status,
        outcome: status === 'real_contact' && outcome ? outcome : null, verificationSource: verify || null,
        note: note.trim() || null, leadRef, revenueCents } })
    },
    onSuccess: () => { toast.success('Beoordeling opgeslagen'); void qc.invalidateQueries({ queryKey: ['admin', 'contact-routes'] }); onDone() },
    onError: (e: any) => actionError(`Niet opgeslagen: ${e?.message ?? 'onbekende fout'}`),
  })

  return (
    <div className="mt-3 space-y-2 border-t border-border pt-3 text-[13px]">
      <div className="flex flex-wrap gap-2">
        {Object.entries(STATUS_LABEL).map(([k, v]) => (
          <Button key={k} type="button" variant={status === k ? 'default' : 'outline'} className="min-h-11" onClick={() => setStatus(k)}>{v}</Button>
        ))}
      </div>
      {status === 'real_contact' && (
        <select aria-label="Uitkomst" className={`${sel} w-full`} value={outcome} onChange={(e) => setOutcome(e.target.value)}>
          <option value="">Uitkomst nog onbekend</option>
          {Object.entries(OUTCOME_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      )}
      <select aria-label="Verificatiebron" className={`${sel} w-full`} value={verify} onChange={(e) => setVerify(e.target.value)}>
        <option value="">Verificatiebron (optioneel)</option>
        {Object.entries(VERIFY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
      <Input aria-label="Dossiernummer" placeholder="Dossiernummer, bv. 1140" inputMode="numeric" value={ref} onChange={(e) => setRef(e.target.value)} className="h-11" />
      <Input aria-label="Werkelijke opbrengst" placeholder="Opbrengst VoltFix in € (leeg = onbekend, 0 = nul)" inputMode="decimal" value={rev} onChange={(e) => setRev(e.target.value)} className="h-11" />
      <textarea aria-label="Notitie" placeholder="Notitie (optioneel)" maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)}
        className="min-h-20 w-full rounded-lg border border-input bg-card p-3" />
      <Button className="min-h-11" disabled={m.isPending} onClick={() => m.mutate()}>{m.isPending ? 'Opslaan…' : 'Opslaan'}</Button>
      {rv && (
        <div className="text-[12px] text-muted-foreground">
          <p className="font-bold">Geschiedenis</p>
          {history.isError && <p className="text-destructive">Geschiedenis laden mislukt.</p>}
          {history.data?.map((h: any) => (
            <p key={h.id}>{amsterdamTime(h.created_at)} · {isHistoricalImport(h.new_value) || !h.actor_id ? 'historische import (eigenaarbevestiging)' : 'admin'} · {STATUS_LABEL[h.new_value?.contact_status] ?? '?'}
              {h.new_value?.outcome ? ` · ${OUTCOME_LABEL[h.new_value.outcome]}` : ''}
              {' · '}{h.new_value?.revenue_cents == null ? 'opbrengst onbekend' : euro(h.new_value.revenue_cents)}</p>
          ))}
        </div>
      )}
    </div>
  )
}
