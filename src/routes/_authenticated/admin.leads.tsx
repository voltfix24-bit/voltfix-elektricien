import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { AdminNav, euro } from '@/components/admin/admin-nav'
import { QuickWhatsAppLead } from '@/components/admin/quick-whatsapp-lead'
import { LeadPhotoPicker } from '@/components/admin/lead-photo-picker'
import { LeadSettingsCard } from '@/components/admin/lead-settings-card'
import { WebhookStatus } from '@/components/admin/webhook-status'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cancelLead, createLead, dispatchLead, listLeads, uploadLeadImage } from '@/lib/admin.functions'

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

const JOB_TYPES = [
  'Storing / geen stroom',
  'Groepenkast vervangen',
  'Perilex aansluiten',
  'Laadpaal installeren',
  'Stopcontact / schakelaar',
  'Verlichting ophangen',
  'Inspectie / keuring',
] as const

const STATUS_LABEL: Record<string, string> = {
  new: 'Nieuw',
  dispatched: 'Verstuurd',
  claimed: 'Geclaimd',
  cancelled: 'Geannuleerd',
  spam_review: 'Spam-controle',
  blocked_spam: 'Spam geblokkeerd',
}

const SOURCE_LABEL: Record<string, string> = {
  admin: 'Handmatig',
  website_form: 'Website',
  booking_form: 'Afspraak',
  whatsapp_manual: 'WhatsApp',
}

type FilterKey = 'all' | 'open' | 'claimed' | 'cancelled'

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: 'all', label: 'Alles' },
  { key: 'open', label: '🟢 Open' },
  { key: 'claimed', label: '🔵 Geclaimd' },
  { key: 'cancelled', label: '🔴 Geannuleerd' },
]

function matchesFilter(status: string, filter: FilterKey): boolean {
  if (filter === 'all') return true
  if (filter === 'open') return status === 'new' || status === 'dispatched' || status === 'spam_review'
  if (filter === 'claimed') return status === 'claimed'
  return status === 'cancelled' || status === 'blocked_spam'
}

function LeadsPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState(emptyForm)
  const [photos, setPhotos] = useState<File[]>([])
  const uploadPhoto = useServerFn(uploadLeadImage)
  const saveLead = useServerFn(createLead)
  const [filter, setFilter] = useState<FilterKey>('all')
  const [search, setSearch] = useState('')
  const [cancelTarget, setCancelTarget] = useState<{ id: string; name: string } | null>(null)

  const leadsQuery = useQuery({ queryKey: ['admin', 'leads'], queryFn: () => listLeads() })

  const create = useMutation({
    mutationFn: async (dispatch: boolean) => {
      const paths: string[] = []
      for (const photo of photos) {
        const dataBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => {
            if (typeof reader.result !== 'string') return reject(new Error('Foto lezen mislukt.'))
            resolve(reader.result.slice(reader.result.indexOf(',') + 1))
          }
          reader.onerror = () => reject(new Error('Foto lezen mislukt.'))
          reader.readAsDataURL(photo)
        })
        const result = await uploadPhoto({ data: {
          filename: photo.name.slice(0, 120),
          contentType: photo.type as 'image/jpeg' | 'image/png' | 'image/webp',
          dataBase64,
        } })
        paths.push(result.path)
      }
      return saveLead({
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
          image_urls: paths,
        },
      })
    },
    onSuccess: (_d, dispatch) => {
      setForm(emptyForm)
      setPhotos([])
      toast.success(dispatch ? 'Lead opgeslagen en verstuurd naar Telegram.' : 'Lead opgeslagen als concept.')
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
      setCancelTarget(null)
      queryClient.invalidateQueries({ queryKey: ['admin', 'leads'] })
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Annuleren mislukt.'),
  })

  function set(key: keyof typeof emptyForm, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const canSubmit =
    form.customer_name.trim().length > 1 &&
    form.customer_phone.trim().length > 5 &&
    form.job_type.trim().length > 1 &&
    Number(form.price_euro.replace(',', '.')) >= 0

  const rows = useMemo(() => {
    const all = (leadsQuery.data as any[]) ?? []
    const q = search.trim().toLowerCase()
    return all.filter((lead) => {
      if (!matchesFilter(lead.status, filter)) return false
      if (!q) return true
      return [lead.customer_name, lead.customer_phone, lead.address, lead.city, lead.postal_code, lead.job_type]
        .filter(Boolean)
        .some((v: string) => String(v).toLowerCase().includes(q))
    })
  }, [leadsQuery.data, filter, search])

  return (
    <div className="min-h-screen bg-muted/20">
      <AdminNav />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">Leads</h1>
          <QuickWhatsAppLead />
          <div className="ml-auto">
            <WebhookStatus />
          </div>
        </div>

        <LeadSettingsCard />

        <Card>
          <CardHeader>
            <CardTitle>Nieuwe lead invoeren</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4 md:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault()
                if (canSubmit && !create.isPending) create.mutate(true)
              }}
            >
              <Field label="Naam klant *" value={form.customer_name} onChange={(v) => set('customer_name', v)} />
              <Field label="Telefoon klant *" value={form.customer_phone} onChange={(v) => set('customer_phone', v)} />
              <Field label="E-mail" value={form.customer_email} onChange={(v) => set('customer_email', v)} />
              <Field label="Postcode" value={form.postal_code} onChange={(v) => set('postal_code', v)} />
              <Field label="Plaats" value={form.city} onChange={(v) => set('city', v)} />
              <Field label="Adres" value={form.address} onChange={(v) => set('address', v)} />
              <div className="space-y-2">
                <Label htmlFor="jobtype">Soort klus *</Label>
                <Input
                  id="jobtype"
                  list="job-types"
                  value={form.job_type}
                  onChange={(e) => set('job_type', e.target.value)}
                  placeholder="Kies of typ een klustype"
                />
                <datalist id="job-types">
                  {JOB_TYPES.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </div>
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
              <div className="md:col-span-2">
                <LeadPhotoPicker photos={photos} onChange={setPhotos} disabled={create.isPending} />
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
                  Alleen opslaan als concept
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-3">
            <CardTitle>Overzicht</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              {FILTERS.map((f) => (
                <Button
                  key={f.key}
                  size="sm"
                  variant={filter === f.key ? 'default' : 'outline'}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                </Button>
              ))}
              <Input
                className="ml-auto w-full sm:w-64"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Zoek op naam, telefoon of straat"
                aria-label="Zoek in leads"
              />
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {leadsQuery.isLoading && <p className="text-sm text-muted-foreground">Laden…</p>}
            {leadsQuery.error && (
              <p className="text-sm text-destructive">
                {leadsQuery.error instanceof Error ? leadsQuery.error.message : 'Laden mislukt.'}
              </p>
            )}
            {leadsQuery.data && rows.length === 0 && (
              <p className="text-sm text-muted-foreground">Geen leads gevonden met deze filters.</p>
            )}
            {rows.length > 0 && (
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
                  {rows.map((lead: any) => (
                    <tr key={lead.id} className="border-t">
                      <td className="py-2 whitespace-nowrap">
                        {new Date(lead.created_at).toLocaleDateString('nl-NL')}
                      </td>
                      <td>
                        <div className="font-medium">{lead.customer_name}</div>
                        <div className="text-muted-foreground">{lead.customer_phone}</div>
                      </td>
                      <td>
                        <div>{lead.job_type}</div>
                        <div className="t-meta text-muted-foreground">
                          {SOURCE_LABEL[lead.source] ?? lead.source ?? 'Handmatig'}
                          {lead.is_urgent ? ' · spoed' : ''}
                        </div>
                      </td>
                      <td className="whitespace-nowrap">{euro(lead.price_cents)}</td>
                      <td>
                        <Badge variant={lead.status === 'claimed' ? 'default' : 'secondary'}>
                          {STATUS_LABEL[lead.status] ?? lead.status}
                        </Badge>
                      </td>
                      <td>{lead.contractors?.name ?? '—'}</td>
                      <td className="space-x-2 whitespace-nowrap py-2 text-right">
                        {lead.status !== 'claimed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={dispatchMut.isPending}
                            onClick={() => dispatchMut.mutate(lead.id)}
                          >
                            {lead.status === 'dispatched'
                              ? 'Opnieuw sturen'
                              : lead.status === 'cancelled'
                                ? 'Opnieuw aanbieden'
                                : 'Naar Telegram'}
                          </Button>
                        )}
                        {lead.status !== 'claimed' && lead.status !== 'cancelled' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setCancelTarget({ id: lead.id, name: lead.customer_name })}
                          >
                            Annuleren
                          </Button>
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

      <AlertDialog open={cancelTarget !== null} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lead annuleren?</AlertDialogTitle>
            <AlertDialogDescription>
              De lead van {cancelTarget?.name} wordt ingetrokken. Staat hij al in de Telegram-groep, dan zien de
              monteurs dat de klus is geannuleerd.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Terug</AlertDialogCancel>
            <AlertDialogAction
              disabled={cancelMut.isPending}
              onClick={(e) => {
                e.preventDefault()
                if (cancelTarget) cancelMut.mutate(cancelTarget.id)
              }}
            >
              {cancelMut.isPending ? 'Bezig…' : 'Ja, annuleren'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
