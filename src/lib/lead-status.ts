export type LeadStage = 'open' | 'dispatched' | 'claimed' | 'closed'

export function leadStage(status: string): LeadStage | undefined {
  if (['new', 'spam_review'].includes(status)) return 'open'
  if (status === 'dispatched') return 'dispatched'
  if (status === 'claimed') return 'claimed'
  if (['cancelled', 'blocked_spam'].includes(status)) return 'closed'
  return undefined
}