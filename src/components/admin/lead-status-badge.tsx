import { leadUrgency } from '@/lib/lead-overdue'

const STATUS_LABEL: Record<string, string> = {
  new: 'Open',
  dispatched: 'Doorgezet',
  claimed: 'Opgepakt',
  cancelled: 'Geannuleerd',
  spam_review: 'Spam-controle',
  blocked_spam: 'Spam geblokkeerd',
}

/** Eén badge per regel; alleen de escalatiestatus is gevuld rood. */
export function LeadStatusBadge({ lead, now }: { lead: any; now?: number }) {
  const base = 'inline-flex items-center rounded-md px-[7px] py-0.5 text-[11.5px] font-bold'

  if (leadUrgency(lead, now) === 'escalated') {
    return <span className={`${base} bg-destructive text-destructive-foreground`}>Niet opgepakt</span>
  }

  const label = STATUS_LABEL[lead.status] ?? lead.status
  const tone =
    lead.status === 'claimed'
      ? 'bg-success/10 text-success'
      : lead.status === 'dispatched'
        ? 'bg-primary/10 text-primary'
        : lead.status === 'blocked_spam'
          ? 'bg-destructive/10 text-destructive'
          : lead.status === 'spam_review'
            ? 'bg-warning/10 text-warning'
            : lead.status === 'cancelled'
              ? 'bg-secondary text-muted-foreground'
              : 'border border-border text-muted-foreground'
  return <span className={`${base} ${tone}`}>{label}</span>
}
