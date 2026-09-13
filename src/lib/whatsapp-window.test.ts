import { describe, expect, it } from 'vitest'
import { whatsappWindow, whatsappWindowNotice } from './whatsapp-window'

const start = Date.parse('2026-09-09T12:00:00.000Z')
const at = (hours: number) => start + hours * 3_600_000
const notice = (iso: string | null, now: number) => whatsappWindowNotice(whatsappWindow(iso, now))

describe('WhatsApp-venster van 24 uur', () => {
  it('toont niets zonder tijdstip', () => {
    expect(whatsappWindow(null, at(1))).toEqual({ state: 'unknown' })
    expect(whatsappWindow(undefined, at(1))).toEqual({ state: 'unknown' })
    expect(whatsappWindow('geen datum', at(1))).toEqual({ state: 'unknown' })
    expect(notice(null, at(1))).toBeNull()
  })
  it('telt af zolang het venster open is', () => {
    const now = at(20) + 40 * 60_000
    expect(whatsappWindow(new Date(start).toISOString(), now)).toMatchObject({ state: 'open', minutesLeft: 200 })
    expect(notice(new Date(start).toISOString(), now)).toEqual({ text: 'Venster sluit over 3 u 20 m', tone: 'text-warning' })
  })
  it('kleurt het laatste uur rood', () => {
    const now = at(23) + 30 * 60_000
    expect(whatsappWindow(new Date(start).toISOString(), now)).toMatchObject({ state: 'closing', minutesLeft: 30 })
    expect(notice(new Date(start).toISOString(), now)).toEqual({ text: 'Venster sluit over 30 min', tone: 'text-destructive' })
  })
  it('meldt een gesloten venster', () => {
    expect(whatsappWindow(new Date(start).toISOString(), at(24))).toEqual({ state: 'closed', minutesLeft: 0 })
    expect(notice(new Date(start).toISOString(), at(24))).toEqual({ text: 'Venster gesloten — alleen template', tone: 'text-destructive' })
  })
})
