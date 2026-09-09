import { useState, type ComponentProps } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Send, Save, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { LeadPhotoPicker } from './lead-photo-picker'
import { createLead, uploadLeadImage } from '@/lib/admin.functions'
import { uploadLeadPhotos } from '@/lib/lead-photo-upload'
import { isEmergencyLead } from '@/lib/lead-overdue'

const initial = { customer_name: '', customer_phone: '', customer_email: '', postal_code: '', city: '', address: '', job_type: '', description: '', price_euro: '20', is_urgent: false }
const jobs = ['Storing / geen stroom', 'Groepenkast vervangen', 'Perilex aansluiten', 'Laadpaal installeren', 'Stopcontact / schakelaar', 'Verlichting ophangen', 'Inspectie / keuring']

export function MobileLeadForm() {
  const [form, setForm] = useState(initial)
  const [photos, setPhotos] = useState<File[]>([])
  const [result, setResult] = useState<string | null>(null)
  const upload = useServerFn(uploadLeadImage)
  const save = useServerFn(createLead)
  const queryClient = useQueryClient()
  const urgent = isEmergencyLead(form)
  const amount = Number(form.price_euro.replace(',', '.'))
  const missing = [form.customer_name.trim().length < 2 && 'naam (min. 2 tekens)', form.customer_phone.trim().length < 6 && 'telefoonnummer', form.job_type.trim().length < 2 && 'soort klus', (!form.price_euro.trim() || !Number.isFinite(amount) || amount < 0 || amount > 1000) && 'geldige leadprijs'].filter(Boolean)
  const create = useMutation({
    mutationFn: async (dispatch: boolean) => save({ data: {
      customer_name: form.customer_name.trim(), customer_phone: form.customer_phone.trim(),
      customer_email: form.customer_email.trim() || null, postal_code: form.postal_code.trim() || null,
      city: form.city.trim() || null, address: form.address.trim() || null,
      job_type: form.job_type.trim(), description: form.description.trim() || null,
      price_cents: Math.round(amount * 100), is_urgent: urgent, dispatch,
      image_urls: await uploadLeadPhotos(photos, upload),
    } }),
    onSuccess: (data, dispatch) => {
      const message = dispatch && !data.dispatched ? 'Lead opgeslagen, maar Telegram is niet bereikt. Stuur de lead opnieuw vanuit het overzicht.' : dispatch ? 'Lead opgeslagen en verstuurd naar Telegram.' : 'Lead opgeslagen als concept.'
      setResult(message)
      if (dispatch && !data.dispatched) toast.warning(message); else toast.success(message)
      setForm(initial); setPhotos([])
      queryClient.invalidateQueries({ queryKey: ['admin', 'leads'] })
    },
    onError: () => toast.error('Opslaan mislukt. Je invoer blijft staan; probeer opnieuw.'),
  })
  function set(key: keyof typeof initial, value: string | boolean) { setResult(null); setForm((old) => ({ ...old, [key]: value })) }
  return <section aria-labelledby="new-lead-title">
    <h2 id="new-lead-title" className="mb-4 text-xl font-semibold">Nieuwe lead invoeren</h2>
    {result && <p role="status" className="mb-4 rounded-md border border-border bg-secondary p-4 text-sm">{result}</p>}
    <form onSubmit={(event) => { event.preventDefault(); if (!missing.length && !create.isPending) create.mutate(true) }}>
      <fieldset disabled={create.isPending} className="grid min-w-0 gap-5 sm:grid-cols-2">
        <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-background p-3 sm:col-span-2">
          <div><span className="flex items-center gap-2 font-semibold"><Zap className={urgent ? 'size-5 text-destructive' : 'size-5 text-muted-foreground'} /> Storing / spoed</span><span className="text-sm text-muted-foreground">Opvolgen na {urgent ? '1 uur' : '24 uur'}</span></div>
          <Button type="button" role="switch" aria-checked={urgent} aria-label="Storing of spoed" variant={urgent ? 'destructive' : 'outline'} onClick={() => { if (urgent) setForm((old) => ({ ...old, is_urgent: false, job_type: isEmergencyLead({ job_type: old.job_type }) ? '' : old.job_type })); else set('is_urgent', true) }}>{urgent ? 'Aan' : 'Uit'}</Button>
        </div>
        <Field label="Telefoon klant" id="lead-phone" type="tel" inputMode="tel" required value={form.customer_phone} onChange={(event) => set('customer_phone', event.target.value)} placeholder="06 1234 5678" minLength={6} autoComplete="off" />
        <Field label="Naam klant" id="lead-name" required value={form.customer_name} onChange={(event) => set('customer_name', event.target.value)} placeholder="Naam van de klant" minLength={2} autoComplete="off" />
        <div className="space-y-2 sm:col-span-2"><Label htmlFor="lead-job">Soort klus *</Label><Input id="lead-job" list="lead-jobs" required minLength={2} placeholder="Kies of typ een klus" value={form.job_type} onChange={(event) => set('job_type', event.target.value)} /><datalist id="lead-jobs">{jobs.map((job) => <option key={job} value={job} />)}</datalist></div>
        <Field label="Postcode" id="lead-postcode" value={form.postal_code} onChange={(event) => set('postal_code', event.target.value.toUpperCase())} autoComplete="off" />
        <Field label="Plaats" id="lead-city" value={form.city} onChange={(event) => set('city', event.target.value)} autoComplete="off" />
        <div className="sm:col-span-2"><Field label="Straat en huisnummer" id="lead-address" value={form.address} onChange={(event) => set('address', event.target.value)} autoComplete="off" /></div>
        <div className="space-y-2 sm:col-span-2"><Label htmlFor="lead-description">Omschrijving / notities</Label><Textarea id="lead-description" rows={3} value={form.description} onChange={(event) => set('description', event.target.value)} /></div>
        <div className="sm:col-span-2"><LeadPhotoPicker photos={photos} onChange={setPhotos} disabled={create.isPending} /></div>
        <details className="border-y border-border py-3 sm:col-span-2"><summary className="min-h-8 cursor-pointer font-medium">E-mail en leadprijs · €{Number.isFinite(amount) ? amount.toLocaleString('nl-NL') : '—'} ex. btw</summary><div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="E-mail" id="lead-email" type="email" value={form.customer_email} onChange={(event) => set('customer_email', event.target.value)} autoComplete="off" /><Field label="Leadprijs (€ ex. btw)" id="lead-price" inputMode="decimal" value={form.price_euro} onChange={(event) => set('price_euro', event.target.value)} /></div></details>
      </fieldset>
      <div className="sticky bottom-0 z-20 -mx-4 mt-4 border-t border-border bg-background px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:static sm:mx-0 sm:px-0">
        {missing.length > 0 && <p className="mb-2 text-sm text-muted-foreground">Nog nodig: {missing.join(', ')}.</p>}
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <Button type="submit" className="min-h-12 h-auto whitespace-normal py-3" disabled={missing.length > 0 || create.isPending}><Send className="size-4 shrink-0" />{create.isPending ? 'Opslaan…' : 'Opslaan + naar Telegram'}</Button>
          <Button type="button" variant="outline" className="min-h-12" title="Opslaan als concept" aria-label="Opslaan als concept" disabled={missing.length > 0 || create.isPending} onClick={() => create.mutate(false)}><Save className="size-5" /><span className="hidden sm:inline">Concept</span></Button>
        </div>
      </div>
    </form>
  </section>
}

function Field({ label, ...props }: ComponentProps<typeof Input> & { label: string }) {
  return <div className="space-y-2"><Label htmlFor={props.id}>{label}{props.required ? ' *' : ''}</Label><Input {...props} /></div>
}