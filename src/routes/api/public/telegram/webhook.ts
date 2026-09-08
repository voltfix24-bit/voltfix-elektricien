import { createFileRoute } from '@tanstack/react-router'
import { timingSafeEqual } from 'crypto'

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

export const Route = createFileRoute('/api/public/telegram/webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env['TELEGRAM_WEBHOOK_SECRET']
        if (!expected) return new Response('Not configured', { status: 503 })
        const given = request.headers.get('X-Telegram-Bot-Api-Secret-Token') ?? ''
        if (!safeEqual(given, expected)) {
          return new Response('Unauthorized', { status: 401 })
        }

        const update = (await request.json()) as any
        const cq = update?.callback_query
        if (!cq?.data || typeof cq.data !== 'string') {
          return Response.json({ ok: true, ignored: true })
        }

        const tg = await import('@/lib/telegram.server')

        if (!cq.data.startsWith('claim:')) {
          await tg.answerCallbackQuery({ callback_query_id: cq.id })
          return Response.json({ ok: true })
        }

        const leadId = cq.data.slice('claim:'.length)
        const telegramUserId = cq.from?.id as number | undefined
        if (!telegramUserId) {
          await tg.answerCallbackQuery({ callback_query_id: cq.id, text: 'Onbekende gebruiker.', show_alert: true })
          return Response.json({ ok: true })
        }

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
        const { data, error } = await supabaseAdmin.rpc('claim_lead', {
          _lead_id: leadId,
          _telegram_user_id: telegramUserId,
        })

        if (error) {
          console.error('claim_lead failed', error)
          await tg.answerCallbackQuery({
            callback_query_id: cq.id,
            text: 'Er ging iets mis. Probeer het opnieuw.',
            show_alert: true,
          })
          return Response.json({ ok: false }, { status: 200 })
        }

        const result = data as any

        if (!result?.ok) {
          const messages: Record<string, string> = {
            not_registered: 'Je Telegram-account is nog niet gekoppeld. Neem contact op met VoltFix.',
            inactive: 'Je account staat op inactief. Neem contact op met VoltFix.',
            not_found: 'Deze lead bestaat niet meer.',
            already_claimed: 'Deze lead is al door iemand anders geclaimd.',
            cancelled: 'Deze lead is geannuleerd.',
            insufficient_balance: `Onvoldoende saldo (${tg.euro(result?.balance_cents ?? 0)}). Waardeer op om leads te claimen.`,
          }
          const text = messages[result?.reason as string] ?? 'Claim niet gelukt.'
          await tg.answerCallbackQuery({ callback_query_id: cq.id, text, show_alert: true })

          if (result?.reason === 'insufficient_balance') {
            await tg
              .sendMessage({
                chat_id: telegramUserId,
                text: `⚠️ <b>Onvoldoende saldo</b>\n\nJe saldo is ${tg.euro(result.balance_cents ?? 0)} en deze lead kost ${tg.euro(result.price_cents ?? 0)}.\nWaardeer je tegoed op bij VoltFix om weer leads te kunnen claimen.`,
              })
              .catch(() => {})
          }
          return Response.json({ ok: true })
        }

        const lead = result.lead as tgLead
        const contractorName = result.contractor_name as string

        await tg.answerCallbackQuery({ callback_query_id: cq.id, text: 'Lead geclaimd! Check je privéchat.' })

        if (cq.message?.chat?.id && cq.message?.message_id) {
          await tg
            .editMessageText({
              chat_id: cq.message.chat.id,
              message_id: cq.message.message_id,
              text: tg.claimedText(lead, contractorName),
              reply_markup: { inline_keyboard: [] },
            })
            .catch((e) => console.error('editMessageText failed', e))
        }

        await tg
          .sendMessage({ chat_id: telegramUserId, text: tg.privateDetails(lead) })
          .catch((e) => console.error('private sendMessage failed', e))

        return Response.json({ ok: true })
      },
    },
  },
})

type tgLead = import('@/lib/telegram.server').LeadRow
