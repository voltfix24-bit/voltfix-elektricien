import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { STEP_LABEL, formatWhen, isStepOverdue, type StepKind } from '@/lib/follow-up'

type Lead = {
  next_step_at?: string | null
  next_step_kind?: string | null
  contact_attempts?: number | null
  outcome?: string | null
}

/** Regel met de geplande vervolgstap plus de knop "Geen antwoord". */
export function FollowUp({
  lead,
  pending,
  onNoAnswer,
  onSetStep,
  onClose,
}: {
  lead: Lead
  pending?: boolean
  onNoAnswer: () => void
  onSetStep: (kind: StepKind | null, at: string | null) => void
  onClose: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [when, setWhen] = useState('')
  const [kind, setKind] = useState<StepKind>('call')

  if (lead.outcome) return null

  const kindValue = (lead.next_step_kind ?? null) as StepKind | null
  const attempts = Number(lead.contact_attempts ?? 0)
  const closing = kindValue === 'close' || attempts >= 3
  const overdue = isStepOverdue(lead as any)

  return (
    <div className="space-y-3 border-t border-border pt-4">
      {kindValue && (
        <p className={`text-[13.5px] ${overdue ? 'text-warning' : 'text-muted-foreground'}`}>
          Volgende: <span className="font-bold text-foreground">{STEP_LABEL[kindValue]}</span>
          {lead.next_step_at ? ` · ${formatWhen(lead.next_step_at)}` : ''}
          {overdue ? ' · verlopen' : ''}
          <button type="button" className="ml-2 font-bold text-primary" onClick={() => setEditing((open) => !open)}>
            Wijzig
          </button>
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          className={`min-h-11 rounded-lg ${closing ? 'text-muted-foreground' : ''}`}
          disabled={pending}
          onClick={closing ? onClose : onNoAnswer}
        >
          {closing ? 'Afsluiten als onbereikbaar' : 'Geen antwoord'}
        </Button>
        {attempts > 0 && <span className="text-[13px] text-muted-foreground tabular-nums">{attempts} van 3 pogingen</span>}
      </div>
      {editing && (
        <div className="space-y-2 rounded-xl border border-border bg-card p-[15px]">
          <Label htmlFor="step-kind" className="text-[11.5px] font-bold uppercase tracking-[0.04em] text-muted-foreground">Soort</Label>
          <select
            id="step-kind"
            value={kind}
            onChange={(event) => setKind(event.target.value as StepKind)}
            className="h-12 w-full rounded-lg border border-input bg-card px-3 text-[14px]"
          >
            <option value="call">Bellen</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="close">Afsluiten als onbereikbaar</option>
          </select>
          {kind !== 'close' && (
            <>
              <Label htmlFor="step-when" className="text-[11.5px] font-bold uppercase tracking-[0.04em] text-muted-foreground">Wanneer</Label>
              <Input id="step-when" type="datetime-local" className="text-base" value={when} onChange={(event) => setWhen(event.target.value)} />
            </>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              className="min-h-11 rounded-lg"
              disabled={pending || (kind !== 'close' && !when)}
              onClick={() => {
                onSetStep(kind, kind === 'close' ? null : new Date(when).toISOString())
                setEditing(false)
              }}
            >
              Bewaren
            </Button>
            <Button variant="ghost" className="min-h-11 rounded-lg" onClick={() => { onSetStep(null, null); setEditing(false) }}>
              Stap wissen
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
