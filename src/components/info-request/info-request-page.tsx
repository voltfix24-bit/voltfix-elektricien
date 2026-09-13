import { useCallback, useEffect, useRef, useState } from 'react'

import {
  infoRequestItems,
  type InfoRequestItemCode,
  type InfoRequestUnavailableReason,
} from '@/lib/booking/info-request'

/**
 * Rustige klantpagina voor een gerichte aanvulling (fase 5B).
 *
 * Bewust geen wizard, geen voortgangsbalk, geen accountscherm: de klant komt
 * hier vanuit WhatsApp en levert alleen aan wat gevraagd is. De pagina toont
 * nooit het adres, de historie, de offerte of de interne beoordeling.
 */

type Answer = { value?: string | null; unavailable?: InfoRequestUnavailableReason | null }

type State = {
  access: { ok: boolean; reason?: string }
  language: 'nl' | 'en'
  note: string
  items: InfoRequestItemCode[]
  revision: number
  draftRevision: number
  answers: Record<string, Answer>
  files: Array<{ attachmentId: string; category: string; filename: string; size: number }>
  submittedAt: string | null
}

const copy = {
  nl: {
    title: 'Vul je Perilex-aanvraag aan',
    intro: 'We hebben nog een paar dingen nodig om je aanvraag verder te kunnen beoordelen.',
    loading: 'Even geduld…',
    unavailableTitle: 'Deze link werkt niet meer',
    unavailableBody: 'Neem gerust telefonisch contact op, dan helpen we je verder.',
    submit: 'Aanvulling versturen',
    sending: 'Versturen…',
    done: 'Aanvulling ontvangen. We bekijken je informatie en nemen contact met je op.',
    stillMissing: 'Je gaf aan dat deze onderdelen nog ontbreken:',
    addPhoto: 'Foto of document kiezen',
    uploading: 'Bezig met versturen…',
    remove: 'Verwijderen',
    dont_know: 'Weet ik niet',
    dont_have: 'Heb ik niet',
    later: 'Kan ik later aanleveren',
    callback: 'Liever even bellen? Vraag een terugbelverzoek aan.',
    callbackAsked: 'Terugbelverzoek genoteerd bij je aanvulling.',
    incomplete: 'Vul de openstaande onderdelen in of geef aan waarom ze ontbreken.',
    error: 'Er ging iets mis. Probeer het opnieuw.',
    yes: 'Ja',
    no: 'Nee',
    unknown: 'Weet ik niet',
    items: {
      photo_consumer_unit: 'Foto van de groepenkast',
      photo_existing_outlet: 'Foto van het bestaande stopcontact',
      photo_installation_location: 'Foto van de plek waar het aangesloten moet worden',
      photo_appliance_label: 'Foto van het typeplaatje of model',
      kitchen_plan: 'Keukentekening',
      socket_present_choice: 'Zit er nu al een stopcontact op die plek?',
      extra_question: 'Aanvullende vraag',
    } as Record<InfoRequestItemCode, string>,
  },
  en: {
    title: 'Complete your Perilex request',
    intro: 'We need a few more details before we can assess your request.',
    loading: 'One moment…',
    unavailableTitle: 'This link is no longer active',
    unavailableBody: 'Feel free to call us and we will help you further.',
    submit: 'Send additional information',
    sending: 'Sending…',
    done: 'Additional information received. We will review it and contact you.',
    stillMissing: 'You told us these parts are still missing:',
    addPhoto: 'Choose a photo or document',
    uploading: 'Sending…',
    remove: 'Remove',
    dont_know: "I don't know",
    dont_have: "I don't have this",
    later: 'I can send this later',
    callback: 'Prefer to talk? Ask us to call you back.',
    callbackAsked: 'Call-back request noted with your answer.',
    incomplete: 'Please complete the open items or tell us why they are missing.',
    error: 'Something went wrong. Please try again.',
    yes: 'Yes',
    no: 'No',
    unknown: "I don't know",
    items: {
      photo_consumer_unit: 'Photo of the consumer unit',
      photo_existing_outlet: 'Photo of the existing socket',
      photo_installation_location: 'Photo of the installation location',
      photo_appliance_label: 'Photo of the type plate or model',
      kitchen_plan: 'Kitchen drawing',
      socket_present_choice: 'Is there already a socket in that spot?',
      extra_question: 'Additional question',
    } as Record<InfoRequestItemCode, string>,
  },
}

const inputClass =
  'w-full min-h-12 rounded-lg border border-input bg-background px-3 py-2 text-[16px] text-foreground outline-none focus:border-primary'

function uuid(): string {
  return crypto.randomUUID()
}

export function InfoRequestPage({
  language,
  /** Alleen voor de lokale visuele controle: vaste, verzonnen stand zonder netwerk. */
  previewState,
}: {
  language: 'nl' | 'en'
  previewState?: State
}) {
  const [state, setState] = useState<State | null>(previewState ?? null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'sending' | 'done' | 'unavailable'>(
    previewState ? (previewState.submittedAt ? 'done' : previewState.access.ok ? 'ready' : 'unavailable') : 'loading',
  )
  const [error, setError] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [reported, setReported] = useState<Array<{ code: InfoRequestItemCode }>>([])
  const idempotency = useRef<string>(uuid())
  const draftRevision = useRef(0)

  const t = copy[state?.language ?? language]

  const apply = useCallback((next: State) => {
    setState(next)
    setAnswers((next.answers ?? {}) as Record<string, Answer>)
    draftRevision.current = next.draftRevision
    setStatus(next.submittedAt ? 'done' : next.access.ok ? 'ready' : 'unavailable')
  }, [])

  useEffect(() => {
    if (previewState) return
    let cancelled = false
    const run = async () => {
      const hash = window.location.hash
      const match = /[#&]t=([^&]+)/.exec(hash)
      if (match) {
        // Token direct uit de adresbalk halen: geen deelbare URL meer, geen
        // token in verwijzers of in de geschiedenis.
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
        const response = await fetch('/api/public/info-request/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: decodeURIComponent(match[1]) }),
        })
        const body = await response.json().catch(() => null)
        if (cancelled) return
        if (body?.ok) return apply(body.state as State)
        return setStatus('unavailable')
      }
      const response = await fetch('/api/public/info-request/state')
      const body = await response.json().catch(() => null)
      if (cancelled) return
      if (body?.ok) return apply(body.state as State)
      setStatus('unavailable')
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [apply, previewState])

  const saveDraft = useCallback(async (next: Record<string, Answer>) => {
    const response = await fetch('/api/public/info-request/draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: next, draftRevision: draftRevision.current }),
    })
    const body = await response.json().catch(() => null)
    if (body?.ok) draftRevision.current = body.draftRevision
    else if (body?.code === 'draft_conflict') {
      // Tweede tabblad: de serverversie wint, de klant ziet die meteen.
      draftRevision.current = body.draftRevision
      setAnswers((body.answers ?? {}) as Record<string, Answer>)
    }
  }, [])

  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const patch = (code: string, answer: Answer) => {
    setAnswers(current => {
      const next = { ...current, [code]: answer }
      if (debounce.current) clearTimeout(debounce.current)
      debounce.current = setTimeout(() => void saveDraft(next), 600)
      return next
    })
  }

  const refresh = async () => {
    const response = await fetch('/api/public/info-request/state')
    const body = await response.json().catch(() => null)
    if (body?.ok) {
      const next = body.state as State
      setState(next)
      draftRevision.current = next.draftRevision
    }
  }

  const upload = async (code: InfoRequestItemCode, file: File) => {
    const category = infoRequestItems[code].category
    if (!category) return
    setBusy(code)
    setError(null)
    const form = new FormData()
    form.set('attachmentId', uuid())
    form.set('category', category)
    form.set('file', file)
    const response = await fetch('/api/public/info-request/upload', { method: 'POST', body: form })
    const body = await response.json().catch(() => null)
    setBusy(null)
    if (!body?.ok) return setError(t.error)
    await refresh()
  }

  const removeFile = async (attachmentId: string) => {
    setBusy(attachmentId)
    await fetch(`/api/public/info-request/upload?attachmentId=${attachmentId}`, { method: 'DELETE' })
    setBusy(null)
    await refresh()
  }

  const submit = async () => {
    if (!state) return
    setStatus('sending')
    setError(null)
    const response = await fetch('/api/public/info-request/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers, idempotencyKey: idempotency.current, revision: state.revision }),
    })
    const body = await response.json().catch(() => null)
    if (body?.ok) {
      setReported((body.reported ?? []) as Array<{ code: InfoRequestItemCode }>)
      return setStatus('done')
    }
    setStatus('ready')
    setError(body?.code === 'incomplete' ? t.incomplete : t.error)
  }

  if (status === 'loading') {
    return <Shell><p className="text-[16px] text-muted-foreground">{t.loading}</p></Shell>
  }

  if (status === 'unavailable' || !state) {
    return (
      <Shell>
        <h1 className="text-[22px] font-extrabold">{t.unavailableTitle}</h1>
        <p className="mt-2 text-[16px] text-muted-foreground">{t.unavailableBody}</p>
      </Shell>
    )
  }

  if (status === 'done') {
    return (
      <Shell>
        <h1 className="text-[22px] font-extrabold">{t.done}</h1>
        {reported.length > 0 && (
          <div className="mt-3">
            <p className="text-[15px] text-muted-foreground">{t.stillMissing}</p>
            <ul className="mt-1 list-disc pl-5 text-[15px]">
              {reported.map(entry => <li key={entry.code}>{t.items[entry.code]}</li>)}
            </ul>
          </div>
        )}
      </Shell>
    )
  }

  return (
    <Shell>
      <h1 className="text-[22px] font-extrabold leading-tight">{t.title}</h1>
      <p className="mt-2 text-[16px] text-muted-foreground">{state.note || t.intro}</p>

      <div className="mt-5 space-y-5 pb-28">
        {state.items.map(code => {
          const definition = infoRequestItems[code]
          const answer = answers[code] ?? {}
          const files = state.files.filter(file => file.category === definition.category)
          return (
            <section key={code} className="rounded-xl border border-border p-4">
              <label className="block text-[16px] font-semibold" htmlFor={`f-${code}`}>{t.items[code]}</label>

              {definition.kind === 'file' && (
                <div className="mt-3">
                  <input
                    id={`f-${code}`}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
                    className="block w-full text-[16px] file:mr-3 file:min-h-12 file:rounded-lg file:border file:border-input file:bg-secondary file:px-4 file:text-[15px]"
                    onChange={event => {
                      const file = event.target.files?.[0]
                      if (file) void upload(code, file)
                      event.target.value = ''
                    }}
                  />
                  {busy === code && <p className="mt-2 text-[15px] text-muted-foreground">{t.uploading}</p>}
                  <ul className="mt-2 space-y-2">
                    {files.map(file => (
                      <li key={file.attachmentId} className="flex items-center justify-between gap-3 text-[15px]">
                        <span className="truncate">{file.filename}</span>
                        <button
                          type="button"
                          className="min-h-12 shrink-0 rounded-lg border border-input px-3 text-[15px]"
                          onClick={() => void removeFile(file.attachmentId)}
                        >
                          {t.remove}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {definition.kind === 'choice' && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {definition.options.map(option => (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={answer.value === option}
                      onClick={() => patch(code, { value: option })}
                      className={`min-h-12 rounded-lg border px-4 text-[16px] ${answer.value === option ? 'border-primary bg-secondary text-primary' : 'border-input'}`}
                    >
                      {option === 'yes' ? t.yes : option === 'no' ? t.no : t.unknown}
                    </button>
                  ))}
                </div>
              )}

              {definition.kind === 'text' && (
                <textarea
                  id={`f-${code}`}
                  rows={3}
                  value={answer.value ?? ''}
                  maxLength={1000}
                  onChange={event => patch(code, { value: event.target.value })}
                  className={`${inputClass} mt-3`}
                />
              )}

              {definition.unavailableReasons.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {definition.unavailableReasons.map(reason => (
                    <button
                      key={reason}
                      type="button"
                      aria-pressed={answer.unavailable === reason}
                      onClick={() =>
                        patch(code, answer.unavailable === reason ? {} : { unavailable: reason })
                      }
                      className={`min-h-12 rounded-lg border px-4 text-[15px] ${answer.unavailable === reason ? 'border-primary bg-secondary text-primary' : 'border-input'}`}
                    >
                      {t[reason]}
                    </button>
                  ))}
                </div>
              )}
            </section>
          )
        })}

        <p className="text-[15px] text-muted-foreground">
          {answers['callback']?.unavailable ? t.callbackAsked : t.callback}
        </p>
        {error && <p className="text-[15px] text-destructive">{error}</p>}
      </div>

      <div
        className="fixed inset-x-0 bottom-0 border-t border-border bg-background px-4 py-3"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
      >
        <button
          type="button"
          onClick={() => void submit()}
          disabled={status === 'sending'}
          className="mx-auto flex min-h-12 w-full max-w-xl items-center justify-center rounded-xl bg-primary px-4 text-[16px] font-semibold text-primary-foreground disabled:opacity-60"
        >
          {status === 'sending' ? t.sending : t.submit}
        </button>
      </div>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-xl overflow-x-hidden px-4 py-6" style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}>
      {children}
    </main>
  )
}
