import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Inbox, HardHat, ClipboardList, Settings, LogOut, Star, Search } from 'lucide-react'
import { listLeads } from '@/lib/admin.functions'
import { isEmergencyLead, isLeadOverdue } from '@/lib/lead-overdue'

type NavItem = { to: string; label: string; short: string; icon: typeof Inbox; alertKey?: 'leads' }

/** Eén bron voor alle drie de navigatievormen (onderbalk, rail, zijbalk). */
const LINKS: NavItem[] = [
  { to: '/admin/leads', label: 'Leads', short: 'Leads', icon: Inbox, alertKey: 'leads' },
  { to: '/admin/contractors', label: "ZZP'ers", short: "ZZP'ers", icon: HardHat },
  { to: '/admin/reviews', label: 'Reviews', short: 'Reviews', icon: Star },
  { to: '/admin/aanmeldingen', label: 'Aanmeldingen', short: 'Aanvragen', icon: ClipboardList },
  { to: '/admin/settings', label: 'Instellingen', short: 'Meer', icon: Settings },
]

/** Telling van spoed- of te-late leads; puur lezen, geen serverwijziging. */
function useAlertCount() {
  const fetchLeads = useServerFn(listLeads)
  const query = useQuery({
    queryKey: ['admin', 'nav-alerts'],
    queryFn: () => fetchLeads({ data: { status: 'open', search: '', cursor: null, limit: 50 } }),
    refetchInterval: 120_000,
    staleTime: 60_000,
  })
  const rows = (query.data?.rows ?? []) as any[]
  const now = Date.now()
  return rows.filter((lead) => isLeadOverdue(lead, now) || isEmergencyLead(lead)).length
}

function AlertCount({ count }: { count: number }) {
  if (!count) return null
  return (
    <span
      className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[11px] font-semibold leading-5 text-destructive-foreground"
      aria-label={`${count} leads met spoed of te laat`}
    >
      {count}
    </span>
  )
}

function useSignOut() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  return async function signOut() {
    await queryClient.cancelQueries()
    queryClient.clear()
    await supabase.auth.signOut()
    navigate({ to: '/auth', replace: true })
  }
}

export function AdminShell({ title, context, actions, children }: { title: string; context?: string; actions?: ReactNode; children: ReactNode }) {
  const navigate = useNavigate()
  const signOut = useSignOut()
  const alerts = useAlertCount()
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="admin-mobile min-h-dvh bg-background md:flex">
      {/* Tablet: rail met alleen iconen. Desktop: zijbalk met labels. */}
      <aside className="sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-border bg-surface-muted md:flex md:w-[66px] xl:w-[216px]">
        <Link to="/admin/leads" className="flex min-h-14 items-center gap-2 px-3 font-semibold xl:px-4" aria-label="VoltFix backoffice">
          <img src="/favicon.svg" alt="" className="size-8 shrink-0" />
          <span className="hidden truncate xl:inline">Backoffice</span>
        </Link>
        <nav aria-label="Beheer" className="flex flex-1 flex-col gap-1 p-2">
          {LINKS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              aria-label={item.label}
              title={item.label}
              className="flex min-h-12 items-center gap-3 rounded-md px-3 text-sm hover:bg-muted [&.active]:bg-secondary [&.active]:font-semibold [&.active]:text-primary xl:px-3"
            >
              <item.icon className="size-5 shrink-0" />
              <span className="hidden truncate xl:inline">{item.label}</span>
              {item.alertKey === 'leads' && <span className="hidden xl:contents"><AlertCount count={alerts} /></span>}
            </Link>
          ))}
        </nav>
        <Button variant="ghost" className="m-2 min-h-12 justify-start gap-3 px-3" aria-label="Uitloggen" title="Uitloggen" onClick={signOut}>
          <LogOut className="size-5 shrink-0" />
          <span className="hidden xl:inline">Uitloggen</span>
        </Button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-border bg-background pt-[env(safe-area-inset-top)]">
          <div className="flex items-center gap-3 px-4 py-2 md:px-[22px]">
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-bold md:text-xl">{title}</h1>
              {context && <p className="hidden truncate text-[13px] text-muted-foreground md:block">{context}</p>}
            </div>
            <form
              className="hidden md:block"
              onSubmit={(event) => {
                event.preventDefault()
                navigate({ to: '/admin/leads' })
              }}
            >
              <div className="relative md:w-[300px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input ref={searchRef} type="search" aria-label="Zoeken in de backoffice" placeholder="Zoeken" className="pl-9 pr-12 text-base" />
                <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground">⌘K</kbd>
              </div>
            </form>
            <Button variant="ghost" size="icon" className="min-h-11 min-w-11 md:hidden" aria-label="Zoeken" onClick={() => navigate({ to: '/admin/leads' })}>
              <Search className="size-5" />
            </Button>
            <span aria-hidden className="hidden size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-primary md:flex">V</span>
            {actions}
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-4 pb-[calc(64px+env(safe-area-inset-bottom))] md:p-[22px] md:pb-[22px]">{children}</main>
      </div>

      {/* Mobiel: onderbalk in plaats van de oude topnav. */}
      <nav
        aria-label="Beheer"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {LINKS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            aria-label={item.label}
            className="relative flex h-[52px] flex-col items-center justify-center gap-0.5 text-[11px] hover:bg-muted [&.active]:bg-secondary [&.active]:font-semibold [&.active]:text-primary"
          >
            <item.icon className="size-5" />
            <span className="truncate px-0.5">{item.short}</span>
            {item.alertKey === 'leads' && alerts > 0 && (
              <span className="absolute right-2 top-1 inline-flex min-w-4 justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-4 text-destructive-foreground" aria-hidden>
                {alerts}
              </span>
            )}
          </Link>
        ))}
      </nav>
    </div>
  )
}
