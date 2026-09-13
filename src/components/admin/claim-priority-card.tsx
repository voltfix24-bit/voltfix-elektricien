import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { getLeadSettings, listClaimPriorityState, updateClaimPrioritySettings } from '@/lib/admin.functions'
import { actionError, ROW_PADDING } from '@/components/admin/list-ui'
import {
  busyMinutesLeft,
  DEFAULT_CLAIM_PRIORITY,
  isOnStoring,
  type ClaimPrioritySettings,
} from '@/lib/claim-priority'

/**
 * Voorrang bij storingen: zit je al op een storing, dan mag iemand die vrij is
 * er twee minuten eerder bij. Eén regel, geen ranglijst.
 */
export function ClaimPriorityCard() {
  const queryClient = useQueryClient()
  const save = useServerFn(updateClaimPrioritySettings)
  const settings = useQuery({ queryKey: ['admin', 'lead-settings'], queryFn: () => getLeadSettings() })
  const state = useQuery({ queryKey: ['admin', 'claim-priority-state'], queryFn: () => listClaimPriorityState() })
  const [draft, setDraft] = useState<{ enabled: boolean; minutes: string; seconds: string } | null>(null)

  const current = settings.data as
    | { claim_priority_enabled?: boolean; busy_window_minutes?: number; claim_delay_seconds?: number }
    | undefined
  const values =
    draft ?? {
      enabled: current?.claim_priority_enabled ?? DEFAULT_CLAIM_PRIORITY.enabled,
      minutes: String(current?.busy_window_minutes ?? DEFAULT_CLAIM_PRIORITY.busyWindowMinutes),
      seconds: String(current?.claim_delay_seconds ?? DEFAULT_CLAIM_PRIORITY.delaySeconds),
    }

  const active: ClaimPrioritySettings = {
    enabled: values.enabled,
    busyWindowMinutes: Math.max(1, Math.round(Number(values.minutes)) || DEFAULT_CLAIM_PRIORITY.busyWindowMinutes),
    delaySeconds: Math.max(0, Math.round(Number(values.seconds)) || 0),
  }

  const mutation = useMutation({
    mutationFn: () =>
      save({
        data: {
          claim_priority_enabled: active.enabled,
          busy_window_minutes: active.busyWindowMinutes,
          claim_delay_seconds: active.delaySeconds,
        },
      }),
    onSuccess: () => {
      toast.success('Voorrangsregel opgeslagen.')
      setDraft(null)
      queryClient.invalidateQueries({ queryKey: ['admin', 'lead-settings'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'claim-priority-state'] })
    },
    onError: () => actionError('Niet opgeslagen.'),
  })

  const rows = (state.data ?? []) as Array<{ id: string; name: string; last_storing_claim_at: string | null }>
  const now = new Date()

  return (
    <section aria-labelledby="claim-priority-title" className="rounded-xl border border-border bg-card">
      <h2 id="claim-priority-title" className="border-b border-border px-4 py-3 text-[16px] font-extrabold tracking-[-0.015em]">
        Voorrang bij storingen
      </h2>
      <p className="px-4 pt-3 text-[13px] text-muted-foreground">
        Zit je al op een storing, dan mag iemand die vrij is er twee minuten eerder bij. Gepland werk telt niet mee en
        weigeren kost niets. Zijn alle monteurs bezig, dan wacht niemand.
      </p>
      <div className="flex flex-wrap items-end gap-4 px-4 py-4">
        <div className="flex items-center gap-2 pb-2">
          <Switch
            id="claim-priority-enabled"
            checked={values.enabled}
            onCheckedChange={(v) => setDraft({ ...values, enabled: v })}
          />
          <Label htmlFor="claim-priority-enabled" className="text-[13px]">
            Regel actief
          </Label>
        </div>
        <div className="space-y-1">
          <Label htmlFor="busy-window" className="text-[11.5px] font-bold uppercase tracking-[0.04em] text-muted-foreground">
            Storing houdt bezet
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="busy-window"
              className="w-24 text-base tabular-nums"
              inputMode="numeric"
              value={values.minutes}
              onChange={(e) => setDraft({ ...values, minutes: e.target.value })}
            />
            <span className="text-[13px] text-muted-foreground">minuten</span>
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="claim-delay" className="text-[11.5px] font-bold uppercase tracking-[0.04em] text-muted-foreground">
            Vertraging
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="claim-delay"
              className="w-24 text-base tabular-nums"
              inputMode="numeric"
              value={values.seconds}
              onChange={(e) => setDraft({ ...values, seconds: e.target.value })}
            />
            <span className="text-[13px] text-muted-foreground">seconden</span>
          </div>
        </div>
        <Button className="min-h-11 rounded-lg" disabled={mutation.isPending || settings.isLoading} onClick={() => mutation.mutate()}>
          {mutation.isPending ? 'Bezig…' : 'Opslaan'}
        </Button>
      </div>

      <div className="border-t border-border">
        <p className="px-4 pt-3 text-[11.5px] font-bold uppercase tracking-[0.04em] text-muted-foreground">
          Monteurs nu
        </p>
        {rows.length === 0 ? (
          <p className={`${ROW_PADDING} text-[13px] text-muted-foreground`}>Geen actieve monteurs.</p>
        ) : (
          <ul>
            {rows.map((c) => {
              const busy = isOnStoring({ lastStoringClaimAt: c.last_storing_claim_at }, now, active)
              const left = busyMinutesLeft({ lastStoringClaimAt: c.last_storing_claim_at }, now, active)
              return (
                <li key={c.id} className={`${ROW_PADDING} flex items-center justify-between border-t border-border text-[14px]`}>
                  <span>{c.name}</span>
                  <span className={busy ? 'rounded-md bg-secondary px-2 py-0.5 text-[13px]' : 'text-[13px] text-muted-foreground'}>
                    {busy ? `Bezig · nog ${left} min` : 'Vrij'}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
