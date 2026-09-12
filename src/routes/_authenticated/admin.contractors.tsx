import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { ChevronDown, Phone, Plus, Search, Send, Wallet } from 'lucide-react'
import { AdminNav, euro } from '@/components/admin/admin-nav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { adjustBalance, listContractorOverview, listTransactions, saveContractor } from '@/lib/admin.functions'

export const Route = createFileRoute('/_authenticated/admin/contractors')({
  head: () => ({
    meta: [
      { title: "ZZP'ers en tegoed | VoltFix backoffice" },
      { name: 'description', content: "Beheer aangesloten ZZP'ers, hun Telegram-koppeling en hun tegoed." },
      { name: 'robots', content: 'noindex, nofollow' },
      { property: 'og:title', content: "ZZP'ers en tegoed | VoltFix backoffice" },
      { property: 'og:description', content: "Beheer ZZP'ers en hun tegoed." },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
    ],
  }),
  component: ContractorsPage,
})

const emptyForm = {
  name: '',
  company: '',
  phone: '',
  email: '',
  telegram_user_id: '',
  notes: '',
  is_active: true,
}

const dateTime = (value: string) =>
  new Date(value).toLocaleString('nl-NL', { dateStyle: 'short', timeStyle: 'short' })

type Filter = 'active' | 'all' | 'low'

function ContractorsPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [topup, setTopup] = useState<Record<string, string>>({})
  const [openLog, setOpenLog] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('active')
  const [search, setSearch] = useState('')

  const contractorsQuery = useQuery({
    queryKey: ['admin', 'contractor-overview'],
    queryFn: () => listContractorOverview(),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'contractor-overview'] })
    queryClient.invalidateQueries({ queryKey: ['admin', 'transactions'] })
  }

  const save = useMutation({
    mutationFn: () =>
      saveContractor({
        data: {
          ...(editingId ? { id: editingId } : {}),
          name: form.name.trim(),
          company: form.company.trim() || null,
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
          telegram_user_id: form.telegram_user_id.trim() || null,
          notes: form.notes.trim() || null,
          is_active: form.is_active,
        },
      }),
    onSuccess: () => {
      toast.success(editingId ? 'Gegevens bijgewerkt.' : "ZZP'er toegevoegd.")
      setForm(emptyForm)
      setEditingId(null)
      setFormOpen(false)
      invalidate()
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Opslaan mislukt.'),
  })

  const topupMut = useMutation({
    mutationFn: ({ id, euros }: { id: string; euros: number }) =>
      adjustBalance({
        data: {
          contractorId: id,
          amountCents: Math.round(euros * 100),
          note: euros >= 0 ? 'Opwaardering' : 'Correctie',
        },
      }),
    onSuccess: (_d, vars) => {
      toast.success('Saldo bijgewerkt.')
      setTopup((t) => ({ ...t, [vars.id]: '' }))
      invalidate()
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Bijwerken mislukt.'),
  })

  function set(key: keyof typeof emptyForm, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function startEdit(c: any) {
    setEditingId(c.id)
    setForm({
      name: c.name ?? '',
      company: c.company ?? '',
      phone: c.phone ?? '',
      email: c.email ?? '',
      telegram_user_id: c.telegram_user_id ? String(c.telegram_user_id) : '',
      notes: c.notes ?? '',
      is_active: c.is_active,
    })
    setFormOpen(true)
    requestAnimationFrame(() => document.getElementById('zzp-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  const all = (contractorsQuery.data as any[]) ?? []
  const term = search.trim().toLowerCase()
  const rows = all.filter((c) => {
    if (filter === 'active' && !c.is_active) return false
    if (filter === 'low' && c.balance_cents >= 5000) return false
    if (!term) return true
    return [c.name, c.company, c.phone, c.email].some((v) => String(v ?? '').toLowerCase().includes(term))
  })

  const activeCount = all.filter((c) => c.is_active).length
  const totalBalance = all.reduce((sum, c) => sum + (c.balance_cents ?? 0), 0)
  const totalClaims = all.reduce((sum, c) => sum + (c.claimedCount ?? 0), 0)
  const totalSpent = all.reduce((sum, c) => sum + (c.spentCents ?? 0), 0)

  return (
    <div className="admin-mobile min-h-dvh bg-background">
      <AdminNav />
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-5 pb-[max(2rem,env(safe-area-inset-bottom))] sm:py-8">
        <h1 className="text-2xl font-bold">ZZP'ers &amp; tegoed</h1>

        <section aria-label="Kerncijfers" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Actief', value: String(activeCount) },
            { label: 'Totaal tegoed', value: euro(totalBalance) },
            { label: 'Leads geclaimd', value: String(totalClaims) },
            { label: 'Omzet uit leads', value: euro(totalSpent) },
          ].map((kpi) => (
            <div key={kpi.label} className="min-w-0 rounded-lg border border-border bg-card p-3">
              <div className="text-xs text-muted-foreground">{kpi.label}</div>
              <div className="mt-1 break-words text-lg font-semibold">{kpi.value}</div>
            </div>
          ))}
        </section>

        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              type="search"
              aria-label="Zoek ZZP'er"
              placeholder="Naam, bedrijf, telefoon of e-mail"
              className="pl-9 text-base"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div role="group" aria-label="Filter" className="flex gap-2 overflow-x-auto">
            {([
              { key: 'active', label: 'Actief' },
              { key: 'all', label: 'Alles' },
              { key: 'low', label: 'Laag saldo' },
            ] as { key: Filter; label: string }[]).map((f) => (
              <Button
                key={f.key}
                size="sm"
                className="min-h-11 shrink-0 rounded-full"
                aria-pressed={filter === f.key}
                variant={filter === f.key ? 'default' : 'outline'}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>

        {contractorsQuery.isLoading && <p role="status">Laden…</p>}
        {contractorsQuery.error && (
          <p role="alert" className="text-destructive">
            {contractorsQuery.error instanceof Error ? contractorsQuery.error.message : 'Laden mislukt.'}
          </p>
        )}
        {!contractorsQuery.isLoading && rows.length === 0 && (
          <p className="py-6 text-muted-foreground">Geen ZZP'ers gevonden.</p>
        )}

        <ul className="space-y-3">
          {rows.map((c: any) => (
            <li key={c.id}>
              <article className="min-w-0 rounded-lg border border-border bg-card">
                <div className="flex min-w-0 flex-wrap items-start gap-2 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="min-w-0 break-words font-semibold">{c.name}</span>
                      <Badge variant={c.is_active ? 'default' : 'secondary'}>{c.is_active ? 'Actief' : 'Inactief'}</Badge>
                      {c.balance_cents < 5000 && <Badge variant="destructive">Laag saldo</Badge>}
                      {!c.telegram_user_id && <Badge variant="outline">Geen Telegram</Badge>}
                    </div>
                    {c.company && <p className="break-words text-sm text-muted-foreground">{c.company}</p>}
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
                      {c.phone && (
                        <a href={`tel:${c.phone}`} className="inline-flex items-center gap-1 underline">
                          <Phone className="size-3.5" aria-hidden />
                          {c.phone}
                        </a>
                      )}
                      {c.telegram_user_id && (
                        <span className="inline-flex items-center gap-1">
                          <Send className="size-3.5" aria-hidden />
                          {c.telegram_user_id}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-xs text-muted-foreground">Tegoed</div>
                    <div className="text-lg font-semibold">{euro(c.balance_cents)}</div>
                  </div>
                </div>

                <dl className="grid grid-cols-2 gap-x-3 gap-y-2 border-t border-border px-4 py-3 text-sm sm:grid-cols-4">
                  <div className="min-w-0">
                    <dt className="text-xs text-muted-foreground">Aanvragen geclaimd</dt>
                    <dd className="font-medium">{c.claimedCount}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs text-muted-foreground">Besteed aan leads</dt>
                    <dd className="font-medium">{euro(c.spentCents)}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs text-muted-foreground">Laatste claim</dt>
                    <dd className="break-words font-medium">{c.lastClaimAt ? dateTime(c.lastClaimAt) : '—'}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs text-muted-foreground">Laatste opwaardering</dt>
                    <dd className="break-words font-medium">
                      {c.lastTopupAt ? `${euro(c.lastTopupCents ?? 0)} · ${dateTime(c.lastTopupAt)}` : '—'}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs text-muted-foreground">Opwaarderingen</dt>
                    <dd className="font-medium">
                      {c.topupCount}× · {euro(c.topupTotalCents)}
                    </dd>
                  </div>
                </dl>

                <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-3">
                  {[100, 200, 500].map((amount) => (
                    <Button
                      key={amount}
                      size="sm"
                      variant="secondary"
                      className="min-h-11"
                      disabled={topupMut.isPending}
                      onClick={() => topupMut.mutate({ id: c.id, euros: amount })}
                    >
                      +€{amount}
                    </Button>
                  ))}
                  <Input
                    className="w-24 text-base"
                    inputMode="decimal"
                    aria-label={`Ander bedrag voor ${c.name}`}
                    value={topup[c.id] ?? ''}
                    onChange={(e) => setTopup((t) => ({ ...t, [c.id]: e.target.value }))}
                    placeholder="Anders"
                  />
                  <Button
                    size="sm"
                    className="min-h-11"
                    disabled={topupMut.isPending || !topup[c.id]}
                    onClick={() => {
                      const value = Number((topup[c.id] ?? '').replace(',', '.'))
                      if (!Number.isFinite(value) || value === 0) {
                        toast.error('Vul een bedrag in.')
                        return
                      }
                      topupMut.mutate({ id: c.id, euros: value })
                    }}
                  >
                    <Wallet className="size-4" aria-hidden /> Bijboeken
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 border-t border-border px-4 py-2">
                  <Button size="sm" variant="ghost" className="min-h-11" onClick={() => setOpenLog((id) => (id === c.id ? null : c.id))}>
                    {openLog === c.id ? 'Verberg transacties' : 'Transacties'}
                  </Button>
                  <Button size="sm" variant="outline" className="min-h-11" onClick={() => startEdit(c)}>
                    Bewerken
                  </Button>
                </div>

                {openLog === c.id && (
                  <div className="border-t border-border bg-muted/30 p-4">
                    <TransactionLog contractorId={c.id} />
                  </div>
                )}
              </article>
            </li>
          ))}
        </ul>

        <Collapsible open={formOpen} onOpenChange={setFormOpen} id="zzp-form" className="rounded-lg border border-border bg-card">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex min-h-14 w-full items-center justify-between gap-2 px-4 text-left font-medium"
              aria-label={editingId ? "ZZP'er bewerken" : "Nieuwe ZZP'er toevoegen"}
            >
              <span className="inline-flex items-center gap-2">
                <Plus className="size-4" aria-hidden />
                {editingId ? "ZZP'er bewerken" : "Nieuwe ZZP'er toevoegen"}
              </span>
              <ChevronDown className={formOpen ? 'size-4 rotate-180 transition-transform' : 'size-4 transition-transform'} aria-hidden />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <form
              className="grid gap-4 border-t border-border p-4 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault()
                save.mutate()
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="name">Naam *</Label>
                <Input id="name" className="text-base" value={form.name} onChange={(e) => set('name', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Bedrijf</Label>
                <Input id="company" className="text-base" value={form.company} onChange={(e) => set('company', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefoon</Label>
                <Input id="phone" inputMode="tel" className="text-base" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" className="text-base" value={form.email} onChange={(e) => set('email', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tg">Telegram-ID (getal)</Label>
                <Input
                  id="tg"
                  inputMode="numeric"
                  className="text-base"
                  value={form.telegram_user_id}
                  onChange={(e) => set('telegram_user_id', e.target.value)}
                  placeholder="bijv. 123456789"
                />
              </div>
              <div className="flex items-center gap-3 sm:pt-8">
                <Switch id="active" checked={form.is_active} onCheckedChange={(v) => set('is_active', v)} />
                <Label htmlFor="active">Actief</Label>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="notes">Notitie</Label>
                <Textarea id="notes" rows={2} className="text-base" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
              </div>
              <div className="flex gap-3 sm:col-span-2">
                <Button type="submit" className="min-h-12" disabled={save.isPending || form.name.trim().length < 2}>
                  {save.isPending ? 'Bezig…' : editingId ? 'Opslaan' : 'Toevoegen'}
                </Button>
                {editingId && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="min-h-12"
                    onClick={() => {
                      setEditingId(null)
                      setForm(emptyForm)
                    }}
                  >
                    Annuleren
                  </Button>
                )}
              </div>
            </form>
          </CollapsibleContent>
        </Collapsible>
      </main>
    </div>
  )
}

const KIND_LABEL: Record<string, string> = {
  topup: 'Opwaardering',
  lead_claim: 'Lead geclaimd',
  correction: 'Correctie',
}

/** Uitklapbaar transactieoverzicht per ZZP'er. */
function TransactionLog({ contractorId }: { contractorId: string }) {
  const q = useQuery({
    queryKey: ['admin', 'transactions', contractorId],
    queryFn: () => listTransactions({ data: { contractorId } }),
  })

  if (q.isLoading) return <p className="text-sm text-muted-foreground">Laden…</p>
  if (q.error)
    return <p className="text-sm text-destructive">{q.error instanceof Error ? q.error.message : 'Laden mislukt.'}</p>
  const rows = (q.data as any[]) ?? []
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">Nog geen transacties.</p>

  return (
    <ul className="space-y-2">
      {rows.map((t: any) => (
        <li key={t.id} className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-border pb-2 text-sm last:border-0">
          <div className="min-w-0">
            <div className="font-medium">{KIND_LABEL[t.kind] ?? t.kind}</div>
            <div className="break-words text-xs text-muted-foreground">
              {dateTime(t.created_at)}
              {t.note ? ` · ${t.note}` : ''}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className={t.amount_cents < 0 ? 'font-medium text-destructive' : 'font-medium text-green-600'}>
              {t.amount_cents < 0 ? '−' : '+'}
              {euro(Math.abs(t.amount_cents))}
            </div>
            <div className="text-xs text-muted-foreground">saldo {euro(t.balance_after_cents)}</div>
          </div>
        </li>
      ))}
    </ul>
  )
}
