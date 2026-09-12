/**
 * Tokencontrole voor de herstelhooks (X-Reminder-Token). Vergelijking is
 * lengte-onafhankelijk en in constante tijd, zodat er niets te raden valt.
 */

export const REMINDER_TOKEN_PATTERN = /^[a-f0-9]{64}$/

export function isWellFormedReminderToken(supplied: string): boolean {
  return REMINDER_TOKEN_PATTERN.test(supplied)
}

export function reminderTokenMatches(supplied: string, expected: string): boolean {
  if (!isWellFormedReminderToken(supplied)) return false
  if (!expected || supplied.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < supplied.length; i++) diff |= supplied.charCodeAt(i) ^ expected.charCodeAt(i)
  return diff === 0
}
