import { createFileRoute, Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useQuery } from '@tanstack/react-query'
import { MessageSquarePlus, Phone, RefreshCw, ArrowRight, MessageCircle } from 'lucide-react'
import { AdminShell } from '@/components/admin/admin-shell'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { listApplications, listContractors, listLeads, listReviewRequests } from '@/lib/admin.functions'
import { isEmergencyLead, isLeadOverdue, openSinceText } from '@/lib/lead-overdue'
import { needsReminder } from '@/lib/review-followup'

export const Route = createFileRoute('/_authenticated/admin/vandaag')({
  head: () => ({
    meta: [
      { title: 'Vandaag | VoltFix backoffice' },
      { name: 'description', content: 'Wat moet er nu gebeuren: openstaande leads, achterstallige opvolging en signalen van vandaag.' },
      { name: 'robots', content: 'noindex, nofollow' },
      { property: 'og:title', content: 'Vandaag | VoltFix backoffice' },
      { property: 'og:description', content: 'Het startscherm van de backoffice: wat vraagt nu actie?' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
    ],
  }),
  component: TodayPage,
})

const WEEK_MS = 7 * 86_400_000

type LeadRow = {
  id: string
  customer_name: string
  customer_phone: string | null
  job_type: string
  city: string | null
  postal_code: string | null
  status: string
  is_urgent?: boolean
  claimed_by?: string | null
  claimed_at?: string | null
  dispatched_at: string | null
  created_at: string
  dispatch?: { state: 'queued' | 'sent' | 'failed' } | null
}

type Reason = 'emergency' | 'overdue' | 'dispatch_failed' | 'review_reminder' | 'awaiting'

const REASON_LABEL: Record<Reason, string> = {
  emergency: 'Spoed open',
  overdue: 'Te laat',
  dispatch_failed: 'Verzending mislukt',
  review_reminder: 'Review-herinnering',
  awaiting: 'Wacht op akkoord',
}

const REASON_VARIANT: Record<Reason, 'destructive' | 'warning' | 'secondary'> = {
  emergency: 'destructive',
  overdue: 'destructive',
  dispatch_failed: 'warning',
  review_reminder: 'warning',
  awaiting: 'secondary',
}

const REASON_EDGE: Record<Reason, string> = {
  emergency: 'border-l-destructive',
  overdue: 'border-l-destructive',
  dispatch_failed: 'border-l-warning',
  review_reminder: 'border-l-warning',
  awaiting: 'border-l-border',
}

/** Volgorde van urgentie; bepaalt zowel sortering als de knop. */
const REASON_ORDER: Reason[] = ['emergency', 'overdue', 'dispatch_failed', 'review_reminder', 'awaiting']

function telHref(phone: string | null) {
  return `tel:${(phone ?? '').replace(/[^\d+]/g, '')}`
}

function waHref(phone: string | null) {
  const digits = (phone ?? '').replace(/\D/g, '')
  const international = digits.startsWith('0') ? `31${digits.slice(1)}` : digits
  return `https://wa.me/${international}`
}

function TodayPage() {
  const fetchLeads = useServerFn(listLeads)
  const fetchContractors = useServerFn(listContractors)
  const fetchReviews = useServerFn(listReviewRequests)
  const fetchApplications = useServerFn(listApplications)

  const leadsQuery = useQuery({
    queryKey: ['admin', 'today', 'leads'],
    queryFn: () => fetchLeads({ data: { status: 'all', search: '', cursor: null, limit: 100 } }),
    refetchInterval: 120_000,
  })
  const reviewsQuery = useQuery({
    queryKey: ['admin', 'today', 'reviews'],
    queryFn: () => fetchReviews({ data: { status: 'all' } }),
  })
  const contractorsQuery = useQuery({ queryKey: ['admin', 'today', 'contractors'], queryFn: () => fetchContractors() })
  const applicationsQuery = useQuery({ queryKey: ['admin', 'today', 'applications'], queryFn: () => fetchApplications() })

  const now = Date.now()
  const leads = (leadsQuery.data?.rows ?? []) as LeadRow[]
  const reviews = (reviewsQuery.data ?? []) as any[]
  const contractors = (contractorsQuery.data ?? []) as any[]
  const applications = (applicationsQuery.data ?? []) as any[]

  const counts = {
    new: leads.filter((lead) => lead.status === 'new').length,
    dispatched: leads.filter((lead) => lead.status === 'dispatched').length,
    claimed: leads.filter((lead) => lead.status === 'claimed').length,
    overdue: leads.filter((lead) => isLeadOverdue(lead, now)).length,
  }

  // Één regel per lead: de zwaarste reden telt.
  const leadActions = leads
    .map((lead) => {
      const open = lead.status === 'new' || lead.status === 'dispatched'
      const reason: Reason | null = !open
        ? null
        : isEmergencyLead(lead) && !lead.claimed_by
          ? 'emergency'
          : isLeadOverdue(lead, now)
            ? 'overdue'
            : lead.dispatch?.state === 'failed'
              ? 'dispatch_failed'
              : lead.status === 'new'
                ? 'awaiting'
                : null
      return reason ? { lead, reason } : null
    })
    .filter(Boolean) as { lead: LeadRow; reason: Reason }[]

  const reminderActions = reviews
    .filter((row) => needsReminder(row, now))
    .map((row) => ({
      lead: {
        id: row.id,
        customer_name: row.customer_name,
        customer_phone: row.customer_phone,
        job_type: row.job_type,
        city: row.city,
        postal_code: row.postal_code,
        status: 'claimed',
        dispatched_at: null,
        created_at: row.review_sent_at ?? new Date().toISOString(),
      } as LeadRow,
      reason: 'review_reminder' as Reason,
    }))

  const todo = [...leadActions, ...reminderActions]
    .sort((a, b) => REASON_ORDER.indexOf(a.reason) - REASON_ORDER.indexOf(b.reason) || Date.parse(a.lead.created_at) - Date.parse(b.lead.created_at))
    .slice(0, 8)

  const weekStart = now - WEEK_MS
  const weekLeads = leads.filter((lead) => Date.parse(lead.created_at) >= weekStart)
  const weekClaimed = leads.filter((lead) => lead.claimed_at && Date.parse(lead.claimed_at) >= weekStart)
  const claimMinutes = weekClaimed
    .map((lead) => (Date.parse(lead.claimed_at!) - Date.parse(lead.dispatched_at ?? lead.created_at)) / 60_000)
    .filter((value) => Number.isFinite(value) && value >= 0)
  const averageClaim = claimMinutes.length ? Math.round(claimMinutes.reduce((sum, value) => sum + value, 0) / claimMinutes.length) : null
  const weekReviews = reviews.filter((row) => row.reviewed_at && Date.parse(row.reviewed_at) >= weekStart).length

  const lowBalance = contractors.filter((row) => Number(row.balance_cents ?? 0) < 5000)
  const reviewsToSend = reviews.filter((row) => !row.review_sent_at && !row.reviewed_at).length
  const waitingApplications = applications.filter((row) => row.status === 'new').length

  const loading = leadsQuery.isLoading

  return (
    <AdminShell title="Vandaag" context="Wat moet er nu gebeuren?">
      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Nieuw" value={counts.new} loading={loading} />
            <Stat label="Doorgezet" value={counts.dispatched} loading={loading} />
            <Stat label="Opgepakt" value={counts.claimed} loading={loading} tone="text-success" />
            <Stat label="Te laat" value={counts.overdue} loading={loading} tone="text-destructive" />
          </div>

          <section aria-labelledby="todo-title" className="min-w-0 rounded-xl border border-border bg-card">
            <h2 id="todo-title" className="border-b border-border px-4 py-3 text-[16px] font-extrabold tracking-[-0.015em]">Nu doen</h2>
            {loading && <div className="space-y-3 p-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>}
            {!loading && todo.length === 0 && <p className="px-4 py-6 text-sm text-muted-foreground">Niets dat nu actie vraagt. Mooi moment voor een kop koffie.</p>}
            {todo.length > 0 && (
              <ul className="divide-y divide-border">
                {todo.map(({ lead, reason }) => (
                  <li key={`${reason}-${lead.id}`} className={`flex min-w-0 flex-wrap items-center gap-3 border-l-[3px] px-[15px] py-[13px] ${REASON_EDGE[reason]}`}>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14.5px] font-bold">{lead.customer_name}</p>
                      <p className="truncate text-[13px] text-muted-foreground">
                        {lead.job_type}
                        {lead.city || lead.postal_code ? ` · ${lead.city ?? lead.postal_code}` : ''}
                        {reason !== 'review_reminder' ? ` · ${openSinceText(lead, now)}` : ''}
                      </p>
                    </div>
                    <Badge variant={REASON_VARIANT[reason]} className="shrink-0">{REASON_LABEL[reason]}</Badge>
                    <ActionButton reason={reason} lead={lead} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="min-w-0 space-y-5">
          <Link
            to="/admin/leads/plakken"
            className="flex min-h-[72px] w-full items-center gap-3 rounded-xl border border-success bg-success/[0.07] px-4 py-3 text-left"
          >
            <MessageSquarePlus className="size-6 shrink-0 text-success" aria-hidden />
            <span className="min-w-0">
              <span className="block text-[14.5px] font-bold">Plak uit WhatsApp</span>
              <span className="block text-[13px] text-muted-foreground">Gesprek plakken, wij vullen de velden</span>
            </span>
          </Link>

          <section aria-labelledby="signals-title" className="min-w-0 rounded-xl border border-border bg-card">
            <h2 id="signals-title" className="border-b border-border px-4 py-3 text-[16px] font-extrabold tracking-[-0.015em]">Let op</h2>
            <ul className="divide-y divide-border">
              <SignalRow
                tone={lowBalance.length ? 'destructive' : 'warning'}
                text={lowBalance.length ? `${lowBalance.length} ZZP'er${lowBalance.length === 1 ? '' : 's'} met laag saldo` : 'Alle saldi in orde'}
                action="Bekijken"
                to="/admin/contractors"
                muted={!lowBalance.length}
              />
              <SignalRow
                tone="warning"
                text={reviewsToSend ? `${reviewsToSend} review${reviewsToSend === 1 ? '' : 's'} nog niet verstuurd` : 'Alle reviews verstuurd'}
                action="Versturen"
                to="/admin/reviews"
                muted={!reviewsToSend}
              />
              <SignalRow
                tone="warning"
                text={waitingApplications ? `${waitingApplications} aanmelding${waitingApplications === 1 ? '' : 'en'} wacht` : 'Geen wachtende aanmeldingen'}
                action="Beoordelen"
                to="/admin/aanmeldingen"
                muted={!waitingApplications}
              />
            </ul>
          </section>

          <section aria-labelledby="week-title" className="min-w-0 rounded-xl border border-border bg-card">
            <h2 id="week-title" className="border-b border-border px-4 py-3 text-[16px] font-extrabold tracking-[-0.015em]">Deze week</h2>
            <dl className="divide-y divide-border">
              <WeekRow label="Leads binnen" value={String(weekLeads.length)} />
              <WeekRow label="Geclaimd" value={String(weekClaimed.length)} />
              <WeekRow label="Gemiddelde claimtijd" value={averageClaim === null ? '—' : averageClaim < 60 ? `${averageClaim} min` : `${Math.round(averageClaim / 60)} u`} />
              <WeekRow label="Reviews binnen" value={String(weekReviews)} />
            </dl>
          </section>
        </div>
      </div>
    </AdminShell>
  )
}

function Stat({ label, value, tone, loading }: { label: string; value: number; tone?: string; loading?: boolean }) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-card px-4 py-3">
      {loading ? (
        <Skeleton className="h-8 w-12" />
      ) : (
        <p className={`text-[27px] font-extrabold leading-tight tracking-[-0.03em] tabular-nums ${tone ?? ''}`}>{value}</p>
      )}
      <p className="mt-0.5 text-[12.5px] text-muted-foreground">{label}</p>
    </div>
  )
}

function ActionButton({ reason, lead }: { reason: Reason; lead: LeadRow }) {
  if (reason === 'emergency' || reason === 'overdue') {
    return (
      <Button asChild variant="destructive" size="sm" className="min-h-11 shrink-0">
        <a href={telHref(lead.customer_phone)}><Phone className="size-4" /> Bellen</a>
      </Button>
    )
  }
  if (reason === 'dispatch_failed') {
    return (
      <Button asChild size="sm" className="min-h-11 shrink-0">
        <Link to="/admin/leads" search={{ view: 'list', lead: lead.id }}><RefreshCw className="size-4" /> Opnieuw</Link>
      </Button>
    )
  }
  if (reason === 'review_reminder') {
    return (
      <Button asChild variant="whatsapp" size="sm" className="min-h-11 shrink-0">
        <a href={waHref(lead.customer_phone)} target="_blank" rel="noreferrer"><MessageCircle className="size-4" /> WhatsApp</a>
      </Button>
    )
  }
  return (
    <Button asChild size="sm" className="min-h-11 shrink-0">
      <Link to="/admin/leads" search={{ view: 'list', lead: lead.id }}>Openen</Link>
    </Button>
  )
}

function SignalRow({ tone, text, action, to, muted }: { tone: 'warning' | 'destructive'; text: string; action: string; to: string; muted?: boolean }) {
  return (
    <li className="flex min-w-0 items-center gap-3 px-4 py-3">
      <span aria-hidden className={`size-2 shrink-0 rounded-full ${muted ? 'bg-border' : tone === 'destructive' ? 'bg-destructive' : 'bg-warning'}`} />
      <span className="min-w-0 flex-1 truncate text-[13.5px]">{text}</span>
      <Link to={to} className="inline-flex shrink-0 items-center gap-1 text-[13px] font-bold text-primary">
        {action} <ArrowRight className="size-3.5" aria-hidden />
      </Link>
    </li>
  )
}

function WeekRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <dt className="text-[13px] text-muted-foreground">{label}</dt>
      <dd className="text-[14.5px] font-semibold tabular-nums">{value}</dd>
    </div>
  )
}
