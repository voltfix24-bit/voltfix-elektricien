import { useCallback, useEffect, useRef, useState } from 'react'
import { Camera, FileText, Loader2, Paperclip, Phone, RefreshCw, Trash2 } from 'lucide-react'

import {
  generalCommentKey,
  infoRequestItems,
  type InfoRequestItemCode,
  type InfoRequestUnavailableReason,
} from '@/lib/booking/info-request'
import { business, telHref } from '@/lib/business'

/**
 * Rustige klantpagina voor een gerichte aanvulling (fase 5B).
 *
 * Bewust geen wizard, geen voortgangsbalk, geen accountscherm: de klant komt
 * hier vanuit WhatsApp en levert alleen aan wat gevraagd is. De pagina toont
 * nooit het adres, de historie, de offerte of de interne beoordeling — en ook
 * geen bestanden uit het dossier: alleen wat via déze link is meegestuurd.
 */

type Answer = { value?: string | null; unavailable?: InfoRequestUnavailableReason | null }

type ServerFile = { attachmentId: string; category: string; filename: string; size: number }

type State = {
  access: { ok: boolean; reason?: string }
  language: 'nl' | 'en'
  note: string
  items: InfoRequestItemCode[]
  /** De werkelijk gestelde aanvullende vraag; leeg wanneer die niet is gesteld. */
  extraQuestion?: string
  callbackRequested?: boolean
  revision: number
  draftRevision: number
  answers: Record<string, Answer>
  files: ServerFile[]
  submittedAt: string | null
}

/** Lokale uploadregel: pas "Opgeslagen" na een bevestiging van de server. */
type UploadItem = {
  id: string
  code: InfoRequestItemCode
  name: string
  size: number
  mime: string
  file: File | null
  attachmentId: string | null
  status: 'preparing' | 'uploading' | 'uploaded' | 'failed'
}

const copy = {
  nl: {
    brand: 'VoltFix Amsterdam',
    title: 'Vul je Perilex-aanvraag aan',
    intro: 'We hebben nog een paar dingen nodig om je aanvraag verder te kunnen beoordelen.',
    loading: 'Even geduld…',
    unavailableTitle: 'Deze link werkt niet meer',
    unavailableBody: 'Bel ons gerust, dan helpen we je direct verder.',
    call: `Bel ${business.phoneDisplay}`,
    submit: 'Aanvulling versturen',
    sending: 'Versturen…',
    done: 'Aanvulling ontvangen. We bekijken je informatie en nemen contact met je op.',
    stillMissing: 'Je gaf aan dat deze onderdelen nog ontbreken:',
    addPhoto: 'Foto toevoegen',
    addFile: 'Bestand of PDF',
    hint: 'JPG, PNG, WebP of PDF. Een iPhone-foto (HEIC) zetten we in je browser om naar JPG.',
    remove: 'Verwijderen',
    retry: 'Opnieuw proberen',
    statusUploading: 'Bezig met versturen…',
    statusUploaded: 'Opgeslagen',
    statusFailed: 'Versturen mislukt',
    statusPreparing: 'Foto wordt klaargemaakt…',
    loadFailed: 'We konden je aanvulling niet laden. Controleer je verbinding.',
    draftFailed: 'Je antwoorden zijn nog niet opgeslagen. We proberen het opnieuw zodra je verder typt.',
    draftMerged: 'Er waren ook antwoorden vanaf een ander tabblad. We hebben alles samengevoegd; controleer het even.',
    deleteFailed: 'Verwijderen is niet gelukt. Probeer het opnieuw.',
    heicFailed: 'Deze iPhone-foto konden we niet omzetten. Stuur hem als JPG of PDF.',
    fileRejected: 'Dit bestandstype kunnen we niet verwerken. Stuur een JPG, PNG, WebP of PDF.',
    sendFailed: 'Versturen is niet gelukt. Je antwoorden staan er nog; probeer het opnieuw.',
    dont_know: 'Weet ik niet',
    dont_have: 'Heb ik niet',
    later: 'Kan ik later aanleveren',
    commentLabel: 'Wil je nog iets kwijt?',
    optional: 'optioneel',
    callbackTitle: 'Liever even bellen?',
    callback: 'Vraag een terugbelverzoek aan',
    callbackOn: 'Terugbelverzoek staat aan',
    callbackAsked: 'Terugbelverzoek opgeslagen bij je aanvulling. We bellen je terug; dit is geen afspraak.',
    callbackHint: 'Je vraagt hiermee geen afspraak of betaalde schouw aan.',
    incomplete: 'Vul de openstaande onderdelen in of geef aan waarom ze ontbreken.',
    error: 'Er ging iets mis. Probeer het opnieuw.',
    revisionChanged: 'De vraag is aangepast. Ververs de pagina en bekijk de nieuwe vraag.',
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
    brand: 'VoltFix Amsterdam',
    title: 'Complete your Perilex request',
    intro: 'We need a few more details before we can assess your request.',
    loading: 'One moment…',
    unavailableTitle: 'This link is no longer active',
    unavailableBody: 'Please call us and we will help you straight away.',
    call: `Call ${business.phoneInternational}`,
    submit: 'Send additional information',
    sending: 'Sending…',
    done: 'Additional information received. We will review it and contact you.',
    stillMissing: 'You told us these parts are still missing:',
    addPhoto: 'Add photo',
    addFile: 'File or PDF',
    hint: 'JPG, PNG, WebP or PDF. An iPhone photo (HEIC) is converted to JPG in your browser.',
    remove: 'Remove',
    retry: 'Try again',
    statusUploading: 'Sending…',
    statusUploaded: 'Saved',
    statusFailed: 'Sending failed',
    statusPreparing: 'Preparing photo…',
    loadFailed: 'We could not load your request. Please check your connection.',
    draftFailed: 'Your answers are not saved yet. We will retry as soon as you continue typing.',
    draftMerged: 'Answers from another tab came in as well. We merged everything; please check it.',
    deleteFailed: 'Removing did not work. Please try again.',
    heicFailed: 'We could not convert this iPhone photo. Please send it as JPG or PDF.',
    fileRejected: 'We cannot process this file type. Please send a JPG, PNG, WebP or PDF.',
    sendFailed: 'Sending did not work. Your answers are still here; please try again.',
    dont_know: "I don't know",
    dont_have: "I don't have this",
    later: 'I can send this later',
    commentLabel: 'Anything else you want to tell us?',
    optional: 'optional',
    callbackTitle: 'Prefer to talk?',
    callback: 'Ask us to call you back',
    callbackOn: 'Call-back request is on',
    callbackAsked: 'Call-back request saved with your answer. We will call you; this is not an appointment.',
    callbackHint: 'This does not book an appointment or a paid site visit.',
    incomplete: 'Please complete the open items or tell us why they are missing.',
    error: 'Something went wrong. Please try again.',
    revisionChanged: 'The question has changed. Please refresh the page to see the new question.',
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

const chipClass = (active: boolean) =>
  `min-h-12 rounded-lg border px-4 text-[16px] ${active ? 'border-primary bg-secondary font-semibold text-primary' : 'border-input text-foreground'}`

const accept = 'image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf'

function uuid(): string {
  return crypto.randomUUID()
}

function formatSize(bytes: number, language: 'nl' | 'en'): string {
  const mb = bytes / (1024 * 1024)
  return mb >= 1
    ? `${mb.toFixed(1).replace('.', language === 'en' ? '.' : ',')} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} kB`
}

/** Miniatuur uit het lokale bestand; een PDF krijgt een pictogram. */
function Thumb({ item, alt }: { item: UploadItem; alt: string }) {
  const [url, setUrl] = useState('')
  useEffect(() => {
    if (!item.file || item.mime === 'application/pdf') return
    const next = URL.createObjectURL(item.file)
    setUrl(next)
    return () => URL.revokeObjectURL(next)
  }, [item.file, item.mime])
  if (!url) {
    return (
      <span className="flex size-14 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
        <FileText className="size-6" />
      </span>
    )
  }
  return <img src={url} alt={alt} className="size-14 shrink-0 rounded-md border border-border object-cover" />
}

export function InfoRequestPage({
  language,
  /** Alleen voor de lokale visuele controle: vaste, verzonnen stand zonder netwerk. */
  previewState,
  /** Alleen voor de lokale visuele controle: vaste uploadregels. */
  previewUploads,
  /** Alleen voor de lokale visuele controle: een vaste melding. */
  previewError,
}: {
  language: 'nl' | 'en'
  previewState?: State
  previewUploads?: UploadItem[]
  previewError?: string
}) {
  const [state, setState] = useState<State | null>(previewState ?? null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'sending' | 'done' | 'unavailable'>(
    previewState ? (previewState.submittedAt ? 'done' : previewState.access.ok ? 'ready' : 'unavailable') : 'loading',
  )
  const [error, setError] = useState<string | null>(previewError ?? null)
  const [answers, setAnswers] = useState<Record<string, Answer>>(previewState?.answers ?? {})
  const [uploads, setUploads] = useState<UploadItem[]>(previewUploads ?? [])
  const [callback, setCallback] = useState(previewState?.callbackRequested ?? false)
  const [callbackSaved, setCallbackSaved] = useState(previewState?.callbackRequested ?? false)
  const [reported, setReported] = useState<Array<{ code: InfoRequestItemCode }>>([])
  const idempotency = useRef<string>(uuid())
  const draftRevision = useRef(0)

  const t = copy[state?.language ?? language]

  const apply = useCallback((next: State) => {
    setState(next)
    setAnswers((next.answers ?? {}) as Record<string, Answer>)
    setCallback(Boolean(next.callbackRequested))
    setCallbackSaved(Boolean(next.callbackRequested))
    draftRevision.current = next.draftRevision
    // Bestanden die al bij deze link horen blijven zichtbaar na herladen.
    setUploads(
      (next.files ?? []).map(file => ({
        id: file.attachmentId,
        code: (Object.keys(infoRequestItems) as InfoRequestItemCode[]).find(
          code => infoRequestItems[code].category === file.category,
        ) as InfoRequestItemCode,
        name: file.filename,
        size: file.size,
        mime: '',
        file: null,
        attachmentId: file.attachmentId,
        status: 'uploaded' as const,
      })),
    )
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

  const saveDraft = useCallback(async (next: Record<string, Answer>, callbackRequested: boolean) => {
    const response = await fetch('/api/public/info-request/draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: next, draftRevision: draftRevision.current, callbackRequested }),
    })
    const body = await response.json().catch(() => null)
    if (body?.ok) {
      draftRevision.current = body.draftRevision
      // "Genoteerd" pas ná de bevestiging van de server.
      setCallbackSaved(Boolean(body.callbackRequested))
    } else if (body?.code === 'draft_conflict') {
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
      debounce.current = setTimeout(() => void saveDraft(next, callback), 600)
      return next
    })
  }

  const toggleCallback = async () => {
    const next = !callback
    setCallback(next)
    setCallbackSaved(false)
    await saveDraft(answers, next)
  }

  const sendFile = async (item: UploadItem, file: File) => {
    const category = infoRequestItems[item.code].category
    if (!category) return
    setUploads(current => current.map(row => (row.id === item.id ? { ...row, status: 'uploading' } : row)))
    setError(null)
    const form = new FormData()
    const attachmentId = item.attachmentId ?? uuid()
    form.set('attachmentId', attachmentId)
    form.set('category', category)
    form.set('file', file)
    let ok = false
    try {
      const response = await fetch('/api/public/info-request/upload', { method: 'POST', body: form })
      const body = await response.json().catch(() => null)
      ok = Boolean(body?.ok)
    } catch {
      ok = false
    }
    setUploads(current =>
      current.map(row =>
        row.id === item.id ? { ...row, attachmentId, status: ok ? 'uploaded' : 'failed' } : row,
      ),
    )
  }

  const addFiles = (code: InfoRequestItemCode, files: File[]) => {
    for (const file of files) {
      const item: UploadItem = {
        id: uuid(),
        code,
        name: file.name,
        size: file.size,
        mime: file.type,
        file,
        attachmentId: null,
        status: 'uploading',
      }
      setUploads(current => [...current, item])
      void sendFile(item, file)
    }
  }

  const removeFile = async (item: UploadItem) => {
    if (item.attachmentId && item.status === 'uploaded') {
      await fetch(`/api/public/info-request/upload?attachmentId=${item.attachmentId}`, { method: 'DELETE' })
    }
    setUploads(current => current.filter(row => row.id !== item.id))
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
    setError(
      body?.code === 'incomplete'
        ? t.incomplete
        : body?.code === 'revision_changed'
          ? t.revisionChanged
          : t.error,
    )
  }

  const callButton = (
    <a
      href={telHref}
      className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-[16px] font-semibold text-primary-foreground"
    >
      <Phone className="size-4" /> {t.call}
    </a>
  )

  if (status === 'loading') {
    return (
      <Shell brand={t.brand}>
        <p className="text-[16px] text-muted-foreground">{t.loading}</p>
      </Shell>
    )
  }

  if (status === 'unavailable' || !state) {
    return (
      <Shell brand={t.brand}>
        <h1 className="text-[22px] font-extrabold">{t.unavailableTitle}</h1>
        <p className="mt-2 text-[16px] text-muted-foreground">{t.unavailableBody}</p>
        {callButton}
      </Shell>
    )
  }

  if (status === 'done') {
    return (
      <Shell brand={t.brand}>
        <h1 className="text-[22px] font-extrabold">{t.done}</h1>
        {reported.length > 0 && (
          <div className="mt-3">
            <p className="text-[15px] text-muted-foreground">{t.stillMissing}</p>
            <ul className="mt-1 list-disc pl-5 text-[15px]">
              {reported.map(entry => (
                <li key={entry.code}>{t.items[entry.code]}</li>
              ))}
            </ul>
          </div>
        )}
        {callbackSaved && <p className="mt-3 text-[15px]">{t.callbackAsked}</p>}
      </Shell>
    )
  }

  return (
    <Shell brand={t.brand}>
      <h1 className="text-[22px] font-extrabold leading-tight">{t.title}</h1>
      <p className="mt-2 text-[16px] text-muted-foreground">{state.note || t.intro}</p>

      <div className="mt-5 space-y-5 pb-28">
        {state.items.map(code => {
          const definition = infoRequestItems[code]
          const answer = answers[code] ?? {}
          const files = uploads.filter(item => item.code === code)
          // De werkelijk gestelde vraag als label; anders de vaste omschrijving.
          const label = code === 'extra_question' && state.extraQuestion ? state.extraQuestion : t.items[code]
          return (
            <section key={code} className="rounded-xl border border-border p-4">
              <label className="block text-[16px] font-semibold" htmlFor={`f-${code}`}>
                {label}
              </label>

              {definition.kind === 'file' && (
                <div className="mt-3">
                  <FilePickers code={code} labels={t} onFiles={addFiles} />
                  <p className="mt-2 text-[14px] text-muted-foreground">{t.hint}</p>
                  {files.length > 0 && (
                    <ul className="mt-3 space-y-3">
                      {files.map(item => (
                        <li key={item.id} className="space-y-2 rounded-lg border border-border p-3">
                          <div className="flex min-w-0 items-start gap-3">
                            <Thumb item={item} alt={label} />
                            <p className="min-w-0 flex-1 break-words text-[15px] font-semibold">{item.name}</p>
                            <div className="flex shrink-0 gap-2">
                              {item.status === 'failed' && (
                                <button
                                  type="button"
                                  aria-label={`${t.retry}: ${item.name}`}
                                  className="flex size-12 items-center justify-center rounded-lg border border-input"
                                  onClick={() => item.file && void sendFile(item, item.file)}
                                >
                                  <RefreshCw className="size-4" />
                                </button>
                              )}
                              <button
                                type="button"
                                aria-label={`${t.remove}: ${item.name}`}
                                className="flex size-12 items-center justify-center rounded-lg border border-input"
                                onClick={() => void removeFile(item)}
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </div>
                          </div>
                          {item.size > 0 && (
                            <p className="text-[13px] text-muted-foreground">{formatSize(item.size, t === copy.en ? 'en' : 'nl')}</p>
                          )}
                          <p
                            data-testid={`info-upload-${item.status}`}
                            className={`flex items-center gap-1 text-[13px] font-semibold ${
                              item.status === 'failed'
                                ? 'text-destructive'
                                : item.status === 'uploaded'
                                  ? 'text-success'
                                  : 'text-muted-foreground'
                            }`}
                          >
                            {item.status === 'uploading' && <Loader2 className="size-3 animate-spin" />}
                            {item.status === 'uploading'
                              ? t.statusUploading
                              : item.status === 'uploaded'
                                ? t.statusUploaded
                                : t.statusFailed}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
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
                      className={chipClass(answer.value === option)}
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
                      onClick={() => patch(code, answer.unavailable === reason ? {} : { unavailable: reason })}
                      className={chipClass(answer.unavailable === reason)}
                    >
                      {t[reason]}
                    </button>
                  ))}
                </div>
              )}
            </section>
          )
        })}

        <section className="rounded-xl border border-border p-4">
          <label className="block text-[16px] font-semibold" htmlFor="general-comment">
            {t.commentLabel} <span className="font-normal text-muted-foreground">({t.optional})</span>
          </label>
          <textarea
            id="general-comment"
            rows={3}
            maxLength={1000}
            value={answers[generalCommentKey]?.value ?? ''}
            onChange={event => patch(generalCommentKey, { value: event.target.value })}
            className={`${inputClass} mt-3`}
          />
        </section>

        <section className="rounded-xl border border-border p-4">
          <p className="text-[16px] font-semibold">{t.callbackTitle}</p>
          <button
            type="button"
            aria-pressed={callback}
            onClick={() => void toggleCallback()}
            className={`mt-3 flex min-h-12 items-center gap-2 rounded-lg border px-4 text-[16px] ${
              callback ? 'border-primary bg-secondary font-semibold text-primary' : 'border-input text-foreground'
            }`}
          >
            <Phone className="size-4" /> {callback ? t.callbackOn : t.callback}
          </button>
          <p className="mt-2 text-[14px] text-muted-foreground">
            {callback && callbackSaved ? t.callbackAsked : t.callbackHint}
          </p>
        </section>

        {error && (
          <p role="alert" className="text-[15px] text-destructive">
            {error}
          </p>
        )}
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

/** Twee duidelijke knoppen in plaats van een kaal bestandsveld. */
function FilePickers({
  code,
  labels,
  onFiles,
}: {
  code: InfoRequestItemCode
  labels: { addPhoto: string; addFile: string }
  onFiles: (code: InfoRequestItemCode, files: File[]) => void
}) {
  const photoInput = useRef<HTMLInputElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <button
        type="button"
        onClick={() => photoInput.current?.click()}
        className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-[16px] font-semibold text-primary-foreground"
      >
        <Camera className="size-4" /> {labels.addPhoto}
      </button>
      <button
        type="button"
        onClick={() => fileInput.current?.click()}
        className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-input px-4 text-[16px]"
      >
        <Paperclip className="size-4" /> {labels.addFile}
      </button>
      <input
        ref={photoInput}
        id={`f-${code}`}
        type="file"
        accept={accept}
        capture="environment"
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-label={labels.addPhoto}
        onChange={event => {
          onFiles(code, Array.from(event.target.files ?? []))
          event.target.value = ''
        }}
      />
      <input
        ref={fileInput}
        type="file"
        accept={accept}
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-label={labels.addFile}
        onChange={event => {
          onFiles(code, Array.from(event.target.files ?? []))
          event.target.value = ''
        }}
      />
    </div>
  )
}

function Shell({ brand, children }: { brand: string; children: React.ReactNode }) {
  return (
    <main
      className="mx-auto w-full max-w-xl overflow-x-hidden px-4 py-6"
      style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}
    >
      <header className="mb-5 flex items-center justify-between gap-3 border-b border-border pb-3">
        <span className="text-[16px] font-extrabold tracking-tight">{brand}</span>
        <a href={telHref} className="flex min-h-12 items-center gap-2 text-[15px] font-semibold text-primary">
          <Phone className="size-4" /> {business.phoneDisplay}
        </a>
      </header>
      {children}
    </main>
  )
}
