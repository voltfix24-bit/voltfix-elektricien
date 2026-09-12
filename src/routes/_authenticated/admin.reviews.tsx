import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { Download, MessageCircle, Plus, Search, Star, TriangleAlert, UserSearch, X } from 'lucide-react'
import { AdminNav, euro } from '@/components/admin/admin-nav'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  approveReviewBonus,
  createManualReview,
  listMonteurPerformance,
  listReviewRequests,
  markReviewSent,
  searchCustomers,
} from '@/lib/admin.functions'
import { reviewHref } from '@/lib/business'
import { dateShort, daysSince, needsReminder } from '@/lib/review-followup'
import { ReviewTextDialog } from '@/components/admin/review-text-dialog'


export const Route = createFileRoute('/_authenticated/admin/reviews')({
  head: () => ({
    meta: [
      { title: 'Review beheer | VoltFix backoffice' },
      { name: 'description', content: 'Reviewverzoeken van monteurs opvolgen en bonussen toekennen.' },
      { name: 'robots', content: 'noindex, nofollow' },
      { property: 'og:title', content: 'Review beheer | VoltFix backoffice' },
      { property: 'og:description', content: 'Reviewverzoeken opvolgen en bonussen toekennen.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
    ],
  }),
  component: ReviewsPage,
})

type Filter = 'open' | 'tosend' | 'waiting' | 'reminder' | 'rewarded' | 'nobonus' | 'all'

const DEFAULT_BONUS_EUR = '5,00'

const dateTime = (value: string | null) =>
  value ? new Date(value).toLocaleString('nl-NL', { dateStyle: 'short', timeStyle: 'short' }) : '—'


function phoneDigits(phone: string | null | undefined) {
  return (phone ?? '').replace(/[^\d]/g, '')
}

function hasPhone(phone: string | null | undefined) {
  return phoneDigits(phone).length >= 9
}

function waHref(phone: string, text: string) {
  const digits = phoneDigits(phone).replace(/^0/, '31')
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}

function reviewText(customerName: string, jobType: string, monteur: string) {
  return [
    `Hoi ${customerName.split(' ')[0]},`,
    ``,
    `Bedankt dat je VoltFix hebt gekozen voor ${jobType.toLowerCase()}. ${monteur} heeft de klus uitgevoerd.`,
    ``,
    `Ben je tevreden? Een korte Google-review helpt ons enorm en kost je minder dan een minuut:`,
    reviewHref({ source: 'whatsapp', content: 'review-beheer' }),
    ``,
    `Alvast bedankt! — Team VoltFix`,
  ].join('\n')
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div role="radiogroup" aria-label="Aantal sterren" className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} ${n === 1 ? 'ster' : 'sterren'}`}
          onClick={() => onChange(n)}
          className="flex size-11 items-center justify-center rounded-md hover:bg-muted"
        >
          <Star
            className={`size-6 ${n <= value ? 'fill-warning text-warning' : 'text-muted-foreground'}`}
            aria-hidden
          />
        </button>
      ))}
    </div>
  )
}

function StarBadge({ rating }: { rating: number }) {
  return (
    <span
      className="inline-flex items-center gap-0.5 rounded-full bg-warning/10 px-2 py-0.5 text-warning-foreground"
      aria-label={`${rating} van 5 sterren`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`size-3.5 ${n <= rating ? 'fill-warning text-warning' : 'text-warning/40'}`}
          aria-hidden
        />
      ))}
    </span>
  )
}

function NoTelegramNotice() {
  return (
    <p
      role="note"
      className="flex items-start gap-2 rounded-md border border-warning bg-warning/10 px-3 py-2 text-sm text-warning-foreground"
    >
      <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>Geen Telegram gekoppeld (bonus wordt wel bijgeschreven, stuur handmatig bericht)</span>
    </p>
  )
}


const norm = (v: unknown) => String(v ?? '').toLowerCase()

/** Vrij zoeken op monteur, klantnaam of plaats. */
function matchesSearch(row: any, term: string) {
  const t = term.trim().toLowerCase()
  if (!t) return true
  return [row.customer_name, row.city, row.contractors?.name, row.contractors?.company].some((v) =>
    norm(v).includes(t),
  )
}

/** Filtert op beoordelingsdatum (valt terug op aanvraagdatum als er nog geen review is). */
function inDateRange(row: any, from: string, to: string) {
  if (!from && !to) return true
  const raw = row.reviewed_at ?? row.review_requested_at
  if (!raw) return false
  const day = new Date(raw).toISOString().slice(0, 10)
  if (from && day < from) return false
  if (to && day > to) return false
  return true
}

const csvCell = (value: unknown) => {
  const s = String(value ?? '')
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

const csvEuro = (cents: number | null) =>
  cents === null || cents === undefined ? '' : (cents / 100).toFixed(2).replace('.', ',')

/** Exporteert de zichtbare reviewregels als CSV met puntkomma's voor Nederlandse Excel. */
function exportTransactionsCsv(rows: any[]) {
  const header = [
    'Transactie ID',
    'Datum',
    'Monteur Naam',
    'Klantnaam',
    'Plaats',
    'Rating (Sterren)',
    'Bonus Bedrag (EUR)',
    'Saldo Na Transactie (EUR)',
  ]
  const lines = rows.map((r) =>
    [
      r.transaction_id ?? '',
      (r.reviewed_at ?? r.review_requested_at ?? '').slice(0, 10),
      r.contractors?.name ?? '',
      r.customer_name ?? '',
      r.city ?? '',
      r.review_rating ?? '',
      csvEuro(r.bonus_cents ?? 0),
      csvEuro(r.balance_after_cents ?? null),
    ]
      .map(csvCell)
      .join(';'),
  )
  const blob = new Blob(['\uFEFF' + [header.join(';'), ...lines].join('\r\n')], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `voltfix-review-transacties-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function SearchField({
  value,
  onChange,
  label,
}: {
  value: string
  onChange: (v: string) => void
  label: string
}) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <Input
        type="search"
        aria-label={label}
        placeholder={label}
        className="min-h-11 pl-9 text-base"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

/** Gestapelde balk: groen voor 5 sterren, amber voor 4 sterren, grijs voor lager. */
function StarDistribution({ counts }: { counts: Record<number, number> }) {
  const five = counts[5] ?? 0
  const four = counts[4] ?? 0
  const low = (counts[1] ?? 0) + (counts[2] ?? 0) + (counts[3] ?? 0)
  const total = five + four + low
  const tooltip = `${five}x 5⭐ | ${four}x 4⭐ | ${low}x <4⭐`
  const pct = (n: number) => (total ? `${(n / total) * 100}%` : '0%')
  return (
    <div className="mt-3" title={tooltip} aria-label={tooltip}>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="bg-success" style={{ width: pct(five) }} />
        <div className="bg-warning" style={{ width: pct(four) }} />
        <div className="bg-slate-400" style={{ width: pct(low) }} />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{tooltip}</p>
    </div>
  )
}

function PerformanceTable() {
  const [sort, setSort] = useState<'avg' | 'total'>('avg')
  const [search, setSearch] = useState('')
  const q = useQuery({ queryKey: ['admin', 'monteur-performance'], queryFn: () => listMonteurPerformance() })
  const rows = [...((q.data as any[]) ?? [])]
    .filter((c) => {
      const t = search.trim().toLowerCase()
      return !t || norm(c.name).includes(t) || norm(c.company).includes(t)
    })
    .sort((a, b) => (sort === 'avg' ? (b.avgRating ?? -1) - (a.avgRating ?? -1) : b.totalReviews - a.totalReviews))

  return (
    <div className="space-y-3">
      <SearchField value={search} onChange={setSearch} label="Zoek op monteur" />
      <div role="group" aria-label="Sorteren" className="flex gap-2">
        <Button
          size="sm"
          variant={sort === 'avg' ? 'default' : 'outline'}
          aria-pressed={sort === 'avg'}
          className="min-h-11 rounded-full"
          onClick={() => setSort('avg')}
        >
          Gemiddelde score
        </Button>
        <Button
          size="sm"
          variant={sort === 'total' ? 'default' : 'outline'}
          aria-pressed={sort === 'total'}
          className="min-h-11 rounded-full"
          onClick={() => setSort('total')}
        >
          Totaal reviews
        </Button>
      </div>
      {q.isLoading && <p role="status">Laden…</p>}
      {!q.isLoading && rows.length === 0 && <p className="py-6 text-muted-foreground">Geen monteurs gevonden.</p>}
      <ul className="space-y-3">
        {rows.map((c) => (
          <li key={c.id}>
            <article className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="min-w-0 break-words font-semibold">{c.name}</span>
                <span className="flex items-center gap-1 font-semibold text-warning">
                  <Star className="size-4 fill-warning text-warning" aria-hidden />
                  {c.avgRating === null ? '—' : `${c.avgRating.toFixed(1)} / 5.0`}
                </span>
              </div>
              <dl className="mt-3 grid grid-cols-3 gap-x-3 gap-y-2 text-sm">
                <div className="min-w-0">
                  <dt className="text-xs text-muted-foreground">Totaal reviews</dt>
                  <dd className="font-medium">{c.totalReviews}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-xs text-muted-foreground">5 sterren</dt>
                  <dd className="font-medium">{c.fiveStarReviews}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-xs text-muted-foreground">Bonus uitgekeerd</dt>
                  <dd className="font-medium text-success">{euro(c.bonusTotalCents)}</dd>
                </div>
              </dl>
              <StarDistribution counts={c.ratingCounts ?? {}} />
            </article>
          </li>
        ))}
      </ul>
    </div>
  )
}


function ReviewsPage() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<'requests' | 'performance'>('requests')
  const [filter, setFilter] = useState<Filter>('open')
  const [active, setActive] = useState<any | null>(null)
  const [textRow, setTextRow] = useState<{ row: any; mode: 'request' | 'reminder' } | null>(null)
  const [amount, setAmount] = useState(DEFAULT_BONUS_EUR)
  const [rating, setRating] = useState(5)
  const [notify, setNotify] = useState(true)
  const [manualOpen, setManualOpen] = useState(false)
  const [mContractor, setMContractor] = useState('')
  const [mName, setMName] = useState('')
  const [mPhone, setMPhone] = useState('')
  const [mCity, setMCity] = useState('')
  const [mJob, setMJob] = useState('')
  const [mRating, setMRating] = useState(5)
  const [mAmount, setMAmount] = useState(DEFAULT_BONUS_EUR)
  const [search, setSearch] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [mLeadId, setMLeadId] = useState<string | null>(null)
  const [custQuery, setCustQuery] = useState('')
  const [mLang, setMLang] = useState<'nl' | 'en'>('nl')

  const customers = useQuery({
    queryKey: ['admin', 'customer-search', custQuery],
    queryFn: () => searchCustomers({ data: { query: custQuery } }),
    enabled: manualOpen && !mLeadId && custQuery.trim().length >= 2,
  })

  const resetManual = () => {
    setMContractor('')
    setMName('')
    setMPhone('')
    setMCity('')
    setMJob('')
    setMRating(5)
    setMAmount(DEFAULT_BONUS_EUR)
    setMLeadId(null)
    setCustQuery('')
    setMLang('nl')
  }

  const pickCustomer = (c: any) => {
    setMLeadId(c.leadId)
    setMName(c.name ?? '')
    setMPhone(c.phone === '-' ? '' : (c.phone ?? ''))
    setMCity(c.city ?? '')
    setMJob(c.jobType ?? '')
    setMLang(c.language === 'en' ? 'en' : 'nl')
    if (c.contractorId) setMContractor(c.contractorId)
    setCustQuery('')
  }


  const q = useQuery({
    queryKey: ['admin', 'reviews', filter],
    queryFn: () => listReviewRequests({ data: { status: filter } }),
    enabled: tab === 'requests',
  })

  const monteurs = useQuery({
    queryKey: ['admin', 'monteur-performance'],
    queryFn: () => listMonteurPerformance(),
  })

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] })
    queryClient.invalidateQueries({ queryKey: ['admin', 'monteur-performance'] })
    queryClient.invalidateQueries({ queryKey: ['admin', 'contractor-overview'] })
    queryClient.invalidateQueries({ queryKey: ['admin', 'transactions'] })
  }

  const sent = useMutation({
    mutationFn: (leadId: string) => markReviewSent({ data: { leadId } }),
    onSuccess: () => {
      toast.success('Gemarkeerd als verstuurd.')
      queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] })
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Markeren mislukt.'),
  })

  const approve = useMutation({
    mutationFn: ({ leadId, cents, stars }: { leadId: string; cents: number; stars: number }) =>
      approveReviewBonus({ data: { leadId, amountCents: cents, rating: stars, notifyMonteur: notify } }),
    onSuccess: (_r, vars) => {
      toast.success(vars.cents > 0 ? 'Bonus toegekend en saldo bijgewerkt.' : 'Review vastgelegd zonder bonus.')
      setActive(null)
      setAmount(DEFAULT_BONUS_EUR)
      setRating(5)
      invalidateAll()
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Verwerken mislukt.'),
  })

  const manual = useMutation({
    mutationFn: (vars: { cents: number }) =>
      createManualReview({
        data: {
          contractorId: mContractor,
          ...(mLeadId ? { existingLeadId: mLeadId } : {}),
          customerName: mName.trim(),
          customerPhone: mPhone.trim(),
          city: mCity.trim(),
          jobType: mJob.trim(),
          customerLanguage: mLang,
          rating: mRating,
          amountCents: vars.cents,
          notifyMonteur: notify,
        },
      }),
    onSuccess: (_r, vars) => {
      toast.success(vars.cents > 0 ? 'Review vastgelegd en bonus toegekend.' : 'Review vastgelegd zonder bonus.')
      setManualOpen(false)
      resetManual()
      invalidateAll()
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Vastleggen mislukt.'),
  })

  const monteurList = ((monteurs.data as any[]) ?? []).filter((m) => m.isActive !== false)
  const allRows = (q.data as any[]) ?? []
  const rows = allRows.filter((r) => matchesSearch(r, search) && inDateRange(r, from, to))
  const openCount = rows.filter((r) => !r.reviewed_at).length

  const perf = (monteurs.data as any[]) ?? []
  const kpiReviews = perf.reduce((sum, c) => sum + (c.totalReviews ?? 0), 0)
  const kpiBonus = perf.reduce((sum, c) => sum + (c.bonusTotalCents ?? 0), 0)
  const rated = perf.filter((c) => c.avgRating !== null && (c.totalReviews ?? 0) > 0)
  const kpiAvg = rated.length
    ? rated.reduce((sum, c) => sum + c.avgRating * c.totalReviews, 0) /
      rated.reduce((sum, c) => sum + c.totalReviews, 0)
    : null



  return (
    <div className="admin-mobile min-h-dvh bg-background">
      <AdminNav />
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-5 pb-[max(2rem,env(safe-area-inset-bottom))] sm:py-8">
        <div>
          <h1 className="text-2xl font-bold">Review beheer</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monteurs vragen een review aan; jij stuurt het verzoek via WhatsApp en kent de bonus toe zodra de review
            binnen is.
          </p>
        </div>

        <Button
          className="min-h-11 w-full sm:w-auto"
          onClick={() => {
            resetManual()
            setManualOpen(true)
          }}
        >
          <Plus className="size-4" aria-hidden /> Review handmatig invoeren
        </Button>

        <div role="group" aria-label="Weergave" className="flex gap-2 border-b border-border pb-3">
          {([
            { key: 'requests', label: 'Reviewverzoeken' },
            { key: 'performance', label: 'Monteur prestaties' },
          ] as const).map((t) => (
            <Button
              key={t.key}
              size="sm"
              className="min-h-11 shrink-0"
              aria-pressed={tab === t.key}
              variant={tab === t.key ? 'default' : 'ghost'}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </Button>
          ))}
        </div>

        <dl className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-border bg-card p-3">
            <dt className="text-xs text-muted-foreground">Totaal reviews</dt>
            <dd className="mt-1 text-lg font-bold">{kpiReviews}</dd>
          </div>
          <div className="rounded-lg border border-border bg-card p-3">
            <dt className="text-xs text-muted-foreground">Bonussen</dt>
            <dd className="mt-1 text-lg font-bold text-success">{euro(kpiBonus)}</dd>
          </div>
          <div className="rounded-lg border border-border bg-card p-3">
            <dt className="text-xs text-muted-foreground">Netwerk rating</dt>
            <dd className="mt-1 flex items-center gap-1 text-lg font-bold text-warning">
              <Star className="size-4 fill-warning text-warning" aria-hidden />
              {kpiAvg === null ? '—' : kpiAvg.toFixed(2)}
            </dd>
          </div>
        </dl>

        {tab === 'performance' && <PerformanceTable />}


        {tab === 'requests' && (
        <>
        <div role="group" aria-label="Filter" className="flex gap-2 overflow-x-auto">
          {([
            { key: 'open', label: `Open${filter === 'open' && openCount ? ` (${openCount})` : ''}` },
            { key: 'tosend', label: 'Nog te sturen' },
            { key: 'waiting', label: 'Wacht op review' },
            { key: 'reminder', label: 'Herinnering sturen' },
            { key: 'rewarded', label: 'Afgerond & beloond' },
            { key: 'nobonus', label: 'Geen bonus (<5⭐)' },
            { key: 'all', label: 'Alles' },
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

        <SearchField value={search} onChange={setSearch} label="Zoek op monteur, klant of plaats" />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="from" className="text-xs text-muted-foreground">
              Vanaf datum
            </Label>
            <Input
              id="from"
              type="date"
              className="mt-1 min-h-11 text-base"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="to" className="text-xs text-muted-foreground">
              Tot datum
            </Label>
            <Input
              id="to"
              type="date"
              className="mt-1 min-h-11 text-base"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </div>

        <Button
          variant="outline"
          className="min-h-11 w-full border-success text-success hover:bg-success/10 sm:w-auto"
          disabled={rows.length === 0}
          onClick={() => exportTransactionsCsv(rows)}
        >
          <Download className="size-4" aria-hidden /> Export transacties (CSV)
        </Button>


        {q.isLoading && <p role="status">Laden…</p>}
        {q.error && (
          <p role="alert" className="text-destructive">
            {q.error instanceof Error ? q.error.message : 'Laden mislukt.'}
          </p>
        )}
        {!q.isLoading && rows.length === 0 && (
          <p className="py-6 text-muted-foreground">Geen reviewverzoeken in deze weergave.</p>
        )}

        <ul className="space-y-3">
          {rows.map((r: any) => {
            const monteur = r.contractors?.name ?? 'Onbekend'
            return (
              <li key={r.id}>
                <article className="min-w-0 rounded-lg border border-border bg-card">
                  <div className="flex min-w-0 flex-wrap items-start gap-2 p-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="min-w-0 break-words font-semibold">
                          <span aria-label={r.customer_language === 'en' ? 'Engelstalige klant' : 'Nederlandstalige klant'} title={r.customer_language === 'en' ? 'Engels' : 'Nederlands'}>
                            {r.customer_language === 'en' ? '🇬🇧' : '🇳🇱'}
                          </span>{' '}
                          {r.customer_name}
                        </span>
                        {r.reviewed_at ? (
                          r.review_rating === 5 ? (
                            <Badge variant="success">Beloond (€5)</Badge>
                          ) : (
                            <Badge variant="secondary">Geen bonus</Badge>
                          )
                        ) : r.review_sent_at ? (
                          <Badge variant="secondary">
                            📤 Verstuurd op {dateShort(r.review_sent_at)} ({daysSince(r.review_sent_at)}d geleden)
                          </Badge>
                        ) : (
                          <Badge variant="warning">Nog te sturen</Badge>
                        )}
                        {needsReminder(r) && (
                          <Badge variant="warning">
                            🔔 Herinnering nodig (72u+)
                          </Badge>
                        )}
                        {r.reminder_sent_at && !r.reviewed_at && (
                          <Badge variant="outline">🔔 Herinnerd {dateShort(r.reminder_sent_at)}</Badge>
                        )}
                        {r.review_rating ? <StarBadge rating={r.review_rating} /> : null}
                      </div>
                      <p className="break-words text-sm text-muted-foreground">
                        {r.job_type}
                        {r.city ? ` · ${r.city}` : ''}
                      </p>
                      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                        <div className="min-w-0">
                          <dt className="text-xs text-muted-foreground">Monteur</dt>
                          <dd className="break-words font-medium">{monteur}</dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="text-xs text-muted-foreground">Aangevraagd</dt>
                          <dd className="break-words font-medium">{dateTime(r.review_requested_at)}</dd>
                        </div>
                        {r.reviewed_at && (
                          <div className="min-w-0">
                            <dt className="text-xs text-muted-foreground">Verwerkt op</dt>
                            <dd className="break-words font-medium">{dateTime(r.reviewed_at)}</dd>
                          </div>
                        )}
                      </dl>
                      {!r.contractors?.telegram_user_id && (
                        <div className="mt-3">
                          <NoTelegramNotice />
                        </div>
                      )}
                    </div>

                  </div>

                  <div className="flex flex-wrap gap-2 border-t border-border px-4 py-3">
                    {!r.reviewed_at && !r.review_sent_at && (
                      <>
                        {hasPhone(r.customer_phone) ? (
                          <Button
                            asChild
                            size="sm"
                            className="min-h-11 bg-emerald-600 text-white hover:bg-emerald-700"
                            onClick={() => sent.mutate(r.id)}
                          >
                            <a
                              href={waHref(r.customer_phone, reviewText(r.customer_name, r.job_type, monteur))}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <MessageCircle className="size-4" aria-hidden /> Open WhatsApp & markeer verstuurd
                            </a>
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="min-h-11"
                            disabled
                            title="Geen telefoonnummer bekend"
                          >
                            <MessageCircle className="size-4" aria-hidden /> Geen telefoonnummer
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="min-h-11"
                          disabled={sent.isPending}
                          onClick={() => sent.mutate(r.id)}
                        >
                          ✅ Markeer als verstuurd
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="min-h-11"
                      onClick={() => setTextRow({ row: r, mode: 'request' })}
                    >
                      📋 Review tekst
                    </Button>
                    {needsReminder(r) && (
                      <Button
                        size="sm"
                        className="min-h-11 bg-amber-500 text-white hover:bg-amber-600"
                        onClick={() => setTextRow({ row: r, mode: 'reminder' })}
                      >
                        🔔 Stuur herinnering
                      </Button>
                    )}
                    {!r.reviewed_at && (
                      <Button
                        size="sm"
                        className="min-h-11 bg-amber-500 text-white hover:bg-amber-600"
                        onClick={() => {
                          setActive(r)
                          setAmount(DEFAULT_BONUS_EUR)
                          setNotify(true)
                        }}
                      >
                        <Star className="size-4" aria-hidden /> Review ontvangen (+€5)
                      </Button>
                    )}
                  </div>
                </article>
              </li>
            )
          })}
        </ul>
        </>
        )}
      </main>

      <Dialog open={Boolean(active)} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review verwerken</DialogTitle>
            <DialogDescription>
              {active
                ? `${active.contractors?.name ?? 'Monteur'} · klant ${active.customer_name} · ${active.job_type}`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {active && !active.contractors?.telegram_user_id && <NoTelegramNotice />}
            <div className="space-y-2">

              <Label>Beoordeling</Label>
              <StarPicker
                value={rating}
                onChange={(v) => {
                  setRating(v)
                  setAmount(v === 5 ? DEFAULT_BONUS_EUR : '0,00')
                }}
              />
              <p className="text-sm text-muted-foreground">
                {rating === 5
                  ? 'Bij 5 sterren volgt de bonus op het saldo van de monteur.'
                  : 'Onder 5 sterren leggen we de score vast zonder bonus.'}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bonus">Bonusbedrag (€)</Label>
              <Input
                id="bonus"
                inputMode="decimal"
                className="text-base"
                disabled={rating < 5}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="flex items-start gap-3">
              <Checkbox
                id="notify"
                checked={notify}
                onCheckedChange={(v) => setNotify(v === true)}
                className="mt-0.5"
              />
              <Label htmlFor="notify" className="font-normal leading-snug">
                Stuur een Telegram-melding naar de monteur
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" className="min-h-11" onClick={() => setActive(null)}>
              Annuleren
            </Button>
            <Button
              className="min-h-11 bg-green-600 text-white hover:bg-green-700"
              disabled={approve.isPending}
              onClick={() => {
                const value = rating === 5 ? Number(amount.replace(',', '.')) : 0
                if (!Number.isFinite(value) || value < 0 || (rating === 5 && value <= 0)) {
                  toast.error('Vul een geldig bedrag in.')
                  return
                }
                approve.mutate({ leadId: active.id, cents: Math.round(value * 100), stars: rating })
              }}
            >
              {approve.isPending
                ? 'Bezig…'
                : rating === 5
                  ? `Ken ${euro(Math.round((Number(amount.replace(',', '.')) || 0) * 100))} bonus toe`
                  : 'Review vastleggen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={manualOpen} onOpenChange={setManualOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review handmatig invoeren</DialogTitle>
            <DialogDescription>
              Voor een klus die niet via de Telegram-knop liep. Bij 5 sterren wordt de bonus direct bijgeschreven.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="m-customer">Bestaande klant</Label>
              {mLeadId ? (
                <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
                  <div className="min-w-0 text-sm">
                    <p className="truncate font-medium">{mName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      Gekoppeld aan bestaande klus{[mCity, mJob].filter(Boolean).length > 0 && ` · ${[mCity, mJob].filter(Boolean).join(' · ')}`}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="min-h-11 min-w-11 shrink-0"
                    aria-label="Koppeling verwijderen"
                    onClick={() => setMLeadId(null)}
                  >
                    <X className="size-4" aria-hidden />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <UserSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                    <Input
                      id="m-customer"
                      className="min-h-11 pl-9 text-base"
                      placeholder="Zoek op naam, telefoon of plaats…"
                      value={custQuery}
                      onChange={(e) => setCustQuery(e.target.value)}
                    />
                  </div>
                  {custQuery.trim().length >= 2 && (
                    <div className="max-h-48 divide-y divide-border overflow-y-auto rounded-md border border-border">
                      {customers.isPending && (
                        <p className="px-3 py-2 text-sm text-muted-foreground">Zoeken…</p>
                      )}
                      {!customers.isPending && ((customers.data as any[]) ?? []).length === 0 && (
                        <p className="px-3 py-2 text-sm text-muted-foreground">Geen klanten gevonden.</p>
                      )}
                      {((customers.data as any[]) ?? []).map((c: any) => (
                        <button
                          key={c.leadId}
                          type="button"
                          disabled={Boolean(c.reviewedAt)}
                          onClick={() => pickCustomer(c)}
                          className="flex min-h-11 w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-muted/60 disabled:opacity-50"
                        >
                          <span className="min-w-0">
                            <span className="block truncate font-medium">{c.name}</span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {[c.phone !== '-' ? c.phone : null, c.city, c.jobType].filter(Boolean).join(' · ')}
                            </span>
                          </span>
                          {c.reviewedAt ? (
                            <Badge variant="secondary" className="shrink-0">Review verwerkt</Badge>
                          ) : c.contractorName ? (
                            <span className="shrink-0 text-xs text-muted-foreground">{c.contractorName}</span>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="m-monteur">Monteur</Label>
              <Select value={mContractor} onValueChange={setMContractor}>
                <SelectTrigger id="m-monteur" className="min-h-11 text-base">
                  <SelectValue placeholder="Kies een monteur" />
                </SelectTrigger>
                <SelectContent>
                  {monteurList.map((m: any) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {mContractor && !monteurList.find((m: any) => m.id === mContractor)?.telegramLinked && (
              <NoTelegramNotice />
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="m-name">Klantnaam</Label>
                <Input id="m-name" className="text-base" value={mName} onChange={(e) => setMName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="m-phone">Telefoonnummer klant (optioneel)</Label>
                <Input
                  id="m-phone"
                  type="tel"
                  inputMode="tel"
                  placeholder="06 12345678"
                  className="text-base"
                  value={mPhone}
                  onChange={(e) => setMPhone(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="m-city">Plaats (optioneel)</Label>
                <Input id="m-city" className="text-base" value={mCity} onChange={(e) => setMCity(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="m-job">Klussoort (optioneel)</Label>
                <Input id="m-job" className="text-base" value={mJob} onChange={(e) => setMJob(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="m-lang">🌐 Taal klant</Label>
              <Select value={mLang} onValueChange={(v) => setMLang(v as 'nl' | 'en')}>
                <SelectTrigger id="m-lang" className="min-h-11 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nl">🇳🇱 Nederlands</SelectItem>
                  <SelectItem value="en">🇬🇧 Engels</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Beoordeling</Label>
              <StarPicker
                value={mRating}
                onChange={(v) => {
                  setMRating(v)
                  setMAmount(v === 5 ? DEFAULT_BONUS_EUR : '0,00')
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="m-bonus">Bonusbedrag (€)</Label>
              <Input
                id="m-bonus"
                inputMode="decimal"
                className="text-base"
                disabled={mRating < 5}
                value={mAmount}
                onChange={(e) => setMAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" className="min-h-11" onClick={() => setManualOpen(false)}>
              Annuleren
            </Button>
            <Button
              className="min-h-11 bg-green-600 text-white hover:bg-green-700"
              disabled={manual.isPending}
              onClick={() => {
                if (!mContractor) {
                  toast.error('Kies een monteur.')
                  return
                }
                if (!mName.trim()) {
                  toast.error('Vul de klantnaam in.')
                  return
                }
                const value = mRating === 5 ? Number(mAmount.replace(',', '.')) : 0
                if (!Number.isFinite(value) || value < 0 || (mRating === 5 && value <= 0)) {
                  toast.error('Vul een geldig bedrag in.')
                  return
                }
                manual.mutate({ cents: Math.round(value * 100) })
              }}
            >
              {manual.isPending ? 'Bezig…' : mRating === 5 ? 'Vastleggen en bonus toekennen' : 'Review vastleggen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {textRow && (
        <ReviewTextDialog
          key={`${textRow.row.id}-${textRow.mode}`}
          open={Boolean(textRow)}
          onOpenChange={(open) => !open && setTextRow(null)}
          mode={textRow.mode}
          leadId={textRow.row.id}
          customerName={textRow.row.customer_name}
          customerPhone={textRow.row.customer_phone}
          jobType={textRow.row.job_type}
          city={textRow.row.city}
          monteurName={textRow.row.contractors?.name}
          reviewRequested={Boolean(textRow.row.review_requested_at)}
          language={textRow.row.customer_language}
          onMarked={() => queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] })}
        />
      )}
    </div>

  )
}
