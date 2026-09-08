// Snelle invoer van een WhatsApp-gesprek als lead: in één venster invullen,
// direct opslaan én naar de Telegram-groep sturen (inclusief foto's).

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
import { createLead, getLeadSettings, uploadLeadImage } from '@/lib/admin.functions'

const PRESETS = [
  'Stroomuitval',
  'Groepenkast uitgevallen',
  'Kortsluiting',
  'Perilex / kookaansluiting',
  'Storing zoeken',
]

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']

const empty = {
  city: '',
  jobType: '',
  phone: '',
  name: '',
  address: '',
  price: '10',
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
      return createLead({
        data: {
          customer_name: form.name.trim() || 'WhatsApp-klant',
          customer_phone: form.phone.trim(),
          customer_email: null,
          postal_code: null,
          address: form.address.trim() || null,
          city: form.city.trim(),
          job_type: form.jobType.trim(),
          description: form.jobType.trim(),
          price_cents: Math.round(Number(form.price.replace(',', '.')) * 100),
          dispatch: true,
          source: 'whatsapp_manual',
          image_urls: paths,
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
    form.city.trim().length > 1 &&
    form.jobType.trim().length > 1 &&
    form.phone.trim().length > 5 &&
    Number(form.price.replace(',', '.')) >= 0

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
            <Label htmlFor="q-city">Woonplaats / regio *</Label>
            <Input
              id="q-city"
              autoFocus
              placeholder="Amsterdam West"
              value={form.city}
              onChange={(e) => set('city', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="q-job">Type klus / omschrijving *</Label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <Button
                  key={p}
                  type="button"
                  size="sm"
                  variant={form.jobType === p ? 'default' : 'outline'}
                  onClick={() => set('jobType', p)}
                >
                  {p}
                </Button>
              ))}
            </div>
            <Textarea
              id="q-job"
              rows={2}
              placeholder="Bijv. stroom uitgevallen in hele woning"
              value={form.jobType}
              onChange={(e) => set('jobType', e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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
            <div className="space-y-2">
              <Label htmlFor="q-address">Straat + huisnummer</Label>
              <Input id="q-address" value={form.address} onChange={(e) => set('address', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="q-price">Leadprijs (€) *</Label>
              <Input id="q-price" inputMode="decimal" value={form.price} onChange={(e) => set('price', e.target.value)} />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="q-photos">Foto's uit WhatsApp (optioneel)</Label>
            <Input
              id="q-photos"
              type="file"
              accept="image/jpeg,image/png"
              multiple
              onChange={(e) => pickPhotos(Array.from(e.target.files ?? []))}
            />
            <p className="text-xs text-muted-foreground">Max 3 foto's · JPG of PNG · 5 MB per foto</p>
            {photos.length > 0 && (
              <p className="text-xs">{photos.map((p) => p.name).join(', ')}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={!canSubmit || submit.isPending} className="w-full">
              {submit.isPending ? 'Bezig…' : '⚡ Versturen naar Telegram'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
