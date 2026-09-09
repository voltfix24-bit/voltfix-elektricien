import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getLeadSettings, updateLeadSettings } from '@/lib/admin.functions'

/** Compact balkje met de standaardtarieven voor website-aanvragen. */
export function LeadSettingsCard() {
  const queryClient = useQueryClient()
  const settings = useQuery({ queryKey: ['admin', 'lead-settings'], queryFn: () => getLeadSettings() })
  const [draft, setDraft] = useState<{ standard: string; urgent: string } | null>(null)

  const current = settings.data as { default_price_cents: number; urgent_price_cents: number } | undefined
  const values =
    draft ??
    (current
      ? {
          standard: (current.default_price_cents / 100).toString(),
          urgent: (current.urgent_price_cents / 100).toString(),
        }
      : { standard: '', urgent: '' })

  const save = useMutation({
    mutationFn: () =>
      updateLeadSettings({
        data: {
          default_price_cents: Math.round(Number(values.standard.replace(',', '.')) * 100),
          urgent_price_cents: Math.round(Number(values.urgent.replace(',', '.')) * 100),
        },
      }),
    onSuccess: () => {
      toast.success('Leadprijzen opgeslagen.')
      setDraft(null)
      queryClient.invalidateQueries({ queryKey: ['admin', 'lead-settings'] })
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Opslaan mislukt.'),
  })

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Standaardtarieven website-aanvragen (ex. btw)</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <Label htmlFor="price-standard" className="t-meta">
            Normaal (€)
          </Label>
          <Input
            id="price-standard"
            className="w-28"
            inputMode="decimal"
            value={values.standard}
            onChange={(e) => setDraft({ ...values, standard: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="price-urgent" className="t-meta">
            Spoed (€)
          </Label>
          <Input
            id="price-urgent"
            className="w-28"
            inputMode="decimal"
            value={values.urgent}
            onChange={(e) => setDraft({ ...values, urgent: e.target.value })}
          />
        </div>
        <Button size="sm" disabled={save.isPending || settings.isLoading} onClick={() => save.mutate()}>
          {save.isPending ? 'Bezig…' : 'Opslaan'}
        </Button>
      </CardContent>
    </Card>
  )
}
