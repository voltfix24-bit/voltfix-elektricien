import { useEffect, useRef, useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Camera, Check, MessageCircle, NotebookPen, Pencil, Phone, Send, UserRoundCog, X } from 'lucide-react'
import { toast } from 'sonner'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { addLeadNote, addLeadPhotos, cancelLead, createLeadUploadUrl, dispatchLead, getLeadDetail, listContractors, markFirstContact, reassignLead, recordNoAnswer, setLeadOutcome, setNextStep, updateLead } from '@/lib/admin.functions'
import { OUTCOME_DOT, OUTCOME_LABEL, canSetOutcome, isOutcome } from '@/lib/lead-outcome'
import { OutcomePicker } from './outcome-picker'
import { FollowUp } from './follow-up'
import type { StepKind } from '@/lib/follow-up'
import { uploadLeadPhotosDirect } from '@/lib/lead-image'
import { durationText, escalationMinutes, isEmergencyLead, leadUrgency, openSinceText, urgencyLine } from '@/lib/lead-overdue'
import { WhatsAppButton } from './whatsapp-button'
import { PerilexAssessmentPanel } from './perilex-assessment-panel'
import { LeadGone } from '@/components/admin/list-ui'
import { euro } from '@/components/admin/admin-nav'

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
  first_contact: 'Eerste contact gelegd',
  outcome_set: 'Afloop vastgelegd',
  outcome_changed: 'Afloop gewijzigd',
  no_answer: 'Geen antwoord',
  next_step_set: 'Vervolgstap gewijzigd',
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
  const firstContact = useServerFn(markFirstContact)
  const camera = useRef<HTMLInputElement>(null)
  const [editing, setEditing] = useState<EditField>(null)
  const [value, setValue] = useState('')
  const [noteOpen, setNoteOpen] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [moveOpen, setMoveOpen] = useState(false)
  const [moveTo, setMoveTo] = useState('')
  const [moveRefund, setMoveRefund] = useState(true)
  const [moveCharge, setMoveCharge] = useState(true)
  const [moveReason, setMoveReason] = useState('')
  const reassign = useServerFn(reassignLead)
  const contractorList = useServerFn(listContractors)
  const saveOutcome = useServerFn(setLeadOutcome)
  const noAnswer = useServerFn(recordNoAnswer)
  const saveStep = useServerFn(setNextStep)
  const [changeOutcome, setChangeOutcome] = useState(false)

  const query = useQuery({
    queryKey: ['admin', 'lead', leadId],
    queryFn: () => detail({ data: { leadId: leadId! } }),
    enabled: Boolean(leadId),
  })
  useEffect(() => {
    setEditing(null); setNoteOpen(false); setNoteText('')
    setMoveOpen(false); setMoveTo(''); setMoveReason(''); setMoveRefund(true); setMoveCharge(true)
  }, [leadId])

  const contractorsQuery = useQuery({
    queryKey: ['admin', 'contractors', 'reassign'],
    queryFn: () => contractorList(),
    enabled: moveOpen,
  })

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
  const noteMut = useMutation({
    mutationFn: () => addNote({ data: { leadId: leadId!, note: noteText.trim() } }),
    onSuccess: () => { setNoteOpen(false); setNoteText(''); toast.success('Notitie toegevoegd.'); invalidate() },
    onError: () => toast.error('Notitie opslaan mislukt.'),
  })
  const outcomeMut = useMutation({
    mutationFn: (vars: { outcome: any; note?: string; override?: boolean }) =>
      saveOutcome({ data: { leadId: leadId!, outcome: vars.outcome, note: vars.note, override: vars.override ?? false } }),
    onSuccess: () => { setChangeOutcome(false); toast.success('Afloop vastgelegd.'); invalidate() },
    onError: (error: any) => toast.error(error?.message ?? 'Afloop vastleggen mislukt.'),
  })
  const noAnswerMut = useMutation({
    mutationFn: () => noAnswer({ data: { leadId: leadId! } }),
    onSuccess: () => { toast.success('Poging genoteerd.'); invalidate() },
    onError: () => toast.error('Poging noteren mislukt.'),
  })
  const stepMut = useMutation({
    mutationFn: (vars: { kind: StepKind | null; at: string | null }) =>
      saveStep({ data: { leadId: leadId!, kind: vars.kind, at: vars.at } }),
    onSuccess: () => invalidate(),
    onError: () => toast.error('Vervolgstap opslaan mislukt.'),
  })
  const moveMut = useMutation({
    mutationFn: () => reassign({
      data: {
        leadId: leadId!,
        toContractorId: moveTo,
        refundPrevious: moveRefund,
        chargeNew: moveCharge,
        reason: moveReason.trim() || undefined,
      },
    }),
    onSuccess: () => {
      setMoveOpen(false); setMoveTo(''); setMoveReason('')
      toast.success('Lead overgedragen.')
      queryClient.invalidateQueries({ queryKey: ['admin', 'contractors'] })
      invalidate()
    },
    onError: () => toast.error('Overdragen mislukt.'),
  })


  function startEdit(field: Exclude<EditField, null>, current: string | null) {
    setEditing(field)
    setValue(current ?? '')
  }

  const phoneHref = lead ? `tel:${String(lead.customer_phone).replace(/[^+\d]/g, '')}` : '#'


  // De teller van het WhatsApp-venster loopt in minuten; elke 60 seconden opnieuw rekenen.
  const [tick, setTick] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setTick(Date.now()), 60_000)
    return () => clearInterval(timer)
  }, [])

  const now = tick
  const urgent = lead ? isEmergencyLead(lead) : false
  const urgency = lead ? leadUrgency(lead, now) : 'none'
  const headerLine = lead ? (urgencyLine(lead, now) ?? openSinceText(lead, now)) : ''

  const contact = useMutation({
    mutationFn: (channel: 'call' | 'whatsapp') => firstContact({ data: { leadId: leadId!, channel } }) as Promise<{ marked: boolean }>,
    onSuccess: (result) => { if (result.marked) invalidate() },
    onError: () => undefined,
  })

  if (!leadId) return null

  return (
    <div className="min-w-0">
      {query.isLoading && <p role="status">Gegevens laden…</p>}
      {query.error && <p role="alert" className="text-destructive">Ophalen mislukt. Sluit en probeer opnieuw.</p>}
      {!query.isLoading && !query.error && !lead && <LeadGone />}

      {lead && (
        <div className="space-y-5">
          <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <div className="min-w-0">
              {showName && <h2 className="break-words text-[22px] font-extrabold tracking-[-0.02em]">{lead.customer_name}</h2>}
              <p className={`mt-1 text-[13px] font-bold tabular-nums ${urgency === 'escalated' || urgency === 'emergency' ? 'text-destructive' : urgency === 'failed' ? 'text-warning' : 'text-muted-foreground'}`}>{headerLine}</p>
            </div>
            <div className="flex shrink-0 items-start gap-2">
              <Button asChild variant="call" className="min-h-11 rounded-lg" onClick={() => contact.mutate('call')}>
                <a href={phoneHref}><Phone className="size-5" /> Bellen</a>
              </Button>
              <WhatsAppButton lead={lead} onOpen={() => contact.mutate('whatsapp')} />
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
            <DetailCell label="Open sinds" value={openSinceText(lead, now).replace('open sinds ', '')} numeric />
            <DetailCell label="Escalatietermijn" value={durationText(escalationMinutes(lead))} numeric />
            {isOutcome(lead.outcome) && (
              <DetailCell
                label="Afloop"
                value={`${OUTCOME_LABEL[lead.outcome as 'done']}${lead.outcome_at ? ` · ${new Date(lead.outcome_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}` : ''}`}
              />
            )}
            {Number(lead.contact_attempts ?? 0) > 0 && (
              <DetailCell label="Pogingen" value={`${lead.contact_attempts} van 3`} numeric />
            )}
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
              {lead.escalated_at && (
                <li className="flex min-w-0 gap-3">
                  <span aria-hidden className="mt-[7px] size-2 shrink-0 rounded-full bg-destructive" />
                  <div className="min-w-0">
                    <p className="break-words font-bold">Beheerder gewaarschuwd — niemand claimde binnen {escalationMinutes(lead)} min</p>
                    <p className="text-[13px] text-muted-foreground">{new Date(lead.escalated_at).toLocaleString('nl-NL', { dateStyle: 'short', timeStyle: 'short' })}</p>
                  </div>
                </li>
              )}
              {(query.data?.timeline ?? []).map((entry: any) => (
                <li key={entry.id} className="flex min-w-0 gap-3">
                  <span
                    aria-hidden
                    className={`mt-[7px] size-2 shrink-0 rounded-full ${
                      isOutcome(entry.changes?.outcome) ? OUTCOME_DOT[entry.changes.outcome as 'done'] : 'bg-primary'
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="break-words font-bold">
                      {ACTION_LABEL[entry.action] ?? entry.action}
                      {isOutcome(entry.changes?.outcome) ? ` — ${OUTCOME_LABEL[entry.changes.outcome as 'done']}` : ''}
                    </p>
                    {isOutcome(entry.changes?.outcome) && entry.changes?.note && (
                      <p className="break-words text-[13px] text-muted-foreground">{entry.changes.note}</p>
                    )}
                    {entry.action === 'note_added' && entry.changes?.note && (
                      <p className="break-words text-[13px] text-muted-foreground">{entry.changes.note}</p>
                    )}
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

          {lead.status === 'claimed' && (
            <FollowUp
              lead={lead}
              pending={noAnswerMut.isPending || stepMut.isPending}
              onNoAnswer={() => noAnswerMut.mutate()}
              onSetStep={(kind, at) => stepMut.mutate({ kind, at })}
              onClose={() => outcomeMut.mutate({ outcome: 'unreachable' })}
            />
          )}

          {canSetOutcome(lead) || changeOutcome ? (
            <OutcomePicker
              pending={outcomeMut.isPending}
              onPick={(outcome, note) => outcomeMut.mutate({ outcome, note, override: changeOutcome })}
              onCancel={() => setChangeOutcome(false)}
            />
          ) : isOutcome(lead.outcome) ? (
            <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
              <span className="inline-flex items-center gap-2 text-[14px] font-bold">
                <span aria-hidden className={`size-2 rounded-full ${OUTCOME_DOT[lead.outcome as 'done']}`} />
                {OUTCOME_LABEL[lead.outcome as 'done']}
              </span>
              {lead.outcome_note && <span className="text-[13px] text-muted-foreground">{lead.outcome_note}</span>}
              <Button variant="ghost" className="min-h-11 rounded-lg" onClick={() => setChangeOutcome(true)}>Wijzigen</Button>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            {lead.status !== 'claimed' && (
              <Button variant="outline" className="min-h-12 rounded-lg" disabled={dispatchMut.isPending} onClick={() => dispatchMut.mutate()}>
                <Send className="size-4" />{lead.status === 'dispatched' ? 'Opnieuw naar Telegram' : 'Naar Telegram'}
              </Button>
            )}
            <Button variant="outline" className="min-h-12 rounded-lg" onClick={() => setNoteOpen((open) => !open)} aria-expanded={noteOpen}>
              <NotebookPen className="size-4" /> Notitie toevoegen
            </Button>
            <Button variant="outline" className="min-h-12 rounded-lg" onClick={() => setMoveOpen((open) => !open)} aria-expanded={moveOpen}>
              <UserRoundCog className="size-4" /> Overdragen
            </Button>
            {!['claimed', 'cancelled'].includes(lead.status) && (
              <Button variant="outline" className="min-h-12 rounded-lg text-muted-foreground" disabled={cancelMut.isPending} onClick={() => cancelMut.mutate()}><X className="size-4" /> Annuleren</Button>
            )}
          </div>
          {moveOpen && (
            <div className="space-y-3 rounded-xl border border-border bg-card p-[15px]">
              <p className="text-[13px] text-muted-foreground">
                Nu op: <span className="font-bold text-foreground">{lead.contractors?.name ?? 'niemand'}</span> · leadprijs {euro(lead.price_cents)}
              </p>
              <div className="space-y-2">
                <Label htmlFor="move-to" className="text-[11.5px] font-bold uppercase tracking-[0.04em] text-muted-foreground">Nieuwe ZZP&apos;er</Label>
                <select
                  id="move-to"
                  value={moveTo}
                  onChange={(event) => setMoveTo(event.target.value)}
                  className="h-12 w-full rounded-lg border border-input bg-card px-3 text-[14px]"
                >
                  <option value="">Kies een ZZP&apos;er</option>
                  {((contractorsQuery.data ?? []) as any[])
                    .filter((contractor) => contractor.id !== lead.claimed_by)
                    .map((contractor) => (
                      <option key={contractor.id} value={contractor.id}>{contractor.name}</option>
                    ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-[14px] font-semibold">
                <input type="checkbox" className="size-5" checked={moveRefund} disabled={!lead.claimed_by} onChange={(event) => setMoveRefund(event.target.checked)} />
                {euro(lead.price_cents)} terug naar {lead.contractors?.name ?? 'de vorige ZZP\u2019er'}
              </label>
              <label className="flex items-center gap-2 text-[14px] font-semibold">
                <input type="checkbox" className="size-5" checked={moveCharge} onChange={(event) => setMoveCharge(event.target.checked)} />
                {euro(lead.price_cents)} van het saldo van de nieuwe ZZP&apos;er
              </label>
              <div className="space-y-2">
                <Label htmlFor="move-reason" className="text-[11.5px] font-bold uppercase tracking-[0.04em] text-muted-foreground">Reden (komt in de tijdlijn)</Label>
                <Input id="move-reason" className="text-base" placeholder="Bijv. eerste storing liep uit" value={moveReason} onChange={(event) => setMoveReason(event.target.value)} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button className="min-h-11 rounded-lg" disabled={!moveTo || moveMut.isPending} onClick={() => moveMut.mutate()}><Check className="size-4" /> Overdragen</Button>
                <Button variant="ghost" className="min-h-11 rounded-lg" onClick={() => setMoveOpen(false)}>Annuleren</Button>
              </div>
            </div>
          )}
          {noteOpen && (
            <div className="space-y-2">
              <Label htmlFor="lead-note" className="text-[11.5px] font-bold uppercase tracking-[0.04em] text-muted-foreground">Interne notitie</Label>
              <Textarea id="lead-note" rows={3} className="text-base" placeholder="Alleen intern zichtbaar, komt in de tijdlijn." value={noteText} onChange={(event) => setNoteText(event.target.value)} />
              <div className="flex flex-wrap gap-2">
                <Button className="min-h-11 rounded-lg" disabled={noteMut.isPending || !noteText.trim()} onClick={() => noteMut.mutate()}><Check className="size-4" /> Bewaar notitie</Button>
                <Button variant="ghost" className="min-h-11 rounded-lg" onClick={() => setNoteOpen(false)}>Annuleren</Button>
              </div>
            </div>
          )}
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

/** Vaste cel in het detailraster: alleen lezen, zelfde vorm als de bewerkbare cellen. */
function DetailCell({ label, value, numeric }: { label: string; value: string; numeric?: boolean }) {
  return (
    <div className="min-w-0 bg-card px-[15px] py-3">
      <dt className="text-[11.5px] font-bold uppercase tracking-[0.04em] text-muted-foreground">{label}</dt>
      <dd className={`mt-0.5 min-w-0 break-words text-[14.5px] font-semibold ${numeric ? 'tabular-nums' : ''}`}>{value}</dd>
    </div>
  )
}
