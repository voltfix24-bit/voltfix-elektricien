import { createFileRoute } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { submitOnboarding } from '@/lib/signup.functions'

export const Route = createFileRoute('/onboarding')({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { telegram_id?: string | number } => ({
    telegram_id:
      typeof search.telegram_id === 'string' || typeof search.telegram_id === 'number'
        ? search.telegram_id
        : undefined,
  }),
  head: () => ({
    meta: [
      { title: 'Registreren als monteur | VoltFix leadnetwerk' },
      {
        name: 'description',
        content:
          'Registreer je als zelfstandige elektricien voor het VoltFix leadnetwerk en ontvang na goedkeuring €50 welkomstkrediet.',
      },
      { name: 'robots', content: 'noindex, nofollow' },
      { property: 'og:title', content: 'Registreren als monteur | VoltFix' },
      {
        property: 'og:description',
        content: 'Registratie voor het VoltFix leadnetwerk met €50 welkomstkrediet na goedkeuring.',
      },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
    ],
  }),
  component: OnboardingPage,
})

const empty = {
  company_name: '',
  contact_name: '',
  phone: '',
  email: '',
  kvk_number: '',
  service_area: '',
}

function OnboardingPage() {
  const { telegram_id } = Route.useSearch()
  const [form, setForm] = useState(empty)
  const [hp, setHp] = useState('')
  const [done, setDone] = useState(false)

  const set = (key: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const submit = useMutation({
    mutationFn: () =>
      submitOnboarding({
        data: { ...form, telegram_user_id: telegram_id ?? '', hp },
      }),
    onSuccess: () => setDone(true),
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : 'Aanmelden is niet gelukt. Probeer het opnieuw.'),
  })

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.company_name.trim() || !form.contact_name.trim() || !form.phone.trim()) {
      toast.error('Vul bedrijfsnaam, contactpersoon en telefoonnummer in.')
      return
    }
    submit.mutate()
  }

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-10">
      <div className="mx-auto max-w-xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">Registreren als VoltFix-monteur</h1>
          <p className="text-sm text-muted-foreground">
            Vul je gegevens in. Na controle van je KvK-gegevens activeren we je account met €50
            welkomstkrediet.
          </p>
        </header>

        {done ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bedankt! Je aanmelding is ontvangen.</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Zodra we je KvK-gegevens gecontroleerd hebben, wordt je €50 welkomstkrediet geactiveerd
              en krijg je toegang tot de Telegram-groep.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Jouw gegevens</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4" onSubmit={onSubmit}>
                <div className="space-y-1.5">
                  <Label htmlFor="company_name">Bedrijfsnaam *</Label>
                  <Input id="company_name" required value={form.company_name} onChange={set('company_name')} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contact_name">Contactpersoon *</Label>
                  <Input id="contact_name" required value={form.contact_name} onChange={set('contact_name')} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Telefoonnummer *</Label>
                    <Input id="phone" type="tel" required value={form.phone} onChange={set('phone')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">E-mailadres *</Label>
                    <Input id="email" type="email" required value={form.email} onChange={set('email')} />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="kvk_number">KvK-nummer *</Label>
                    <Input id="kvk_number" required value={form.kvk_number} onChange={set('kvk_number')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="service_area">Werkgebied / regio</Label>
                    <Input
                      id="service_area"
                      placeholder="Bijv. Amsterdam en omgeving"
                      value={form.service_area}
                      onChange={set('service_area')}
                    />
                  </div>
                </div>

                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="hidden"
                  value={hp}
                  onChange={(e) => setHp(e.target.value)}
                />

                {telegram_id && (
                  <p className="text-xs text-muted-foreground">
                    Gekoppeld aan Telegram-ID {telegram_id}.
                  </p>
                )}

                <Button type="submit" disabled={submit.isPending}>
                  {submit.isPending ? 'Versturen…' : 'Aanmelding versturen'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}
