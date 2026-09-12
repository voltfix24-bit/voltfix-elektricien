import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

import { AdminShell } from '@/components/admin/admin-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  createInvite,
  decideApplication,
  getApplicationDocumentUrls,
  listApplications,
  listInvites,
} from '@/lib/admin.functions'

export const Route = createFileRoute('/_authenticated/admin/aanmeldingen')({
  head: () => ({
    meta: [
      { title: 'ZZP-aanmeldingen | VoltFix backoffice' },
      { name: 'description', content: 'Uitnodigingen versturen en aanmeldingen van ZZP-elektriciens beoordelen.' },
      { name: 'robots', content: 'noindex, nofollow' },
      { property: 'og:title', content: 'ZZP-aanmeldingen | VoltFix backoffice' },
      { property: 'og:description', content: 'Beoordeel aanmeldingen van ZZP-elektriciens.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
    ],
  }),
  component: ApplicationsPage,
})

const statusLabels: Record<string, string> = {
  new: 'Nieuw',
  approved: 'Goedgekeurd',
  rejected: 'Afgewezen',
}

function ApplicationsPage() {
  const queryClient = useQueryClient()
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')

  const invitesQuery = useQuery({ queryKey: ['admin', 'invites'], queryFn: () => listInvites() })
  const appsQuery = useQuery({ queryKey: ['admin', 'applications'], queryFn: () => listApplications() })

  const invite = useMutation({
    mutationFn: () =>
      createInvite({ data: { email: email.trim(), note: note.trim(), days: 30 } }),
    onSuccess: async (created: any) => {
      const url = `${window.location.origin}/aanmelden?token=${created.token}`
      await navigator.clipboard.writeText(url).catch(() => {})
      toast.success('Uitnodigingslink gekopieerd naar je klembord.')
      setEmail('')
      setNote('')
      queryClient.invalidateQueries({ queryKey: ['admin', 'invites'] })
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Aanmaken mislukt.'),
  })

  const decide = useMutation({
    mutationFn: (vars: { applicationId: string; decision: 'approved' | 'rejected' }) =>
      decideApplication({ data: vars }),
    onSuccess: (_d, vars) => {
      toast.success(vars.decision === 'approved' ? "ZZP'er aangemaakt." : 'Aanmelding afgewezen.')
      queryClient.invalidateQueries({ queryKey: ['admin', 'applications'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'contractors'] })
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Mislukt.'),
  })

  async function openDocs(paths: string[]) {
    const { urls } = await getApplicationDocumentUrls({ data: { paths } })
    urls.forEach((url) => window.open(url, '_blank', 'noopener'))
  }

  return (
    <AdminShell title="Aanmeldingen" context="Uitnodigingen versturen en binnengekomen aanmeldingen beoordelen.">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nieuwe uitnodiging</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-sm">E-mail (optioneel)</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Notitie (optioneel)</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button onClick={() => invite.mutate()} disabled={invite.isPending}>
                Link aanmaken en kopiëren
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Openstaande uitnodigingen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {invitesQuery.data?.length ? (
              invitesQuery.data.map((row: any) => (
                <div key={row.id} className="flex flex-wrap items-center gap-2 border-b py-2 last:border-0">
                  <Badge variant={row.used_at ? 'secondary' : 'default'}>
                    {row.used_at ? 'Gebruikt' : 'Open'}
                  </Badge>
                  <span>{row.email || row.note || '—'}</span>
                  <span className="text-muted-foreground">
                    geldig t/m {new Date(row.expires_at).toLocaleDateString('nl-NL')}
                  </span>
                  {!row.used_at && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto"
                      onClick={() => {
                        navigator.clipboard
                          .writeText(`${window.location.origin}/aanmelden?token=${row.token}`)
                          .then(() => toast.success('Link gekopieerd.'))
                          .catch(() => {})
                      }}
                    >
                      Link kopiëren
                    </Button>
                  )}
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">Nog geen uitnodigingen.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aanmeldingen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {appsQuery.data?.length ? (
              appsQuery.data.map((app: any) => (
                <div key={app.id} className="rounded-lg border bg-background p-4 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong>{app.company_name}</strong>
                    <Badge variant={app.status === 'new' ? 'default' : 'secondary'}>
                      {statusLabels[app.status] ?? app.status}
                    </Badge>
                    <span className="text-muted-foreground">
                      {new Date(app.created_at).toLocaleString('nl-NL')}
                    </span>
                  </div>
                  <div className="mt-2 grid gap-1 sm:grid-cols-2">
                    <span>
                      {app.contact_name} · {app.phone} · {app.email}
                    </span>
                    <span>
                      KvK {app.kvk_number}
                      {app.vat_number ? ` · Btw ${app.vat_number}` : ''}
                      {app.iban ? ` · IBAN ${app.iban}` : ''}
                      {app.invoice_email ? ` · Factuur-e-mail ${app.invoice_email}` : ''}
                    </span>
                    <span>
                      Werkgebied: {app.service_areas?.join(', ') || '—'} ({app.travel_radius_km} km)
                    </span>
                    <span>Specialismen: {app.specialties?.join(', ') || '—'}</span>
                    <span>Beschikbaar: {app.availability?.join(', ') || '—'}{app.emergency_available ? ' · spoed' : ''}</span>
                    <span>Certificeringen: {app.certifications?.join(', ') || '—'}</span>
                    <span>
                      Verzekering: {[app.insurer, app.policy_number].filter(Boolean).join(' — ') || '—'}
                    </span>
                    <span>
                      Telegram: {app.telegram_username || '—'}
                      {app.telegram_user_id ? ` · ID ${app.telegram_user_id}` : ''}
                    </span>
                  </div>
                  {app.notes && <p className="mt-2 text-muted-foreground">{app.notes}</p>}
                  <p className="mt-2 t-meta text-muted-foreground">
                    Akkoord met voorwaarden op{' '}
                    {app.terms_accepted_at
                      ? new Date(app.terms_accepted_at).toLocaleString('nl-NL')
                      : '—'}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {app.document_paths?.length > 0 && (
                      <Button variant="outline" size="sm" onClick={() => openDocs(app.document_paths)}>
                        Bewijsstukken openen ({app.document_paths.length})
                      </Button>
                    )}
                    {app.status === 'new' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() =>
                            decide.mutate({ applicationId: app.id, decision: 'approved' })
                          }
                          disabled={decide.isPending}
                        >
                          Goedkeuren en toevoegen
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            decide.mutate({ applicationId: app.id, decision: 'rejected' })
                          }
                          disabled={decide.isPending}
                        >
                          Afwijzen
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">Nog geen aanmeldingen.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  )
}
