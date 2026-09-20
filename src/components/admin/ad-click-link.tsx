import { useState } from 'react'
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { linkLeadAdClick, listRecentAdClicks, retryAdsUpload } from '@/lib/admin.functions'

// conversion_type-waarden zoals het meetpunt ze opslaat (zie
// src/routes/api/public/track/conversion.ts).
const TYPE_LABEL: Record<string, string> = {
  whatsapp: 'WhatsApp-klik',
  call: 'Belknop',
  quote: 'Offerteaanvraag',
  schedule: 'Planning',
  social: 'Social-klik',
}

const UPLOAD_LABEL: Record<string, string> = {
  uploaded: 'Teruggemeld aan Google',
  failed: 'Terugmelden mislukt',
  skipped_no_click: 'Niet teruggemeld · geen advertentieklik',
  skipped_test: 'Niet teruggemeld · testdossier',
}

function clock(iso: string) {
  return new Date(iso).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
}

/**
 * Een klant die na een advertentieklik belt of appt, komt met de hand in de
 * backoffice. Hier koppel je zo'n dossier alsnog aan de klik, zodat de klus
 * later bij de juiste campagne terechtkomt.
 */
export function AdClickLink({ lead }: { lead: any }) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const linked = Boolean(lead.gclid || lead.gbraid || lead.wbraid)
  const link = useServerFn(linkLeadAdClick)
  const retry = useServerFn(retryAdsUpload)

  const clicks = useQuery({
    queryKey: ['ad-clicks'],
    queryFn: () => listRecentAdClicks({ data: { hours: 3 } }),
    enabled: open,
  })

  const save = useMutation({
    mutationFn: (click: { gclid: string | null; gbraid: string | null; wbraid: string | null }) =>
      link({ data: { leadId: lead.id, ...click } }),
    onSuccess: () => {
      toast.success('Advertentieklik bijgewerkt')
      setOpen(false)
      invalidateLead(qc, lead.id)
    },
    onError: (err: any) => toast.error(err?.message ?? 'Koppelen mislukt'),
  })

  const again = useMutation({
    mutationFn: () => retry({ data: { leadId: lead.id } }),
    onSuccess: (result: any) => {
      toast[result?.status === 'uploaded' ? 'success' : 'error'](
        UPLOAD_LABEL[result?.status] ?? 'Terugmelden mislukt',
      )
      invalidateLead(qc, lead.id)
    },
    onError: (err: any) => toast.error(err?.message ?? 'Terugmelden mislukt'),
  })

  return (
    <div className="space-y-2 rounded-xl border border-border bg-card p-[15px]">
      <p className="text-[13px] text-muted-foreground">
        Advertentie:{' '}
        <span className="font-bold text-foreground">
          {linked ? 'gekoppeld aan een Google Ads-klik' : 'geen klik gekoppeld'}
        </span>
      </p>

      {lead.ads_upload_status && (
        <p className="text-[13px] text-muted-foreground">
          <Badge variant={lead.ads_upload_status === 'failed' ? 'destructive' : 'outline'}>
            {UPLOAD_LABEL[lead.ads_upload_status] ?? lead.ads_upload_status}
          </Badge>
          {lead.ads_upload_error && <span className="ml-2 text-destructive">{lead.ads_upload_error}</span>}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" className="min-h-11 rounded-lg" onClick={() => setOpen((v) => !v)}>
          {linked ? 'Klik wijzigen' : 'Advertentieklik koppelen'}
        </Button>
        {linked && (
          <Button
            variant="ghost"
            className="min-h-11 rounded-lg"
            disabled={save.isPending}
            onClick={() => save.mutate({ gclid: null, gbraid: null, wbraid: null })}
          >
            Losmaken
          </Button>
        )}
        {lead.outcome === 'done' && linked && (
          <Button variant="ghost" className="min-h-11 rounded-lg" disabled={again.isPending} onClick={() => again.mutate()}>
            Opnieuw terugmelden
          </Button>
        )}
      </div>

      {open && (
        <div className="space-y-2">
          {clicks.isPending && <p className="text-[13px] text-muted-foreground">Klikken laden…</p>}
          {clicks.isError && <p className="text-[13px] text-destructive">Klikken laden mislukt.</p>}
          {clicks.data?.length === 0 && (
            <p className="text-[13px] text-muted-foreground">
              Geen advertentieklikken in de afgelopen 3 uur. Vraag de klant eventueel naar de code uit het
              WhatsApp-bericht.
            </p>
          )}
          {(clicks.data ?? []).map((click: any) => (
            <div key={click.key} className="flex items-center justify-between gap-2 rounded-lg border border-border p-2">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-bold">
                  {clock(click.at)} · {TYPE_LABEL[click.conversionType] ?? click.conversionType}
                  {click.clickRef && <span className="ml-2 font-mono">Ref {click.clickRef}</span>}
                </p>
                <p className="truncate text-[12px] text-muted-foreground">
                  {click.pagePath} · {click.device}
                </p>
              </div>
              <Button
                variant="outline"
                className="min-h-11 shrink-0 rounded-lg"
                disabled={save.isPending}
                onClick={() => save.mutate({ gclid: click.gclid, gbraid: click.gbraid, wbraid: click.wbraid })}
              >
                Koppelen
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
