import { useEffect, useRef, useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Camera, Check, MessageCircle, NotebookPen, Pencil, Phone, Send, X } from 'lucide-react'
import { toast } from 'sonner'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { addLeadNote, addLeadPhotos, cancelLead, createLeadUploadUrl, dispatchLead, getLeadDetail, updateLead } from '@/lib/admin.functions'
import { uploadLeadPhotosDirect } from '@/lib/lead-image'
import { isEmergencyLead, isLeadOverdue, openSinceText } from '@/lib/lead-overdue'
import { PerilexAssessmentPanel } from './perilex-assessment-panel'

const QUOTE_REF = /^quote:([0-9a-f-]{36})$/i

/** Interne beoordeling alleen tonen bij een Perilex-aanvraag met een bronaanvraag. */
function perilexQuoteId(lead: any): string | null {
  const match = QUOTE_REF.exec(String(lead?.external_ref ?? ''))
  if (!match) return null
  const service = String(lead?.booking_service ?? lead?.service_id ?? lead?.job_type ?? '').toLowerCase()
  return service.includes('perilex') ? match[1] : null
}

const STATUS_LABEL: Record<string, string> = { new: 'Open', dispatched: 'Doorgezet', claimed: 'Opgepakt', cancelled: 'Geannuleerd', spam_review: 'Spam-controle', blocked_spam: 'Spam geblokkeerd' }

const ACTION_LABEL: Record<string, string> = {
  created: 'Lead aangemaakt',
  dispatched: 'Naar Telegram gestuurd',
  dispatch_failed: 'Versturen naar Telegram mislukt',
  updated: 'Gegevens gewijzigd',
  photos_added: 'Foto’s toegevoegd',
  cancelled: 'Lead geannuleerd',
  note_added: 'Notitie toegevoegd',
}

type EditField = 'customer_name' | 'customer_phone' | 'customer_email' | 'address' | 'city' | 'postal_code' | 'job_type' | 'description' | null

/**
 * Volledige detailweergave van één lead. Weet niets van drawers of routes:
 * de drawer (smal) en de tweekolommenweergave (breed) gebruiken dezelfde component.
 */
export function LeadDetail({ leadId, onClosed, showName = true }: { leadId: string | null; onClosed?: () => void; showName?: boolean }) {
  const queryClient = useQueryClient()
  const detail = useServerFn(getLeadDetail)
  const patch = useServerFn(updateLead)
  const send = useServerFn(dispatchLead)
  const cancel = useServerFn(cancelLead)
  const ticket = useServerFn(createLeadUploadUrl)
  const addPhotos = useServerFn(addLeadPhotos)
  const addNote = useServerFn(addLeadNote)
  const camera = useRef<HTMLInputElement>(null)
  const [editing, setEditing] = useState<EditField>(null)
  const [value, setValue] = useState('')
  const [noteOpen, setNoteOpen] = useState(false)
  const [noteText, setNoteText] = useState('')

  const query = useQuery({
    queryKey: ['admin', 'lead', leadId],
    queryFn: () => detail({ data: { leadId: leadId! } }),
    enabled: Boolean(leadId),
  })
  useEffect(() => { setEditing(null); setNoteOpen(false); setNoteText('') }, [leadId])

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
    onSuccess: () => { toast.success('Lead geannuleerd.'); invalidate(); onClosed?.() },
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

  const now = Date.now()
  const urgent = lead ? isEmergencyLead(lead) : false
  const overdue = lead ? isLeadOverdue(lead, now) : false
  const since = lead ? openSinceText(lead, now).replace('open sinds ', 'open sinds ') : ''
  const urgencyLine = overdue ? `Te laat · ${since}` : urgent ? `Spoed · ${since}` : since

  if (!leadId) return null

  return (
    <div className="min-w-0">
      {query.isLoading && <p role="status">Gegevens laden…</p>}
      {query.error && <p role="alert" className="text-destructive">Ophalen mislukt. Sluit en probeer opnieuw.</p>}

      {lead && (
        <div className="space-y-5">
          <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <div className="min-w-0">
              {showName && <h2 className="break-words text-[22px] font-extrabold tracking-[-0.02em]">{lead.customer_name}</h2>}
              <p className={`mt-1 text-[13px] font-bold tabular-nums ${overdue || urgent ? 'text-destructive' : 'text-muted-foreground'}`}>{urgencyLine}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button asChild variant="call" className="min-h-11 rounded-lg"><a href={phoneHref}><Phone className="size-5" /> Bellen</a></Button>
              <Button asChild variant="whatsapp" className="min-h-11 rounded-lg"><a href={waHref} target="_blank" rel="noreferrer"><MessageCircle className="size-5" /> WhatsApp</a></Button>
            </div>
          </header>

          <div className="flex flex-wrap gap-2">
            <Badge variant={lead.status === 'claimed' ? 'default' : 'secondary'}>{STATUS_LABEL[lead.status] ?? lead.status}</Badge>
            {urgent && <Badge variant="destructive">Storing / spoed</Badge>}
            {lead.duplicate_of_id && <Badge variant="outline">Mogelijk dubbel</Badge>}
            {lead.contractors?.name && <Badge variant="outline">{lead.contractors.name}</Badge>}
          </div>

          <dl className="grid gap-px overflow-hidden rounded-xl border border-border bg-border [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
            <Cell label="Naam" field="customer_name" current={lead.customer_name} {...{ editing, setEditing, startEdit, value, setValue, saveField }} />
            <Cell label="Telefoon" field="customer_phone" current={lead.customer_phone} {...{ editing, setEditing, startEdit, value, setValue, saveField }} />
            <Cell label="E-mail" field="customer_email" current={lead.customer_email} {...{ editing, setEditing, startEdit, value, setValue, saveField }} />
            <Cell label="Klus" field="job_type" current={lead.job_type} {...{ editing, setEditing, startEdit, value, setValue, saveField }} />
            <Cell label="Adres" field="address" current={lead.address} {...{ editing, setEditing, startEdit, value, setValue, saveField }} />
            <Cell label="Postcode" field="postal_code" current={lead.postal_code} {...{ editing, setEditing, startEdit, value, setValue, saveField }} />
            <Cell label="Plaats" field="city" current={lead.city} {...{ editing, setEditing, startEdit, value, setValue, saveField }} />
            <Cell label="Omschrijving" field="description" current={lead.description} multiline {...{ editing, setEditing, startEdit, value, setValue, saveField }} />
          </dl>

          <section>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-[16px] font-extrabold tracking-[-0.015em]">Foto’s</h3>
              <Button type="button" variant="outline" className="min-h-11 rounded-lg" disabled={photoMut.isPending} onClick={() => camera.current?.click()}><Camera className="size-5" /> Toevoegen</Button>
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
            <h3 className="mb-2 text-[16px] font-extrabold tracking-[-0.015em]">Tijdlijn</h3>
            <ol className="space-y-3 text-sm">
              {(query.data?.timeline ?? []).map((entry: any) => (
                <li key={entry.id} className="flex min-w-0 gap-3">
                  <span aria-hidden className="mt-[7px] size-2 shrink-0 rounded-full bg-primary" />
                  <div className="min-w-0">
                    <p className="break-words font-bold">{ACTION_LABEL[entry.action] ?? entry.action}</p>
                    <p className="text-[13px] text-muted-foreground">{new Date(entry.created_at).toLocaleString('nl-NL', { dateStyle: 'short', timeStyle: 'short' })}</p>
                  </div>
                </li>
              ))}
              {(query.data?.timeline ?? []).length === 0 && <li className="text-muted-foreground">Nog geen gebeurtenissen vastgelegd.</li>}
            </ol>
            {(query.data?.deliveries ?? []).some((d: any) => d.status === 'failed') && (
              <p className="mt-2 text-sm text-destructive">Laatste verzending naar Telegram is mislukt — stuur opnieuw.</p>
            )}
          </section>

          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            {lead.status !== 'claimed' && (
              <Button variant="outline" className="min-h-12 rounded-lg" disabled={dispatchMut.isPending} onClick={() => dispatchMut.mutate()}>
                <Send className="size-4" />{lead.status === 'dispatched' ? 'Opnieuw naar Telegram' : 'Naar Telegram'}
              </Button>
            )}
            <Button
              variant="outline"
              className="min-h-12 rounded-lg"
              onClick={() => { startEdit('description', lead.description); document.getElementById('edit-description')?.scrollIntoView({ block: 'center' }) }}
            >
              <NotebookPen className="size-4" /> Notitie toevoegen
            </Button>
            {!['claimed', 'cancelled'].includes(lead.status) && (
              <Button variant="outline" className="min-h-12 rounded-lg text-muted-foreground" disabled={cancelMut.isPending} onClick={() => cancelMut.mutate()}><X className="size-4" /> Annuleren</Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/** Dunne wrapper voor smalle schermen; de inhoud komt uit LeadDetail. */
export function LeadSheet({ leadId, onClose }: { leadId: string | null; onClose: () => void }) {
  return (
    <Drawer open={Boolean(leadId)} onOpenChange={(open) => { if (!open) onClose() }}>
      <DrawerContent className="max-h-[92dvh]">
        <DrawerHeader className="pb-2 text-left">
          <DrawerTitle className="break-words text-lg">Lead</DrawerTitle>
        </DrawerHeader>
        <div className="min-w-0 flex-1 overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <LeadDetail leadId={leadId} onClosed={onClose} />
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function Cell({ label, field, current, multiline, editing, startEdit, setEditing, value, setValue, saveField }: {
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
    <div className={`min-w-0 bg-card px-[15px] py-3 ${multiline ? '[grid-column:1/-1]' : ''}`}>
      <div className="flex min-w-0 items-start justify-between gap-2">
        <dt className="text-[11.5px] font-bold uppercase tracking-[0.04em] text-muted-foreground">{label}</dt>
        {!open && (
          <Button type="button" size="icon" variant="ghost" className="-mt-1 size-11 shrink-0 md:size-9" aria-label={`${label} wijzigen`} onClick={() => startEdit(field, current)}><Pencil className="size-4" /></Button>
        )}
      </div>
      {!open && <dd className="mt-0.5 min-w-0 break-words text-[14.5px] font-semibold">{current || <span className="font-normal text-muted-foreground">—</span>}</dd>}
      {open && (
        <div className="mt-2 space-y-2">
          <Label htmlFor={`edit-${field}`} className="sr-only">{label}</Label>
          {multiline
            ? <Textarea id={`edit-${field}`} rows={4} className="text-base" value={value} onChange={(event) => setValue(event.target.value)} />
            : <Input id={`edit-${field}`} className="text-base" inputMode={field === 'customer_phone' ? 'tel' : undefined} value={value} onChange={(event) => setValue(event.target.value)} />}
          <div className="flex flex-wrap gap-2">
            <Button type="button" className="min-h-11 rounded-lg" disabled={saveField.isPending} onClick={() => saveField.mutate({ [field]: value.trim() || null })}><Check className="size-4" /> Opslaan</Button>
            <Button type="button" variant="ghost" className="min-h-11 rounded-lg" onClick={() => setEditing(null)}>Annuleren</Button>
          </div>
        </div>
      )}
    </div>
  )
}
