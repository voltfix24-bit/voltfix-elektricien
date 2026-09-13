import { leadUrgency } from '@/lib/lead-overdue'
import { leadStage, STAGE_LABEL } from '@/lib/lead-status'

const OUT_OF_FLOW_LABEL: Record<string, string> = {
  cancelled: 'Geannuleerd',
  spam_review: 'Spam-controle',
  blocked_spam: 'Spam geblokkeerd',
}

/** Eén badge per regel, met de afgeleide status. Alleen escalatie is gevuld rood. */
export function LeadStatusBadge({ lead, now }: { lead: any; now?: number }) {
  const base = 'inline-flex items-center rounded-md px-[7px] py-0.5 text-[11.5px] font-bold'

  if (leadUrgency(lead, now) === 'escalated') {
    return <span className={`${base} bg-destructive text-destructive-foreground`}>Niet opgepakt</span>
  }

  const stage = leadStage(lead, now)
  if (stage === 'out_of_flow') {
    const tone =
      lead.status === 'blocked_spam'
        ? 'bg-destructive/10 text-destructive'
        : lead.status === 'spam_review'
          ? 'bg-warning/10 text-warning'
          : 'bg-secondary text-muted-foreground'
    return <span className={`${base} ${tone}`}>{OUT_OF_FLOW_LABEL[lead.status] ?? lead.status}</span>
  }

  // Niet doorgegaan is geen fout: neutraal grijs, nergens rood.
  const tone =
    stage === 'claimed' || stage === 'scheduled' || stage === 'closed_review'
      ? 'bg-success/10 text-success'
      : stage === 'dispatched' || stage === 'awaiting_review'
        ? 'bg-primary/10 text-primary'
        : stage === 'not_proceeded' || stage === 'closed_no_review'
          ? 'bg-secondary text-muted-foreground'
          : 'border border-border text-muted-foreground'
  return <span className={`${base} ${tone}`}>{STAGE_LABEL[stage]}</span>
}
