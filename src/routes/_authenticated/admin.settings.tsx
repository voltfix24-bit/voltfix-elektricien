import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AdminNav } from '@/components/admin/admin-nav'
import { LeadSettingsCard } from '@/components/admin/lead-settings-card'
import { WebhookStatus, publicOrigin } from '@/components/admin/webhook-status'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getTelegramWebhookStatus, registerTelegramWebhook, sendTelegramTest } from '@/lib/admin.functions'

export const Route = createFileRoute('/_authenticated/admin/settings')({
  head: () => ({
    meta: [
      { title: 'Instellingen | VoltFix backoffice' },
      { name: 'description', content: 'Telegram-koppeling, standaard leadprijzen en systeeminstellingen.' },
      { name: 'robots', content: 'noindex, nofollow' },
      { property: 'og:title', content: 'Instellingen | VoltFix backoffice' },
      { property: 'og:description', content: 'Telegram-koppeling en leadprijzen beheren.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
    ],
  }),
  component: SettingsPage,
})

function SettingsPage() {
  const queryClient = useQueryClient()
  const status = useQuery({ queryKey: ['admin', 'webhook'], queryFn: () => getTelegramWebhookStatus() })

  const webhookMut = useMutation({
    mutationFn: () => registerTelegramWebhook({ data: { origin: publicOrigin() } }),
    onSuccess: (r) => {
      toast.success(`Telegram gekoppeld aan ${r.url}`)
      queryClient.invalidateQueries({ queryKey: ['admin', 'webhook'] })
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Koppelen mislukt.'),
  })

  const testMut = useMutation({
    mutationFn: () => sendTelegramTest(),
    onSuccess: () => toast.success('Testbericht verstuurd naar de groep.'),
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Versturen mislukt.'),
  })

  const info = status.data as { live?: boolean; url?: string | null; pending?: number; error?: string | null } | undefined

  return (
    <div className="min-h-screen bg-muted/20">
      <AdminNav />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <h1 className="text-2xl font-bold">Instellingen</h1>

        <Card>
          <CardHeader>
            <CardTitle>Telegram-koppeling</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <WebhookStatus />
            {info?.url && <p className="break-all text-muted-foreground">Endpoint: {info.url}</p>}
            {typeof info?.pending === 'number' && info.pending > 0 && (
              <p className="text-muted-foreground">Wachtende berichten: {info.pending}</p>
            )}
            {info?.error && <p className="text-destructive">Laatste fout: {info.error}</p>}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" disabled={webhookMut.isPending} onClick={() => webhookMut.mutate()}>
                Telegram (opnieuw) koppelen
              </Button>
              <Button size="sm" variant="ghost" disabled={testMut.isPending} onClick={() => testMut.mutate()}>
                Testbericht sturen
              </Button>
            </div>
          </CardContent>
        </Card>

        <LeadSettingsCard />

        <Card>
          <CardHeader>
            <CardTitle>Beheerdersaccounts</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Toegang tot de backoffice is alleen op uitnodiging. Nieuwe beheerders worden handmatig toegevoegd — vraag
            dit aan bij VoltFix.
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
