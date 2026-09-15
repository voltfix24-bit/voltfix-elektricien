import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { actionError } from '@/components/admin/list-ui'
import { deleteJobPrice, listJobPrices, saveJobPrice } from '@/lib/admin.functions'

type Row = { job_type: string; label: string | null; price_cents: number }

/**
 * Leadprijs per klussoort. Een groepenkastlead is voor een monteur veel meer
 * waard dan een spoedlead, dus die prijs staat los van het algemene tarief.
 */
export function JobPricesCard() {
  const queryClient = useQueryClient()
  const rows = useQuery({ queryKey: ['admin', 'job-prices'], queryFn: () => listJobPrices() })
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [newType, setNewType] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [newPrice, setNewPrice] = useState('')

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'job-prices'] })

  const save = useMutation({
    mutationFn: (input: { job_type: string; label: string | null; price_cents: number }) => saveJobPrice({ data: input }),
    onSuccess: () => {
      toast.success('Leadprijs opgeslagen.')
      setDrafts({})
      setNewType('')
      setNewLabel('')
      setNewPrice('')
      invalidate()
    },
    onError: () => actionError('Niet opgeslagen.'),
  })

  const remove = useMutation({
    mutationFn: (jobType: string) => deleteJobPrice({ data: { job_type: jobType } }),
    onSuccess: () => {
      toast.success('Verwijderd — deze klussoort gebruikt weer het algemene tarief.')
      invalidate()
    },
    onError: () => actionError('Verwijderen mislukt.'),
  })

  const list = (rows.data ?? []) as Row[]
  const toCents = (value: string) => Math.round(Number(value.replace(',', '.')) * 100)

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-base">Leadprijs per klussoort</CardTitle>
        <CardDescription>
          Wat de monteur betaalt om deze lead aan te nemen. Staat een klussoort er niet bij, dan geldt het algemene tarief
          hierboven.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {list.map((row) => {
          const value = drafts[row.job_type] ?? (row.price_cents / 100).toString()
          return (
            <div key={row.job_type} className="flex flex-wrap items-end gap-2">
              <div className="min-w-[10rem] flex-1">
                <Label className="text-xs text-muted-foreground">{row.label || row.job_type}</Label>
                <p className="text-xs text-muted-foreground">{row.job_type}</p>
              </div>
              <div className="w-28">
                <Input
                  inputMode="decimal"
                  value={value}
                  onChange={(event) => setDrafts((prev) => ({ ...prev, [row.job_type]: event.target.value }))}
                />
              </div>
              <Button
                size="sm"
                disabled={save.isPending || !Number.isFinite(toCents(value))}
                onClick={() => save.mutate({ job_type: row.job_type, label: row.label, price_cents: toCents(value) })}
              >
                Opslaan
              </Button>
              <Button
                size="sm"
                variant="ghost"
                aria-label={`${row.label || row.job_type} verwijderen`}
                disabled={remove.isPending}
                onClick={() => remove.mutate(row.job_type)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          )
        })}

        <div className="flex flex-wrap items-end gap-2 border-t pt-4">
          <div className="min-w-[8rem] flex-1">
            <Label className="text-xs text-muted-foreground">Klussoort (zoals aangeleverd)</Label>
            <Input value={newType} onChange={(event) => setNewType(event.target.value)} placeholder="groepenkast" />
          </div>
          <div className="min-w-[8rem] flex-1">
            <Label className="text-xs text-muted-foreground">Omschrijving</Label>
            <Input value={newLabel} onChange={(event) => setNewLabel(event.target.value)} placeholder="Groepenkast vervangen" />
          </div>
          <div className="w-28">
            <Label className="text-xs text-muted-foreground">Prijs (€)</Label>
            <Input inputMode="decimal" value={newPrice} onChange={(event) => setNewPrice(event.target.value)} placeholder="20" />
          </div>
          <Button
            size="sm"
            disabled={save.isPending || newType.trim().length < 2 || !Number.isFinite(toCents(newPrice))}
            onClick={() =>
              save.mutate({ job_type: newType.trim(), label: newLabel.trim() || null, price_cents: toCents(newPrice) })
            }
          >
            Toevoegen
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
