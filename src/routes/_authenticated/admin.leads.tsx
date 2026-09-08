import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { AdminNav, euro } from '@/components/admin/admin-nav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  cancelLead,
  createLead,
  dispatchLead,
  listLeads,
  registerTelegramWebhook,
  sendTelegramTest,
} from '@/lib/admin.functions'

export const Route = createFileRoute('/_authenticated/admin/leads')({
  head: () => ({
    meta: [
      { title: 'Leads beheren | VoltFix backoffice' },
      { name: 'description', content: 'Voer leads in en stuur ze door naar de ZZP-groep op Telegram.' },
      { name: 'robots', content: 'noindex, nofollow' },
      { property: 'og:title', content: 'Leads beheren | VoltFix backoffice' },
      { property: 'og:description', content: 'Voer leads in en stuur ze door naar de ZZP-groep.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
    ],
  }),
  component: LeadsPage,
})

const emptyForm = {
  customer_name: '',
  customer_phone: '',
  customer_email: '',
  postal_code: '',
  city: '',
  address: '',
  job_type: '',
  description: '',
  price_euro: '20',
}

const STATUS_LABEL: Record<string, string> = {
  new: 'Nieuw',
  dispatched: 'Verstuurd',
  claimed: 'Geclaimd',
  cancelled: 'Geannuleerd',
}

function LeadsPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState(emptyForm)

  const leadsQuery = useQuery({ queryKey: ['admin', 'leads'], queryFn: () => listLeads() })

  const create = useMutation({
    mutationFn: (dispatch: boolean) =>
      createLead({
        data: {
          customer_name: form.customer_name.trim(),
          customer_phone: form.customer_phone.trim(),
          customer_email: form.customer_email.trim() || null,
          postal_code: form.postal_code.trim() || null,
          city: form.city.trim() || null,
          address: form.address.trim() || null,
          job_type: form.job_type.trim(),
          description: form.description.trim() || null,
          price_cents: Math.round(Number(form.price_euro.replace(',', '.')) * 100),
          dispatch,
        },
      }),
    onSuccess: (_d, dispatch) => {
      setForm(emptyForm)
      toast.success(dispatch ? 'Lead opgeslagen en verstuurd naar Telegram.' : 'Lead opgeslagen.')
      queryClient.invalidateQueries({ queryKey: ['admin', 'leads'] })
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Opslaan mislukt.'),
  })

  const dispatchMut = useMutation({
    mutationFn: (leadId: string) => dispatchLead({ data: { leadId } }),
    onSuccess: () => {
      toast.success('Naar Telegram verstuurd.')
      queryClient.invalidateQueries({ queryKey: ['admin', 'leads'] })
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Versturen mislukt.'),
  })

  const cancelMut = useMutation({
    mutationFn: (leadId: string) => cancelLead({ data: { leadId } }),
    onSuccess: () => {
      toast.success('Lead geannuleerd.')
      queryClient.invalidateQueries({ queryKey: ['admin', 'leads'] })
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Annuleren mislukt.'),
  })

  // Telegram kan het afgeschermde id-preview-- domein niet bereiken; gebruik de
  // stabiele publieke projecthost (project--<id>-dev.<host> in preview).
  function publicOrigin(): string {
    const { protocol, host } = window.location
    const m = host.match(/^id-preview--([0-9a-f-]+)\.(.+)$/)
    if (m) return `${protocol}//project--${m[1]}-dev.${m[2]}`
    return window.location.origin
  }

  const webhookMut = useMutation({
    mutationFn: () => registerTelegramWebhook({ data: { origin: publicOrigin() } }),
    onSuccess: (r) => toast.success(`Telegram gekoppeld aan ${r.url}`),
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Koppelen mislukt.'),
  })

  const testMut = useMutation({
    mutationFn: () => sendTelegramTest(),
    onSuccess: () => toast.success('Testbericht verstuurd naar de groep.'),
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Versturen mislukt.'),
  })

  function set(key: keyof typeof emptyForm, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const canSubmit =
    form.customer_name.trim().length > 1 &&
    form.customer_phone.trim().length > 5 &&
    form.job_type.trim().length > 1 &&
    Number(form.price_euro.replace(',', '.')) >= 0

  return (
    <div className="min-h-screen bg-muted/20">
      <AdminNav />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">Leads</h1>
          <div className="ml-auto flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={webhookMut.isPending}
              onClick={() => webhookMut.mutate()}
            >
              Telegram koppelen
            </Button>
            <Button size="sm" variant="ghost" disabled={testMut.isPending} onClick={() => testMut.mutate()}>
              Testbericht
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Nieuwe lead invoeren</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4 md:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault()
                create.mutate(true)
              }}
            >
              <Field label="Naam klant *" value={form.customer_name} onChange={(v) => set('customer_name', v)} />
              <Field label="Telefoon klant *" value={form.customer_phone} onChange={(v) => set('customer_phone', v)} />
              <Field label="E-mail" value={form.customer_email} onChange={(v) => set('customer_email', v)} />
              <Field label="Postcode" value={form.postal_code} onChange={(v) => set('postal_code', v)} />
              <Field label="Plaats" value={form.city} onChange={(v) => set('city', v)} />
              <Field label="Adres" value={form.address} onChange={(v) => set('address', v)} />
              <Field label="Soort klus *" value={form.job_type} onChange={(v) => set('job_type', v)} />
              <Field label="Prijs per lead (€) *" value={form.price_euro} onChange={(v) => set('price_euro', v)} />
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Omschrijving</Label>
                <Textarea
                  id="description"
                  rows={3}
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-3 md:col-span-2">
                <Button type="submit" disabled={!canSubmit || create.isPending}>
                  {create.isPending ? 'Bezig…' : 'Opslaan + naar Telegram sturen'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!canSubmit || create.isPending}
                  onClick={() => create.mutate(false)}
                >
                  Alleen opslaan
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Overzicht</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {leadsQuery.isLoading && <p className="text-sm text-muted-foreground">Laden…</p>}
            {leadsQuery.error && (
              <p className="text-sm text-destructive">
                {leadsQuery.error instanceof Error ? leadsQuery.error.message : 'Laden mislukt.'}
              </p>
            )}
            {leadsQuery.data && leadsQuery.data.length === 0 && (
              <p className="text-sm text-muted-foreground">Nog geen leads.</p>
            )}
            {leadsQuery.data && leadsQuery.data.length > 0 && (
              <table className="w-full min-w-[720px] text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr>
                    <th className="py-2">Datum</th>
                    <th>Klant</th>
                    <th>Klus</th>
                    <th>Prijs</th>
                    <th>Status</th>
                    <th>Geclaimd door</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {leadsQuery.data.map((lead: any) => (
                    <tr key={lead.id} className="border-t">
                      <td className="py-2 whitespace-nowrap">
                        {new Date(lead.created_at).toLocaleDateString('nl-NL')}
                      </td>
                      <td>
                        <div className="font-medium">{lead.customer_name}</div>
                        <div className="text-muted-foreground">{lead.customer_phone}</div>
                      </td>
                      <td>{lead.job_type}</td>
                      <td className="whitespace-nowrap">{euro(lead.price_cents)}</td>
                      <td>
                        <Badge variant={lead.status === 'claimed' ? 'default' : 'secondary'}>
                          {STATUS_LABEL[lead.status] ?? lead.status}
                        </Badge>
                      </td>
                      <td>{lead.contractors?.name ?? '—'}</td>
                      <td className="space-x-2 whitespace-nowrap py-2 text-right">
                        {lead.status !== 'claimed' && lead.status !== 'cancelled' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={dispatchMut.isPending}
                              onClick={() => dispatchMut.mutate(lead.id)}
                            >
                              {lead.status === 'dispatched' ? 'Opnieuw sturen' : 'Naar Telegram'}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={cancelMut.isPending}
                              onClick={() => cancelMut.mutate(lead.id)}
                            >
                              Annuleren
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  const id = label.replace(/[^a-zA-Z]/g, '').toLowerCase()
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}
