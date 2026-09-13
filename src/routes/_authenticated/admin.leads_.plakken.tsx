import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Check, Save, Send } from 'lucide-react'
import { toast } from 'sonner'
import { AdminShell } from '@/components/admin/admin-shell'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createLead, findPossibleDuplicates, lookupAddress, parsePastedConversation } from '@/lib/admin.functions'
import { JOBS } from '@/lib/lead-jobs'
import { CONFIDENCE_LABEL, type Confidence, type WhatsAppParse } from '@/lib/whatsapp-parse'

export const Route = createFileRoute('/_authenticated/admin/leads_/plakken')({
  head: () => ({
    meta: [
      { title: 'Plakken uit WhatsApp | VoltFix backoffice' },
      { name: 'description', content: 'Plak een WhatsApp-gesprek en laat de velden van de lead automatisch invullen.' },
      { name: 'robots', content: 'noindex, nofollow' },
      { property: 'og:title', content: 'Plakken uit WhatsApp | VoltFix backoffice' },
      { property: 'og:description', content: 'Van geplakt gesprek naar ingevulde lead.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
    ],
  }),
  component: PastePage,
})

type FieldKey = 'customer_name' | 'customer_phone' | 'job_type' | 'postal_code' | 'house_number' | 'address' | 'city' | 'description'

const EMPTY = {
  customer_name: '',
  customer_phone: '',
  job_type: '',
  postal_code: '',
  house_number: '',
  address: '',
  city: '',
  description: '',
}

type DuplicateHit = { id: string; customer_name: string; job_type: string; status: string; created_at: string }

function ConfidenceBadge({ level, confirmed }: { level: Confidence; confirmed?: boolean }) {
  if (confirmed) return <Badge variant="success" className="shrink-0">PDOK bevestigd</Badge>
  const variant = level === 'certain' ? 'success' : level === 'suggested' ? 'secondary' : 'warning'
  return <Badge variant={variant} className="shrink-0">{CONFIDENCE_LABEL[level]}</Badge>
}

function PastePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const parse = useServerFn(parsePastedConversation)
  const save = useServerFn(createLead)
  const findAddress = useServerFn(lookupAddress)
  const findDuplicates = useServerFn(findPossibleDuplicates)

  const [pasted, setPasted] = useState('')
  const [values, setValues] = useState({ ...EMPTY })
  const [confidence, setConfidence] = useState<Record<FieldKey, Confidence>>({
    customer_name: 'missing',
    customer_phone: 'missing',
    job_type: 'missing',
    postal_code: 'missing',
    house_number: 'missing',
    address: 'missing',
    city: 'missing',
    description: 'missing',
  })
  const [language, setLanguage] = useState<'nl' | 'en'>('nl')
  const [urgent, setUrgent] = useState(false)
  const [urgentKnown, setUrgentKnown] = useState<Confidence>('missing')
  const [addressConfirmed, setAddressConfirmed] = useState(false)
  const [duplicates, setDuplicates] = useState<DuplicateHit[]>([])
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID())

  // Herkenning draait server-side, met een rustpauze na het typen/plakken.
  useEffect(() => {
    if (pasted.trim().length < 8) return
    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const result = (await parse({ data: { text: pasted } })) as WhatsAppParse
        if (cancelled) return
        setValues((old) => ({
          ...old,
          customer_name: result.name.value ?? '',
          customer_phone: result.phone.value ?? '',
          job_type: result.jobType.value ?? '',
          postal_code: result.postalCode.value ?? '',
          house_number: result.houseNumber.value ?? '',
          address: result.address.value ?? '',
        }))
        setConfidence({
          customer_name: result.name.confidence,
          customer_phone: result.phone.confidence,
          job_type: result.jobType.confidence,
          postal_code: result.postalCode.confidence,
          house_number: result.houseNumber.confidence,
          address: result.address.confidence,
          city: 'missing',
          description: 'missing',
        })
        setLanguage(result.language.value ?? 'nl')
        setUrgent(result.urgent.value ?? false)
        setUrgentKnown(result.urgent.confidence)
        setAddressConfirmed(false)
      } catch {
        // Mislukte herkenning mag het handmatig invullen niet blokkeren.
      }
    }, 400)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [pasted, parse])

  // Bestaande PDOK-lookup bevestigt postcode + huisnummer.
  useEffect(() => {
    const pc = values.postal_code.replace(/\s+/g, '').toUpperCase()
    if (!/^[1-9][0-9]{3}[A-Z]{2}$/.test(pc) || !values.house_number.trim()) return
    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const found = await findAddress({ data: { postcode: pc, houseNumber: values.house_number.trim() } })
        if (cancelled) return
        setValues((old) => ({ ...old, address: `${found.street} ${found.houseNumber}`.trim(), city: found.city }))
        setAddressConfirmed(true)
      } catch {
        if (!cancelled) setAddressConfirmed(false)
      }
    }, 500)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [values.postal_code, values.house_number, findAddress])

  // Dezelfde dubbelcontrole als in het leadformulier.
  useEffect(() => {
    const digits = values.customer_phone.replace(/\D/g, '')
    if (digits.length < 9) { setDuplicates([]); return }
    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const hits = await findDuplicates({ data: { phone: values.customer_phone.trim() } })
        if (!cancelled) setDuplicates(hits)
      } catch {
        if (!cancelled) setDuplicates([])
      }
    }, 500)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [values.customer_phone, findDuplicates])

  const missing = [
    values.customer_phone.replace(/\D/g, '').length < 9 && 'telefoonnummer',
    values.job_type.trim().length < 2 && 'soort klus',
  ].filter(Boolean) as string[]

  const create = useMutation({
    mutationFn: (dispatch: boolean) =>
      save({
        data: {
          customer_name: values.customer_name.trim() || 'Onbekend',
          customer_phone: values.customer_phone.trim(),
          postal_code: values.postal_code.trim().toUpperCase() || null,
          address: values.address.trim() || null,
          city: values.city.trim() || null,
          job_type: values.job_type.trim(),
          description: values.description.trim() || null,
          price_cents: 2000,
          is_urgent: urgent,
          dispatch,
          source: 'whatsapp_manual',
          customer_language: language,
          idempotency_key: idempotencyKey,
        },
      }),
    onSuccess: (_data, dispatch) => {
      toast.success(dispatch ? 'Lead opgeslagen en verstuurd naar Telegram.' : 'Lead opgeslagen.')
      queryClient.invalidateQueries({ queryKey: ['admin', 'leads'] })
      setIdempotencyKey(crypto.randomUUID())
      navigate({ to: '/admin/leads', search: { view: 'list' } })
    },
    onError: () => toast.error('Opslaan mislukt. Je invoer blijft staan; probeer opnieuw.'),
  })

  function set(key: FieldKey, value: string) {
    setValues((old) => ({ ...old, [key]: value }))
    setConfidence((old) => ({ ...old, [key]: value.trim() ? 'certain' : 'missing' }))
    if (key === 'postal_code' || key === 'house_number') setAddressConfirmed(false)
  }

  return (
    <AdminShell
      title="Plakken uit WhatsApp"
      context="Plak het gesprek links; rechts staan de herkende velden."
      actions={
        <Button asChild variant="outline" size="sm" className="min-h-11 shrink-0">
          <Link to="/admin/leads"><ArrowLeft className="size-4" /> Terug</Link>
        </Button>
      }
    >
      <div className="grid min-w-0 gap-5 lg:grid-cols-2">
        <section aria-labelledby="paste-title" className="min-w-0 rounded-xl border border-border bg-card">
          <h2 id="paste-title" className="border-b border-border px-4 py-3 text-[11.5px] font-bold uppercase tracking-[0.04em] text-muted-foreground">Geplakt gesprek</h2>
          <div className="p-4">
            <Label htmlFor="paste" className="sr-only">Geplakt gesprek</Label>
            <Textarea
              id="paste"
              value={pasted}
              onChange={(event) => setPasted(event.target.value)}
              placeholder="Plak hier het WhatsApp-gesprek…"
              rows={12}
              className="h-[260px] min-h-[260px] text-base"
            />
            <p className="mt-2 text-[13px] text-muted-foreground">Het gesprek wordt niet bewaard. Wil je iets ervan vastleggen, zet het dan in de omschrijving.</p>
          </div>
        </section>

        <section aria-labelledby="fields-title" className="min-w-0 space-y-3">
          <h2 id="fields-title" className="text-[16px] font-extrabold tracking-[-0.015em]">Herkende velden</h2>

          <Row label="Naam" id="p-name" value={values.customer_name} level={confidence.customer_name} onChange={(v) => set('customer_name', v)} />
          <Row label="Telefoon" id="p-phone" value={values.customer_phone} level={confidence.customer_phone} onChange={(v) => set('customer_phone', v)} />
          <Row label="Soort klus" id="p-job" value={values.job_type} level={confidence.job_type} onChange={(v) => set('job_type', v)} list="paste-jobs" />
          <datalist id="paste-jobs">{JOBS.map((job) => <option key={job} value={job} />)}</datalist>
          <Row label="Postcode" id="p-postcode" value={values.postal_code} level={confidence.postal_code} onChange={(v) => set('postal_code', v.toUpperCase())} confirmed={addressConfirmed} />
          <Row label="Huisnummer" id="p-house" value={values.house_number} level={confidence.house_number} onChange={(v) => set('house_number', v)} confirmed={addressConfirmed} />
          <Row label="Adres" id="p-address" value={values.address} level={confidence.address} onChange={(v) => set('address', v)} confirmed={addressConfirmed} />
          <Row label="Plaats" id="p-city" value={values.city} level={confidence.city} onChange={(v) => set('city', v)} confirmed={addressConfirmed} />

          <div className="flex min-w-0 flex-wrap items-center gap-3 rounded-xl border border-border p-3">
            <div className="min-w-0 flex-1">
              <Label htmlFor="p-language" className="text-[11.5px] font-bold uppercase tracking-[0.04em] text-muted-foreground">Taal klant</Label>
              <Select value={language} onValueChange={(value) => setLanguage(value as 'nl' | 'en')}>
                <SelectTrigger id="p-language" className="mt-1 min-h-11 text-base"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nl">Nederlands</SelectItem>
                  <SelectItem value="en">Engels</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className={`flex min-w-0 flex-wrap items-center gap-3 rounded-xl border p-3 ${urgentKnown === 'missing' ? 'border-warning' : 'border-border'}`}>
            <div className="min-w-0 flex-1">
              <span className="block text-[11.5px] font-bold uppercase tracking-[0.04em] text-muted-foreground">Spoed</span>
              <span className="text-[14.5px]">{urgentKnown === 'missing' ? 'Onbekend — vragen' : urgent ? 'Ja' : 'Nee'}</span>
            </div>
            <Button type="button" role="switch" aria-checked={urgent} aria-label="Spoed" variant={urgent ? 'destructive' : 'outline'} className="min-h-11" onClick={() => { setUrgent(!urgent); setUrgentKnown('certain') }}>
              {urgent ? 'Aan' : 'Uit'}
            </Button>
            <ConfidenceBadge level={urgentKnown} />
          </div>

          <div className="min-w-0 rounded-xl border border-border p-3">
            <Label htmlFor="p-description" className="text-[11.5px] font-bold uppercase tracking-[0.04em] text-muted-foreground">Omschrijving</Label>
            <Textarea id="p-description" rows={3} className="mt-1 text-base" value={values.description} onChange={(event) => set('description', event.target.value)} placeholder="Alleen wat je bewust wilt vastleggen" />
          </div>

          {duplicates.length > 0 && (
            <div role="status" className="rounded-xl border border-warning bg-warning/10 p-3">
              <p className="text-[14px] font-bold text-warning-foreground">Mogelijk al bekend · {duplicates.length}</p>
              <ul className="mt-2 space-y-2">
                {duplicates.map((hit) => (
                  <li key={hit.id} className="text-[13.5px]">{hit.customer_name} · {hit.job_type} · {new Date(hit.created_at).toLocaleDateString('nl-NL')}</li>
                ))}
              </ul>
            </div>
          )}

          {missing.length > 0 && <p className="text-[13px] text-muted-foreground">Nog nodig: {missing.join(', ')}.</p>}

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button className="min-h-12" disabled={missing.length > 0 || create.isPending} onClick={() => create.mutate(true)}>
              <Send className="size-4" /> Opslaan + naar Telegram
            </Button>
            <Button variant="outline" className="min-h-12" disabled={missing.length > 0 || create.isPending} onClick={() => create.mutate(false)}>
              <Save className="size-4" /> Alleen opslaan
            </Button>
          </div>
        </section>
      </div>
    </AdminShell>
  )
}

function Row({
  label,
  id,
  value,
  level,
  onChange,
  list,
  confirmed,
}: {
  label: string
  id: string
  value: string
  level: Confidence
  onChange: (value: string) => void
  list?: string
  confirmed?: boolean
}) {
  const unknown = level === 'missing' && !value.trim()
  return (
    <div className={`flex min-w-0 flex-wrap items-end gap-3 rounded-xl border p-3 ${unknown ? 'border-warning' : 'border-border'}`}>
      <div className="min-w-0 flex-1">
        <Label htmlFor={id} className="text-[11.5px] font-bold uppercase tracking-[0.04em] text-muted-foreground">{label}</Label>
        <Input id={id} list={list} className="mt-1 min-h-11 text-base" value={value} placeholder={unknown ? 'Onbekend — vragen' : ''} onChange={(event) => onChange(event.target.value)} />
      </div>
      <div className="flex shrink-0 items-center gap-2 pb-2">
        {confirmed && <Check className="size-4 text-success" aria-hidden />}
        <ConfidenceBadge level={level} confirmed={confirmed} />
      </div>
    </div>
  )
}
