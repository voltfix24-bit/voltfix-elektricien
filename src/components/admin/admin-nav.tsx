import { Link, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'

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
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <span className="font-semibold">VoltFix backoffice</span>
        <nav className="flex gap-3 text-sm">
          <Link to="/admin/leads" className="hover:underline [&.active]:font-semibold">
            Leads
          </Link>
          <Link to="/admin/contractors" className="hover:underline [&.active]:font-semibold">
            ZZP'ers
          </Link>
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
