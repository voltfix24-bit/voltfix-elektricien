import { Link, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'

const LINKS = [
  { to: '/admin/leads', label: '📥 Leads' },
  { to: '/admin/contractors', label: "👷 ZZP'ers" },
  { to: '/admin/aanmeldingen', label: '📝 Aanmeldingen' },
  { to: '/admin/settings', label: '⚙️ Instellingen' },
] as const

export function AdminNav() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  async function signOut() {
    await queryClient.cancelQueries()
    queryClient.clear()
    await supabase.auth.signOut()
    navigate({ to: '/auth', replace: true })
  }

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
        <span className="font-semibold">VoltFix backoffice</span>
        <nav className="flex flex-wrap gap-3 text-sm">
          {LINKS.map((l) => (
            <Link key={l.to} to={l.to} className="hover:underline [&.active]:font-semibold">
              {l.label}
            </Link>
          ))}
        </nav>
        <Button variant="ghost" size="sm" className="ml-auto" onClick={signOut}>
          Uitloggen
        </Button>
      </div>
    </header>
  )
}

export function euro(cents: number): string {
  return `€${(cents / 100).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
