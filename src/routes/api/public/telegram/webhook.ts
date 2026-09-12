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
        const tg = await import('@/lib/telegram.server')

        // /start in privéchat: bot mag pas berichten sturen nadat de gebruiker
        // het gesprek heeft geopend. Lever meteen openstaande claims na.
        const msg = update?.message
        const msgText = typeof msg?.text === 'string' ? msg.text.trim() : ''

        // Saldo-overzicht in privéchat (commando of menuknop).
        if (
          msgText.startsWith('/saldo') ||
          msgText.startsWith('/account') ||
          msgText === '💰 Mijn Saldo & Tegoed'
        ) {
          const fromId = msg.from?.id as number | undefined
          if (fromId) await sendAccountSummary(fromId, tg)
          return Response.json({ ok: true })
        }

        if (msgText.startsWith('/start')) {
          const fromId = msg.from?.id as number | undefined
          if (fromId) {
            const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
            const { data: contractor } = await supabaseAdmin
              .from('contractors')
              .select('id, name, balance_cents, is_active')
              .eq('telegram_user_id', fromId)
              .maybeSingle()

            // Nog niet geregistreerd: stuur de persoonlijke registratielink.
            if (!contractor) {
              await tg
                .sendMessage({
                  chat_id: fromId,
                  text:
                    `Welkom bij VoltFix! ⚡\n\nOm klussen te claimen en je €50 welkomstkrediet te ontvangen, dien je je eenmalig te registreren:\n\n` +
                    `https://voltfix.nl/onboarding?telegram_id=${fromId}`,
                })
                .catch(() => {})
              return Response.json({ ok: true })
            }

            if (!contractor.is_active) {
              await tg
                .sendMessage({
                  chat_id: fromId,
                  text: 'Je aanmelding is ontvangen en wordt gecontroleerd. Zodra je account is goedgekeurd, staat je €50 startkrediet klaar.',
                })
                .catch(() => {})
              return Response.json({ ok: true })
            }

            await tg
              .sendMessage({
                chat_id: fromId,
                text: `Je bent al geregistreerd! Je saldo is ${tg.euroExVat(contractor.balance_cents ?? 0)}. Je kunt leads claimen in onze Telegram-groep.\n\nTik onderin op <b>💰 Mijn Saldo & Tegoed</b> of stuur /saldo voor je tegoed.`,
                reply_markup: tg.accountReplyKeyboard,
              })
              .catch(() => {})
            const { data: leads } = await supabaseAdmin
              .from('leads')
              .select('*')
              .eq('claimed_by', contractor.id)
              .eq('status', 'claimed')
              .order('claimed_at', { ascending: false })
              .limit(5)
            for (const lead of leads ?? []) {
              await tg
                .sendMessage({
                  chat_id: fromId,
                  text: tg.privateDetails(lead as any),
                  reply_markup: tg.leadDoneKeyboard(lead.id),
                })
                .catch(() => {})
              const { sendClaimedLeadPhotos } = await import('@/lib/lead-dispatch.server')
              await sendClaimedLeadPhotos(fromId, lead.id).catch(() => console.error('Claim photos delivery failed', lead.id))
            }
          }
          return Response.json({ ok: true })
        }


        // Nieuwe groepsleden verwelkomen en naar privéchat verwijzen
        const newMembers = msg?.new_chat_members
        if (Array.isArray(newMembers) && newMembers.length > 0) {
          const botUsername = process.env['TELEGRAM_BOT_USERNAME']
          if (!botUsername) {
            console.error('TELEGRAM_BOT_USERNAME is not configured')
            return Response.json({ ok: true, ignored: true })
          }
          for (const member of newMembers) {
            if (member?.is_bot) continue
            const firstName = typeof member?.first_name === 'string' ? member.first_name : 'nieuw lid'
            const userId = typeof member?.id === 'number' ? member.id : undefined
            const mention = userId
              ? `<a href="tg://user?id=${userId}">${tg.escapeHtml(firstName)}</a>`
              : tg.escapeHtml(firstName)
            await tg
              .sendMessage({
                chat_id: msg.chat.id,
                text: `Welkom ${mention} bij het VoltFix Leadnetwerk! ⚡\n\nOm straks de klant- en adresgegevens van geclaimde leads in je privébericht te ontvangen, moet je de bot eenmalig activeren.\n\n👉 Tik op de knop hieronder en druk onderin op START:`,
                reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: '⚡ Activeer LeadBot (Verplicht)',
                        url: `https://t.me/${botUsername}?start=welcome`,
                      },
                    ],
                  ],
                },
              })
              .catch((e) => console.error('welcome message failed', e))
          }
          return Response.json({ ok: true })
        }

        const cq = update?.callback_query
        if (!cq?.data || typeof cq.data !== 'string') {
          return Response.json({ ok: true, ignored: true })
        }

        // Monteur geeft de klus een duimpje: VoltFix krijgt privé de klant-
        // gegevens en een kant-en-klaar WhatsApp-reviewverzoek. De klant krijgt
        // nooit een Telegram-bericht.
        if (cq.data.startsWith('done:')) {
          const doneLeadId = cq.data.slice('done:'.length)
          const doneUserId = cq.from?.id as number | undefined
          const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
          const { data: contractor } = doneUserId
            ? await supabaseAdmin
                .from('contractors')
                .select('id, name')
                .eq('telegram_user_id', doneUserId)
                .maybeSingle()
            : { data: null }
          const { data: doneLead } = contractor
            ? await supabaseAdmin.from('leads').select('*').eq('id', doneLeadId).maybeSingle()
            : { data: null }

          if (!contractor || !doneLead || doneLead.claimed_by !== contractor.id) {
            await tg.answerCallbackQuery({
              callback_query_id: cq.id,
              text: 'Deze klus staat niet op jouw naam.',
              show_alert: true,
            })
            return Response.json({ ok: true })
          }

          const admin = tg.adminChatId()
          if (!admin) {
            console.error('TELEGRAM_ADMIN_CHAT_ID is not configured')
            await tg.answerCallbackQuery({
              callback_query_id: cq.id,
              text: 'Bedankt! We konden de melding nog niet doorzetten — VoltFix is op de hoogte.',
              show_alert: true,
            })
            return Response.json({ ok: true })
          }

          const { reviewHref } = await import('@/lib/business')
          const handoff = tg.reviewHandoffMessage(
            doneLead as any,
            contractor.name,
            reviewHref({ source: 'whatsapp', content: 'monteur-duimpje' }),
          )
          await tg
            .sendMessage({ chat_id: admin, text: handoff.text, reply_markup: handoff.reply_markup })
            .catch((e) => console.error('review handoff failed', e))
          // Zet de klus in de backoffice op "reviewverzoek open" (eerste keer telt).
          await supabaseAdmin
            .from('leads')
            .update({ review_requested_at: new Date().toISOString() })
            .eq('id', doneLeadId)
            .is('review_requested_at', null)
          await tg.answerCallbackQuery({
            callback_query_id: cq.id,
            text: 'Top! VoltFix vraagt de klant om een review.',
          })
          if (cq.message?.chat?.id && cq.message?.message_id) {
            await tg
              .removeLeadKeyboard({ chat_id: cq.message.chat.id, message_id: cq.message.message_id })
              .catch(() => {})
          }
          return Response.json({ ok: true })
        }

        // Monteur meldt een aanvraag als spam: lead blokkeren voor claimen en
        // in de backoffice op 'spam_review' zetten.
        if (cq.data.startsWith('spam:')) {
          const spamLeadId = cq.data.slice('spam:'.length)
          const reporterName =
            [cq.from?.first_name, cq.from?.last_name].filter(Boolean).join(' ') || 'een monteur'
          const reporterId = cq.from?.id as number | undefined
          const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
          // Alleen een geregistreerde, actieve monteur mag melden; de melding
          // wordt met naam en tijdstip vastgelegd.
          const { data: spamResult, error: spamError } = reporterId
            ? await supabaseAdmin.rpc('report_lead_spam', {
                _lead_id: spamLeadId,
                _telegram_user_id: reporterId,
                _reporter_name: reporterName,
              })
            : { data: null, error: null }
          const spam = spamResult as any
          const lead = spam?.ok ? spam.lead : null

          if (spamError || !lead) {
            const reasons: Record<string, string> = {
              not_registered: 'Je Telegram-account is nog niet gekoppeld. Neem contact op met VoltFix.',
              inactive: 'Je account staat op inactief. Neem contact op met VoltFix.',
            }
            await tg.answerCallbackQuery({
              callback_query_id: cq.id,
              text: reasons[spam?.reason as string] ?? 'Deze lead kan niet meer gemeld worden.',
              show_alert: true,
            })
            return Response.json({ ok: true })
          }

          const reporter = reporterName
          await tg.answerCallbackQuery({
            callback_query_id: cq.id,
            text: 'Bedankt! VoltFix controleert deze aanvraag.',
          })
          if (cq.message?.chat?.id && cq.message?.message_id) {
            await tg
              .editLeadMessage({
                chat_id: cq.message.chat.id,
                message_id: cq.message.message_id,
                text: tg.spamFlaggedText(lead as any, reporter),
                reply_markup: { inline_keyboard: [] },
              })
              .catch((e) => console.error('editLeadMessage (spam) failed', e))
          }
          return Response.json({ ok: true })
        }

        if (cq.data.startsWith('topup:')) {
          const euros = Number(cq.data.slice('topup:'.length))
          const fromId = cq.from?.id as number | undefined
          await tg.answerCallbackQuery({ callback_query_id: cq.id })
          if (fromId && Number.isFinite(euros) && euros > 0) {
            const { createTopupCheckout } = await import('@/lib/topup.server')
            const url = await createTopupCheckout(fromId, euros).catch((e) => {
              console.error('createTopupCheckout failed', e)
              return null
            })
            await tg
              .sendMessage({
                chat_id: fromId,
                text: url
                  ? `💳 Waardeer €${euros} ex. btw op via onderstaande link (21% btw wordt bij het afrekenen toegevoegd).`
                  : 'Opwaarderen lukt nu niet. Neem contact op met VoltFix.',
                ...(url
                  ? {
                      reply_markup: {
                        inline_keyboard: [[{ text: `Betaal €${euros} ex. btw`, url }]],
                      },
                    }
                  : {}),
              })
              .catch(() => {})
          }
          return Response.json({ ok: true })
        }

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
            spam_review: 'Deze lead is gemeld als spam en wordt gecontroleerd.',

            insufficient_balance: `Onvoldoende saldo (${tg.euroExVat(result?.balance_cents ?? 0)}). Deze lead kost ${tg.euroExVat(result?.price_cents ?? 0)}. Waardeer op met minimaal €100 ex. btw.`,
          }
          const text = messages[result?.reason as string] ?? 'Claim niet gelukt.'
          await tg.answerCallbackQuery({ callback_query_id: cq.id, text, show_alert: true })

          // Herstel oude groepsberichten waarvan de knop na een eerdere claim
          // zichtbaar bleef doordat Telegram de lange tekst niet kon wijzigen.
          if (result?.reason === 'already_claimed' && cq.message?.chat?.id && cq.message?.message_id) {
            await tg
              .removeLeadKeyboard({
                chat_id: cq.message.chat.id,
                message_id: cq.message.message_id,
              })
              .catch((e) => console.error('removeLeadKeyboard (already claimed) failed', e))
          }

          if (result?.reason === 'insufficient_balance') {
            await tg
              .sendMessage({
                chat_id: telegramUserId,
                text: `❌ <b>Onvoldoende saldo (${tg.euroExVat(result.balance_cents ?? 0)}).</b>\n\nDeze lead kost ${tg.euroExVat(result.price_cents ?? 0)}. Waardeer je account op met minimaal €100 ex. btw om weer leads te ontvangen:`,
                reply_markup: tg.topupKeyboard(),
              })
              .catch(() => {})
          }
          return Response.json({ ok: true })
        }

        const lead = result.lead as tgLead
        const contractorName = result.contractor_name as string

        // Een mislukte bevestigingspopup mag de aflevering nooit blokkeren.
        await tg
          .answerCallbackQuery({
            callback_query_id: cq.id,
            text: result.resumed
              ? 'Je had deze lead al. We sturen de gegevens opnieuw.'
              : 'Lead geclaimd! Check je privéchat.',
          })
          .catch((e) => console.error('answerCallbackQuery (claim) failed', e))

        if (cq.message?.chat?.id && cq.message?.message_id) {
          // Verwijder eerst de knoppen. Dit is een kleine, betrouwbare update
          // en voorkomt dat anderen nog op Accepteren kunnen tikken wanneer de
          // langere tekst- of captionupdate door Telegram wordt geweigerd.
          await tg
            .removeLeadKeyboard({
              chat_id: cq.message.chat.id,
              message_id: cq.message.message_id,
            })
            .catch((e) => console.error('removeLeadKeyboard failed', e))

          await tg
            .editLeadMessage({
              chat_id: cq.message.chat.id,
              message_id: cq.message.message_id,
              text: tg.claimedText(lead, contractorName),
              reply_markup: { inline_keyboard: [] },
            })
            .catch((e) => console.error('editLeadMessage failed', e))
        }

        // De leveringstaak is in dezelfde transactie als de afschrijving
        // aangemaakt. Lukt de directe aflevering niet, dan blijft de taak in de
        // wachtrij staan en probeert de herstelhook het opnieuw.
        const { tryDeliverClaimNow } = await import('@/lib/lead-delivery.server')
        const { delivered } = await tryDeliverClaimNow(supabaseAdmin, lead.id)
        if (!delivered) {
          // Bot mag geen chat starten: vraag in de groep om de bot te openen.
          if (cq.message?.chat?.id) {
            await tg
              .sendMessage({
                chat_id: cq.message.chat.id,
                text: `⚠️ ${tg.escapeHtml(contractorName)}: open eerst een privéchat met deze bot en stuur <b>/start</b>. Daarna krijg je de klantgegevens direct toegestuurd.`,
              })
              .catch(() => {})
          }
        }

        // Waarschuwing als het resterende saldo €20 of lager is, of te laag
        // voor een volgende lead. Alleen bij het passeren van de grens sturen,
        // zodat een zzp'er niet bij elke claim dezelfde melding krijgt.
        const newBalance = Number(result.balance_cents ?? 0)
        const priceCents = Number(lead.price_cents ?? 0)
        const prevBalance = newBalance + priceCents
        const LOW_BALANCE_CENTS = 2000
        const wasLow = prevBalance <= LOW_BALANCE_CENTS || prevBalance < priceCents * 2
        const isLow = newBalance <= LOW_BALANCE_CENTS || newBalance < priceCents
        if (isLow && !wasLow) {
          await tg
            .sendMessage({
              chat_id: telegramUserId,
              text: `⚠️ Je saldo is nu ${tg.euroExVat(newBalance)}. Waardeer tijdig op (min. €100 ex. btw) om geen volgende leads te missen!`,
              reply_markup: tg.topupKeyboard(),
            })
            .catch(() => {})
        }

        return Response.json({ ok: true })
      },
    },
  },
})

type tgLead = import('@/lib/telegram.server').LeadRow

type TgModule = typeof import('@/lib/telegram.server')

async function sendAccountSummary(telegramUserId: number, tg: TgModule) {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const { data: contractor } = await supabaseAdmin
    .from('contractors')
    .select('id, balance_cents')
    .eq('telegram_user_id', telegramUserId)
    .maybeSingle()

  if (!contractor) {
    await tg
      .sendMessage({
        chat_id: telegramUserId,
        text: 'Je Telegram-account is nog niet gekoppeld aan VoltFix. Neem contact op met VoltFix.',
      })
      .catch(() => {})
    return
  }

  const [{ count }, { data: settings }] = await Promise.all([
    supabaseAdmin
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('claimed_by', contractor.id)
      .eq('status', 'claimed'),
    supabaseAdmin.from('lead_settings').select('default_price_cents').eq('id', 1).maybeSingle(),
  ])

  await tg
    .sendMessage({
      chat_id: telegramUserId,
      text: tg.accountSummary({
        balanceCents: contractor.balance_cents ?? 0,
        leadsClaimed: count ?? 0,
        leadPriceCents: settings?.default_price_cents ?? 1000,
      }),
      reply_markup: tg.topupKeyboard(),
    })
    .catch(() => {})
}
