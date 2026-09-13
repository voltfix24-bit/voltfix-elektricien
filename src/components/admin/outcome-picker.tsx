import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { OUTCOMES, OUTCOME_LABEL, type Outcome } from '@/lib/lead-outcome'

/**
 * Vier knoppen onder de tijdlijn. Zodra de afloop staat, verdwijnt dit blok —
 * wijzigen gaat dan via de aparte knop in het detailpaneel.
 */
export function OutcomePicker({
  pending,
  onPick,
  onCancel,
}: {
  pending?: boolean
  onPick: (outcome: Outcome, note?: string) => void
  onCancel?: () => void
}) {
  const [chosen, setChosen] = useState<Outcome | null>(null)
  const [note, setNote] = useState('')

  if (chosen && chosen !== 'done') {
    return (
      <div className="space-y-3 border-t border-border pt-4">
        <Label htmlFor="outcome-note" className="text-[11.5px] font-bold uppercase tracking-[0.04em] text-muted-foreground">
          {OUTCOME_LABEL[chosen]} — korte toelichting (mag leeg)
        </Label>
        <Input
          id="outcome-note"
          className="text-base"
          placeholder="Bijv. klant koos voor eigen installateur"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <Button className="min-h-11 rounded-lg" disabled={pending} onClick={() => onPick(chosen, note)}>
            Vastleggen
          </Button>
          <Button variant="ghost" className="min-h-11 rounded-lg" onClick={() => { setChosen(null); setNote(''); onCancel?.() }}>
            Terug
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2 border-t border-border pt-4">
      <p className="text-[11.5px] font-bold uppercase tracking-[0.04em] text-muted-foreground">Hoe is het afgelopen</p>
      <div className="flex flex-wrap gap-2">
        {OUTCOMES.map((outcome) => (
          <Button
            key={outcome}
            variant="outline"
            className="min-h-11 rounded-lg"
            disabled={pending}
            onClick={() => (outcome === 'done' ? onPick(outcome) : setChosen(outcome))}
          >
            {OUTCOME_LABEL[outcome]}
          </Button>
        ))}
      </div>
    </div>
  )
}
