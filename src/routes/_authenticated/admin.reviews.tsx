import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { MessageCircle, Star } from 'lucide-react'
import { AdminNav, euro } from '@/components/admin/admin-nav'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { approveReviewBonus, listReviewRequests } from '@/lib/admin.functions'
import { reviewHref } from '@/lib/business'

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

type Filter = 'open' | 'rewarded' | 'all'

const DEFAULT_BONUS_EUR = '5,00'

const dateTime = (value: string | null) =>
  value ? new Date(value).toLocaleString('nl-NL', { dateStyle: 'short', timeStyle: 'short' }) : '—'

function waHref(phone: string, text: string) {
  const digits = phone.replace(/[^\d]/g, '').replace(/^0/, '31')
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

function ReviewsPage() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<Filter>('open')
  const [active, setActive] = useState<any | null>(null)
  const [amount, setAmount] = useState(DEFAULT_BONUS_EUR)
  const [notify, setNotify] = useState(true)

  const q = useQuery({
    queryKey: ['admin', 'reviews', filter],
    queryFn: () => listReviewRequests({ data: { status: filter } }),
  })

  const approve = useMutation({
    mutationFn: ({ leadId, cents }: { leadId: string; cents: number }) =>
      approveReviewBonus({ data: { leadId, amountCents: cents, notifyMonteur: notify } }),
    onSuccess: () => {
      toast.success('Bonus toegekend en saldo bijgewerkt.')
      setActive(null)
      setAmount(DEFAULT_BONUS_EUR)
      queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'contractor-overview'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'transactions'] })
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Toekennen mislukt.'),
  })

  const rows = (q.data as any[]) ?? []
  const openCount = rows.filter((r) => !r.reviewed_at).length

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

        <div role="group" aria-label="Filter" className="flex gap-2 overflow-x-auto">
          {([
            { key: 'open', label: `Open${filter === 'open' && openCount ? ` (${openCount})` : ''}` },
            { key: 'rewarded', label: 'Beloond' },
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
                        <span className="min-w-0 break-words font-semibold">{r.customer_name}</span>
                        {r.reviewed_at ? (
                          <Badge className="bg-green-600 text-white hover:bg-green-600">Beloond</Badge>
                        ) : (
                          <Badge className="bg-amber-500 text-white hover:bg-amber-500">Review open</Badge>
                        )}
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
                            <dt className="text-xs text-muted-foreground">Beloond op</dt>
                            <dd className="break-words font-medium">{dateTime(r.reviewed_at)}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 border-t border-border px-4 py-3">
                    <Button asChild size="sm" variant="outline" className="min-h-11">
                      <a
                        href={waHref(r.customer_phone, reviewText(r.customer_name, r.job_type, monteur))}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <MessageCircle className="size-4" aria-hidden /> WhatsApp openen
                      </a>
                    </Button>
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
                        <Star className="size-4" aria-hidden /> Review goedgekeurd (+€5)
                      </Button>
                    )}
                  </div>
                </article>
              </li>
            )
          })}
        </ul>
      </main>

      <Dialog open={Boolean(active)} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>5-sterrenreview verwerken</DialogTitle>
            <DialogDescription>
              {active
                ? `${active.contractors?.name ?? 'Monteur'} · klant ${active.customer_name} · ${active.job_type}`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bonus">Bonusbedrag (€)</Label>
              <Input
                id="bonus"
                inputMode="decimal"
                className="text-base"
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
                const value = Number(amount.replace(',', '.'))
                if (!Number.isFinite(value) || value <= 0) {
                  toast.error('Vul een geldig bedrag in.')
                  return
                }
                approve.mutate({ leadId: active.id, cents: Math.round(value * 100) })
              }}
            >
              {approve.isPending ? 'Bezig…' : `Ken ${euro(Math.round((Number(amount.replace(',', '.')) || 0) * 100))} bonus toe`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
