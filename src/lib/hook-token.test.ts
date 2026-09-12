import { describe, expect, it } from 'vitest'

import { isWellFormedReminderToken, reminderTokenMatches } from './hook-token'

const TOKEN = 'a'.repeat(64)

describe('hook-token (X-Reminder-Token)', () => {
  it('weigert ontbrekende of verkeerd gevormde tokens', () => {
    expect(isWellFormedReminderToken('')).toBe(false)
    expect(isWellFormedReminderToken('kort')).toBe(false)
    expect(isWellFormedReminderToken('A'.repeat(64))).toBe(false) // hoofdletters
    expect(isWellFormedReminderToken('z'.repeat(64))).toBe(false) // geen hex
    expect(isWellFormedReminderToken(TOKEN)).toBe(true)
  })

  it('accepteert alleen het exacte token', () => {
    expect(reminderTokenMatches(TOKEN, TOKEN)).toBe(true)
    expect(reminderTokenMatches(TOKEN, 'b'.repeat(64))).toBe(false)
    expect(reminderTokenMatches(TOKEN, TOKEN.slice(0, 63))).toBe(false)
    expect(reminderTokenMatches('', TOKEN)).toBe(false)
    expect(reminderTokenMatches(TOKEN, '')).toBe(false)
  })
})
