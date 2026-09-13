import { useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { ClipboardCopy, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { markReminderSent, markReviewRequested, markReviewSent } from '@/lib/admin.functions'

const REVIEW_LINK = 'https://g.page/r/CU3tzGD_WrDdEBM/review'

type TextInput = {
  customerName: string
  monteurName: string
  jobType: string
  city?: string | null
  language?: 'nl' | 'en' | null
}

function firstName(value: string | null | undefined): string {
  return (value || '').trim().split(/\s+/)[0]
}

export function buildReviewRequestText(input: TextInput) {
  const customerFirstName = (input.customerName || 'daar').trim().split(/\s+/)[0]
  const monteur = firstName(input.monteurName) || 'onze monteur'
  const job = (input.jobType || 'de werkzaamheden').toLowerCase()
  const place = input.city ? ` in ${input.city}` : ''

  if (input.language === 'en') {
    const enName = (input.customerName || 'there').trim().split(/\s+/)[0]
    const enMonteur = firstName(input.monteurName) || 'our electrician'
    const enJob = (input.jobType || 'the work').toLowerCase()
    return [
      `Hi ${enName},`,
      ``,
      `${enMonteur} just let us know that the work on your ${enJob}${place} has been completed.⚡ We hope everything is working properly!`,
      ``,
      `Would you mind helping us and ${enMonteur} out with a quick Google review? It takes less than 30 seconds:`,
      ``,
      REVIEW_LINK,
      ``,
      `(If anything isn't quite to your satisfaction, please feel free to let us know directly via this chat!)`,
      ``,
      `Thanks in advance and have a great day!`,
      ``,
      `Team VoltFix`,
    ].join('\n')
  }

  return [
    `Hi ${customerFirstName},`,
    ``,
    `${monteur} liet net weten dat de werkzaamheden aan je ${job}${place} zijn afgerond.⚡ We hopen dat alles naar behoren werkt!`,
    ``,
    `Zou je ons én ${monteur} willen helpen met een korte Google-review? Dit duurt minder dan 30 seconden:`,
    ``,
    REVIEW_LINK,
    ``,
    `(Mocht er toch iets niet helemaal naar wens zijn, laat het ons gerust direct via deze chat weten!)`,
    ``,
    `Alvast bedankt en een fijne dag!`,
    ``,
    `Team VoltFix`,
  ].join('\n')
}

/** Vriendelijke 72-uurs herinnering, in de taal van de klant. */
export function buildReviewReminderText(input: TextInput) {
  const job = (input.jobType || 'de werkzaamheden').toLowerCase()
  const monteur = input.monteurName || 'onze monteur'

  if (input.language === 'en') {
    const enName = (input.customerName || 'there').trim().split(/\s+/)[0]
    const enJob = (input.jobType || 'the work').toLowerCase()
    const enMonteur = input.monteurName || 'our electrician'
    return [
      `Hi ${enName},`,
      ``,
      `Hope everything is still working perfectly regarding the ${enJob}!⚡`,
      ``,
      `If you happen to have 20 seconds to spare, it would mean a lot to ${enMonteur} and VoltFix if you could leave a quick Google review:`,
      REVIEW_LINK,
      ``,
      `Thanks so much in advance!`,
      ``,
      `Team VoltFix`,
    ].join('\n')
  }

  const firstName = (input.customerName || 'daar').trim().split(/\s+/)[0]
  return [
    `Hi ${firstName},`,
    ``,
    `Hopelijk werkt alles rondom de ${job} nog steeds helemaal naar wens!⚡`,
    ``,
    `Mocht je tussen de bedrijven door 20 seconden over hebben, zou je ${monteur} en VoltFix enorm helpen met een korte Google-review:`,
    REVIEW_LINK,
    ``,
    `Alvast heel erg bedankt!`,
    ``,
    `Team VoltFix`,
  ].join('\n')
}

export function waReviewHref(phone: string | null | undefined, text: string) {
  const digits = (phone ?? '').replace(/[^\d]/g, '').replace(/^0/, '31')
  if (digits.length < 9) return null
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  leadId: string
  customerName: string
  customerPhone?: string | null
  jobType: string
  city?: string | null
  monteurName?: string | null
  reviewRequested?: boolean
  /** Vastgelegde taal van de klant; bepaalt de standaardtekst. */
  language?: 'nl' | 'en' | null
  /** 'request' = eerste verzoek, 'reminder' = 72-uurs herinnering. */
  mode?: 'request' | 'reminder'
  /** Wordt aangeroepen zodra verstuurd/herinnerd is vastgelegd. */
  onMarked?: () => void
}

export function ReviewTextDialog(props: Props) {
  const mode = props.mode ?? 'request'
  const markRequested = useServerFn(markReviewRequested)
  const markSent = useServerFn(markReviewSent)
  const markReminder = useServerFn(markReminderSent)
  const build = mode === 'reminder' ? buildReviewReminderText : buildReviewRequestText
  const [lang, setLang] = useState<'nl' | 'en'>(props.language === 'en' ? 'en' : 'nl')
  const [text, setText] = useState(() =>
    build({
      customerName: props.customerName,
      monteurName: props.monteurName ?? '',
      jobType: props.jobType,
      city: props.city,
      language: props.language === 'en' ? 'en' : 'nl',
    }),
  )
  const areaRef = useRef<HTMLTextAreaElement>(null)

  function switchLang(next: 'nl' | 'en') {
    setLang(next)
    setText(
      build({
        customerName: props.customerName,
        monteurName: props.monteurName ?? '',
        jobType: props.jobType,
        city: props.city,
        language: next,
      }),
    )
  }

  const markMut = useMutation({
    mutationFn: async () => {
      if (mode === 'reminder') return markReminder({ data: { leadId: props.leadId } })
      if (!props.reviewRequested) await markRequested({ data: { leadId: props.leadId } })
      return markSent({ data: { leadId: props.leadId } })
    },
    onSuccess: () => props.onMarked?.(),
  })

  const href = waReviewHref(props.customerPhone, text)

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(mode === 'reminder' ? 'Herinnering gekopieerd en vastgelegd!' : 'Reviewtekst gekopieerd!')
      markMut.mutate()
    } catch {
      areaRef.current?.select()
      toast.error('Kopiëren mislukt — tekst is geselecteerd, kopieer handmatig.')
    }
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === 'reminder' ? 'Herinnering sturen' : 'Review tekst'}</DialogTitle>
          <DialogDescription>
            {props.customerName} · {props.jobType}
            {props.city ? ` · ${props.city}` : ''} · monteur {props.monteurName ?? 'onbekend'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">🌐 Taal klant:</span>
          {(['nl', 'en'] as const).map((option) => (
            <Button
              key={option}
              type="button"
              size="sm"
              variant={lang === option ? 'default' : 'outline'}
              className="min-h-9"
              onClick={() => switchLang(option)}
            >
              {option === 'nl' ? '🇳🇱 NL' : '🇬🇧 EN'}
            </Button>
          ))}
        </div>
        <textarea
          ref={areaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={(e) => e.currentTarget.select()}
          aria-label="Reviewtekst (bewerkbaar)"
          className="h-72 w-full resize-y rounded-md border border-input bg-muted/40 p-3 font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="text-xs text-muted-foreground">
          Tik in het tekstvak om alles te selecteren; je kunt de tekst vóór verzending aanpassen.
        </p>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            className="min-h-11 bg-warning text-warning-foreground hover:bg-warning/90"
            onClick={copy}
          >
            <ClipboardCopy className="size-4" aria-hidden />{' '}
            {mode === 'reminder' ? 'Kopieer & markeer herinnerd' : 'Kopieer & markeer verstuurd'}
          </Button>
          {href ? (
            <Button
              asChild
              type="button"
              className="min-h-11 bg-success text-success-foreground hover:bg-success/90"
              onClick={() => markMut.mutate()}
            >
              <a href={href} target="_blank" rel="noreferrer">
                <MessageCircle className="size-4" aria-hidden /> Open WhatsApp & markeer verstuurd
              </a>
            </Button>
          ) : (
            <Button
              type="button"
              className="min-h-11 bg-success text-success-foreground hover:bg-success/90"
              disabled
              title="Geen telefoonnummer bekend"
            >
              <MessageCircle className="size-4" aria-hidden /> Geen telefoonnummer
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
