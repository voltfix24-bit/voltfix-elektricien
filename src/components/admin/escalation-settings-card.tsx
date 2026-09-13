import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getLeadSettings, updateEscalationSettings } from '@/lib/admin.functions'
import { DEFAULT_ESCALATION_MINUTES } from '@/lib/lead-overdue'

/** Na hoeveel minuten zonder claim de beheerder een seintje krijgt. */
export function EscalationSettingsCard() {
  const queryClient = useQueryClient()
  const save = useServerFn(updateEscalationSettings)
  const settings = useQuery({ queryKey: ['admin', 'lead-settings'], queryFn: () => getLeadSettings() })
  const [draft, setDraft] = useState<{ urgent: string; planned: string } | null>(null)

  const current = settings.data as { escalation_urgent_minutes?: number; escalation_planned_minutes?: number } | undefined
  const values = draft ?? {
    urgent: String(current?.escalation_urgent_minutes ?? DEFAULT_ESCALATION_MINUTES.urgent),
    planned: String(current?.escalation_planned_minutes ?? DEFAULT_ESCALATION_MINUTES.planned),
  }

  const mutation = useMutation({
    mutationFn: () =>
      save({
        data: {
          escalation_urgent_minutes: Math.round(Number(values.urgent)),
          escalation_planned_minutes: Math.round(Number(values.planned)),
        },
      }),
    onSuccess: () => {
      toast.success('Escalatietermijnen opgeslagen.')
      setDraft(null)
      queryClient.invalidateQueries({ queryKey: ['admin', 'lead-settings'] })
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Opslaan mislukt.'),
  })

  return (
    <section aria-labelledby="escalation-title" className="rounded-xl border border-border bg-card">
      <h2 id="escalation-title" className="border-b border-border px-4 py-3 text-[16px] font-extrabold tracking-[-0.015em]">
        Escalatietermijnen
      </h2>
      <p className="px-4 pt-3 text-[13px] text-muted-foreground">
        Wordt een lead niet binnen deze tijd geclaimd in de groep, dan krijgt de beheerder één bericht. De monteurs krijgen niets extra’s.
      </p>
      <div className="flex flex-wrap items-end gap-4 px-4 py-4">
        <div className="space-y-1">
          <Label htmlFor="escalation-urgent" className="text-[11.5px] font-bold uppercase tracking-[0.04em] text-muted-foreground">
            Storing
          </Label>
          <div className="flex items-center gap-2">
            <Input id="escalation-urgent" className="w-24 text-base" inputMode="numeric" value={values.urgent} onChange={(e) => setDraft({ ...values, urgent: e.target.value })} />
            <span className="text-[13px] text-muted-foreground">minuten</span>
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="escalation-planned" className="text-[11.5px] font-bold uppercase tracking-[0.04em] text-muted-foreground">
            Gepland werk
          </Label>
          <div className="flex items-center gap-2">
            <Input id="escalation-planned" className="w-24 text-base" inputMode="numeric" value={values.planned} onChange={(e) => setDraft({ ...values, planned: e.target.value })} />
            <span className="text-[13px] text-muted-foreground">minuten</span>
          </div>
        </div>
        <Button className="min-h-11 rounded-lg" disabled={mutation.isPending || settings.isLoading} onClick={() => mutation.mutate()}>
          {mutation.isPending ? 'Bezig…' : 'Opslaan'}
        </Button>
      </div>
    </section>
  )
}
