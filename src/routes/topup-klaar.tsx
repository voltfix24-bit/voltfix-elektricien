import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/topup-klaar')({
  head: () => ({
    meta: [
      { title: 'Opwaardering afgerond | VoltFix leadnetwerk' },
      { name: 'description', content: 'Bevestiging van je opwaardering van VoltFix leadtegoed.' },
      { name: 'robots', content: 'noindex, nofollow' },
      { property: 'og:title', content: 'Opwaardering afgerond | VoltFix' },
      { property: 'og:description', content: 'Je VoltFix leadtegoed is opgewaardeerd.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
    ],
  }),
  component: TopupDone,
})

function TopupDone() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-bold">Bedankt voor je betaling</h1>
      <p className="mt-3 text-muted-foreground">
        Zodra de betaling is verwerkt krijg je een bevestiging in je privéchat met de VoltFix
        LeadBot en is je saldo bijgewerkt. Je kunt dit venster sluiten.
      </p>
    </main>
  )
}
