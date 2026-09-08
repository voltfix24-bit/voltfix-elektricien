// Snelle invoer van een WhatsApp-gesprek als lead: dienst kiezen, postcode +
// huisnummer laten opzoeken, foto's slepen en direct naar Telegram sturen.

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { createLead, getLeadSettings, lookupAddress, uploadLeadImage } from '@/lib/admin.functions'

const SERVICES = [
  'Spoed: Stroomuitval/Storing',
  'Groepenkast vervangen/uitbreiden',
  'Verlichting & Wandcontactdozen',
  'Laadpaal installeren',
  'Zonnepanelen / Omvormer',
  'Anders...',
] as const

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']

const PRICE_STATUSES = [
  { value: 'none', label: 'Geen prijsafspraak (offerte/indicatie gewenst)' },
  { value: 'hourly', label: 'Uurtarief afgesproken' },
  { value: 'fixed', label: 'Vaste prijs afgesproken' },
] as const

const empty = {
  service: '' as string,
  customJob: '',
  postcode: '',
  houseNumber: '',
  street: '',
  city: '',
  phone: '',
  name: '',
  notes: '',
  price: '10',
  priceStatus: 'none' as 'none' | 'hourly' | 'fixed',
  agreedPrice: '',
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result)
      resolve(result.slice(result.indexOf(',') + 1))
    }
    reader.onerror = () => reject(new Error('Foto lezen mislukt.'))
    reader.readAsDataURL(file)
  })
}

export function QuickWhatsAppLead() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(empty)
  const [photos, setPhotos] = useState<File[]>([])
  const [dragOver, setDragOver] = useState(false)

  const settings = useQuery({ queryKey: ['admin', 'lead-settings'], queryFn: () => getLeadSettings() })
  const defaultPrice = (settings.data as { default_price_cents?: number } | undefined)?.default_price_cents

  // Prijs voorvullen met het huidige actietarief.
  useEffect(() => {
    if (open && typeof defaultPrice === 'number') {
      setForm((f) => ({ ...f, price: (defaultPrice / 100).toString() }))
    }
  }, [open, defaultPrice])

  function set(key: keyof typeof empty, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const lookup = useMutation({
    mutationFn: (v: { postcode: string; houseNumber: string }) => lookupAddress({ data: v }),
    onSuccess: (r) => setForm((f) => ({ ...f, street: r.street, city: r.city })),
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Adres opzoeken mislukt.'),
  })

  // Automatisch opzoeken zodra postcode en huisnummer compleet zijn.
  useEffect(() => {
    const pc = form.postcode.replace(/\s+/g, '').toUpperCase()
    const nr = form.houseNumber.trim()
    if (!/^[1-9][0-9]{3}[A-Z]{2}$/.test(pc) || nr.length === 0) return
    const timer = setTimeout(() => lookup.mutate({ postcode: pc, houseNumber: nr }), 400)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.postcode, form.houseNumber])

  function pickPhotos(files: File[]) {
    const valid: File[] = []
    for (const f of files.slice(0, 3)) {
      if (!ALLOWED.includes(f.type)) {
        toast.error('Alleen JPG of PNG.')
        continue
      }
      if (f.size > 5 * 1024 * 1024) {
        toast.error(`${f.name} is groter dan 5 MB.`)
        continue
      }
      valid.push(f)
    }
    setPhotos(valid)
  }

  const jobTitle = form.service === 'Anders...' ? form.customJob.trim() : form.service

  const submit = useMutation({
    mutationFn: async () => {
      const paths: string[] = []
      for (const photo of photos) {
        const res = await uploadLeadImage({
          data: {
            filename: photo.name,
            contentType: photo.type as 'image/jpeg' | 'image/png' | 'image/webp',
            dataBase64: await fileToBase64(photo),
          },
        })
        paths.push(res.path)
      }
      const houseNr = form.houseNumber.trim()
      const street = form.street.trim()
      return createLead({
        data: {
          customer_name: form.name.trim() || 'WhatsApp-klant',
          customer_phone: form.phone.trim(),
          customer_email: null,
          postal_code: form.postcode.trim().toUpperCase() || null,
          address: street ? `${street} ${houseNr}`.trim() : houseNr || null,
          city: form.city.trim() || null,
          job_type: jobTitle,
          description: form.notes.trim() || null,
          price_cents: Math.round(Number(form.price.replace(',', '.')) * 100),
          dispatch: true,
          source: 'whatsapp_manual',
          image_urls: paths,
          price_status: form.priceStatus,
          agreed_price_details:
            form.priceStatus === 'none' ? null : form.agreedPrice.trim() || null,
        },
      })
    },
    onSuccess: () => {
      toast.success('Lead succesvol verstuurd naar Telegram!')
      setForm(empty)
      setPhotos([])
      setOpen(false)
      queryClient.invalidateQueries({ queryKey: ['admin', 'leads'] })
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Versturen mislukt.'),
  })

  const canSubmit =
    jobTitle.length > 1 && form.phone.trim().length > 5 && Number(form.price.replace(',', '.')) >= 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg">⚡ Snelle WhatsApp Lead</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Snelle WhatsApp Lead</DialogTitle>
          <DialogDescription>Invullen en direct naar de Telegram-groep sturen.</DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (canSubmit && !submit.isPending) submit.mutate()
          }}
        >
          <div className="space-y-2">
            <Label>Soort klus *</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {SERVICES.map((s) => {
                const active = form.service === s
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set('service', s)}
                    aria-pressed={active}
                    className={`rounded-lg border p-3 text-left text-sm transition ${
                      active
                        ? 'border-primary bg-primary/10 font-medium text-foreground'
                        : 'border-border bg-background hover:border-primary/50'
                    }`}
                  >
                    {s}
                  </button>
                )
              })}
            </div>
            {form.service === 'Anders...' && (
              <Input
                placeholder="Omschrijf de klus"
                value={form.customJob}
                onChange={(e) => set('customJob', e.target.value)}
              />
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="q-pc">Postcode</Label>
              <Input
                id="q-pc"
                placeholder="1012 JS"
                value={form.postcode}
                onChange={(e) => set('postcode', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="q-nr">Huisnummer</Label>
              <Input id="q-nr" value={form.houseNumber} onChange={(e) => set('houseNumber', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="q-street">Straatnaam</Label>
              <Input
                id="q-street"
                placeholder={lookup.isPending ? 'Zoeken…' : ''}
                value={form.street}
                onChange={(e) => set('street', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="q-city">Woonplaats</Label>
              <Input id="q-city" value={form.city} onChange={(e) => set('city', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="q-phone">Telefoonnummer klant *</Label>
              <Input
                id="q-phone"
                type="tel"
                placeholder="06 12 34 56 78"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="q-name">Naam klant</Label>
              <Input id="q-name" value={form.name} onChange={(e) => set('name', e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="q-notes">Notities</Label>
            <Textarea
              id="q-notes"
              rows={2}
              placeholder="Bijv. hele woning zonder stroom sinds vanmiddag"
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="q-photos">Foto's uit WhatsApp</Label>
            <label
              htmlFor="q-photos"
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragOver(false)
                pickPhotos(Array.from(e.dataTransfer.files))
              }}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-4 text-center text-xs ${
                dragOver ? 'border-primary bg-primary/5' : 'border-border'
              }`}
            >
              <span>Sleep foto's hierheen of klik om te kiezen</span>
              <span className="text-muted-foreground">Max 3 foto's · JPG of PNG · 5 MB per foto</span>
            </label>
            <input
              id="q-photos"
              type="file"
              accept="image/jpeg,image/png"
              multiple
              className="sr-only"
              onChange={(e) => pickPhotos(Array.from(e.target.files ?? []))}
            />
            {photos.length > 0 && <p className="text-xs">{photos.map((p) => p.name).join(', ')}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="q-price">Leadprijs (€)</Label>
            <Input id="q-price" inputMode="decimal" value={form.price} onChange={(e) => set('price', e.target.value)} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={!canSubmit || submit.isPending} className="w-full">
              {submit.isPending ? 'Bezig…' : '⚡ Verstuur direct naar Telegram'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
