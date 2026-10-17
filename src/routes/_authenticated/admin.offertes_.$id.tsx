import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { AdminShell } from '@/components/admin/admin-shell'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { finalizeQuote, getQuote, reviseQuote, saveQuoteDraft, setQuoteStatus } from '@/lib/quotes.functions'
import { eur, overrideMissingReason, quoteTotals, quoteWhatsAppText } from '@/lib/quotes/engine'
import { renderQuoteHtml } from '@/lib/quotes/document'
import logoUrl from '@/assets/logos/voltfix-logo-primair.svg'
import { QUOTE_STATUS } from './admin.offertes'

export const Route = createFileRoute('/_authenticated/admin/offertes_/$id')({
  head: () => ({ meta: [{ title: 'Offerte — VoltFix backoffice' }, { name: 'robots', content: 'noindex' }] }),
  component: QuotePage,
})

type Line = {
  catalog_item_key: string | null; kind: string; label: string; description?: string | null; qty: number; unit: string
  unit_price_inc_vat_cents: number; catalog_unit_price_cents: number | null; override_reason: string | null; is_internal: boolean
  vat_rate_bps: number; line_total_inc_vat_cents?: number
}

function QuotePage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['quote', id], queryFn: () => getQuote({ data: { id } }) })
  const [lines, setLines] = useState<Line[]>([])
  const [customerNote, setCustomerNote] = useState('')
  const [internalNote, setInternalNote] = useState('')
  const [lang, setLang] = useState<'nl' | 'en'>('nl')
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (!q.data) return
    setLines(q.data.items.map((i: any) => ({ ...i })))
    setCustomerNote(q.data.quote.customer_note ?? '')
    setInternalNote(q.data.quote.internal_note ?? '')
    setLang(q.data.quote.language === 'en' ? 'en' : 'nl')
    setDirty(false)
  }, [q.data])

  const totals = useMemo(() => quoteTotals(lines), [lines])
  if (!q.data) return <AdminShell title="Offerte"><p>Laden…</p></AdminShell>
  const { quote, catalog, events } = q.data
  const draft = quote.status === 'draft'
  const refresh = () => qc.invalidateQueries({ queryKey: ['quote', id] })
  const update = (n: number, patch: Partial<Line>) => { setLines(ls => ls.map((l, i) => (i === n ? { ...l, ...patch } : l))); setDirty(true) }

  function addCatalog(item: any) {
    setLines(ls => [...ls, {
      catalog_item_key: item.item_key, kind: item.kind, label: lang === 'en' ? item.label_en : item.label_nl, qty: 1, unit: item.unit,
      unit_price_inc_vat_cents: item.price_inc_vat_cents, catalog_unit_price_cents: item.price_inc_vat_cents,
      override_reason: null, is_internal: item.kind === 'component', vat_rate_bps: item.vat_rate_bps,
    }])
    setDirty(true)
  }
  function addFree() {
    setLines(ls => [...ls, { catalog_item_key: null, kind: 'labour', label: 'Extra werk', qty: 1, unit: 'stuk', unit_price_inc_vat_cents: 0, catalog_unit_price_cents: null, override_reason: null, is_internal: false, vat_rate_bps: 2100 }])
    setDirty(true)
  }

  async function save() {
    const bad = lines.find(l => overrideMissingReason(l))
    if (bad) { toast.error(`Vul een reden in voor de afwijkende prijs bij "${bad.label}".`); return false }
    try {
      await saveQuoteDraft({ data: { id, lines: lines.map(l => ({ catalog_item_key: l.catalog_item_key, kind: l.kind, label: l.label, description: l.description ?? null, qty: l.qty, unit: l.unit, unit_price_inc_vat_cents: l.unit_price_inc_vat_cents, override_reason: l.override_reason, is_internal: l.is_internal })), customer_note: customerNote || null, internal_note: internalNote || null, language: lang } })
      toast.success('Opgeslagen'); refresh(); return true
    } catch (e: any) { toast.error(e.message); return false }
  }
  async function finalize() {
    if (dirty && !(await save())) return
    if (!confirm('Definitief maken? Daarna kan deze offerte niet meer gewijzigd worden.')) return
    try {
      const r = await finalizeQuote({ data: { id } })
      if (!r.ok) toast.error(r.reason === 'empty' ? 'Offerte heeft geen regels.' : 'Offerte is al definitief.')
      else toast.success(`Offerte ${r.quote_number} is definitief`)
      refresh()
    } catch (e: any) { toast.error(e.message) }
  }
  function openPdf() {
    const w = window.open('', '_blank')
    if (!w) return toast.error('Pop-up geblokkeerd.')
    w.document.write(renderQuoteHtml({ ...quote, customer_note: customerNote }, lines.map(l => ({ ...l, line_total_inc_vat_cents: l.qty * l.unit_price_inc_vat_cents })), new URL(logoUrl, window.location.origin).href))
    w.document.close()
  }
  async function copyWhatsApp() {
    await navigator.clipboard.writeText(quoteWhatsAppText(quote as any, lines.map(l => ({ ...l, line_total_inc_vat_cents: l.qty * l.unit_price_inc_vat_cents }))))
    toast.success('WhatsApp-tekst gekopieerd')
  }
  const status = (s: 'sent' | 'accepted' | 'declined') => setQuoteStatus({ data: { id, status: s } }).then(refresh).catch(e => toast.error(e.message))

  return (
    <AdminShell title={quote.quote_number ?? 'Offerte (concept)'} context={`Dossier #${(quote.customer_snapshot as any)?.ref_number ?? ''} · ${(quote.customer_snapshot as any)?.name ?? ''}`}
      actions={<Link to="/admin/offertes" search={{ ref: undefined }} className="text-sm underline">Alle offertes</Link>}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge>{QUOTE_STATUS[quote.status]}</Badge>
        {quote.valid_until && <span className="text-sm text-muted-foreground">Geldig tot {quote.valid_until}</span>}
        <div className="ml-auto flex flex-wrap gap-2">
          {draft && <Button variant="outline" onClick={save} disabled={!dirty}>Opslaan</Button>}
          <Button variant="outline" onClick={openPdf}>{draft ? 'Voorbeeld' : 'PDF / printen'}</Button>
          {!draft && <Button variant="outline" onClick={copyWhatsApp}>Kopieer WhatsApp-tekst</Button>}
          {draft && <Button onClick={finalize}>Definitief maken</Button>}
          {quote.status === 'final' && <Button variant="outline" onClick={() => status('sent')}>Markeer verstuurd</Button>}
          {['final', 'sent'].includes(quote.status) && <>
            <Button variant="outline" onClick={() => status('accepted')}>Geaccepteerd</Button>
            <Button variant="outline" onClick={() => status('declined')}>Afgewezen</Button>
          </>}
          {!draft && quote.status !== 'superseded' && <Button variant="ghost" onClick={() => reviseQuote({ data: { id } }).then(r => navigate({ to: '/admin/offertes/$id', params: { id: r.id } })).catch(e => toast.error(e.message))}>Nieuwe versie</Button>}
        </div>
      </div>

      {draft && (
        <div className="mb-4 rounded-lg border p-3">
          <p className="mb-2 text-sm font-medium">Toevoegen uit catalogus</p>
          <div className="flex flex-wrap gap-2">
            {catalog.map((c: any) => <Button key={c.id} size="sm" variant="secondary" onClick={() => addCatalog(c)}>{c.label_nl} · {eur(c.price_inc_vat_cents)}</Button>)}
            <Button size="sm" variant="outline" onClick={addFree}>+ Vrije regel</Button>
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm">Taal offerte:
            <Button size="sm" variant={lang === 'nl' ? 'default' : 'outline'} onClick={() => { setLang('nl'); setDirty(true) }}>NL</Button>
            <Button size="sm" variant={lang === 'en' ? 'default' : 'outline'} onClick={() => { setLang('en'); setDirty(true) }}>EN</Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left"><tr><th className="p-2">Omschrijving</th><th className="p-2">Aantal</th><th className="p-2">Prijs incl. btw</th><th className="p-2">Totaal</th><th className="p-2">Intern</th>{draft && <th />}</tr></thead>
          <tbody>
            {lines.map((l, n) => {
              const deviates = l.catalog_unit_price_cents != null && l.unit_price_inc_vat_cents !== l.catalog_unit_price_cents
              return (
                <tr key={n} className="border-t align-top">
                  <td className="p-2">
                    {draft ? <Input value={l.label} onChange={e => update(n, { label: e.target.value })} /> : l.label}
                    {deviates && (draft
                      ? <Input className="mt-1" placeholder={`Reden afwijking (catalogus ${eur(l.catalog_unit_price_cents!)})`} value={l.override_reason ?? ''} onChange={e => update(n, { override_reason: e.target.value })} />
                      : <p className="mt-1 text-xs text-muted-foreground">Afwijking van {eur(l.catalog_unit_price_cents!)}: {l.override_reason}</p>)}
                  </td>
                  <td className="p-2">{draft ? <Input className="w-20" type="number" min={1} value={l.qty} onChange={e => update(n, { qty: Math.max(1, Math.trunc(Number(e.target.value) || 1)) })} /> : l.qty}</td>
                  <td className="p-2">{draft ? <Input className="w-28" inputMode="decimal" defaultValue={(l.unit_price_inc_vat_cents / 100).toFixed(2)} onBlur={e => { const c = Math.round(parseFloat(e.target.value.replace(',', '.')) * 100); if (Number.isFinite(c) && c >= 0) update(n, { unit_price_inc_vat_cents: c }) }} /> : eur(l.unit_price_inc_vat_cents)}</td>
                  <td className="p-2">{eur(l.qty * l.unit_price_inc_vat_cents)}</td>
                  <td className="p-2"><Checkbox checked={l.is_internal} disabled={!draft} onCheckedChange={v => update(n, { is_internal: v === true })} /></td>
                  {draft && <td className="p-2"><Button size="sm" variant="ghost" onClick={() => { setLines(ls => ls.filter((_, i) => i !== n)); setDirty(true) }}>Verwijder</Button></td>}
                </tr>
              )
            })}
            {lines.length === 0 && <tr><td colSpan={6} className="p-4 text-muted-foreground">Nog geen regels.</td></tr>}
          </tbody>
          <tfoot className="border-t font-medium">
            <tr><td className="p-2" colSpan={3}>Subtotaal excl. btw</td><td className="p-2">{eur(totals.subtotal_ex_vat_cents)}</td></tr>
            <tr><td className="p-2" colSpan={3}>Btw 21%</td><td className="p-2">{eur(totals.vat_cents)}</td></tr>
            <tr><td className="p-2" colSpan={3}>Totaal incl. btw</td><td className="p-2">{eur(totals.total_inc_vat_cents)}</td></tr>
          </tfoot>
        </table>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Interne regels staan niet op de klantofferte en tellen niet mee in het totaal.</p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div><label className="text-sm font-medium">Opmerking voor klant</label><Textarea disabled={!draft} value={customerNote} onChange={e => { setCustomerNote(e.target.value); setDirty(true) }} /></div>
        <div><label className="text-sm font-medium">Interne notitie</label><Textarea disabled={!draft} value={internalNote} onChange={e => { setInternalNote(e.target.value); setDirty(true) }} /></div>
      </div>

      <div className="mt-6">
        <h3 className="mb-2 font-semibold">Geschiedenis</h3>
        <ul className="space-y-1 text-sm text-muted-foreground">
          {events.map((e: any) => <li key={e.id}>{new Date(e.created_at).toLocaleString('nl-NL')} — {e.event}</li>)}
        </ul>
      </div>
    </AdminShell>
  )
}
