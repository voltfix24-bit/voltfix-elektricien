import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { AdminNav, euro } from '@/components/admin/admin-nav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { adjustBalance, listContractors, saveContractor } from '@/lib/admin.functions'

export const Route = createFileRoute('/_authenticated/admin/contractors')({
  head: () => ({
    meta: [
      { title: "ZZP'ers en tegoed | VoltFix backoffice" },
      { name: 'description', content: "Beheer aangesloten ZZP'ers, hun Telegram-koppeling en hun tegoed." },
      { name: 'robots', content: 'noindex, nofollow' },
      { property: 'og:title', content: "ZZP'ers en tegoed | VoltFix backoffice" },
      { property: 'og:description', content: "Beheer ZZP'ers en hun tegoed." },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
    ],
  }),
  component: ContractorsPage,
})

const emptyForm = {
  name: '',
  company: '',
  phone: '',
  email: '',
  telegram_user_id: '',
  notes: '',
  is_active: true,
}

function ContractorsPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [topup, setTopup] = useState<Record<string, string>>({})

  const contractorsQuery = useQuery({
    queryKey: ['admin', 'contractors'],
    queryFn: () => listContractors(),
  })

  const save = useMutation({
    mutationFn: () =>
      saveContractor({
        data: {
          ...(editingId ? { id: editingId } : {}),
          name: form.name.trim(),
          company: form.company.trim() || null,
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
          telegram_user_id: form.telegram_user_id.trim() || null,
          notes: form.notes.trim() || null,
          is_active: form.is_active,
        },
      }),
    onSuccess: () => {
      toast.success(editingId ? 'Gegevens bijgewerkt.' : "ZZP'er toegevoegd.")
      setForm(emptyForm)
      setEditingId(null)
      queryClient.invalidateQueries({ queryKey: ['admin', 'contractors'] })
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Opslaan mislukt.'),
  })

  const topupMut = useMutation({
    mutationFn: ({ id, euros }: { id: string; euros: number }) =>
      adjustBalance({
        data: {
          contractorId: id,
          amountCents: Math.round(euros * 100),
          note: euros >= 0 ? 'Opwaardering' : 'Correctie',
        },
      }),
    onSuccess: (_d, vars) => {
      toast.success('Saldo bijgewerkt.')
      setTopup((t) => ({ ...t, [vars.id]: '' }))
      queryClient.invalidateQueries({ queryKey: ['admin', 'contractors'] })
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Bijwerken mislukt.'),
  })

  function set(key: keyof typeof emptyForm, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <AdminNav />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <h1 className="text-2xl font-bold">ZZP'ers &amp; tegoed</h1>

        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "ZZP'er bewerken" : "ZZP'er toevoegen"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4 md:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault()
                save.mutate()
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="name">Naam *</Label>
                <Input id="name" value={form.name} onChange={(e) => set('name', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Bedrijf</Label>
                <Input id="company" value={form.company} onChange={(e) => set('company', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefoon</Label>
                <Input id="phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tg">Telegram-ID (getal)</Label>
                <Input
                  id="tg"
                  value={form.telegram_user_id}
                  onChange={(e) => set('telegram_user_id', e.target.value)}
                  placeholder="bijv. 123456789"
                />
              </div>
              <div className="flex items-center gap-3 pt-8">
                <Switch id="active" checked={form.is_active} onCheckedChange={(v) => set('is_active', v)} />
                <Label htmlFor="active">Actief</Label>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Notitie</Label>
                <Textarea id="notes" rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
              </div>
              <div className="flex gap-3 md:col-span-2">
                <Button type="submit" disabled={save.isPending || form.name.trim().length < 2}>
                  {save.isPending ? 'Bezig…' : editingId ? 'Opslaan' : 'Toevoegen'}
                </Button>
                {editingId && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setEditingId(null)
                      setForm(emptyForm)
                    }}
                  >
                    Annuleren
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Overzicht</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {contractorsQuery.isLoading && <p className="text-sm text-muted-foreground">Laden…</p>}
            {contractorsQuery.error && (
              <p className="text-sm text-destructive">
                {contractorsQuery.error instanceof Error ? contractorsQuery.error.message : 'Laden mislukt.'}
              </p>
            )}
            {contractorsQuery.data && contractorsQuery.data.length === 0 && (
              <p className="text-sm text-muted-foreground">Nog geen ZZP'ers toegevoegd.</p>
            )}
            {contractorsQuery.data && contractorsQuery.data.length > 0 && (
              <table className="w-full min-w-[760px] text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr>
                    <th className="py-2">Naam</th>
                    <th>Telegram-ID</th>
                    <th>Saldo</th>
                    <th>Status</th>
                    <th>Saldo aanpassen (€)</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {contractorsQuery.data.map((c: any) => (
                    <tr key={c.id} className="border-t align-middle">
                      <td className="py-2">
                        <div className="font-medium">{c.name}</div>
                        <div className="text-muted-foreground">{c.company ?? ''}</div>
                      </td>
                      <td>{c.telegram_user_id ?? '—'}</td>
                      <td className="whitespace-nowrap font-medium">{euro(c.balance_cents)}</td>
                      <td>
                        <Badge variant={c.is_active ? 'default' : 'secondary'}>
                          {c.is_active ? 'Actief' : 'Inactief'}
                        </Badge>
                      </td>
                      <td>
                        <div className="flex items-center gap-2 py-2">
                          <Input
                            className="w-24"
                            inputMode="decimal"
                            value={topup[c.id] ?? ''}
                            onChange={(e) => setTopup((t) => ({ ...t, [c.id]: e.target.value }))}
                            placeholder="100"
                          />
                          <Button
                            size="sm"
                            disabled={topupMut.isPending || !topup[c.id]}
                            onClick={() => {
                              const value = Number((topup[c.id] ?? '').replace(',', '.'))
                              if (!Number.isFinite(value) || value === 0) {
                                toast.error('Vul een bedrag in.')
                                return
                              }
                              topupMut.mutate({ id: c.id, euros: value })
                            }}
                          >
                            Bijboeken
                          </Button>
                        </div>
                      </td>
                      <td className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingId(c.id)
                            setForm({
                              name: c.name ?? '',
                              company: c.company ?? '',
                              phone: c.phone ?? '',
                              email: c.email ?? '',
                              telegram_user_id: c.telegram_user_id ? String(c.telegram_user_id) : '',
                              notes: c.notes ?? '',
                              is_active: c.is_active,
                            })
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                          }}
                        >
                          Bewerken
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
