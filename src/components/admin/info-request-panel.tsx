import { useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy, Loader2, MessageCircle, Send, XCircle } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { infoRequestItemCodes, infoRequestItems, type InfoRequestItemCode } from '@/lib/booking/info-request'
import { createInfoRequestFn, listInfoRequests, withdrawInfoRequestFn } from '@/lib/info-request.functions'

/**
 * "Informatie opvragen" binnen de bestaande beoordeling.
 *
 * Alleen ontbrekende punten worden voorgesteld; niets staat standaard aan.
 * De klantgerichte toelichting is een apart veld: de interne notitie gaat
 * nooit automatisch mee. Een concept verstuurt niets en heeft geen link.
 */

const itemLabel: Record<InfoRequestItemCode, string> = {
  photo_consumer_unit: 'Foto groepenkast',
  photo_existing_outlet: 'Foto bestaand stopcontact',
  photo_installation_location: 'Foto aansluitlocatie',
  photo_appliance_label: 'Foto typeplaatje/model',
  kitchen_plan: 'Keukentekening',
  socket_present_choice: 'Vraag: al een stopcontact aanwezig?',
  extra_question: 'Korte aanvullende vraag',
}

const statusLabel: Record<string, string> = {
  draft: 'Concept',
  open: 'Openstaand',
  submitted: 'Ingediend',
  withdrawn: 'Ingetrokken',
  superseded: 'Vervangen',
}

export function InfoRequestPanel({ quoteRequestId, phone }: { quoteRequestId: string; phone?: string | null }) {
  const queryClient = useQueryClient()
  const load = useServerFn(listInfoRequests)
  const create = useServerFn(createInfoRequestFn)
  const withdraw = useServerFn(withdrawInfoRequestFn)

  const [selected, setSelected] = useState<InfoRequestItemCode[]>([])
  const [note, setNote] = useState('')
  const [language, setLanguage] = useState<'nl' | 'en'>('nl')
  const [link, setLink] = useState<string | null>(null)

  const query = useQuery({
    queryKey: ['admin', 'info-requests', quoteRequestId],
    queryFn: () => load({ data: { quoteRequestId } }),
  })

  const data: any = query.data
  const requests: any[] = data?.requests ?? []
  const live = requests.find(row => row.status === 'open' || row.status === 'draft') ?? null
  const suggestions: InfoRequestItemCode[] = data?.suggestions ?? []
  const received: string[] = data?.receivedCategories ?? []
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin', 'info-requests', quoteRequestId] })

  const createMut = useMutation({
    mutationFn: () =>
      create({ data: { quoteRequestId, items: selected, language, customerNote: note, openNow: true } }),
    onSuccess: (result: any) => {
      if (!result?.ok) return toast.error('Verzoek niet aangemaakt.')
      setLink(result.link ? new URL(result.link, window.location.origin).toString() : null)
      setSelected([])
      setNote('')
      toast.success('Informatieverzoek klaargezet.')
      refresh()
    },
  })

  const withdrawMut = useMutation({
    mutationFn: (id: string) => withdraw({ data: { id } }),
    onSuccess: () => {
      setLink(null)
      toast.success('Verzoek ingetrokken.')
      refresh()
    },
  })

  const toggle = (code: InfoRequestItemCode) =>
    setSelected(current => (current.includes(code) ? current.filter(item => item !== code) : [...current, code]))

  return (
    <div className="space-y-4">
      <h4 className="text-[11.5px] font-bold uppercase tracking-[0.04em] text-muted-foreground">Informatie opvragen</h4>

      {received.length > 0 && (
        <p className="text-[13.5px] text-muted-foreground">Al ontvangen: {received.join(', ')}</p>
      )}

      {live ? (
        <div className="rounded-lg border border-border p-3 text-[13.5px]">
          <p className="font-semibold">
            {statusLabel[live.status]} · versie {live.revision} · geldig tot{' '}
            {new Date(live.expires_at).toLocaleDateString('nl-NL')}
          </p>
          <p className="mt-1 text-muted-foreground">{live.items.map((code: string) => itemLabel[code as InfoRequestItemCode] ?? code).join(', ')}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {link && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-12"
                  onClick={() => {
                    void navigator.clipboard.writeText(link)
                    toast.success('Link gekopieerd.')
                  }}
                >
                  <Copy className="size-4" /> Link kopiëren
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-12"
                  onClick={() =>
                    window.open(
                      `https://wa.me/${(phone ?? '').replace(/\D/g, '')}?text=${encodeURIComponent(link)}`,
                      '_blank',
                      'noopener',
                    )
                  }
                >
                  <MessageCircle className="size-4" /> Open WhatsApp
                </Button>
              </>
            )}
            <Button
              type="button"
              variant="outline"
              className="min-h-12"
              disabled={withdrawMut.isPending}
              onClick={() => withdrawMut.mutate(live.id)}
            >
              <XCircle className="size-4" /> Intrekken
            </Button>
          </div>
          {link && (
            <p className="mt-2 text-[12.5px] text-muted-foreground">
              De link is eenmalig zichtbaar en gaat nooit naar de monteursgroep.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.length > 0 && (
            <p className="text-[13.5px] text-muted-foreground">
              Voorstel uit de beoordeling: {suggestions.map(code => itemLabel[code]).join(', ')}
            </p>
          )}
          <div className="grid gap-2">
            {infoRequestItemCodes.map(code => (
              <label key={code} className="flex min-h-12 items-center gap-3 text-[14.5px]">
                <Checkbox checked={selected.includes(code)} onCheckedChange={() => toggle(code)} />
                <span>
                  {itemLabel[code]}
                  {infoRequestItems[code].category && received.includes(infoRequestItems[code].category as string) && (
                    <span className="ml-2 text-[12.5px] text-muted-foreground">al ontvangen</span>
                  )}
                </span>
              </label>
            ))}
          </div>
          <div>
            <label className="text-[11.5px] font-bold uppercase tracking-[0.04em] text-muted-foreground" htmlFor="ir-note">
              Toelichting voor de klant
            </label>
            <Textarea
              id="ir-note"
              value={note}
              maxLength={600}
              rows={3}
              onChange={event => setNote(event.target.value)}
              className="mt-1 text-[16px]"
              placeholder="Bijvoorbeeld: kun je een foto van de groepenkast sturen?"
            />
            <p className="mt-1 text-[12.5px] text-muted-foreground">Interne notities gaan nooit mee naar de klant.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['nl', 'en'] as const).map(code => (
              <Button
                key={code}
                type="button"
                variant={language === code ? 'default' : 'outline'}
                className="min-h-12"
                onClick={() => setLanguage(code)}
              >
                {code === 'nl' ? 'Nederlands' : 'English'}
              </Button>
            ))}
            <Button
              type="button"
              className="min-h-12"
              disabled={selected.length === 0 || createMut.isPending}
              onClick={() => createMut.mutate()}
            >
              {createMut.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Informatie opvragen
            </Button>
          </div>
        </div>
      )}

      {requests.filter(row => row.status === 'submitted').length > 0 && (
        <div className="space-y-2">
          <h5 className="text-[11.5px] font-bold uppercase tracking-[0.04em] text-muted-foreground">Ontvangen van de klant</h5>
          {requests
            .filter(row => row.status === 'submitted')
            .map(row => (
              <div key={row.id} className="rounded-lg border border-border p-3 text-[13.5px]">
                <p className="font-semibold">
                  Ontvangen {new Date(row.submitted_at).toLocaleString('nl-NL', { dateStyle: 'short', timeStyle: 'short' })} · versie {row.revision}
                </p>
                <ul className="mt-1 space-y-1">
                  {(row.items as string[]).map(code => {
                    const answer = (row.answers ?? {})[code]
                    const missing = ((row.reported_missing ?? []) as any[]).find(entry => entry.code === code)
                    return (
                      <li key={code}>
                        <span className="text-muted-foreground">{itemLabel[code as InfoRequestItemCode] ?? code}: </span>
                        {missing ? 'klant kan dit niet aanleveren' : (answer?.value ?? 'bestand ontvangen')}
                      </li>
                    )
                  })}
                </ul>
                <p className="mt-2 text-[12.5px] text-muted-foreground">
                  Ontvangen is niet hetzelfde als gecontroleerd: beoordeel dit zelf hierboven.
                </p>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
