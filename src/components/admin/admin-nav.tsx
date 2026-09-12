import { Link, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Inbox, HardHat, ClipboardList, Settings, LogOut, Star } from 'lucide-react'

const LINKS = [
  { to: '/admin/leads', label: 'Leads', shortLabel: 'Leads', icon: Inbox },
  { to: '/admin/contractors', label: "ZZP'ers", shortLabel: "ZZP'ers", icon: HardHat },
  { to: '/admin/reviews', label: 'Reviews', shortLabel: 'Reviews', icon: Star },
  { to: '/admin/aanmeldingen', label: 'Aanmeldingen', shortLabel: 'Aanvragen', icon: ClipboardList },
  { to: '/admin/settings', label: 'Instellingen', shortLabel: 'Instellen', icon: Settings },
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
    <header className="border-b bg-background pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 px-4 py-2">
        <span className="flex items-center gap-2 font-semibold"><img src="/favicon.svg" alt="" className="size-8" />VoltFix backoffice</span>
        <nav aria-label="Beheer" className="order-3 grid w-full grid-cols-5 gap-1 text-xs sm:order-none sm:flex sm:w-auto sm:gap-3 sm:text-sm">
          {LINKS.map((l) => (
            <Link key={l.to} to={l.to} aria-label={l.label} className="flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-md px-1 hover:bg-muted [&.active]:bg-secondary [&.active]:font-semibold [&.active]:text-primary sm:flex-row sm:px-3">
              <l.icon className="size-4" />
              <span className="sm:hidden">{l.shortLabel}</span><span className="hidden sm:inline">{l.label}</span>
            </Link>
          ))}
        </nav>
        <Button variant="ghost" size="icon" className="ml-auto min-h-11 min-w-11" aria-label="Uitloggen" title="Uitloggen" onClick={signOut}>
          <LogOut className="size-4" />
        </Button>
      </div>
    </header>
  )
}

export function euro(cents: number): string {
  return `€${(cents / 100).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
