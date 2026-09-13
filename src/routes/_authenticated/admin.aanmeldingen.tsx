import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

import { AdminShell } from '@/components/admin/admin-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { actionError, EmptyState, ListError, ROW_BORDER, ROW_PADDING } from '@/components/admin/list-ui'
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

/** Een aanmelding die langer dan 48 uur wacht, vraagt aandacht. */
const LONG_WAIT_MS = 48 * 60 * 60 * 1000
function waitsLong(app: any) {
  return app.status === 'new' && Date.now() - Date.parse(app.created_at) > LONG_WAIT_MS
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
    onError: () => actionError('Link niet aangemaakt.'),
  })

  const decide = useMutation({
    mutationFn: (vars: { applicationId: string; decision: 'approved' | 'rejected' }) =>
      decideApplication({ data: vars }),
    onSuccess: (_d, vars) => {
      toast.success(vars.decision === 'approved' ? "ZZP'er aangemaakt." : 'Aanmelding afgewezen.')
      queryClient.invalidateQueries({ queryKey: ['admin', 'applications'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'contractors'] })
    },
    onError: () => actionError('Beslissing niet opgeslagen.'),
  })

  async function openDocs(paths: string[]) {
    const { urls } = await getApplicationDocumentUrls({ data: { paths } })
    urls.forEach((url) => window.open(url, '_blank', 'noopener'))
  }

  return (
    <AdminShell title="Aanmeldingen" context="Uitnodigingen versturen en binnengekomen aanmeldingen beoordelen.">
      <div className="space-y-6">
        <section aria-labelledby="invite-title" className="rounded-xl border border-border bg-card">
          <h2 id="invite-title" className="border-b border-border px-4 py-3 text-[11.5px] font-bold uppercase tracking-[0.04em] text-muted-foreground">
            Nieuwe uitnodiging
          </h2>
          <div className="grid gap-4 p-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-sm">E-mail (optioneel)</Label>
              <Input className="text-base" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Notitie (optioneel)</Label>
              <Input className="text-base" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button className="min-h-11" onClick={() => invite.mutate()} disabled={invite.isPending}>
                Link aanmaken en kopiëren
              </Button>
            </div>
          </div>
        </section>

        <section aria-labelledby="invites-title" className="rounded-xl border border-border bg-card">
          <h2 id="invites-title" className="border-b border-border px-4 py-3 text-[11.5px] font-bold uppercase tracking-[0.04em] text-muted-foreground">
            Openstaande uitnodigingen
          </h2>
          {invitesQuery.isLoading && <p role="status" className="px-4 py-6">Laden…</p>}
          {invitesQuery.error && (
            <div className="p-4">
              <ListError title="Kon uitnodigingen niet laden" onRetry={() => invitesQuery.refetch()} />
            </div>
          )}
          {!invitesQuery.isLoading && !invitesQuery.error && !invitesQuery.data?.length && (
            <EmptyState title="Niets te doen" description="Geen openstaande uitnodigingen." />
          )}
          {Boolean(invitesQuery.data?.length) && (
            <ul className="divide-y divide-border">
              {invitesQuery.data!.map((row: any) => (
                <li key={row.id} className={`flex flex-wrap items-center gap-2 border-l-[3px] ${ROW_BORDER.none} ${ROW_PADDING} text-sm`}>
                  <span className="min-w-0 break-words text-[14.5px] font-bold">{row.email || row.note || '—'}</span>
                  <Badge variant={row.used_at ? 'secondary' : 'default'}>
                    {row.used_at ? 'Gebruikt' : 'Open'}
                  </Badge>
                  <span className="text-[13px] tabular-nums text-muted-foreground">
                    geldig t/m {new Date(row.expires_at).toLocaleDateString('nl-NL')}
                  </span>
                  {!row.used_at && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto min-h-11"
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
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="apps-title" className="rounded-xl border border-border bg-card">
          <h2 id="apps-title" className="border-b border-border px-4 py-3 text-[11.5px] font-bold uppercase tracking-[0.04em] text-muted-foreground">
            Aanmeldingen
          </h2>
          {appsQuery.isLoading && <p role="status" className="px-4 py-6">Laden…</p>}
          {appsQuery.error && (
            <div className="p-4">
              <ListError title="Kon aanmeldingen niet laden" onRetry={() => appsQuery.refetch()} />
            </div>
          )}
          {!appsQuery.isLoading && !appsQuery.error && !appsQuery.data?.length && (
            <EmptyState title="Niets te doen" description="Er wachten geen aanmeldingen op beoordeling." />
          )}
          {Boolean(appsQuery.data?.length) && (
            <ul className="divide-y divide-border">
              {appsQuery.data!.map((app: any) => {
                const urgent = waitsLong(app)
                return (
                  <li key={app.id} className={`border-l-[3px] ${urgent ? ROW_BORDER.warning : ROW_BORDER.none}`}>
                    <div className={ROW_PADDING}>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="min-w-0 break-words text-[14.5px] font-bold">{app.company_name}</span>
                        <Badge variant={app.status === 'new' ? 'default' : 'secondary'}>
                          {statusLabels[app.status] ?? app.status}
                        </Badge>
                      </div>
                      <p className="mt-1 text-[13px] tabular-nums text-muted-foreground">
                        {app.contact_name} · {app.phone} · {new Date(app.created_at).toLocaleString('nl-NL')}
                      </p>
                      {urgent && (
                        <p className="mt-1 text-[11.5px] font-bold tabular-nums text-warning">
                          Wacht langer dan 48 uur op beoordeling
                        </p>
                      )}
                      <div className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
                        <span>{app.email}</span>
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
                      <p className="mt-2 text-[11.5px] text-muted-foreground">
                        Akkoord met voorwaarden op{' '}
                        {app.terms_accepted_at
                          ? new Date(app.terms_accepted_at).toLocaleString('nl-NL')
                          : '—'}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {app.document_paths?.length > 0 && (
                          <Button variant="outline" size="sm" className="min-h-11" onClick={() => openDocs(app.document_paths)}>
                            Bewijsstukken openen ({app.document_paths.length})
                          </Button>
                        )}
                        {app.status === 'new' && (
                          <>
                            <Button
                              size="sm"
                              className="min-h-11"
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
                              className="min-h-11"
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
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </AdminShell>
  )
}
