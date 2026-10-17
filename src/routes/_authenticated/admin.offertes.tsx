import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { AdminShell } from '@/components/admin/admin-shell'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { createQuoteForLead, listQuotes } from '@/lib/quotes.functions'
import { eur } from '@/lib/quotes/engine'

export const Route = createFileRoute('/_authenticated/admin/offertes')({
  head: () => ({ meta: [{ title: 'Offertes — VoltFix backoffice' }, { name: 'robots', content: 'noindex' }] }),
  validateSearch: (s: Record<string, unknown>) => ({ ref: s.ref ? Number(s.ref) : undefined }),
  component: QuotesPage,
})

export const QUOTE_STATUS: Record<string, string> = {
  draft: 'Concept', final: 'Definitief', sent: 'Verstuurd', accepted: 'Geaccepteerd', declined: 'Afgewezen', expired: 'Verlopen', superseded: 'Vervangen',
}

function QuotesPage() {
  const { ref } = Route.useSearch()
  const navigate = useNavigate()
  const [refNo, setRefNo] = useState(ref ? String(ref) : '')
  const [busy, setBusy] = useState(false)
  const q = useQuery({ queryKey: ['quotes'], queryFn: () => listQuotes() })

  async function create() {
    const n = Number(refNo)
    if (!Number.isInteger(n) || n <= 0) return toast.error('Vul een opvolgnummer in.')
    setBusy(true)
    try {
      const r = await createQuoteForLead({ data: { refNumber: n, language: 'nl' } })
      navigate({ to: '/admin/offertes/$id', params: { id: r.id } })
    } catch (e: any) { toast.error(e.message) } finally { setBusy(false) }
  }

  return (
    <AdminShell title="Offertes" context="Groepenkastoffertes op basis van de gepubliceerde catalogus."
      actions={<Link to="/admin/catalogus" className="text-sm underline">Catalogus</Link>}>
      <div className="mb-6 flex flex-wrap items-end gap-2">
        <div><label className="text-sm">Opvolgnummer dossier</label><Input value={refNo} onChange={e => setRefNo(e.target.value)} placeholder="bijv. 1129" className="w-40" /></div>
        <Button onClick={create} disabled={busy}>Offerte maken</Button>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left"><tr><th className="p-2">Nummer</th><th className="p-2">Dossier</th><th className="p-2">Klant</th><th className="p-2">Totaal</th><th className="p-2">Status</th><th className="p-2">Aangemaakt</th></tr></thead>
          <tbody>
            {(q.data ?? []).map((r: any) => (
              <tr key={r.id} className="border-t hover:bg-muted/30">
                <td className="p-2"><Link to="/admin/offertes/$id" params={{ id: r.id }} className="font-medium underline">{r.quote_number ?? 'Concept'}</Link></td>
                <td className="p-2">#{r.leads?.ref_number}</td>
                <td className="p-2">{r.customer_snapshot?.name}</td>
                <td className="p-2">{eur(r.total_inc_vat_cents)}</td>
                <td className="p-2"><Badge variant={r.status === 'draft' ? 'outline' : 'default'}>{QUOTE_STATUS[r.status] ?? r.status}</Badge>{r.is_test && <Badge variant="outline" className="ml-1">test</Badge>}</td>
                <td className="p-2">{new Date(r.created_at).toLocaleDateString('nl-NL')}</td>
              </tr>
            ))}
            {q.data?.length === 0 && <tr><td colSpan={6} className="p-4 text-muted-foreground">Nog geen offertes.</td></tr>}
          </tbody>
        </table>
      </div>
    </AdminShell>
  )
}
