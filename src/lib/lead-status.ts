/**
 * Eén statusmodel voor een lead. Vijf werkstatussen, drie eindstatussen, en
 * alles daarbuiten (spam, geannuleerd) valt bewust buiten dit model.
 *
 * De status wordt afgeleid uit wat er al vastligt — claim, plandatum, afloop,
 * review — en nergens als tweede veld opgeslagen. Twee velden die elkaar kunnen
 * tegenspreken bestaan hier dus niet.
 */

import { isPlannedLead } from './lead-schedule'

export type LeadStage =
  | 'new'
  | 'dispatched'
  | 'claimed'
  | 'scheduled'
  | 'awaiting_review'
  | 'closed_review'
  | 'closed_no_review'
  | 'not_proceeded'
  /** Spam en geannuleerd: buiten het model, zoals ze altijd al werkten. */
  | 'out_of_flow'

export const WORK_STAGES: LeadStage[] = ['new', 'dispatched', 'claimed', 'scheduled', 'awaiting_review']
export const END_STAGES: LeadStage[] = ['closed_review', 'closed_no_review', 'not_proceeded']

export const STAGE_LABEL: Record<LeadStage, string> = {
  new: 'Nieuw',
  dispatched: 'Doorgezet',
  claimed: 'Opgepakt',
  scheduled: 'Ingepland',
  awaiting_review: 'Wacht op review',
  closed_review: 'Afgerond met review',
  closed_no_review: 'Afgerond zonder review',
  not_proceeded: 'Niet doorgegaan',
  out_of_flow: 'Buiten behandeling',
}

/** Een reviewverzoek sluit zichzelf na zeven dagen. Geen fout, dus geen rood. */
export const REVIEW_CLOSE_DAYS = 7
export const REVIEW_CLOSE_MS = REVIEW_CLOSE_DAYS * 86_400_000

export type StageLead = {
  status: string
  outcome?: string | null
  outcome_at?: string | null
  reviewed_at?: string | null
  review_closed_at?: string | null
  scheduled_at?: string | null
  is_urgent?: boolean | null
  job_type?: string | null
}

function time(value: string | null | undefined): number | null {
  if (!value) return null
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : null
}

/** De enige plek die bepaalt in welke bak een lead hoort. */
export function leadStage(lead: StageLead, now = Date.now()): LeadStage {
  if (lead.status === 'cancelled' || lead.status === 'spam_review' || lead.status === 'blocked_spam') {
    return 'out_of_flow'
  }

  const outcome = lead.outcome ?? null
  if (outcome && outcome !== 'done') return 'not_proceeded'

  if (outcome === 'done') {
    if (lead.reviewed_at) return 'closed_review'
    const closed = time(lead.review_closed_at)
    if (closed !== null) return 'closed_no_review'
    const since = time(lead.outcome_at)
    if (since !== null && now - since >= REVIEW_CLOSE_MS) return 'closed_no_review'
    return 'awaiting_review'
  }

  if (lead.status === 'claimed') {
    return lead.scheduled_at && isPlannedLead(lead) ? 'scheduled' : 'claimed'
  }
  if (lead.status === 'dispatched') return 'dispatched'
  return 'new'
}

export function isWorkStage(stage: LeadStage) {
  return WORK_STAGES.includes(stage)
}

/* ---------------- Filterpillen boven de lijst ---------------- */

export type StagePill =
  | 'work'
  | 'new'
  | 'dispatched'
  | 'claimed'
  | 'scheduled'
  | 'awaiting_review'
  | 'closed'
  | 'not_proceeded'

/** Vaste volgorde; de eerste pil is de standaardweergave. */
export const STAGE_PILLS: StagePill[] = [
  'work',
  'new',
  'dispatched',
  'claimed',
  'scheduled',
  'awaiting_review',
  'closed',
  'not_proceeded',
]

export const PILL_LABEL: Record<StagePill, string> = {
  work: 'Alles (werk)',
  new: 'Nieuw',
  dispatched: 'Doorgezet',
  claimed: 'Opgepakt',
  scheduled: 'Ingepland',
  awaiting_review: 'Wacht op review',
  closed: 'Afgerond',
  not_proceeded: 'Niet doorgegaan',
}

const PILL_STAGES: Record<StagePill, LeadStage[]> = {
  work: WORK_STAGES,
  new: ['new'],
  dispatched: ['dispatched'],
  claimed: ['claimed'],
  scheduled: ['scheduled'],
  awaiting_review: ['awaiting_review'],
  closed: ['closed_review', 'closed_no_review'],
  not_proceeded: ['not_proceeded'],
}

export function isStagePill(value: unknown): value is StagePill {
  return typeof value === 'string' && (STAGE_PILLS as string[]).includes(value)
}

/** Wat een pil laat zien; de teller op de pil telt exact hetzelfde. */
export function pillMatches(pill: StagePill, stage: LeadStage): boolean {
  return PILL_STAGES[pill].includes(stage)
}

export function countByPill(stages: LeadStage[]): Record<StagePill, number> {
  const counts = Object.fromEntries(STAGE_PILLS.map((pill) => [pill, 0])) as Record<StagePill, number>
  for (const stage of stages) {
    for (const pill of STAGE_PILLS) if (pillMatches(pill, stage)) counts[pill]++
  }
  return counts
}
