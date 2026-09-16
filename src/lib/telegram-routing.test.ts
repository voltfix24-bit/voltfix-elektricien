import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/integrations/supabase/client.server', () => ({
  supabaseAdmin: { from: vi.fn() },
}))

describe('centrale Telegram-routering', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env['TELEGRAM_BOT_TOKEN'] = 'test-token'
    process.env['TELEGRAM_CHAT_ID'] = '-100-production'
    process.env['TELEGRAM_TEST_CHAT_ID'] = '-5387512281'
    delete process.env['VOLTFIX_TEST_MODE']
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    vi.restoreAllMocks()
  })

  it('leidt een testdossier weg van de productiegroep', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true, result: { message_id: 1 } }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const tg = await import('./telegram.server')

    await tg.sendMessage({
      chat_id: '-100-production',
      text: 'testtoewijzing',
      routing: { event: 'assignment', lead: { id: '22222222-2222-4222-8222-222222222204', is_test: true } },
    })

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(JSON.parse(String(request.body)).chat_id).toBe('-5387512281')
  })

  it('laat een aantoonbaar echt dossier naar productie gaan', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true, result: { message_id: 2 } }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const tg = await import('./telegram.server')

    await tg.sendMessage({
      chat_id: '-100-production',
      text: 'echte lead',
      routing: { event: 'dispatch', lead: { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', is_test: false } },
    })

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(JSON.parse(String(request.body)).chat_id).toBe('-100-production')
  })
})