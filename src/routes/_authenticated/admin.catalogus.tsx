import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { AdminShell } from '@/components/admin/admin-shell'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { createCatalogDraft, getCatalog, publishCatalog, seedGroepenkastCatalog, updateCatalogItem } from '@/lib/quotes.functions'
import { eur } from '@/lib/quotes/engine'

export const Route = createFileRoute('/_authenticated/admin/catalogus')({
  head: () => ({ meta: [{ title: 'Catalogus — VoltFix backoffice' }, { name: 'robots', content: 'noindex' }] }),
  component: CatalogPage,
})

const KIND: Record<string, string> = { package: 'Pakket', option: 'Optie', extra_unit: 'Per stuk', survey: 'Schouw', brand: 'Merk', component: 'Component', labour: 'Arbeid' }

function CatalogPage() {
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['catalog', 'groepenkast'], queryFn: () => getCatalog({ data: { serviceId: 'groepenkast' } }) })
  const refresh = () => qc.invalidateQueries({ queryKey: ['catalog'] })
  const run = (fn: () => Promise<unknown>, ok: string) => fn().then(() => { toast.success(ok); refresh() }).catch(e => toast.error(e.message))

  const versions = q.data?.versions ?? []
  const pub = versions.find(v => v.status === 'published')
  const draft = versions.find(v => v.status === 'draft')
  const items = q.data?.items ?? []
  const pubItems = items.filter(i => i.version_id === pub?.id)
  const draftItems = items.filter(i => i.version_id === draft?.id)
  const pubByKey = new Map(pubItems.map(i => [i.item_key, i]))

  return (
    <AdminShell title="Groepenkastcatalogus" context="Eén prijsbron voor offertes. Wijzigingen gelden pas na publiceren en alleen voor nieuwe offertes.">
      {q.isLoading ? <p>Laden…</p> : versions.length === 0 ? (
        <div className="rounded-lg border p-6">
          <p className="mb-4">Nog geen catalogus. Neem de huidige websiteprijzen over als versie 1.</p>
          <Button onClick={() => run(() => seedGroepenkastCatalog(), 'Catalogus aangemaakt')}>Websiteprijzen overnemen</Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            {pub && <Badge>Gepubliceerd: versie {pub.version_no}</Badge>}
            {draft ? (
              <>
                <Badge variant="outline">Concept: versie {draft.version_no}</Badge>
                <Button onClick={() => { if (confirm('Concept publiceren? Nieuwe offertes gebruiken daarna deze prijzen.')) run(() => publishCatalog({ data: { versionId: draft.id } }), 'Gepubliceerd') }}>Publiceren</Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => run(() => createCatalogDraft({ data: { serviceId: 'groepenkast' } }), 'Concept gemaakt')}>Wijzigen (nieuw concept)</Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground">Let op: de website toont voorlopig nog de prijzen uit de code. Koppeling volgt in een volgende stap.</p>

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left"><tr>
                <th className="p-2">Soort</th><th className="p-2">Naam (NL)</th><th className="p-2">Naam (EN)</th>
                <th className="p-2">Prijs incl. btw</th><th className="p-2">Actief</th><th className="p-2">Website</th><th className="p-2">Offerte</th>
              </tr></thead>
              <tbody>
                {(draft ? draftItems : pubItems).map(i => (
                  <ItemRow key={i.id} item={i} editable={!!draft} published={pubByKey.get(i.item_key)} onSaved={refresh} />
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h3 className="mb-2 font-semibold">Geschiedenis</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {(q.data?.audit ?? []).map(a => (
                <li key={a.id}>{new Date(a.created_at).toLocaleString('nl-NL')} — {a.action} {a.diff && Object.keys(a.diff).length ? JSON.stringify(a.diff) : ''}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </AdminShell>
  )
}

function ItemRow({ item, editable, published, onSaved }: { item: any; editable: boolean; published?: any; onSaved: () => void }) {
  const [price, setPrice] = useState((item.price_inc_vat_cents / 100).toFixed(2))
  const [nl, setNl] = useState(item.label_nl)
  const [en, setEn] = useState(item.label_en)
  const save = useMutation({
    mutationFn: (patch: Record<string, unknown>) => updateCatalogItem({ data: { id: item.id, patch } }),
    onSuccess: onSaved, onError: (e: Error) => toast.error(e.message),
  })
  const changed = published && published.price_inc_vat_cents !== item.price_inc_vat_cents
  const cents = Math.round(parseFloat(price.replace(',', '.')) * 100)
  return (
    <tr className="border-t">
      <td className="p-2">{KIND[item.kind] ?? item.kind}</td>
      <td className="p-2">{editable ? <Input value={nl} onChange={e => setNl(e.target.value)} onBlur={() => nl !== item.label_nl && save.mutate({ label_nl: nl })} /> : item.label_nl}</td>
      <td className="p-2">{editable ? <Input value={en} onChange={e => setEn(e.target.value)} onBlur={() => en !== item.label_en && save.mutate({ label_en: en })} /> : item.label_en}</td>
      <td className="p-2">
        {editable ? <Input className="w-28" inputMode="decimal" value={price} onChange={e => setPrice(e.target.value)}
          onBlur={() => Number.isFinite(cents) && cents >= 0 && cents !== item.price_inc_vat_cents && save.mutate({ price_inc_vat_cents: cents })} /> : eur(item.price_inc_vat_cents)}
        {changed && <span className="ml-1 text-xs text-muted-foreground">(was {eur(published.price_inc_vat_cents)})</span>}
      </td>
      {(['active', 'show_on_website', 'show_in_quotes'] as const).map(k => (
        <td key={k} className="p-2"><Checkbox checked={item[k]} disabled={!editable} onCheckedChange={v => save.mutate({ [k]: v === true })} /></td>
      ))}
    </tr>
  )
}
