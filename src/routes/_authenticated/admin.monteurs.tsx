import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { AlertTriangle, Phone, RefreshCw } from 'lucide-react'
import { AdminShell } from '@/components/admin/admin-shell'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { listContractorPlanning } from '@/lib/admin.functions'

export const Route = createFileRoute('/_authenticated/admin/monteurs')({
  head: () => ({ meta: [{ title: 'Monteurs — VoltFix backoffice' }, { name: 'robots', content: 'noindex' }] }),
  component: MonteursPage,
})

type Job = {
  id: string
  ref: number | null
  name: string
  address: string
  jobType: string
  status: string
  urgent: boolean
  scheduledAt: string | null
  openDays: number | null
  stale: boolean
  clash: boolean
}

type Row = {
  id: string
  name: string
  company: string | null
  phone: string | null
  balanceCents: number
  isActive: boolean
  openCount: number
  todayCount: number
  staleCount: number
  clashCount: number
  unplannedCount: number
  /** Per leadsoort: kan deze monteur hem betalen, en zo nee hoeveel komt hij tekort? */
  affordability: { jobType: string; label: string; priceCents: number; ok: boolean; shortfallCents: number }[]
  jobs: Job[]
}

const euro = (cents: number) => `€${(cents / 100).toFixed(2).replace('.', ',')}`

function whenText(value: string | null) {
  if (!value) return 'Nog geen afspraak'
  const date = new Date(value)
  return date.toLocaleString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

const STATUS_LABEL: Record<string, string> = {
  new: 'Nieuw',
  dispatched: 'Verstuurd',
  claimed: 'Aangenomen',
  scheduled: 'Ingepland',
  urgent: 'Spoed',
}

function MonteursPage() {
  const fetchPlanning = useServerFn(listContractorPlanning)
  const query = useQuery({
    queryKey: ['admin', 'monteurs', 'planning'],
    queryFn: () => fetchPlanning(),
    refetchInterval: 120_000,
  })
  const rows = (query.data ?? []) as Row[]
  const active = rows.filter((row) => row.isActive)

  return (
    <AdminShell
      title="Monteurs"
      context="Wie heeft wat openstaan, wie zit vol vandaag, wie kan er een spoedklus bij."
      actions={
        <Button variant="outline" size="icon" className="min-h-11 min-w-11" aria-label="Vernieuwen" disabled={query.isFetching} onClick={() => query.refetch()}>
          <RefreshCw className={query.isFetching ? 'size-4 animate-spin' : 'size-4'} />
        </Button>
      }
    >
      {query.isLoading && <p role="status">Gegevens laden…</p>}
      {query.error && <p role="alert" className="text-destructive">Ophalen mislukt. Vernieuw de pagina.</p>}

      {/* Beslishulp bij een spoedklus: één regel per monteur, mobiel leesbaar. */}
      <section aria-labelledby="overzicht-title" className="mb-6 rounded-xl border border-border bg-card">
        <h2 id="overzicht-title" className="border-b border-border px-4 py-3 text-[16px] font-extrabold tracking-[-0.015em]">
          Wie kan er nu bij?
        </h2>
        <ul className="divide-y divide-border">
          {active.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
              <a href={`#monteur-${row.id}`} className="text-[14.5px] font-bold">{row.name}</a>
              <span className="text-[13px] text-muted-foreground tabular-nums">
                {row.openCount} open · {row.todayCount} vandaag · saldo {euro(row.balanceCents)}
              </span>
              {row.balanceCents < 500 && <Badge variant="destructive">saldo te laag</Badge>}
              {row.clashCount > 0 && <Badge variant="destructive">{row.clashCount} botsende afspraken</Badge>}
              {row.staleCount > 0 && <Badge variant="outline">{row.staleCount} te lang open</Badge>}
              {row.todayCount === 0 && row.balanceCents >= 500 && <Badge variant="secondary">ruimte vandaag</Badge>}
              {(row.affordability ?? []).map((tier) =>
                tier.ok ? null : (
                  <Badge key={tier.jobType} variant="outline" className="border-destructive text-destructive">
                    {tier.label}: {euro(tier.shortfallCents)} tekort
                  </Badge>
                ),
              )}
            </li>
          ))}
          {!query.isLoading && active.length === 0 && <li className="px-4 py-3 text-[13.5px] text-muted-foreground">Geen actieve monteurs.</li>}
        </ul>
      </section>

      <div className="space-y-5">
        {rows.map((row) => (
          <section key={row.id} id={`monteur-${row.id}`} className="rounded-xl border border-border bg-card">
            <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border px-4 py-3">
              <h2 className="text-[16px] font-extrabold tracking-[-0.015em]">{row.name}</h2>
              {!row.isActive && <Badge variant="outline">inactief</Badge>}
              <span className="text-[13px] tabular-nums text-muted-foreground">Saldo {euro(row.balanceCents)}</span>
              {row.balanceCents < 500 && <Badge variant="destructive">kan geen lead krijgen</Badge>}
              {(row.affordability ?? []).map((tier) => (
                <Badge
                  key={tier.jobType}
                  variant={tier.ok ? 'secondary' : 'outline'}
                  className={tier.ok ? '' : 'border-destructive text-destructive'}
                >
                  {tier.label} {euro(tier.priceCents)}: {tier.ok ? 'kan aannemen' : `${euro(tier.shortfallCents)} tekort`}
                </Badge>
              ))}
              {row.phone && (
                <Button asChild size="sm" variant="outline" className="ml-auto min-h-11 rounded-lg">
                  <a href={`tel:${row.phone.replace(/[^+\d]/g, '')}`}><Phone className="size-4" /> Bellen</a>
                </Button>
              )}
            </header>

            <p className="px-4 pt-3 text-[13px] tabular-nums text-muted-foreground">
              {row.openCount} open · {row.unplannedCount} zonder afspraak · {row.staleCount} te lang open · {row.todayCount} vandaag
            </p>

            <ul className="divide-y divide-border">
              {row.jobs.map((job) => (
                <li key={job.id} className={`px-4 py-3 ${job.clash ? 'border-l-4 border-l-destructive' : ''}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    {job.ref && <span className="rounded-md bg-secondary px-[7px] py-0.5 text-[11.5px] font-bold tabular-nums text-muted-foreground">#{job.ref}</span>}
                    <Link to="/admin/leads" search={{ lead: job.id }} className="text-[14px] font-bold">
                      {job.name}
                    </Link>
                    {job.urgent && <Badge variant="destructive">spoed</Badge>}
                    <Badge variant="secondary">{STATUS_LABEL[job.status] ?? job.status}</Badge>
                    {job.clash && (
                      <span className="inline-flex items-center gap-1 text-[12.5px] font-bold text-destructive">
                        <AlertTriangle className="size-3.5" aria-hidden /> botst met een andere afspraak
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[13px] text-muted-foreground">{job.address || job.jobType}</p>
                  <p className={`mt-0.5 text-[12.5px] font-bold tabular-nums ${job.stale ? 'text-warning' : 'text-muted-foreground'}`}>
                    {whenText(job.scheduledAt)}
                    {job.openDays !== null && ` · ${job.openDays} dag${job.openDays === 1 ? '' : 'en'} op zijn naam`}
                  </p>
                </li>
              ))}
              {row.jobs.length === 0 && <li className="px-4 py-3 text-[13.5px] text-muted-foreground">Niets open — beschikbaar.</li>}
            </ul>
          </section>
        ))}
      </div>
    </AdminShell>
  )
}
