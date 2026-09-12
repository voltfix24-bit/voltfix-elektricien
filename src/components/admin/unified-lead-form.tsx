import { useEffect, useRef, useState, type ComponentProps } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Camera, Check, ChevronDown, ImagePlus, MapPin, Pencil, Save, Send, X, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { createLead, createLeadUploadUrl, lookupAddress } from '@/lib/admin.functions'
import { uploadLeadPhotosDirect } from '@/lib/lead-image'
import { clearLeadDraft, draftHasContent, readLeadDraft, saveLeadDraft } from '@/lib/lead-draft'
import { isEmergencyLead } from '@/lib/lead-overdue'

const initial = {
  customer_phone: '',
  job_type: '',
  postal_code: '',
  house_number: '',
  address: '',
  city: '',
  customer_name: '',
  customer_email: '',
  description: '',
  pricing_type: 'standard' as 'standard' | 'hourly' | 'fixed',
  pricing_note: '',
  price_euro: '20',
  is_urgent: false,
  source: 'phone_manual' as 'phone_manual' | 'whatsapp_manual' | 'referral',
  customer_language: 'nl' as 'nl' | 'en',
}
type Values = typeof initial

const JOBS = ['Storing / geen stroom', 'Groepenkast vervangen', 'Perilex aansluiten', 'Laadpaal installeren', 'Stopcontact / schakelaar', 'Verlichting ophangen', 'Inspectie / keuring']
const SOURCES: { key: Values['source']; label: string }[] = [
  { key: 'phone_manual', label: 'Telefoon' },
  { key: 'whatsapp_manual', label: 'WhatsApp' },
  { key: 'referral', label: 'Doorverwijzing' },
]
const PRICING: { key: Values['pricing_type']; label: string }[] = [
  { key: 'standard', label: 'Standaard' },
  { key: 'hourly', label: 'Uurtarief' },
  { key: 'fixed', label: 'Vaste prijs' },
]

export function UnifiedLeadForm() {
  const [form, setForm] = useState<Values>(initial)
  const [photos, setPhotos] = useState<File[]>([])
  const [draft, setDraft] = useState<Values | null>(null)
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() => crypto.randomUUID())
  const [result, setResult] = useState<string | null>(null)
  const [addressMode, setAddressMode] = useState<'lookup' | 'manual'>('lookup')
  const [lookupState, setLookupState] = useState<'idle' | 'searching' | 'found' | 'notfound'>('idle')
  const gallery = useRef<HTMLInputElement>(null)
  const camera = useRef<HTMLInputElement>(null)

  const queryClient = useQueryClient()
  const save = useServerFn(createLead)
  const ticket = useServerFn(createLeadUploadUrl)
  const findAddress = useServerFn(lookupAddress)

  const urgent = isEmergencyLead({ is_urgent: form.is_urgent, job_type: form.job_type })
  const amount = Number(form.price_euro.replace(',', '.'))
  const missing = [
    form.customer_phone.trim().length < 6 && 'telefoonnummer',
    form.job_type.trim().length < 2 && 'soort klus',
    !Number.isFinite(amount) || amount < 0 || amount > 1000 ? 'geldige leadprijs' : false,
  ].filter(Boolean) as string[]

  // Concept uit een eerdere sessie aanbieden.
  useEffect(() => {
    const stored = readLeadDraft()
    if (stored && draftHasContent(stored.values)) setDraft({ ...initial, ...(stored.values as Values) })
  }, [])

  // Invoer meelopend bewaren, zodat een gesloten tabblad niets kost.
  useEffect(() => {
    if (!draftHasContent(form)) return
    const timer = setTimeout(() => saveLeadDraft(form), 500)
    return () => clearTimeout(timer)
  }, [form])

  // Adres automatisch aanvullen na postcode + huisnummer.
  useEffect(() => {
    if (addressMode !== 'lookup') return
    const pc = form.postal_code.replace(/\s+/g, '').toUpperCase()
    if (!/^[1-9][0-9]{3}[A-Z]{2}$/.test(pc) || !form.house_number.trim()) { setLookupState('idle'); return }
    let cancelled = false
    setLookupState('searching')
    const timer = setTimeout(async () => {
      try {
        const found = await findAddress({ data: { postcode: pc, houseNumber: form.house_number.trim() } })
        if (cancelled) return
        setForm((old) => ({ ...old, address: `${found.street} ${found.houseNumber}`.trim(), city: found.city }))
        setLookupState('found')
      } catch {
        // Geen adres gevonden: handmatig invullen blijft mogelijk.
        if (!cancelled) setLookupState('notfound')
      }
    }, 400)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [form.postal_code, form.house_number, findAddress, addressMode])


  const create = useMutation({
    mutationFn: async (dispatch: boolean) =>
      save({
        data: {
          customer_name: form.customer_name.trim() || 'Onbekend',
          customer_phone: form.customer_phone.trim(),
          customer_email: form.customer_email.trim() || null,
          postal_code: form.postal_code.trim().toUpperCase() || null,
          address: form.address.trim() || null,
          city: form.city.trim() || null,
          job_type: form.job_type.trim(),
          description: form.description.trim() || null,
          price_cents: Math.round(amount * 100),
          is_urgent: urgent,
          dispatch,
          source: form.source,
          pricing_type: form.pricing_type,
          pricing_note: form.pricing_note.trim() || null,
          customer_language: form.customer_language,
          idempotency_key: idempotencyKey,
          image_urls: await uploadLeadPhotosDirect(photos, ticket),
        },
      }),
    onSuccess: (data, dispatch) => {
      const message = data.reused
        ? 'Deze lead was al opgeslagen — geen tweede invoer aangemaakt.'
        : dispatch && !data.dispatched
          ? 'Lead opgeslagen, maar Telegram is niet bereikt. Stuur hem opnieuw vanuit het overzicht.'
          : dispatch
            ? 'Lead opgeslagen en verstuurd naar Telegram.'
            : 'Lead opgeslagen als concept.'
      setResult(data.duplicateOfId ? `${message} Let op: mogelijk een dubbele aanvraag van dezelfde klant.` : message)
      if (dispatch && !data.dispatched) toast.warning(message)
      else toast.success(message)
      setForm(initial)
      setAddressMode('lookup')
      setLookupState('idle')
      setPhotos([])
      setIdempotencyKey(crypto.randomUUID())
      clearLeadDraft()
      queryClient.invalidateQueries({ queryKey: ['admin', 'leads'] })
    },
    onError: () => toast.error('Opslaan mislukt. Je invoer blijft staan; probeer opnieuw.'),
  })

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setResult(null)
    setForm((old) => ({ ...old, [key]: value }))
  }

  function addPhotos(files: File[]) {
    const next = [...photos]
    for (const file of files) {
      if (!file.type.startsWith('image/') && !/\.(heic|heif)$/i.test(file.name)) {
        toast.error('Kies een afbeelding.')
        continue
      }
      if (next.length >= 3) { toast.error('Maximaal 3 foto’s.'); break }
      next.push(file)
    }
    setPhotos(next)
  }

  return (
    <section aria-labelledby="new-lead-title" className="min-w-0">
      <h2 id="new-lead-title" className="mb-4 text-xl font-semibold">Nieuwe lead invoeren</h2>

      {draft && (
        <div role="status" className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-secondary p-3 text-sm">
          <span className="flex-1">Er staat nog een niet-verzonden invoer klaar.</span>
          <Button type="button" size="sm" className="min-h-11" onClick={() => { setForm(draft); setDraft(null) }}>Herstellen</Button>
          <Button type="button" size="sm" variant="ghost" className="min-h-11" onClick={() => { clearLeadDraft(); setDraft(null) }}>Weggooien</Button>
        </div>
      )}

      {result && <p role="status" className="mb-4 rounded-md border border-border bg-secondary p-4 text-sm">{result}</p>}

      <form onSubmit={(event) => { event.preventDefault(); if (!missing.length && !create.isPending) create.mutate(true) }}>
        <fieldset disabled={create.isPending} className="grid min-w-0 gap-5 sm:grid-cols-2">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3 sm:col-span-2">
            <div className="min-w-0">
              <span className="flex items-center gap-2 font-semibold"><Zap className={urgent ? 'size-5 text-destructive' : 'size-5 text-muted-foreground'} /> Storing / spoed</span>
              <span className="text-sm text-muted-foreground">Opvolgen na {urgent ? '1 uur' : '24 uur'}</span>
            </div>
            <Button type="button" role="switch" aria-checked={urgent} aria-label="Storing of spoed" variant={urgent ? 'destructive' : 'outline'} className="min-h-12 min-w-12" onClick={() => set('is_urgent', !form.is_urgent)}>{urgent ? 'Aan' : 'Uit'}</Button>
          </div>

          <div className="flex flex-wrap gap-2 sm:col-span-2" role="group" aria-label="Hoe kwam de lead binnen">
            {SOURCES.map((item) => (
              <Button key={item.key} type="button" size="sm" className="min-h-11" aria-pressed={form.source === item.key} variant={form.source === item.key ? 'default' : 'outline'} onClick={() => set('source', item.key)}>{item.label}</Button>
            ))}
          </div>

          <Field label="Telefoon klant" id="lead-phone" type="tel" inputMode="tel" required className="text-base" value={form.customer_phone} onChange={(event) => set('customer_phone', event.target.value)} placeholder="06 1234 5678" autoComplete="off" />
          <div className="space-y-2">
            <Label htmlFor="lead-job">Soort klus *</Label>
            <Input id="lead-job" list="lead-jobs" required minLength={2} className="text-base" placeholder="Kies of typ een klus" value={form.job_type} onChange={(event) => set('job_type', event.target.value)} />
            <datalist id="lead-jobs">{JOBS.map((job) => <option key={job} value={job} />)}</datalist>
          </div>
          <div className="min-w-0 space-y-3 rounded-lg border border-border p-3 sm:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-2 font-medium"><MapPin className="size-4 text-muted-foreground" aria-hidden /> Adres</span>
              <div className="min-w-0">
                <Label htmlFor="lead-address-mode" className="sr-only">Hoe wil je het adres invullen?</Label>
                <Select value={addressMode} onValueChange={(value) => { setAddressMode(value as 'lookup' | 'manual'); setLookupState('idle') }}>
                  <SelectTrigger id="lead-address-mode" className="min-h-11 text-base sm:w-56"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lookup">Zoeken op postcode</SelectItem>
                    <SelectItem value="manual">Handmatig invullen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Postcode" id="lead-postcode" className="text-base" value={form.postal_code} onChange={(event) => set('postal_code', event.target.value.toUpperCase())} placeholder="1012 AB" autoComplete="off" />
              <Field label="Huisnummer" id="lead-house" inputMode="numeric" className="text-base" value={form.house_number} onChange={(event) => set('house_number', event.target.value)} autoComplete="off" />
            </div>

            {addressMode === 'lookup' && (
              <div role="status" aria-live="polite" className="text-sm">
                {lookupState === 'searching' && <p className="text-muted-foreground">Adres zoeken…</p>}
                {lookupState === 'found' && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-secondary p-3">
                    <span className="flex min-w-0 items-center gap-2"><Check className="size-4 shrink-0" aria-hidden /><span className="min-w-0 break-words">{[form.address, form.postal_code, form.city].filter(Boolean).join(' · ')}</span></span>
                    <Button type="button" size="sm" variant="outline" className="min-h-11" onClick={() => setAddressMode('manual')}><Pencil className="size-4" /> Klopt niet? Aanpassen</Button>
                  </div>
                )}
                {lookupState === 'notfound' && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3">
                    <span className="text-muted-foreground">Geen adres gevonden bij deze postcode en huisnummer.</span>
                    <Button type="button" size="sm" variant="outline" className="min-h-11" onClick={() => setAddressMode('manual')}><Pencil className="size-4" /> Handmatig invullen</Button>
                  </div>
                )}
              </div>
            )}

            {addressMode === 'manual' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field label="Straat en huisnummer" id="lead-address" className="text-base" value={form.address} onChange={(event) => set('address', event.target.value)} autoComplete="off" />
                </div>
                <Field label="Plaats" id="lead-city" className="text-base" value={form.city} onChange={(event) => set('city', event.target.value)} autoComplete="off" />
              </div>
            )}
          </div>


          <Section title="Klantgegevens" className="sm:col-span-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Naam klant" id="lead-name" className="text-base" value={form.customer_name} onChange={(event) => set('customer_name', event.target.value)} autoComplete="off" />
              <Field label="E-mail" id="lead-email" type="email" className="text-base" value={form.customer_email} onChange={(event) => set('customer_email', event.target.value)} autoComplete="off" />
            </div>
          </Section>


          <Section title="Omschrijving" className="sm:col-span-2">
            <Label htmlFor="lead-description" className="sr-only">Omschrijving van de klus</Label>
            <Textarea id="lead-description" rows={4} className="text-base" value={form.description} onChange={(event) => set('description', event.target.value)} placeholder="Wat vertelde de klant?" />
          </Section>

          <Section title={`Tariefafspraak · ${PRICING.find((p) => p.key === form.pricing_type)?.label}`} className="sm:col-span-2">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Tariefafspraak">
              {PRICING.map((item) => (
                <Button key={item.key} type="button" size="sm" className="min-h-11" aria-pressed={form.pricing_type === item.key} variant={form.pricing_type === item.key ? 'default' : 'outline'} onClick={() => set('pricing_type', item.key)}>{item.label}</Button>
              ))}
            </div>
            {form.pricing_type !== 'standard' && (
              <div className="mt-4">
                <Field label="Toelichting op de afspraak" id="lead-pricing-note" className="text-base" value={form.pricing_note} onChange={(event) => set('pricing_note', event.target.value)} placeholder={form.pricing_type === 'hourly' ? 'Bijv. € 90 per uur, voorrijden inbegrepen' : 'Bijv. vaste prijs € 695 inclusief materiaal'} />
              </div>
            )}
            <div className="mt-4 max-w-xs">
              <Field label="Leadprijs (€ ex. btw)" id="lead-price" inputMode="decimal" className="text-base" value={form.price_euro} onChange={(event) => set('price_euro', event.target.value)} />
            </div>
          </Section>

          <Section title={`Foto’s · ${photos.length}/3`} className="sm:col-span-2">
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" className="min-h-12" onClick={() => camera.current?.click()}><Camera className="size-5" /> Camera</Button>
              <Button type="button" variant="outline" className="min-h-12" onClick={() => gallery.current?.click()}><ImagePlus className="size-5" /> Kiezen</Button>
              <input ref={camera} type="file" accept="image/*" capture="environment" className="sr-only" onChange={(event) => { addPhotos(Array.from(event.target.files ?? [])); event.target.value = '' }} />
              <input ref={gallery} type="file" accept="image/*" multiple className="sr-only" onChange={(event) => { addPhotos(Array.from(event.target.files ?? [])); event.target.value = '' }} />
            </div>
            {photos.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-3">
                {photos.map((photo, index) => (
                  <li key={`${photo.name}-${index}`} className="flex min-w-0 items-center gap-2 rounded-md border border-border p-2 text-sm">
                    <span className="max-w-40 truncate">{photo.name}</span>
                    <Button type="button" size="icon" variant="ghost" className="min-h-11 min-w-11" aria-label={`Verwijder ${photo.name}`} onClick={() => setPhotos(photos.filter((_, i) => i !== index))}><X className="size-4" /></Button>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-sm text-muted-foreground">Foto’s worden automatisch verkleind voor snel versturen.</p>
          </Section>
        </fieldset>

        <div className="sticky bottom-0 z-20 -mx-4 mt-4 border-t border-border bg-background px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:static sm:mx-0 sm:px-0">
          {missing.length > 0 && <p className="mb-2 text-sm text-muted-foreground">Nog nodig: {missing.join(', ')}.</p>}
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Button type="submit" className="h-auto min-h-12 whitespace-normal py-3" disabled={missing.length > 0 || create.isPending}><Send className="size-4 shrink-0" />{create.isPending ? 'Bezig…' : 'Opslaan + naar Telegram'}</Button>
            <Button type="button" variant="outline" className="min-h-12 min-w-12" title="Opslaan als concept" aria-label="Opslaan als concept" disabled={missing.length > 0 || create.isPending} onClick={() => create.mutate(false)}><Save className="size-5" /><span className="hidden sm:inline">Concept</span></Button>
          </div>
        </div>
      </form>
    </section>
  )
}

function Field({ label, ...props }: ComponentProps<typeof Input> & { label: string }) {
  return (
    <div className="min-w-0 space-y-2">
      <Label htmlFor={props.id}>{label}{props.required ? ' *' : ''}</Label>
      <Input {...props} />
    </div>
  )
}

function Section({ title, className, children }: { title: string; className?: string; children: React.ReactNode }) {
  return (
    <details className={`min-w-0 rounded-lg border border-border ${className ?? ''}`}>
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 px-3 font-medium">
        <span className="min-w-0 break-words">{title}</span>
        <ChevronDown className="size-4 shrink-0" aria-hidden />
      </summary>
      <div className="border-t border-border p-3">{children}</div>
    </details>
  )
}
