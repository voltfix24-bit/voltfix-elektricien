import { useEffect, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { whatsappWindow, whatsappWindowNotice } from '@/lib/whatsapp-window'

function waHref(phone: string | null) {
  return `https://wa.me/${String(phone ?? '').replace(/\D/g, '').replace(/^0/, '31')}`
}

/**
 * WhatsApp-knop met de venstermelding eronder. Buiten het venster is de knop
 * gedempt: vrije tekst mag dan niet meer, alleen een template.
 */
export function WhatsAppButton({ lead, onOpen }: { lead: any; onOpen?: () => void }) {
  // herberekent elke minuut; geen seconden in beeld
  const [, tick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  const win = whatsappWindow(lead.last_customer_message_at)
  const notice = whatsappWindowNotice(win)
  const closed = win.state === 'closed'

  return (
    <div className="min-w-0">
      <a
        href={waHref(lead.customer_phone)}
        target="_blank"
        rel="noreferrer"
        onClick={() => onOpen?.()}
        className={
          closed
            ? 'inline-flex h-11 items-center gap-2 rounded-lg border border-input bg-card px-[18px] text-[14.5px] font-bold text-muted-foreground'
            : 'inline-flex h-11 items-center gap-2 rounded-lg bg-success px-[18px] text-[14.5px] font-bold text-success-foreground'
        }
      >
        <MessageCircle className="size-5" aria-hidden /> WhatsApp
      </a>
      {notice && <p className={`mt-1 text-[11.5px] font-bold tabular-nums ${notice.tone}`}>{notice.text}</p>}
    </div>
  )
}
