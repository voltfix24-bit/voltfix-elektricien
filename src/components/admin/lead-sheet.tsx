import { useEffect, useRef, useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Camera, Check, MessageCircle, Pencil, Phone, Send, X } from 'lucide-react'
import { toast } from 'sonner'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { addLeadPhotos, cancelLead, createLeadUploadUrl, dispatchLead, getLeadDetail, updateLead } from '@/lib/admin.functions'
import { uploadLeadPhotosDirect } from '@/lib/lead-image'
import { isEmergencyLead } from '@/lib/lead-overdue'

const STATUS_LABEL: Record<string, string> = { new: 'Open', dispatched: 'Doorgezet', claimed: 'Opgepakt', cancelled: 'Geannuleerd', spam_review: 'Spam-controle', blocked_spam: 'Spam geblokkeerd' }

const ACTION_LABEL: Record<string, string> = {
  created: 'Lead aangemaakt',
  dispatched: 'Naar Telegram gestuurd',
  dispatch_failed: 'Versturen naar Telegram mislukt',
  updated: 'Gegevens gewijzigd',
  photos_added: 'Foto’s toegevoegd',
  cancelled: 'Lead geannuleerd',
}

type EditField = 'customer_name' | 'customer_phone' | 'customer_email' | 'address' | 'city' | 'postal_code' | 'job_type' | 'description' | null

export function LeadSheet({ leadId, onClose }: { leadId: string | null; onClose: () => void }) {
  const queryClient = useQueryClient()
  const detail = useServerFn(getLeadDetail)
  const patch = useServerFn(updateLead)
  const send = useServerFn(dispatchLead)
  const cancel = useServerFn(cancelLead)
  const ticket = useServerFn(createLeadUploadUrl)
  const addPhotos = useServerFn(addLeadPhotos)
  const camera = useRef<HTMLInputElement>(null)
  const [editing, setEditing] = useState<EditField>(null)
  const [value, setValue] = useState('')

  const query = useQuery({
    queryKey: ['admin', 'lead', leadId],
    queryFn: () => detail({ data: { leadId: leadId! } }),
    enabled: Boolean(leadId),
  })
  useEffect(() => { setEditing(null) }, [leadId])

  const lead: any = query.data?.lead
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'leads'] })
    queryClient.invalidateQueries({ queryKey: ['admin', 'lead', leadId] })
  }

  const saveField = useMutation({
    mutationFn: (changes: Record<string, unknown>) => patch({ data: { leadId: leadId!, changes: changes as any } }),
    onSuccess: () => { setEditing(null); toast.success('Opgeslagen.'); invalidate() },
    onError: () => toast.error('Opslaan mislukt.'),
  })
  const dispatchMut = useMutation({
    mutationFn: () => send({ data: { leadId: leadId! } }),
    onSuccess: () => { toast.success('Naar Telegram verstuurd.'); invalidate() },
    onError: () => toast.error('Versturen mislukt.'),
  })
  const cancelMut = useMutation({
    mutationFn: () => cancel({ data: { leadId: leadId! } }),
    onSuccess: () => { toast.success('Lead geannuleerd.'); invalidate(); onClose() },
    onError: () => toast.error('Annuleren mislukt.'),
  })
  const photoMut = useMutation({
    mutationFn: async (files: File[]) => {
      const paths = await uploadLeadPhotosDirect(files, ticket)
      return addPhotos({ data: { leadId: leadId!, paths: paths as [string, ...string[]] } })
    },
    onSuccess: () => { toast.success('Foto’s toegevoegd.'); invalidate() },
    onError: () => toast.error('Foto toevoegen mislukt.'),
  })

  function startEdit(field: Exclude<EditField, null>, current: string | null) {
    setEditing(field)
    setValue(current ?? '')
  }

  const phoneHref = lead ? `tel:${String(lead.customer_phone).replace(/[^+\d]/g, '')}` : '#'
  const waHref = lead ? `https://wa.me/${String(lead.customer_phone).replace(/\D/g, '').replace(/^0/, '31')}` : '#'

  return (
    <Drawer open={Boolean(leadId)} onOpenChange={(open) => { if (!open) onClose() }}>
      <DrawerContent className="max-h-[92dvh]">
        <DrawerHeader className="pb-2 text-left">
          <DrawerTitle className="break-words text-lg">{lead ? lead.customer_name : 'Lead laden…'}</DrawerTitle>
        </DrawerHeader>

        <div className="min-w-0 flex-1 overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {query.isLoading && <p role="status">Gegevens laden…</p>}
          {query.error && <p role="alert" className="text-destructive">Ophalen mislukt. Sluit en probeer opnieuw.</p>}

          {lead && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-2">
                <Button asChild className="min-h-12"><a href={phoneHref}><Phone className="size-5" /> Bellen</a></Button>
                <Button asChild variant="outline" className="min-h-12"><a href={waHref} target="_blank" rel="noreferrer"><MessageCircle className="size-5" /> WhatsApp</a></Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant={lead.status === 'claimed' ? 'default' : 'secondary'}>{STATUS_LABEL[lead.status] ?? lead.status}</Badge>
                {isEmergencyLead(lead) && <Badge variant="destructive">Storing / spoed</Badge>}
                {lead.duplicate_of_id && <Badge variant="outline">Mogelijk dubbel</Badge>}
                {lead.contractors?.name && <Badge variant="outline">{lead.contractors.name}</Badge>}
              </div>

              <dl className="divide-y divide-border border-y border-border">
                <Row label="Naam" field="customer_name" current={lead.customer_name} {...{ editing, setEditing, startEdit, value, setValue, saveField }} />
                <Row label="Telefoon" field="customer_phone" current={lead.customer_phone} {...{ editing, setEditing, startEdit, value, setValue, saveField }} />
                <Row label="E-mail" field="customer_email" current={lead.customer_email} {...{ editing, setEditing, startEdit, value, setValue, saveField }} />
                <Row label="Klus" field="job_type" current={lead.job_type} {...{ editing, setEditing, startEdit, value, setValue, saveField }} />
                <Row label="Adres" field="address" current={lead.address} {...{ editing, setEditing, startEdit, value, setValue, saveField }} />
                <Row label="Postcode" field="postal_code" current={lead.postal_code} {...{ editing, setEditing, startEdit, value, setValue, saveField }} />
                <Row label="Plaats" field="city" current={lead.city} {...{ editing, setEditing, startEdit, value, setValue, saveField }} />
                <Row label="Omschrijving" field="description" current={lead.description} multiline {...{ editing, setEditing, startEdit, value, setValue, saveField }} />
              </dl>

              <section>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h3 className="font-semibold">Foto’s</h3>
                  <Button type="button" variant="outline" className="min-h-12" disabled={photoMut.isPending} onClick={() => camera.current?.click()}><Camera className="size-5" /> Toevoegen</Button>
                  <input ref={camera} type="file" accept="image/*" capture="environment" className="sr-only" onChange={(event) => { const files = Array.from(event.target.files ?? []); event.target.value = ''; if (files.length) photoMut.mutate(files.slice(0, 3)) }} />
                </div>
                {(query.data?.photoUrls ?? []).length === 0 && <p className="text-sm text-muted-foreground">Nog geen foto’s.</p>}
                <div className="flex flex-wrap gap-2">
                  {(query.data?.photoUrls ?? []).map((url, index) => (
                    <a key={url} href={url} target="_blank" rel="noreferrer" className="block">
                      <img src={url} alt={`Foto ${index + 1} bij deze lead`} className="size-24 rounded-md border border-border object-cover" loading="lazy" />
                    </a>
                  ))}
                </div>
              </section>

              {perilexQuoteId(lead) && (
                <PerilexAssessmentPanel quoteRequestId={perilexQuoteId(lead)!} phone={lead.customer_phone} />
              )}



              <section>
                <h3 className="mb-2 font-semibold">Tijdlijn</h3>
                <ol className="space-y-2 text-sm">
                  {(query.data?.timeline ?? []).map((entry: any) => (
                    <li key={entry.id} className="flex flex-wrap gap-2 border-l-2 border-border pl-3">
                      <span className="font-medium">{ACTION_LABEL[entry.action] ?? entry.action}</span>
                      <span className="text-muted-foreground">{new Date(entry.created_at).toLocaleString('nl-NL', { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </li>
                  ))}
                  {(query.data?.timeline ?? []).length === 0 && <li className="text-muted-foreground">Nog geen gebeurtenissen vastgelegd.</li>}
                </ol>
                {(query.data?.deliveries ?? []).some((d: any) => d.status === 'failed') && (
                  <p className="mt-2 text-sm text-destructive">Laatste verzending naar Telegram is mislukt — stuur opnieuw.</p>
                )}
              </section>

              <div className="grid gap-2 sm:grid-cols-2">
                {lead.status !== 'claimed' && (
                  <Button className="min-h-12" disabled={dispatchMut.isPending} onClick={() => dispatchMut.mutate()}><Send className="size-4" />{lead.status === 'dispatched' ? 'Opnieuw sturen' : 'Naar Telegram'}</Button>
                )}
                {!['claimed', 'cancelled'].includes(lead.status) && (
                  <Button variant="outline" className="min-h-12" disabled={cancelMut.isPending} onClick={() => cancelMut.mutate()}><X className="size-4" /> Annuleren</Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function Row({ label, field, current, multiline, editing, startEdit, setEditing, value, setValue, saveField }: {
  label: string
  field: Exclude<EditField, null>
  current: string | null
  multiline?: boolean
  editing: EditField
  startEdit: (field: Exclude<EditField, null>, current: string | null) => void
  setEditing: (field: EditField) => void
  value: string
  setValue: (value: string) => void
  saveField: { mutate: (changes: Record<string, unknown>) => void; isPending: boolean }
}) {
  const open = editing === field
  return (
    <div className="min-w-0 py-3">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <dt className="w-28 shrink-0 text-sm text-muted-foreground">{label}</dt>
        {!open && <dd className="min-w-0 flex-1 break-words">{current || <span className="text-muted-foreground">—</span>}</dd>}
        {!open && (
          <Button type="button" size="icon" variant="ghost" className="min-h-12 min-w-12 shrink-0" aria-label={`${label} wijzigen`} onClick={() => startEdit(field, current)}><Pencil className="size-4" /></Button>
        )}
      </div>
      {open && (
        <div className="mt-2 space-y-2">
          <Label htmlFor={`edit-${field}`} className="sr-only">{label}</Label>
          {multiline
            ? <Textarea id={`edit-${field}`} rows={4} className="text-base" value={value} onChange={(event) => setValue(event.target.value)} />
            : <Input id={`edit-${field}`} className="text-base" inputMode={field === 'customer_phone' ? 'tel' : undefined} value={value} onChange={(event) => setValue(event.target.value)} />}
          <div className="flex gap-2">
            <Button type="button" className="min-h-12" disabled={saveField.isPending} onClick={() => saveField.mutate({ [field]: value.trim() || null })}><Check className="size-4" /> Opslaan</Button>
            <Button type="button" variant="ghost" className="min-h-12" onClick={() => setEditing(null)}>Annuleren</Button>
          </div>
        </div>
      )}
    </div>
  )
}
