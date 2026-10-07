import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { getLeadSettings, updatePriorityGroupSettings } from '@/lib/admin.functions'
import { actionError } from '@/components/admin/list-ui'

/** Eerst de besloten voorranggroep, daarna pas de gewone monteursgroep. */
export function PriorityGroupCard() {
  const queryClient = useQueryClient()
  const save = useServerFn(updatePriorityGroupSettings)
  const settings = useQuery({ queryKey: ['admin', 'lead-settings'], queryFn: () => getLeadSettings() })
  const current = settings.data as
    | {
        priority_group_enabled?: boolean
        priority_chat_id?: string | null
        priority_wait_urgent_seconds?: number
        priority_wait_planned_seconds?: number
      }
    | undefined
  const [draft, setDraft] = useState<{ enabled: boolean; chat: string; urgent: string; planned: string } | null>(null)
  const values = draft ?? {
    enabled: current?.priority_group_enabled ?? false,
    chat: current?.priority_chat_id ?? '',
    urgent: String(Math.round((current?.priority_wait_urgent_seconds ?? 180) / 60)),
    planned: String(Math.round((current?.priority_wait_planned_seconds ?? 900) / 60)),
  }

  const mutation = useMutation({
    mutationFn: () =>
      save({
        data: {
          priority_group_enabled: values.enabled,
          priority_chat_id: values.chat.trim() || null,
          priority_wait_urgent_seconds: Math.max(1, Math.round(Number(values.urgent)) || 3) * 60,
          priority_wait_planned_seconds: Math.max(1, Math.round(Number(values.planned)) || 15) * 60,
        },
      }),
    onSuccess: () => {
      toast.success('Voorranggroep opgeslagen.')
      setDraft(null)
      queryClient.invalidateQueries({ queryKey: ['admin', 'lead-settings'] })
    },
    onError: () => actionError('Niet opgeslagen. Klopt het groep-ID?'),
  })

  const field = 'text-[11.5px] font-bold uppercase tracking-[0.04em] text-muted-foreground'

  return (
    <section aria-labelledby="priority-group-title" className="rounded-xl border border-border bg-card">
      <h2 id="priority-group-title" className="border-b border-border px-4 py-3 text-[16px] font-extrabold tracking-[-0.015em]">
        Voorranggroep
      </h2>
      <p className="px-4 pt-3 text-[13px] text-muted-foreground">
        Nieuwe klussen gaan eerst alleen naar de besloten voorranggroep. Neemt daar niemand de klus aan binnen de wachttijd,
        dan komt hij in de gewone monteursgroep. Die groep ziet niets van de eerste ronde.
      </p>
      <div className="flex flex-wrap items-end gap-4 px-4 py-4">
        <div className="flex items-center gap-2 pb-2">
          <Switch id="priority-enabled" checked={values.enabled} onCheckedChange={(v) => setDraft({ ...values, enabled: v })} />
          <Label htmlFor="priority-enabled" className="text-[13px]">Aan</Label>
        </div>
        <div className="space-y-1">
          <Label htmlFor="priority-chat" className={field}>Groep-ID</Label>
          <Input id="priority-chat" className="w-44 text-base tabular-nums" inputMode="numeric" placeholder="-100…" value={values.chat} onChange={(e) => setDraft({ ...values, chat: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="priority-urgent" className={field}>Wachttijd spoed</Label>
          <div className="flex items-center gap-2">
            <Input id="priority-urgent" className="w-20 text-base tabular-nums" inputMode="numeric" value={values.urgent} onChange={(e) => setDraft({ ...values, urgent: e.target.value })} />
            <span className="text-[13px] text-muted-foreground">min</span>
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="priority-planned" className={field}>Wachttijd gepland</Label>
          <div className="flex items-center gap-2">
            <Input id="priority-planned" className="w-20 text-base tabular-nums" inputMode="numeric" value={values.planned} onChange={(e) => setDraft({ ...values, planned: e.target.value })} />
            <span className="text-[13px] text-muted-foreground">min</span>
          </div>
        </div>
        <Button className="min-h-11 rounded-lg" disabled={mutation.isPending || settings.isLoading} onClick={() => mutation.mutate()}>
          {mutation.isPending ? 'Bezig…' : 'Opslaan'}
        </Button>
      </div>
    </section>
  )
}
