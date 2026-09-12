import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Bewijst dat een iPhone-foto (HEIC/HEIF) niet uit de Telegram-keten valt:
 * hij gaat als bestand mee, terwijl gewone foto's als foto blijven gaan.
 */

const sendMessage = vi.fn(async () => ({ message_id: 11 }))
const sendPhoto = vi.fn(async () => ({ message_id: 12 }))
const sendDocumentUpload = vi.fn(async () => ({ message_id: 13 }))

vi.mock('@/lib/telegram.server', () => ({
  groupChatId: () => '-100123',
  groupTeaser: () => 'Nieuwe lead',
  leadKeyboard: () => [[{ text: 'Claim', callback_data: 'x' }]],
  sendMessage: (...a: unknown[]) => sendMessage(...(a as [])),
  sendPhoto: (...a: unknown[]) => sendPhoto(...(a as [])),
  sendMediaGroup: vi.fn(),
  sendMediaGroupUpload: vi.fn(),
  sendPhotoUpload: vi.fn(),
  sendDocumentUpload: (...a: unknown[]) => sendDocumentUpload(...(a as [])),
}))

vi.mock('@/integrations/supabase/client.server', () => ({
  supabaseAdmin: {
    storage: {
      from: () => ({
        createSignedUrl: async (path: string) => ({
          data: { signedUrl: `https://storage.test/${path}?token=abc` },
          error: null,
        }),
      }),
    },
  },
}))

const lead = { id: 'lead-1', price_cents: 2500 } as never

beforeEach(() => {
  sendMessage.mockClear()
  sendPhoto.mockClear()
  sendDocumentUpload.mockClear()
  vi.stubGlobal('fetch', vi.fn(async () => new Response(new Uint8Array([1, 2, 3]))))
})

describe('dispatchLeadToGroup met iPhone-foto', () => {
  it('stuurt een HEIC-bijlage als bestand mee naar de groep', async () => {
    const { dispatchLeadToGroup } = await import('./lead-dispatch.server')
    const id = await dispatchLeadToGroup({ ...lead, image_urls: ['2026/q1/1-IMG_0042.heic'] })
    expect(sendDocumentUpload).toHaveBeenCalledTimes(1)
    expect(sendDocumentUpload.mock.calls[0]![0]).toMatchObject({ name: '1-IMG_0042.heic' })
    // De lead zelf komt nog steeds met claimknop in de groep.
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(id).toBe(11)
  })

  it('combineert HEIC (bestand) met een gewone foto (fotobericht)', async () => {
    const { dispatchLeadToGroup } = await import('./lead-dispatch.server')
    await dispatchLeadToGroup({ ...lead, image_urls: ['2026/q1/1-foto.jpg', '2026/q1/2-IMG.heif'] })
    expect(sendDocumentUpload).toHaveBeenCalledTimes(1)
    expect(sendPhoto).toHaveBeenCalledTimes(1)
  })

  it('een mislukte HEIC-levering blokkeert de lead niet', async () => {
    sendDocumentUpload.mockRejectedValueOnce(new Error('Telegram sendDocument failed [502]'))
    const { dispatchLeadToGroup } = await import('./lead-dispatch.server')
    const id = await dispatchLeadToGroup({ ...lead, image_urls: ['2026/q1/1-IMG.heic'] })
    expect(id).toBe(11)
    expect(sendMessage).toHaveBeenCalledTimes(1)
  })
})
