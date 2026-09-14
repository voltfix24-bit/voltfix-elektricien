import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated')({
  ssr: false,
  beforeLoad: async ({ location }) => {
    // Dynamische import: de inlogbibliotheek hoort alleen bij de beveiligde
    // pagina's, niet in het gedeelde bestand van de hele website.
    const { supabase } = await import('@/integrations/supabase/client')
    const { data, error } = await supabase.auth.getUser()
    // Bestemming meenemen: de link uit het botbericht moet na inloggen
    // gewoon de bedoelde lead openen, niet een lege lijst.
    if (error || !data.user) throw redirect({ to: '/auth', search: { terug: location.href } })
    return { user: data.user }
  },
  component: () => <Outlet />,
})
