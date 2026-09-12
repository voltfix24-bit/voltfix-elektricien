/** Hulpfuncties voor de opvolging van reviewverzoeken (verstuurd / 72-uurs herinnering). */

export const REMINDER_AFTER_MS = 72 * 60 * 60 * 1000

export type ReviewFollowupRow = {
  review_sent_at?: string | null
  reminder_sent_at?: string | null
  reviewed_at?: string | null
}

/** Hele dagen sinds een tijdstip. */
export function daysSince(value: string, now = Date.now()) {
  return Math.floor((now - new Date(value).getTime()) / 86_400_000)
}

export function dateShort(value: string) {
  return new Date(value).toLocaleDateString('nl-NL', { dateStyle: 'short' })
}

/** Verstuurd, nog geen review, ouder dan 72 uur en nog niet herinnerd. */
export function needsReminder(row: ReviewFollowupRow, now = Date.now()) {
  if (row.reviewed_at || row.reminder_sent_at || !row.review_sent_at) return false
  return now - new Date(row.review_sent_at).getTime() > REMINDER_AFTER_MS
}
