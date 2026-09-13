import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const Route = createFileRoute('/auth')({
  head: () => ({
    meta: [
      { title: 'Inloggen | VoltFix backoffice' },
      { name: 'description', content: 'Inloggen op de besloten VoltFix backoffice.' },
      { name: 'robots', content: 'noindex, nofollow' },
      { property: 'og:title', content: 'Inloggen | VoltFix backoffice' },
      { property: 'og:description', content: 'Inloggen op de besloten VoltFix backoffice.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-title', content: 'VoltFix Leads' },
    ],
    links: [{ rel: 'manifest', href: '/admin.webmanifest' }],
  }),
  component: AuthPage,
})

function AuthPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: '/admin/vandaag', replace: true })
    })
  }, [navigate])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      navigate({ to: '/admin/vandaag', replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Inloggen mislukt.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="admin-mobile min-h-dvh flex items-center justify-center px-4 py-16 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Inloggen backoffice</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mailadres</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Wachtwoord</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? 'Bezig…' : 'Inloggen'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Alleen op uitnodiging. Geen toegang? Neem contact op met VoltFix.
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
