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
import { markReviewRequested } from '@/lib/admin.functions'

const REVIEW_LINK = 'https://g.page/r/CU3tzGD_WrDdEBM/review'

export function buildReviewRequestText(input: {
  customerName: string
  monteurName: string
  jobType: string
  city?: string | null
  language?: 'nl' | 'en' | null
}) {
  const firstName = (input.customerName || 'daar').trim().split(/\s+/)[0]
  const monteur = input.monteurName || 'onze monteur'
  const job = (input.jobType || 'de werkzaamheden').toLowerCase()
  const place = input.city ? ` in ${input.city}` : ''

  if (input.language === 'en') {
    const enName = (input.customerName || 'there').trim().split(/\s+/)[0]
    const enMonteur = input.monteurName || 'our electrician'
    const enJob = (input.jobType || 'the work').toLowerCase()
    return [
      `Hi ${enName},`,
      ``,
      `${enMonteur} just let us know that the work on your ${enJob}${place} has been completed.⚡ We hope everything works as it should!`,
      ``,
      `Would you help us and ${enMonteur} with a short Google review? It takes less than 30 seconds:`,
      ``,
      REVIEW_LINK,
      ``,
      `(If anything is not quite right, just let us know directly in this chat!)`,
      ``,
      `Thanks in advance and have a great day!`,
      ``,
      `Team VoltFix`,
    ].join('\n')
  }

  return [
    `Hi ${firstName},`,
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
}

export function ReviewTextDialog(props: Props) {
  const markRequested = useServerFn(markReviewRequested)
  const [text, setText] = useState(() =>
    buildReviewRequestText({
      customerName: props.customerName,
      monteurName: props.monteurName ?? '',
      jobType: props.jobType,
      city: props.city,
    }),
  )
  const areaRef = useRef<HTMLTextAreaElement>(null)

  const markMut = useMutation({
    mutationFn: () => markRequested({ data: { leadId: props.leadId } }),
  })

  const href = waReviewHref(props.customerPhone, text)

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Reviewtekst gekopieerd!')
      if (!props.reviewRequested) markMut.mutate()
    } catch {
      areaRef.current?.select()
      toast.error('Kopiëren mislukt — tekst is geselecteerd, kopieer handmatig.')
    }
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Review tekst</DialogTitle>
          <DialogDescription>
            {props.customerName} · {props.jobType}
            {props.city ? ` · ${props.city}` : ''} · monteur {props.monteurName ?? 'onbekend'}
          </DialogDescription>
        </DialogHeader>
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
            className="min-h-11 bg-amber-500 text-white hover:bg-amber-600"
            onClick={copy}
          >
            <ClipboardCopy className="size-4" aria-hidden /> Kopieer tekst
          </Button>
          {href ? (
            <Button asChild type="button" className="min-h-11 bg-emerald-600 text-white hover:bg-emerald-700">
              <a href={href} target="_blank" rel="noreferrer">
                <MessageCircle className="size-4" aria-hidden /> Open WhatsApp
              </a>
            </Button>
          ) : (
            <Button
              type="button"
              className="min-h-11 bg-emerald-600 text-white hover:bg-emerald-700"
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
