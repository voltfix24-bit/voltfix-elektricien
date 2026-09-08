import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AVAILABILITY,
  CERTIFICATIONS,
  SPECIALTIES,
  checkInvite,
  submitApplication,
  uploadApplicationDocument,
} from '@/lib/signup.functions'

export const Route = createFileRoute('/aanmelden')({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { token?: string } => ({
    token: typeof search.token === 'string' ? search.token : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Aanmelden als ZZP-elektricien | VoltFix leadnetwerk" },
      {
        name: 'description',
        content:
          "Aanmeldformulier voor zelfstandige elektriciens die leads willen ontvangen via het VoltFix leadnetwerk. Alleen op uitnodiging.",
      },
      { name: 'robots', content: 'noindex, nofollow' },
      { property: 'og:title', content: 'Aanmelden als ZZP-elektricien | VoltFix' },
      { property: 'og:description', content: 'Aanmelden voor het VoltFix leadnetwerk, op uitnodiging.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
    ],
  }),
  component: SignupPage,
})

const empty = {
  company_name: '',
  contact_name: '',
  phone: '',
  email: '',
  kvk_number: '',
  vat_number: '',
  street: '',
  postal_code: '',
  city: '',
  service_areas: '',
  travel_radius_km: '25',
  certification_notes: '',
  insurer: '',
  policy_number: '',
  telegram_username: '',
  notes: '',
}

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

function SignupPage() {
  const { token } = Route.useSearch()
  const [form, setForm] = useState(empty)
  const [specialties, setSpecialties] = useState<string[]>([])
  const [availability, setAvailability] = useState<string[]>([])
  const [certifications, setCertifications] = useState<string[]>([])
  const [emergency, setEmergency] = useState(false)
  const [terms, setTerms] = useState(false)
  const [docs, setDocs] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [done, setDone] = useState(false)

  const inviteQuery = useQuery({
    queryKey: ['invite', token],
    enabled: Boolean(token),
    queryFn: () => checkInvite({ data: { token: token as string } }),
  })

  const submit = useMutation({
    mutationFn: () =>
      submitApplication({
        data: {
          token: token as string,
          company_name: form.company_name.trim(),
          contact_name: form.contact_name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          kvk_number: form.kvk_number.trim(),
          vat_number: form.vat_number.trim(),
          street: form.street.trim(),
          postal_code: form.postal_code.trim(),
          city: form.city.trim(),
          service_areas: form.service_areas
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean),
          travel_radius_km: Number(form.travel_radius_km) || 25,
          specialties,
          availability,
          emergency_available: emergency,
          certifications,
          certification_notes: form.certification_notes.trim(),
          insurer: form.insurer.trim(),
          policy_number: form.policy_number.trim(),
          document_paths: docs,
          telegram_username: form.telegram_username.trim(),
          notes: form.notes.trim(),
          terms_accepted: true as const,
        },
      }),
    onSuccess: () => setDone(true),
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Versturen mislukt.'),
  })

  async function onFiles(files: FileList | null) {
    if (!files || !token) return
    const list = Array.from(files).slice(0, 3 - docs.length)
    setUploading(true)
    try {
      for (const file of list) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is groter dan 5 MB.`)
          continue
        }
        const allowed = ['image/jpeg', 'image/png', 'application/pdf']
        if (!allowed.includes(file.type)) {
          toast.error(`${file.name}: alleen JPG, PNG of PDF.`)
          continue
        }
        const buffer = await file.arrayBuffer()
        let binary = ''
        const bytes = new Uint8Array(buffer)
        for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i])
        const res = await uploadApplicationDocument({
          data: {
            token,
            filename: file.name,
            contentType: file.type as 'image/jpeg' | 'image/png' | 'application/pdf',
            dataBase64: btoa(binary),
          },
        })
        setDocs((prev) => [...prev, res.path])
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Uploaden mislukt.')
    } finally {
      setUploading(false)
    }
  }

  if (!token) {
    return (
      <Shell>
        <p className="text-muted-foreground">
          Deze pagina is alleen bereikbaar via een persoonlijke uitnodigingslink van VoltFix.
        </p>
      </Shell>
    )
  }

  if (inviteQuery.isLoading) {
    return (
      <Shell>
        <p className="text-muted-foreground">Uitnodiging controleren…</p>
      </Shell>
    )
  }

  if (!inviteQuery.data?.valid) {
    const reason = inviteQuery.data?.reason
    return (
      <Shell>
        <p className="text-muted-foreground">
          {reason === 'used'
            ? 'Deze uitnodiging is al gebruikt.'
            : reason === 'expired'
              ? 'Deze uitnodiging is verlopen. Vraag een nieuwe link aan bij VoltFix.'
              : 'Deze uitnodigingslink is niet geldig.'}
        </p>
      </Shell>
    )
  }

  if (done) {
    return (
      <Shell>
        <h1 className="text-2xl font-semibold">Bedankt voor je aanmelding</h1>
        <p className="mt-3 text-muted-foreground">
          We nemen je gegevens door en nemen zo snel mogelijk contact met je op. Daarna krijg je
          toegang tot de Telegram-groep met leads.
        </p>
      </Shell>
    )
  }

  const canSubmit =
    terms &&
    form.company_name.trim().length > 1 &&
    form.contact_name.trim().length > 1 &&
    form.phone.trim().length > 5 &&
    /.+@.+\..+/.test(form.email) &&
    form.kvk_number.trim().length > 5

  return (
    <Shell>
      <h1 className="text-2xl font-semibold">Aanmelden voor het VoltFix leadnetwerk</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Vul je gegevens in. Alle leadprijzen en tegoeden zijn zakelijk en exclusief 21% btw.
      </p>

      <form
        className="mt-6 space-y-6"
        onSubmit={(e) => {
          e.preventDefault()
          if (canSubmit) submit.mutate()
        }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bedrijfsgegevens</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Bedrijfsnaam *">
              <Input
                value={form.company_name}
                onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                required
              />
            </Field>
            <Field label="Contactpersoon *">
              <Input
                value={form.contact_name}
                onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                required
              />
            </Field>
            <Field label="Telefoon *">
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
            </Field>
            <Field label="E-mail *">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </Field>
            <Field label="KvK-nummer *">
              <Input
                value={form.kvk_number}
                onChange={(e) => setForm({ ...form, kvk_number: e.target.value })}
                required
              />
            </Field>
            <Field label="Btw-nummer">
              <Input
                value={form.vat_number}
                onChange={(e) => setForm({ ...form, vat_number: e.target.value })}
                placeholder="NL001234567B01"
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Adres en werkgebied</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Straat + huisnummer">
              <Input
                value={form.street}
                onChange={(e) => setForm({ ...form, street: e.target.value })}
              />
            </Field>
            <Field label="Postcode">
              <Input
                value={form.postal_code}
                onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
              />
            </Field>
            <Field label="Plaats">
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </Field>
            <Field label="Werkgebied (plaatsen, komma-gescheiden)">
              <Input
                value={form.service_areas}
                onChange={(e) => setForm({ ...form, service_areas: e.target.value })}
                placeholder="Amsterdam, Amstelveen, Diemen"
              />
            </Field>
            <Field label="Maximale straal (km)">
              <Input
                type="number"
                min={1}
                max={200}
                value={form.travel_radius_km}
                onChange={(e) => setForm({ ...form, travel_radius_km: e.target.value })}
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Specialismen en beschikbaarheid</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CheckGroup
              options={SPECIALTIES as unknown as string[]}
              selected={specialties}
              onToggle={(v) => setSpecialties((s) => toggle(s, v))}
            />
            <div className="pt-2">
              <p className="mb-2 text-sm font-medium">Beschikbaarheid</p>
              <CheckGroup
                options={AVAILABILITY as unknown as string[]}
                selected={availability}
                onToggle={(v) => setAvailability((s) => toggle(s, v))}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={emergency} onCheckedChange={(v) => setEmergency(Boolean(v))} />
              Beschikbaar voor spoedklussen
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Certificeringen en verzekering</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CheckGroup
              options={CERTIFICATIONS as unknown as string[]}
              selected={certifications}
              onToggle={(v) => setCertifications((s) => toggle(s, v))}
            />
            <Field label="Toelichting certificeringen">
              <Textarea
                rows={2}
                value={form.certification_notes}
                onChange={(e) => setForm({ ...form, certification_notes: e.target.value })}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Verzekeraar (aansprakelijkheid)">
                <Input
                  value={form.insurer}
                  onChange={(e) => setForm({ ...form, insurer: e.target.value })}
                />
              </Field>
              <Field label="Polisnummer">
                <Input
                  value={form.policy_number}
                  onChange={(e) => setForm({ ...form, policy_number: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Bewijsstukken (KvK-uittreksel, certificaten, polis — max. 3 bestanden, 5 MB)">
              <Input
                type="file"
                multiple
                accept="image/jpeg,image/png,application/pdf"
                disabled={uploading || docs.length >= 3}
                onChange={(e) => onFiles(e.target.files)}
              />
            </Field>
            {docs.length > 0 && (
              <p className="text-sm text-muted-foreground">{docs.length} bestand(en) geüpload.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Telegram en akkoord</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Telegram-gebruikersnaam">
              <Input
                value={form.telegram_username}
                onChange={(e) => setForm({ ...form, telegram_username: e.target.value })}
                placeholder="@jouwnaam"
              />
            </Field>
            <Field label="Opmerkingen">
              <Textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </Field>
            <label className="flex items-start gap-2 text-sm">
              <Checkbox
                className="mt-1"
                checked={terms}
                onCheckedChange={(v) => setTerms(Boolean(v))}
              />
              <span>
                Ik ga akkoord met de voorwaarden van het VoltFix leadnetwerk: leads worden vooraf
                betaald uit mijn tegoed, alle bedragen zijn exclusief 21% btw, geclaimde leads worden
                niet gerestitueerd, en mijn gegevens worden verwerkt volgens het privacybeleid.
              </span>
            </label>
          </CardContent>
        </Card>

        <Button type="submit" disabled={!canSubmit || submit.isPending || uploading}>
          {submit.isPending ? 'Versturen…' : 'Aanmelding versturen'}
        </Button>
      </form>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-3xl px-4 py-10">{children}</div>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  )
}

function CheckGroup({
  options,
  selected,
  onToggle,
}: {
  options: string[]
  selected: string[]
  onToggle: (value: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = selected.includes(option)
        return (
          <button
            key={option}
            type="button"
            onClick={() => onToggle(option)}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${
              active
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background hover:bg-muted'
            }`}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}
