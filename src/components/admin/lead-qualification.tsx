// ---------------------------------------------------------------------------
// Beoordeling van de aanvraag
// ---------------------------------------------------------------------------
// Dit is een eigen oordeel over de aanvráág: is dit een echte, bereikbare klant
// met een passende klus binnen het werkgebied, zonder spam of dubbel dossier?
// Dat een monteur de klus vervolgens aanneemt is een losse gebeurtenis, met een
// eigen moment. De twee worden hier bewust niet door elkaar gehaald.
// ---------------------------------------------------------------------------

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { setLeadQualification } from '@/lib/admin.functions'

type LeadLike = {
  id: string
  qualified_at?: string | null
  disqualified_at?: string | null
  qualification_note?: string | null
  disqualification_reason?: string | null
}

function dateText(value: string) {
  return new Date(value).toLocaleString('nl-NL', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function LeadQualification({ lead }: { lead: LeadLike }) {
  const qc = useQueryClient()
  const save = useServerFn(setLeadQualification)
  const [note, setNote] = useState('')
  const [open, setOpen] = useState(false)

  const mutation = useMutation({
    mutationFn: (vars: { qualified: boolean }) =>
      save({ data: { leadId: lead.id, qualified: vars.qualified, note: note.trim() || undefined } }),
    onSuccess: () => {
      setNote('')
      setOpen(false)
      void qc.invalidateQueries({ queryKey: ['admin', 'lead', lead.id] })
      void qc.invalidateQueries({ queryKey: ['admin', 'leads'] })
      toast.success('Beoordeling vastgelegd')
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : 'Beoordeling opslaan mislukt'),
  })

  const qualified = Boolean(lead.qualified_at)
  const rejected = Boolean(lead.disqualified_at)

  return (
    <div className="space-y-2 rounded-xl border border-border bg-card p-[15px]">
      <p className="text-[13px] text-muted-foreground">Beoordeling van de aanvraag</p>
      <p className="text-[15px]">
        {qualified
          ? `Echte klant · beoordeeld op ${dateText(lead.qualified_at!)}`
          : rejected
            ? `Afgekeurd op ${dateText(lead.disqualified_at!)}${lead.disqualification_reason ? ` · ${lead.disqualification_reason}` : ''}`
            : 'Nog niet beoordeeld'}
      </p>
      {qualified && lead.qualification_note && (
        <p className="text-[13px] text-muted-foreground">{lead.qualification_note}</p>
      )}

      {open ? (
        <div className="space-y-2">
          <Input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Toelichting (optioneel)"
            maxLength={300}
          />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={mutation.isPending} onClick={() => mutation.mutate({ qualified: true })}>
              Echte klant
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate({ qualified: false })}
            >
              Geen echte aanvraag
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
              Annuleren
            </Button>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          {qualified || rejected ? 'Beoordeling wijzigen' : 'Aanvraag beoordelen'}
        </Button>
      )}
    </div>
  )
}
