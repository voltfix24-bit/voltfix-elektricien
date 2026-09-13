import { describe, expect, it } from 'vitest'
import { whatsappWindow } from './whatsapp-window'

const start = Date.parse('2026-09-09T12:00:00.000Z')
const at = (hours: number) => start + hours * 3_600_000

describe('WhatsApp-venster van 24 uur', () => {
  it('toont niets zonder tijdstip', () => {
    expect(whatsappWindow(null, at(1))).toBeNull()
    expect(whatsappWindow(undefined, at(1))).toBeNull()
    expect(whatsappWindow('geen datum', at(1))).toBeNull()
  })
  it('telt af zolang het venster open is', () => {
    const result = whatsappWindow(new Date(start).toISOString(), at(20) + 40 * 60_000)
    expect(result).toMatchObject({ state: 'open', tone: 'text-warning' })
    expect(result!.text).toBe('Venster sluit over 3 u 20')
  })
  it('kleurt het laatste uur rood', () => {
    const result = whatsappWindow(new Date(start).toISOString(), at(23) + 30 * 60_000)
    expect(result).toMatchObject({ state: 'last_hour', tone: 'text-destructive' })
    expect(result!.text).toBe('Venster sluit over 30 min')
  })
  it('meldt een gesloten venster', () => {
    expect(whatsappWindow(new Date(start).toISOString(), at(24))).toMatchObject({
      state: 'closed',
      text: 'Venster gesloten — alleen template',
    })
  })
})
