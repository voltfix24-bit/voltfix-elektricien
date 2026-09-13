import { useEffect, useMemo, useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Download, FileText, Loader2, Phone, RefreshCw, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/integrations/supabase/client'
import {
  checklistCodes,
  checklistItems,
  assessmentDecisions,
  hasCriticalSafetyFlag,
  missingInfoItems,
  safetyFlags as allSafetyFlags,
  workItems as allWorkItems,
  type AssessmentDecision,
  type ChecklistCode,
} from '@/lib/booking/perilex-assessment'
import {
  categoryLabel,
  checklistLabel,
  decisionLabel,
  eventLabel,
  missingInfoLabel,
  optionLabel,
  rejectionLabel,
  safetyLabel,
  statusLabel,
  workItemLabel,
} from './perilex-assessment-labels'
import {
  confirmPriorityAvailability,
  createAttachmentViewUrl,
  decideAssessmentFn,
  getAssessment,
  saveAssessmentDraft,
} from '@/lib/perilex-assessment.functions'

type Draft = {
  checklist: Record<string, string>
  safetyFlags: string[]
  workItems: string[]
  missingInfo: string[]
  internalNotes: string
}

const emptyDraft: Draft = { checklist: {}, safetyFlags: [], workItems: [], missingInfo: [], internalNotes: '' }

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter(item => item !== value) : [...list, value]
}

/**
 * Interne Perilex-beoordeling binnen de bestaande leaddetailweergave.
 * Geen tweede dashboard, geen modal in een modal.
 */
export function PerilexAssessmentPanel({ quoteRequestId, phone }: { quoteRequestId: string; phone?: string | null }) {
  const queryClient = useQueryClient()
  const load = useServerFn(getAssessment)
  const saveDraft = useServerFn(saveAssessmentDraft)
  const decide = useServerFn(decideAssessmentFn)
  const confirmAvailability = useServerFn(confirmPriorityAvailability)
  const viewUrl = useServerFn(createAttachmentViewUrl)

  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [dirty, setDirty] = useState(false)
  const [conflict, setConflict] = useState<string | null>(null)
  const [previews, setPreviews] = useState<Record<string, string>>({})

  const query = useQuery({
    queryKey: ['admin', 'assessment', quoteRequestId],
    queryFn: () => load({ data: { quoteRequestId } }),
  })

  const assessment: any = query.data?.assessment
  const version: number = assessment?.version ?? 1

  useEffect(() => {
    if (!assessment || dirty) return
    setDraft({
      checklist: (assessment.checklist ?? {}) as Record<string, string>,
      safetyFlags: (assessment.safety_flags ?? []) as string[],
      workItems: (assessment.work_items ?? []) as string[],
      missingInfo: (assessment.missing_info ?? []) as string[],
      internalNotes: assessment.internal_notes ?? '',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessment?.id, assessment?.version])

  const critical = hasCriticalSafetyFlag(draft.safetyFlags)
  const priorityRequested = Boolean(query.data?.customerRequestedPriority)
  const availabilityConfirmed = Boolean(assessment?.availability_confirmed_at)

  const patch = (next: Partial<Draft>) => {
    setDraft(current => ({ ...current, ...next }))
    setDirty(true)
    setConflict(null)
  }

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin', 'assessment', quoteRequestId] })

  const handleResult = (result: any, successMessage: string) => {
    if (result?.ok) {
      setDirty(false)
      setConflict(null)
      toast.success(successMessage)
      refresh()
      return
    }
    const reason = String(result?.reason ?? 'version_conflict')
    setConflict(rejectionLabel[reason] ?? reason)
    toast.error(rejectionLabel[reason] ?? 'Actie geweigerd.')
    if (reason === 'version_conflict') refresh()
  }

  const saveMut = useMutation({
    mutationFn: () =>
      saveDraft({
        data: {
          assessmentId: assessment.id,
          version,
          checklist: draft.checklist,
          safetyFlags: draft.safetyFlags as any,
          workItems: draft.workItems as any,
          missingInfo: draft.missingInfo as any,
          internalNotes: draft.internalNotes.trim() || null,
        },
      }),
    onSuccess: result => handleResult(result, 'Concept opgeslagen.'),
    onError: () => toast.error('Opslaan mislukt.'),
  })

  const decideMut = useMutation({
    mutationFn: (decision: AssessmentDecision) =>
      decide({ data: { assessmentId: assessment.id, version, decision, reason: null } }),
    onSuccess: result => handleResult(result, 'Beslissing vastgelegd.'),
    onError: () => toast.error('Vastleggen mislukt.'),
  })

  const availabilityMut = useMutation({
    mutationFn: (confirmed: boolean) => confirmAvailability({ data: { assessmentId: assessment.id, version, confirmed } }),
    onSuccess: result => handleResult(result, 'Beschikbaarheid bijgewerkt.'),
    onError: () => toast.error('Bijwerken mislukt.'),
  })

  const openImage = useMutation({
    mutationFn: (rowId: string) => viewUrl({ data: { attachmentRowId: rowId } }),
    onSuccess: (result: any, rowId) => setPreviews(current => ({ ...current, [rowId]: result.url })),
    onError: () => toast.error('Kon de bijlage niet openen.'),
  })

  const downloadMut = useMutation({
    mutationFn: async (row: any) => {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) throw new Error('no session')
      const response = await fetch('/api/admin/attachment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ attachmentRowId: row.id }),
      })
      if (!response.ok) throw new Error('download failed')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = row.original_filename ?? 'bijlage'
      anchor.click()
      URL.revokeObjectURL(url)
    },
    onError: () => toast.error('Downloaden mislukt.'),
  })

  const attachments: any[] = query.data?.attachments ?? []
  const events: any[] = query.data?.events ?? []
  const busy = saveMut.isPending || decideMut.isPending || availabilityMut.isPending

  const amount = useMemo(() => {
    if (!assessment?.amount_ex_vat_cents) return null
    return `€ ${(assessment.amount_ex_vat_cents / 100).toFixed(2).replace('.', ',')} excl. btw`
  }, [assessment?.amount_ex_vat_cents])

  if (query.isLoading) {
    return (
      <section className="rounded-xl border border-border p-4" aria-busy="true">
        <p className="text-sm text-muted-foreground">Beoordeling laden…</p>
      </section>
    )
  }
  if (query.error || !assessment) {
    return (
      <section className="rounded-xl border border-border p-4">
        <p role="alert" className="text-sm text-destructive">Beoordeling kon niet worden geladen.</p>
      </section>
    )
  }

  return (
    <section className="space-y-5" aria-label="Interne beoordeling">
      <div className="flex flex-wrap items-center gap-2.5">
        <h3 className="text-base font-extrabold tracking-[-0.015em]">Interne beoordeling</h3>
        <Badge variant="secondary">{statusLabel[assessment.assessment_status as keyof typeof statusLabel] ?? assessment.assessment_status}</Badge>
        {assessment.decision && <Badge variant="outline">{decisionLabel[assessment.decision as AssessmentDecision]}</Badge>}
        {amount && <Badge variant="outline">{amount}</Badge>}
        <span className="text-[13px] text-muted-foreground">versie {version}</span>
      </div>

      {critical && (
        <div className="rounded-xl border-2 border-destructive bg-destructive/10 p-4">
          <p className="flex items-center gap-2 font-bold text-destructive">
            <AlertTriangle className="size-5 shrink-0" /> Veiligheidsmarkering — geen vaste prijs
          </p>
          <p className="mt-1 text-[13.5px]">Bel de klant en leg de uitkomst vast. Een vaste prijs is geblokkeerd zolang deze markering staat.</p>
          {phone && (
            <Button asChild variant="destructive" className="mt-3 min-h-12">
              <a href={`tel:${String(phone).replace(/[^+\d]/g, '')}`}><Phone className="size-5" /> Klant bellen</a>
            </Button>
          )}
        </div>
      )}

      {conflict && (
        <div role="alert" className="rounded-xl border border-warning bg-warning/10 p-4 text-[13.5px]">
          <p className="font-bold">{conflict}</p>
          <Button type="button" variant="outline" className="mt-3 min-h-12" onClick={() => { setDirty(false); refresh() }}>
            <RefreshCw className="size-4" /> Herladen
          </Button>
        </div>
      )}

      {/* Bijlagen */}
      <div className="space-y-2.5">
        <h4 className="text-[11.5px] font-bold uppercase tracking-[0.04em] text-muted-foreground">Bijlagen</h4>
        {attachments.length === 0 && <p className="text-[13.5px] text-muted-foreground">Geen bijlagen bij deze aanvraag.</p>}
        <ul className="space-y-2.5">
          {attachments.map(row => (
            <li key={row.id} className="rounded-xl border border-border p-3">
              <p className="break-all text-[14.5px] font-semibold">{row.original_filename}</p>
              <p className="text-[13px] text-muted-foreground">
                {categoryLabel[row.category] ?? row.category} · {Math.round(row.size_bytes / 1024)} kB
                {row.sanitization_status === 'metadata_retained' ? ' · metadata behouden' : ''}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {row.mime_type === 'application/pdf' ? (
                  <Button type="button" variant="outline" className="min-h-12" disabled={downloadMut.isPending} onClick={() => downloadMut.mutate(row)}>
                    <Download className="size-4" /> Download PDF
                  </Button>
                ) : (
                  <Button type="button" variant="outline" className="min-h-12" disabled={openImage.isPending} onClick={() => openImage.mutate(row.id)}>
                    <FileText className="size-4" /> Bekijk (5 min geldig)
                  </Button>
                )}
              </div>
              {previews[row.id] && (
                <a href={previews[row.id]} target="_blank" rel="noreferrer" className="mt-2 block">
                  <img src={previews[row.id]} alt={`Bijlage ${row.original_filename}`} className="max-h-64 rounded-lg border border-border object-contain" />
                </a>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Checklist */}
      <div className="space-y-3">
        <h4 className="text-[11.5px] font-bold uppercase tracking-[0.04em] text-muted-foreground">Technische checklist</h4>
        {checklistCodes.map(code => (
          <fieldset key={code} className="min-w-0">
            <legend className="text-[13.5px] font-semibold">{checklistLabel[code as ChecklistCode]}</legend>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {(checklistItems[code] as readonly string[]).map(option => {
                const active = draft.checklist[code] === option
                return (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={active}
                    onClick={() => patch({ checklist: { ...draft.checklist, [code]: option } })}
                    className={`min-h-12 rounded-full border px-4 text-[13.5px] font-semibold ${active ? 'border-primary bg-secondary text-primary' : 'border-input text-foreground'}`}
                  >
                    {optionLabel[option] ?? option}
                  </button>
                )
              })}
            </div>
          </fieldset>
        ))}
      </div>

      {/* Veiligheid */}
      <div className="space-y-2.5">
        <h4 className="text-[11.5px] font-bold uppercase tracking-[0.04em] text-muted-foreground">Veiligheid</h4>
        {allSafetyFlags.map(flag => (
          <label key={flag} className="flex min-h-12 items-center gap-3 text-[14.5px]">
            <Checkbox checked={draft.safetyFlags.includes(flag)} onCheckedChange={() => patch({ safetyFlags: toggle(draft.safetyFlags, flag) })} />
            <span className="min-w-0 break-words">{safetyLabel[flag]}</span>
          </label>
        ))}
      </div>

      {/* Werkzaamheden */}
      <div className="space-y-2.5">
        <h4 className="text-[11.5px] font-bold uppercase tracking-[0.04em] text-muted-foreground">Mogelijke werkzaamheden</h4>
        {allWorkItems.map(item => (
          <label key={item} className="flex min-h-12 items-center gap-3 text-[14.5px]">
            <Checkbox checked={draft.workItems.includes(item)} onCheckedChange={() => patch({ workItems: toggle(draft.workItems, item) })} />
            <span className="min-w-0 break-words">{workItemLabel[item]}</span>
          </label>
        ))}
      </div>

      {/* Ontbrekende informatie */}
      <div className="space-y-2.5">
        <h4 className="text-[11.5px] font-bold uppercase tracking-[0.04em] text-muted-foreground">Ontbrekende informatie</h4>
        {missingInfoItems.map(item => (
          <label key={item} className="flex min-h-12 items-center gap-3 text-[14.5px]">
            <Checkbox checked={draft.missingInfo.includes(item)} onCheckedChange={() => patch({ missingInfo: toggle(draft.missingInfo, item) })} />
            <span className="min-w-0 break-words">{missingInfoLabel[item]}</span>
          </label>
        ))}
      </div>

      {/* Interne notities */}
      <div className="space-y-2">
        <Label htmlFor="assessment-notes" className="text-[11.5px] font-bold uppercase tracking-[0.04em] text-muted-foreground">
          Interne toelichting
        </Label>
        <Textarea
          id="assessment-notes"
          rows={4}
          className="text-base"
          value={draft.internalNotes}
          onChange={event => patch({ internalNotes: event.target.value })}
          placeholder="Wat je collega moet weten. Niet zichtbaar voor de klant."
        />
      </div>

      {/* Voorrang */}
      <div className="rounded-xl border border-border p-4">
        <h4 className="text-[13.5px] font-bold">Voorrang binnen 24 uur</h4>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {priorityRequested ? 'De klant heeft voorrang gevraagd.' : 'De klant heeft geen voorrang gevraagd — € 145 is niet mogelijk.'}
        </p>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {availabilityConfirmed
            ? `Beschikbaarheid bevestigd op ${new Date(assessment.availability_confirmed_at).toLocaleString('nl-NL', { dateStyle: 'short', timeStyle: 'short' })}.`
            : 'Beschikbaarheid nog niet bevestigd. Een verzoek is geen afspraak.'}
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-3 min-h-12"
          disabled={!priorityRequested || busy}
          onClick={() => availabilityMut.mutate(!availabilityConfirmed)}
        >
          {availabilityConfirmed ? 'Bevestiging intrekken' : 'Beschikbaarheid bevestigen'}
        </Button>
      </div>

      {/* Beslissing */}
      <div className="space-y-2.5">
        <h4 className="text-[11.5px] font-bold uppercase tracking-[0.04em] text-muted-foreground">Beslissing</h4>
        <div className="grid gap-2 sm:grid-cols-2">
          {assessmentDecisions.map(decision => (
            <Button
              key={decision}
              type="button"
              variant={assessment.decision === decision ? 'default' : 'outline'}
              className="min-h-12 justify-start text-left"
              disabled={busy || dirty}
              onClick={() => decideMut.mutate(decision)}
            >
              {decisionLabel[decision]}
            </Button>
          ))}
        </div>
        {dirty && <p className="text-[13px] text-muted-foreground">Sla eerst je wijzigingen op; de server beslist op de opgeslagen gegevens.</p>}
      </div>

      {/* Historie */}
      <div className="space-y-2">
        <h4 className="text-[11.5px] font-bold uppercase tracking-[0.04em] text-muted-foreground">Auditgeschiedenis</h4>
        <ol className="space-y-2 text-[13.5px]">
          {events.map(event => (
            <li key={event.id} className="border-l-2 border-border pl-3">
              <span className="font-semibold">{eventLabel[event.event_type] ?? event.event_type}</span>{' '}
              <span className="text-muted-foreground">
                {new Date(event.created_at).toLocaleString('nl-NL', { dateStyle: 'short', timeStyle: 'short' })}
              </span>
              {event.reason && <span className="block text-muted-foreground">{rejectionLabel[event.reason] ?? event.reason}</span>}
            </li>
          ))}
          {events.length === 0 && <li className="text-muted-foreground">Nog geen gebeurtenissen.</li>}
        </ol>
      </div>

      {/* Sticky opslaan — niet overlappend dankzij de spacer */}
      <div className="h-16" aria-hidden="true" />
      <div className="sticky bottom-0 -mx-4 border-t border-border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="min-w-0 flex-1 text-[13px] text-muted-foreground">
            {dirty ? 'Onopgeslagen wijzigingen' : 'Alles opgeslagen'}
          </span>
          <Button type="button" className="min-h-12" disabled={!dirty || busy} onClick={() => saveMut.mutate()}>
            {saveMut.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Concept opslaan
          </Button>
        </div>
      </div>
    </section>
  )
}
