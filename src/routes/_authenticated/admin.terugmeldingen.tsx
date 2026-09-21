import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'

import { AdminShell } from '@/components/admin/admin-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { OUTBOX_LABEL } from '@/lib/ads-outbox'
import { listAdsExportQueue, resetAdsExport } from '@/lib/admin.functions'

export const Route = createFileRoute('/_authenticated/admin/terugmeldingen')({
  component: Page,
  head: () => ({
    meta: [
      { title: 'Terugmeldingen · VoltFix backoffice' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
})

const EVIDENCE_LABEL: Record<string, string> = {
  form: 'Klik-id kwam mee met het formulier',
  whatsapp_ref: 'Code uit het bericht van de klant',
  click_id: 'Klik-id uit het bericht van de klant',
  manual_guess: 'Vermoeden · gaat niet naar Google',
}

function moment(iso: string) {
  return new Date(iso).toLocaleString('nl-NL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function Page() {
  const qc = useQueryClient()
  const read = useServerFn(listAdsExportQueue)
  const reset = useServerFn(resetAdsExport)

  const queue = useQuery({ queryKey: ['admin', 'ads-export-queue'], queryFn: () => read({}) })

  const again = useMutation({
    mutationFn: (id: string) => reset({ data: { id } }),
    onSuccess: () => {
      toast.success('Terug in de wachtrij')
      void qc.invalidateQueries({ queryKey: ['admin', 'ads-export-queue'] })
    },
    onError: (err: any) => toast.error(err?.message ?? 'Herstellen mislukt'),
  })

  const rows = queue.data?.rows ?? []
  const wachtend = rows.filter((r) => r.status === 'pending').length

  return (
    <AdminShell
      title="Terugmeldingen aan Google"
      context="Proefoverzicht: wat er klaarstaat, wat geblokkeerd is en waarom. Deze pagina verstuurt niets."
    >
      <div className="space-y-4 p-4">


        <div className="rounded-xl border border-border bg-card p-4 text-[13px]">
          <p>
            Verzenden naar Google staat{' '}
            <span className="font-bold">{queue.data?.exportEnabled ? 'aan' : 'uit'}</span>
            {' · '}koppeling {queue.data?.configured ? 'aanwezig' : 'ontbreekt'}
            {' · '}
            <span className="font-bold">{wachtend}</span> klaar om te verzenden van {rows.length} gebeurtenissen.
          </p>
          {!queue.data?.exportEnabled && (
            <p className="mt-1 text-muted-foreground">
              Zolang dit uitstaat blijft alles netjes wachten; er verlaat niets deze omgeving.
            </p>
          )}
        </div>

        {queue.isPending && <p className="text-[13px] text-muted-foreground">Overzicht laden…</p>}
        {queue.isError && <p className="text-[13px] text-destructive">Overzicht laden mislukt.</p>}

        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.id} className="rounded-xl border border-border bg-card p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[13px] font-bold">
                  {row.leadRef ? `#${row.leadRef}` : 'Dossier'} · {row.customerName ?? 'onbekend'} · {row.phaseLabel}
                </p>
                <Badge variant={row.status === 'failed_permanent' ? 'destructive' : 'outline'}>
                  {OUTBOX_LABEL[row.status] ?? row.status}
                </Badge>
              </div>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Gebeurtenis {moment(row.eventTime)} · {row.destination} ·{' '}
                {row.evidence ? (EVIDENCE_LABEL[row.evidence] ?? row.evidence) : 'geen bewijs'} · toestemming{' '}
                {row.consent === 'granted' ? 'verleend' : 'niet verleend'}
                {row.attempts > 0 && ` · ${row.attempts} poging(en)`}
              </p>
              {row.requestId && (
                <p className="text-[12px] text-muted-foreground">
                  Aanvraagnummer {row.requestId}
                  {row.submittedAt && ` · ingediend ${moment(row.submittedAt)}`}
                </p>
              )}
              {row.lastError && <p className="text-[12px] text-destructive">{row.lastError}</p>}
              {row.status === 'failed_permanent' && (
                <Button
                  variant="outline"
                  className="mt-2 min-h-11 rounded-lg"
                  disabled={again.isPending}
                  onClick={() => again.mutate(row.id)}
                >
                  Opnieuw in de wachtrij zetten
                </Button>
              )}
            </div>
          ))}
          {!queue.isPending && rows.length === 0 && (
            <p className="text-[13px] text-muted-foreground">Nog geen gebeurtenissen in de wachtrij.</p>
          )}
        </div>
      </div>
    </AdminShell>
  )
}
