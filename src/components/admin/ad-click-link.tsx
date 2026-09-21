import { useState } from 'react'
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { findAdClickByCode, linkLeadAdClick, listRecentAdClicks, retryAdsUpload } from '@/lib/admin.functions'

// conversion_type-waarden zoals het meetpunt ze opslaat (zie
// src/routes/api/public/track/conversion.ts).
const TYPE_LABEL: Record<string, string> = {
  whatsapp: 'WhatsApp-klik',
  call: 'Belknop',
  quote: 'Offerteaanvraag',
  schedule: 'Planning',
  social: 'Social-klik',
}

import { OUTBOX_LABEL } from '@/lib/ads-outbox'

const UPLOAD_LABEL: Record<string, string> = {
  ...OUTBOX_LABEL,
  uploaded: 'Ingediend bij Google',
  failed: 'Terugmelden mislukt',
}

/** Alleen een onderbouwde koppeling mag later naar Google. */
type Evidence = 'whatsapp_ref' | 'click_id' | 'manual_guess'

type SavePayload = {
  gclid: string | null
  gbraid: string | null
  wbraid: string | null
  evidence: Evidence | null
  consentAdUserData: 'granted' | 'denied' | null
}

/** Zelfde cache-sleutels als lead-sheet.tsx / admin.leads.tsx gebruiken. */
function invalidateLead(qc: QueryClient, leadId: string) {
  void qc.invalidateQueries({ queryKey: ['admin', 'lead', leadId] })
  void qc.invalidateQueries({ queryKey: ['admin', 'leads'] })
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
  const [code, setCode] = useState('')
  const linked = Boolean(lead.gclid || lead.gbraid || lead.wbraid)
  const link = useServerFn(linkLeadAdClick)
  const findByCode = useServerFn(findAdClickByCode)
  const retry = useServerFn(retryAdsUpload)

  const clicks = useQuery({
    queryKey: ['ad-clicks'],
    queryFn: () => listRecentAdClicks({ data: { hours: 3 } }),
    enabled: open,
  })

  const save = useMutation({
    mutationFn: (click: SavePayload) => link({ data: { leadId: lead.id, ...click } }),
    onSuccess: () => {
      toast.success('Advertentieklik bijgewerkt')
      setOpen(false)
      invalidateLead(qc, lead.id)
    },
    onError: (err: any) => toast.error(err?.message ?? 'Koppelen mislukt'),
  })

  // Plak de code ("K7QP") of het volledige klik-id uit het WhatsApp-bericht;
  // de server zoekt de bijbehorende advertentieklik en koppelt die direct.
  const paste = useMutation({
    mutationFn: async (value: string) => {
      const found: any = await findByCode({ data: { code: value } })
      if (!found) throw new Error('Geen advertentieklik gevonden bij deze code of dit klik-id.')
      if (found.ambiguous) {
        // Dezelfde code hoort bij meer dan één klik: dan is de koppeling niet
        // te bewijzen en kiezen we er niet zelf een.
        throw new Error(
          `Deze code hoort bij ${found.candidates?.length ?? 2} verschillende advertentieklikken. ` +
            'Vraag de klant het volledige klik-id, of kies bewust een klik uit de lijst (dat blijft een vermoeden).',
        )
      }
      return found
    },
    onSuccess: (found: any) => {
      // De klant noemde zelf de code of het klik-id: dat is hard bewijs.
      save.mutate({
        gclid: found.gclid,
        gbraid: found.gbraid,
        wbraid: found.wbraid,
        evidence: found.clickRef ? 'whatsapp_ref' : 'click_id',
        // Geen vastgelegde toestemming betekent onbekend — niet "geweigerd" en
        // zeker niet "verleend".
        consentAdUserData:
          found.consentAdUserData === 'granted'
            ? 'granted'
            : found.consentAdUserData === 'denied'
              ? 'denied'
              : null,
      })
    },
    onError: (err: any) => toast.error(err?.message ?? 'Klik niet gevonden'),
  })

  const again = useMutation({
    mutationFn: () => retry({ data: { leadId: lead.id } }),
    onSuccess: (result: any) => {
      const ok = result?.status === 'pending' || result?.status === 'submitted'
      toast[ok ? 'success' : 'error'](UPLOAD_LABEL[result?.status] ?? 'Terugmelden mislukt')
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
        {linked && lead.ad_click_evidence === 'manual_guess' && (
          <span className="ml-2 text-amber-600">vermoeden · gaat niet naar Google</span>
        )}
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
            onClick={() =>
              save.mutate({ gclid: null, gbraid: null, wbraid: null, evidence: null, consentAdUserData: null })
            }
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
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              const value = code.trim()
              if (value) paste.mutate(value)
            }}
          >
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Code of gclid uit WhatsApp (bijv. K7QP)"
              className="h-11 min-w-0 flex-1 rounded-lg border border-border bg-background px-3 font-mono text-[13px] outline-none focus:border-primary"
            />
            <Button
              type="submit"
              variant="outline"
              className="min-h-11 shrink-0 rounded-lg"
              disabled={paste.isPending || save.isPending || !code.trim()}
            >
              {paste.isPending ? 'Zoeken…' : 'Zoeken & koppelen'}
            </Button>
          </form>
          {clicks.isPending && <p className="text-[13px] text-muted-foreground">Klikken laden…</p>}
          {clicks.isError && <p className="text-[13px] text-destructive">Klikken laden mislukt.</p>}
          {clicks.data?.length === 0 && (
            <p className="text-[13px] text-muted-foreground">
              Geen advertentieklikken in de afgelopen 3 uur. Plak hierboven de code of het klik-id uit het
              WhatsApp-bericht om de klik alsnog te vinden.
            </p>
          )}
          <p className="text-[12px] text-muted-foreground">
            Een klik uit deze lijst kiezen is een vermoeden: die koppeling is zichtbaar in het dossier, maar gaat
            niet naar Google. Alleen een code of klik-id uit het bericht telt als bewijs.
          </p>
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
                onClick={() =>
                  save.mutate({
                    gclid: click.gclid,
                    gbraid: click.gbraid,
                    wbraid: click.wbraid,
                    // Gekozen uit de lijst: een vermoeden, geen bewijs.
                    evidence: 'manual_guess',
                    consentAdUserData: click.consentAdUserData === 'granted' ? 'granted' : 'denied',
                  })
                }
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
