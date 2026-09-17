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

        // Zelf ingetypte tijd: antwoord op de vraag "Typ de tijd ...".
        const replyText = typeof msg?.reply_to_message?.text === 'string' ? msg.reply_to_message.text : ''
        if (msg?.chat?.type === 'private' && msg?.from?.id && msgText && replyText.includes(tg.SCHEDULE_TIME_PROMPT)) {
          // De vraag draagt zelf de dag én de klus mee, zodat het antwoord
          // nooit bij een andere openstaande klus van dezelfde monteur landt.
          const target = tg.schedulePromptTarget(replyText)
          const schedule = await import('@/lib/lead-schedule')
          const time = schedule.parseTimeInput(msgText)
          const chatId = msg.from.id as number
          const day = target?.day ?? ''
          if (!target || !schedule.isValidDay(day)) {
            await tg.sendMessage({ chat_id: chatId, text: 'Deze vraag is verlopen. Kies opnieuw een dag via de knoppen.' }).catch(() => {})
            return Response.json({ ok: true })
          }
          if (!time) {
            await tg
              .sendMessage({ chat_id: chatId, text: 'Dat lukte niet. Typ een tijd tussen 06:00 en 22:00, bijvoorbeeld 14:15.', reply_markup: { force_reply: true, input_field_placeholder: '14:15' } })
              .catch(() => {})
            return Response.json({ ok: true })
          }
          const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
          const { data: who } = await supabaseAdmin.from('contractors').select('id, name').eq('telegram_user_id', chatId).maybeSingle()
          const { data: openLead } = who
            ? await supabaseAdmin
                .from('leads')
                .select('*')
                .eq('id', target.leadId)
                .eq('claimed_by', who.id)
                .eq('status', 'claimed')
                .maybeSingle()
            : { data: null }
          if (!who || !openLead) {
            await tg.sendMessage({ chat_id: chatId, text: 'Deze klus staat niet (meer) op jouw naam om in te plannen.' }).catch(() => {})
            return Response.json({ ok: true })
          }
          const iso = schedule.toScheduleIso(day, time)
          const { saveSchedule } = await import('@/lib/lead-schedule.server')
          const saved = await saveSchedule({ leadId: openLead.id, iso, by: who.name ?? 'Monteur', actorId: who.id, slot: null })
          await tg
            .sendMessage({
              chat_id: chatId,
              text: saved.ok
                ? `Genoteerd: <b>${tg.escapeHtml(schedule.scheduleText(iso))}</b>.`
                : saved.conflictBy
                  ? `Deze klus is al ingepland door ${tg.escapeHtml(saved.conflictBy)}.`
                  : 'Opslaan lukte niet. Probeer het opnieuw.',
            })
            .catch(() => {})
          if (saved.ok) {
            const { sendAppointment } = await import('@/lib/lead-schedule.server')
            await sendAppointment(chatId, openLead, iso, null)
          }
          return Response.json({ ok: true })
        }

        // Bewijs wordt uitsluitend in de privéchat verwerkt. De actieve stap
        // komt uit de database, nooit uit losse chattekst of een groepsbericht.
        if (msg?.chat?.type === 'private' && msg?.from?.id && !msgText.startsWith('/') && msgText !== 'Mijn Saldo & Tegoed' && msgText !== '💰 Mijn Saldo & Tegoed') {
          const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
          const { data: contractor } = await supabaseAdmin
            .from('contractors').select('id, is_active').eq('telegram_user_id', msg.from.id).maybeSingle()
          const { data: proof } = contractor?.is_active
            ? await supabaseAdmin.from('lead_completion_proofs').select('*').eq('contractor_id', contractor.id).neq('state', 'complete').order('started_at', { ascending: false }).limit(1).maybeSingle()
            : { data: null }
          if (contractor && proof) {
            const completion = await import('@/lib/completion-proof.server')
            if (proof.state === 'awaiting_before_reason' && msgText) {
              const saved = await completion.saveBeforeSkipReason(proof.lead_id, contractor.id, msgText)
              await tg.sendMessage({ chat_id: msg.from.id, text: saved ? 'Reden genoteerd. Stuur nu een foto van het resultaat.' : 'Geef de reden in één korte regel.' }).catch(() => {})
              return Response.json({ ok: true })
            }
            const photos = Array.isArray(msg.photo) ? msg.photo : []
            const fileId = photos.length ? photos[photos.length - 1]?.file_id : undefined
            if (fileId && (proof.state === 'awaiting_before' || proof.state === 'awaiting_result')) {
              try {
                const kind = proof.state === 'awaiting_before' ? 'before' : 'result'
                const saved = await completion.saveProofPhoto({ leadId: proof.lead_id, contractorId: contractor.id, kind, fileId })
                if (!saved.ok) return Response.json({ ok: true })
                if (kind === 'before') {
                  await tg.sendMessage({ chat_id: msg.from.id, text: 'Foto vóór opgeslagen. Stuur nu een foto van het resultaat.' })
                } else {
                  const url = await completion.createSignatureLink(proof.lead_id, contractor.id)
                  await tg.sendMessage({ chat_id: msg.from.id, text: 'Resultaat opgeslagen. Open de pagina op je telefoon en laat de klant tekenen.', reply_markup: tg.signatureKeyboard(url) })
                }
              } catch (error) {
                console.error('completion proof photo failed', error)
                await tg.sendMessage({ chat_id: msg.from.id, text: 'Deze foto kon niet veilig worden opgeslagen. Stuur een JPG-, PNG- of WebP-foto tot 12 MB.' }).catch(() => {})
              }
              return Response.json({ ok: true })
            }
          }
        }

        // Saldo-overzicht in privéchat (commando of menuknop).
        if (
          msgText.startsWith('/saldo') ||
          msgText.startsWith('/account') ||
          msgText === 'Mijn Saldo & Tegoed' ||
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
            // Deze persoon staat per definitie nog niet in de database, dus de
            // testrouting kan hem niet herkennen; het is onboarding naar een
            // privéchat en dus nooit een bericht aan de monteursgroep.
            if (!contractor) {
              await tg
                .sendMessage({
                  chat_id: fromId,
                  text:
                    `<b>Welkom bij VoltFix.</b>\n\nOm klussen te claimen en je €50 welkomstkrediet te ontvangen, dien je je eenmalig te registreren:\n\n` +
                    `https://voltfix.nl/onboarding?telegram_id=${fromId}`,
                  routing: { event: 'onboarding_start', productionSafe: true },
                })
                .catch((e) => console.error('registratielink niet bezorgd', fromId, e))
              return Response.json({ ok: true })
            }

            if (!contractor.is_active) {
              await tg
                .sendMessage({
                  chat_id: fromId,
                  text: 'Je aanmelding is ontvangen en wordt gecontroleerd. Zodra je account is goedgekeurd, staat je €50 startkrediet klaar.',
                  routing: { event: 'onboarding_pending', contractor },
                })
                .catch((e) => console.error('wachtbericht niet bezorgd', fromId, e))
              return Response.json({ ok: true })
            }

            await tg
              .sendMessage({
                chat_id: fromId,
                  text: `Je bent al geregistreerd! Je saldo is ${tg.euroExVat(contractor.balance_cents ?? 0)}. Je kunt leads claimen in onze Telegram-groep.\n\nTik onderin op <b>Mijn Saldo & Tegoed</b> of stuur /saldo voor je tegoed.`,
                reply_markup: tg.accountReplyKeyboard,
                routing: { event: 'account_overview', contractor },
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
                  text: tg.privateDetails(lead as any, { balanceCents: contractor.balance_cents ?? null }),
                  reply_markup: tg.claimedLeadKeyboard(lead as any),
                  routing: { event: 'start_claimed_leads', lead: lead as any, contractor },
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
                text: `<b>Welkom ${mention} bij het VoltFix Leadnetwerk.</b>\n\nOm straks de klant- en adresgegevens van geclaimde leads in je privébericht te ontvangen, moet je de bot eenmalig activeren.\n\nTik op de knop hieronder en druk onderin op START:`,
                reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: 'Activeer LeadBot (verplicht)',
                        url: `https://t.me/${botUsername}?start=welcome`,
                      },
                    ],
                  ],
                },
                // Een nieuw groepslid staat nog niet in de database; zonder deze
                // markering hield de testbeveiliging het welkomstbericht tegen
                // en kon niemand de bot activeren.
                routing: { event: 'group_welcome', productionSafe: true },
              })
              .catch((e) => console.error('welkomstbericht niet bezorgd', e))
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
        // Onderweg: hetzelfde privébericht wordt bijgewerkt, niet aangevuld.
        if (cq.data.startsWith('otw:') || cq.data.startsWith('out:')) {
          const isOtw = cq.data.startsWith('otw:')
          const rest = cq.data.slice(isOtw ? 'otw:'.length : 'out:'.length)
          const kind = isOtw ? 'otw' : rest.slice(0, rest.indexOf(':'))
          const targetId = isOtw ? rest : rest.slice(rest.indexOf(':') + 1)
          const actorId = cq.from?.id as number | undefined
          const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
          const { data: who } = actorId
            ? await supabaseAdmin.from('contractors').select('id, name, balance_cents').eq('telegram_user_id', actorId).maybeSingle()
            : { data: null }
          const { data: theLead } = who
            ? await supabaseAdmin.from('leads').select('*').eq('id', targetId).maybeSingle()
            : { data: null }
          if (!who || !theLead || theLead.claimed_by !== who.id) {
            await tg.answerCallbackQuery({ callback_query_id: cq.id, text: 'Deze klus staat niet op jouw naam.', show_alert: true })
            return Response.json({ ok: true })
          }

          const labels: Record<string, string> = {
            otw: 'Onderweg',
            declined: 'Klant zag ervan af',
            price: 'Prijs niet akkoord',
            noreach: 'Klant onbereikbaar',
          }
          const state = labels[kind] ?? 'Bijgewerkt'
          // Afloop vastleggen op de lead zelf; alleen de eerste keer telt.
          const outcomeByKind: Record<string, 'declined' | 'no_deal' | 'unreachable'> = {
            declined: 'declined',
            price: 'no_deal',
            noreach: 'unreachable',
          }
          const outcome = outcomeByKind[kind]
          if (outcome) {
            await supabaseAdmin
              .from('leads')
              .update({ outcome, outcome_at: new Date().toISOString(), next_step_at: null, next_step_kind: null })
              .eq('id', theLead.id)
              .is('outcome', null)
          }
          await supabaseAdmin
            .from('lead_audit_logs')
            .insert({ lead_id: theLead.id, action: kind === 'otw' ? 'on_the_way' : `outcome_${kind}`, changes: { by: who.name, outcome: outcome ?? null } as any })
            .then(undefined, (e: unknown) => console.error('audit log failed', e))

          if (cq.message?.chat?.id && cq.message?.message_id) {
            await tg
              .editLeadMessage({
                chat_id: cq.message.chat.id,
                message_id: cq.message.message_id,
                text: tg.privateDetails(theLead as any, { balanceCents: who.balance_cents ?? null, state }),
                reply_markup: kind === 'otw' ? tg.leadOutcomeKeyboard(theLead.id) : { inline_keyboard: [] },
              })
              .catch((e) => console.error('editLeadMessage (outcome) failed', e))
          }

          if (kind !== 'otw') {
            const admin = tg.adminChatId(theLead)
            if (admin) {
              await tg
                .sendMessage({ chat_id: admin, text: `${tg.escapeHtml(state)} — ${tg.escapeHtml(who.name)}\nLead ${theLead.id.slice(0, 8)}`, routing: { event: 'lead_outcome', lead: theLead, contractor: who } })
                .catch((e) => console.error('outcome notify failed', e))
            }
          }
          await tg.answerCallbackQuery({ callback_query_id: cq.id, text: `${state} genoteerd.` })
          return Response.json({ ok: true })
        }

        if (cq.data.startsWith('proofskip:')) {
          const leadId = cq.data.slice('proofskip:'.length)
          const userId = cq.from?.id as number | undefined
          const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
          const { data: contractor } = userId ? await supabaseAdmin.from('contractors').select('id').eq('telegram_user_id', userId).eq('is_active', true).maybeSingle() : { data: null }
          const { data: lead } = contractor ? await supabaseAdmin.from('leads').select('claimed_by').eq('id', leadId).maybeSingle() : { data: null }
          if (!contractor || lead?.claimed_by !== contractor.id) {
            await tg.answerCallbackQuery({ callback_query_id: cq.id, text: 'Deze klus staat niet op jouw naam.', show_alert: true })
            return Response.json({ ok: true })
          }
          const { skipBeforePhoto } = await import('@/lib/completion-proof.server')
          await skipBeforePhoto(leadId, contractor.id)
          await tg.answerCallbackQuery({ callback_query_id: cq.id, text: 'Geef nu kort de reden.' })
          if (userId) await tg.sendMessage({ chat_id: userId, text: 'Waarom was een foto vóór niet mogelijk? Stuur de reden in één korte regel.' }).catch(() => {})
          return Response.json({ ok: true })
        }

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

          const { startCompletionProof } = await import('@/lib/completion-proof.server')
          const proof = await startCompletionProof(doneLeadId, contractor.id)
          await tg.answerCallbackQuery({
            callback_query_id: cq.id,
            text: proof.state === 'complete' ? 'Deze klus is al afgerond.' : 'We gaan de afronding vastleggen in je privéchat.',
          })
          if (doneUserId && proof.state !== 'complete') await tg.sendMessage({ chat_id: doneUserId, text: 'Stuur een foto van de situatie vóór het werk.', reply_markup: tg.beforePhotoKeyboard(doneLeadId) }).catch(() => {})
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
                routing: { event: 'spam_group_update', lead },
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
                  ? `<b>Opwaarderen:</b> €${euros} ex. btw via onderstaande link (21% btw wordt bij het afrekenen toegevoegd).`
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

        // Plandatum: de monteur kiest eerst een dag, daarna een half uur.
        if (cq.data.startsWith('sd:') || cq.data.startsWith('st:') || cq.data.startsWith('sm:')) {
          const isDay = cq.data.startsWith('sd:')
          const isManual = cq.data.startsWith('sm:')
          const parts = cq.data.slice(3).split(':')
          const targetId = parts[0]!
          const actorId = cq.from?.id as number | undefined
          const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
          const { data: who } = actorId
            ? await supabaseAdmin.from('contractors').select('id, name').eq('telegram_user_id', actorId).maybeSingle()
            : { data: null }
          const { data: theLead } = who
            ? await supabaseAdmin.from('leads').select('*').eq('id', targetId).maybeSingle()
            : { data: null }
          if (!who || !theLead || theLead.claimed_by !== who.id) {
            await tg.answerCallbackQuery({ callback_query_id: cq.id, text: 'Deze klus staat niet op jouw naam.', show_alert: true })
            return Response.json({ ok: true })
          }

          const schedule = await import('@/lib/lead-schedule')
          const { askScheduleDay, askScheduleSlot, saveSchedule } = await import('@/lib/lead-schedule.server')

          if (isManual) {
            const day = parts[1] ?? ''
            if (!schedule.isValidDay(day)) {
              await tg.answerCallbackQuery({ callback_query_id: cq.id })
              await askScheduleDay(actorId!, theLead)
              return Response.json({ ok: true })
            }
            await tg.answerCallbackQuery({ callback_query_id: cq.id })
            await tg
              .sendMessage({
                chat_id: actorId!,
                text: tg.scheduleTimePromptText(day, String(theLead.id)),
                reply_markup: { force_reply: true, input_field_placeholder: '14:15' },
              })
              .catch((e) => console.error('time prompt failed', e))
            return Response.json({ ok: true })
          }

          if (isDay) {
            const day = parts[1] ?? ''
            if (day === 'other') {
              await tg.answerCallbackQuery({ callback_query_id: cq.id })
              await tg
                .sendMessage({
                  chat_id: actorId!,
                  text: 'Een andere datum regelt kantoor. Bel VoltFix even, dan zetten we hem erin.',
                })
                .catch(() => {})
              return Response.json({ ok: true })
            }
            if (day === 'back' || !schedule.isValidDay(day)) {
              await tg.answerCallbackQuery({ callback_query_id: cq.id })
              await askScheduleDay(actorId!, theLead)
              return Response.json({ ok: true })
            }
            await tg.answerCallbackQuery({ callback_query_id: cq.id })
            await askScheduleSlot(actorId!, theLead, day).catch((e) => console.error('askScheduleSlot failed', e))
            return Response.json({ ok: true })
          }

          const day = parts[1] ?? ''
          // Het tijdvak kan zelf dubbele punten bevatten ("09:30"): alles na de dag hoort erbij.
          const slot = parts.slice(2).join(':')
          const startTime = schedule.slotStartTime(slot)
          if (!schedule.isValidDay(day) || !startTime) {
            await tg.answerCallbackQuery({ callback_query_id: cq.id, text: 'Kies opnieuw een dag en tijd.', show_alert: true })
            return Response.json({ ok: true })
          }
          const iso = schedule.toScheduleIso(day, startTime)
          const saved = await saveSchedule({ leadId: theLead.id, iso, by: who.name ?? 'Monteur', actorId: who.id, slot })
          if (!saved.ok) {
            await tg.answerCallbackQuery({
              callback_query_id: cq.id,
              text: saved.conflictBy ? `Al ingepland door ${saved.conflictBy}.` : 'Opslaan lukte niet. Probeer het opnieuw.',
              show_alert: true,
            })
            return Response.json({ ok: true })
          }
          await tg.answerCallbackQuery({ callback_query_id: cq.id, text: `Ingepland: ${schedule.scheduleText(iso)}` })
          await tg
            .sendMessage({
              chat_id: actorId!,
              text: saved.previous
                ? `Gewijzigd: ${tg.escapeHtml(schedule.scheduleText(saved.previous))} wordt <b>${tg.escapeHtml(schedule.scheduleText(iso))}</b>.`
                : `Genoteerd: <b>${tg.escapeHtml(schedule.scheduleText(iso))}</b>${schedule.slotLabel(slot) ? ` (${tg.escapeHtml(schedule.slotLabel(slot))})` : ''}.`,
            })
            .catch(() => {})
          const { sendAppointment } = await import('@/lib/lead-schedule.server')
          await sendAppointment(actorId!, theLead, iso, slot)
          return Response.json({ ok: true })
        }

        // Afwijzen: de klus blijft in de groep staan voor de anderen. We leggen
        // alleen vast wie hem niet wil, zodat kantoor ziet of niemand hem wil.
        if (cq.data.startsWith('skip:')) {
          const skipLeadId = cq.data.slice('skip:'.length)
          const fromId = cq.from?.id as number | undefined
          const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
          const { data: who } = fromId
            ? await supabaseAdmin.from('contractors').select('id, name, is_test').eq('telegram_user_id', fromId).maybeSingle()
            : { data: null }
          if (!who) {
            await tg.answerCallbackQuery({ callback_query_id: cq.id, text: 'Je Telegram-account is nog niet gekoppeld. Neem contact op met VoltFix.', show_alert: true })
            return Response.json({ ok: true })
          }
          const { data: skipLead } = await supabaseAdmin
            .from('leads')
            .select('id, ref_number, job_type, city, status, claimed_by, price_cents, is_test')
            .eq('id', skipLeadId)
            .maybeSingle()
          if (!skipLead) {
            await tg.answerCallbackQuery({ callback_query_id: cq.id, text: 'Deze lead bestaat niet meer.', show_alert: true })
            return Response.json({ ok: true })
          }
          if (skipLead.claimed_by) {
            await tg.answerCallbackQuery({ callback_query_id: cq.id, text: 'Deze klus is al aangenomen.', show_alert: true })
            return Response.json({ ok: true })
          }

          const { data: history } = await supabaseAdmin
            .from('lead_audit_logs')
            .select('action, changes')
            .eq('lead_id', skipLead.id)
            .in('action', ['contractor_declined', 'declined_by_all'])
          const rows = history ?? []
          const declined = new Set(
            rows
              .filter((row) => row.action === 'contractor_declined')
              .map((row) => (row.changes as any)?.contractor_id as string | undefined)
              .filter((id): id is string => Boolean(id)),
          )
          if (!declined.has(who.id)) {
            await supabaseAdmin
              .from('lead_audit_logs')
              .insert({
                lead_id: skipLead.id,
                action: 'contractor_declined',
                changes: { contractor_id: who.id, by: who.name } as any,
              })
              .then(undefined, (e: unknown) => console.error('afwijzing vastleggen mislukt', e))
            declined.add(who.id)
          }
          await tg.answerCallbackQuery({
            callback_query_id: cq.id,
            text: 'Genoteerd. De klus blijft voor de anderen beschikbaar.',
          })

          // Wil niemand hem, dan is er iets mis met de klus of de prijs. Eén
          // melding aan de beheerder, niet bij elke volgende druk opnieuw.
          const alreadyWarned = rows.some((row) => row.action === 'declined_by_all')
          if (!alreadyWarned) {
            const { data: actives } = await supabaseAdmin
              .from('contractors')
              .select('id')
              .eq('is_active', true)
              .eq('is_test', Boolean(skipLead.is_test))
            const pool = (actives ?? []).map((row) => row.id)
            if (pool.length > 0 && pool.every((id) => declined.has(id))) {
              await supabaseAdmin
                .from('lead_audit_logs')
                .insert({ lead_id: skipLead.id, action: 'declined_by_all', changes: { count: pool.length } as any })
                .then(undefined, (e: unknown) => console.error('afwijzing-iedereen vastleggen mislukt', e))
              const admin = tg.adminChatId(skipLead)
              if (admin) {
                await tg
                  .sendMessage({
                    chat_id: admin,
                    text:
                      `<b>Door iedereen afgewezen</b>\n` +
                      `${tg.escapeHtml(skipLead.job_type ?? 'Klus')}${skipLead.city ? ` · ${tg.escapeHtml(skipLead.city)}` : ''}${skipLead.ref_number ? ` · #${skipLead.ref_number}` : ''}\n` +
                      `Alle ${pool.length} actieve monteurs hebben deze klus afgewezen. Kijk naar de prijs, het werk of de locatie.`,
                    routing: { event: 'lead_declined_by_all', lead: skipLead, contractor: who },
                  })
                  .catch((e) => console.error('melding iedereen-afgewezen mislukt', e))
              }
            }
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
          // Voorrangsregel: wie wacht, moet kunnen zien waarom.
          if (result?.reason === 'too_early') {
            const { tooEarlyNotice } = await import('@/lib/claim-priority')
            await tg.answerCallbackQuery({
              callback_query_id: cq.id,
              text: tooEarlyNotice(Number(result.seconds_left ?? 0), (result.since as string | null) ?? null),
              show_alert: true,
            })
            return Response.json({ ok: true })
          }
          // Harde rem: gepland werk zonder dag en tijd blokkeert een tweede
          // geplande klus. Storingen laat de database wél door.
          if (result?.reason === 'schedule_missing') {
            const blockingLeadId = typeof result.blocking_lead_id === 'string' ? result.blocking_lead_id : ''
            let promptSent = false
            if (blockingLeadId) {
              const { data: blockingLead } = await supabaseAdmin
                .from('leads')
                .select('id, ref_number, job_type, customer_name, customer_phone, address, postal_code, city, description')
                .eq('id', blockingLeadId)
                .maybeSingle()
              if (blockingLead) {
                const { askScheduleDay } = await import('@/lib/lead-schedule.server')
                promptSent = await askScheduleDay(telegramUserId, blockingLead, true)
              }
            }
            await tg.answerCallbackQuery({
              callback_query_id: cq.id,
              text: promptSent
                ? 'Geef eerst dag en tijd door voor je open klus. De klusgegevens en keuzeknoppen staan opnieuw in je privéchat.'
                : 'Geef eerst dag en tijd door voor je open klus. Open de privéchat met VoltFix Bot en probeer opnieuw.',
              show_alert: true,
            })
            return Response.json({ ok: true })
          }
          const messages: Record<string, string> = {
            not_registered: 'Je Telegram-account is nog niet gekoppeld. Neem contact op met VoltFix.',
            inactive: 'Je account staat op inactief. Neem contact op met VoltFix.',
            not_found: 'Deze lead bestaat niet meer.',
            already_claimed: 'Deze lead is al door iemand anders geclaimd.',
            cancelled: 'Deze lead is geannuleerd.',
            spam_review: 'Deze lead is gemeld als spam en wordt gecontroleerd.',

            insufficient_balance: `Onvoldoende saldo (${tg.euroExVat(result?.balance_cents ?? 0)}). Deze lead kost ${tg.euroExVat(result?.price_cents ?? 0)} — je komt ${tg.euroExVat(Math.max(0, Number(result?.price_cents ?? 0) - Number(result?.balance_cents ?? 0)))} tekort. Waardeer op met minimaal €100 ex. btw.`,
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
                routing: { event: 'already_claimed_group_update', leadId },
              })
              .catch((e) => console.error('removeLeadKeyboard (already claimed) failed', e))
          }

          if (result?.reason === 'insufficient_balance') {
            await tg
              .sendMessage({
                chat_id: telegramUserId,
                text: `<b>Onvoldoende saldo (${tg.euroExVat(result.balance_cents ?? 0)}).</b>\n\nDeze lead kost ${tg.euroExVat(result.price_cents ?? 0)} — je komt ${tg.euroExVat(Math.max(0, Number(result.price_cents ?? 0) - Number(result.balance_cents ?? 0)))} tekort. Waardeer je account op met minimaal €100 ex. btw om weer leads te ontvangen:`,
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
              routing: { event: 'claim_group_keyboard', lead },
            })
            .catch((e) => console.error('removeLeadKeyboard failed', e))

          await tg
            .editLeadMessage({
              chat_id: cq.message.chat.id,
              message_id: cq.message.message_id,
              text: tg.claimedText(lead, contractorName),
              reply_markup: { inline_keyboard: [] },
              routing: { event: 'claim_group_update', lead },
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
                text: `<b>${tg.escapeHtml(contractorName)}:</b> open eerst een privéchat met deze bot en stuur <b>/start</b>. Daarna krijg je de klantgegevens direct toegestuurd.`,
                routing: { event: 'claim_delivery_warning', lead },
              })
              .catch(() => {})
          }
        }

        // Gepland werk: vraag direct om dag en tijd. Zonder antwoord vraagt de
        // bot het over vier uur nog één keer, daarna is het aan kantoor.
        if (result.planned && !(lead as any).scheduled_at) {
          const { askScheduleDay } = await import('@/lib/lead-schedule.server')
          const asked = await askScheduleDay(telegramUserId, lead)
          if (asked) {
            await supabaseAdmin
              .from('leads')
              .update({ schedule_prompt_count: 1, schedule_prompt_at: new Date().toISOString() })
              .eq('id', lead.id)
              .then(undefined, (e: unknown) => console.error('schedule prompt bookkeeping failed', e))
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
              text: `<b>Laag saldo:</b> je saldo is nu ${tg.euroExVat(newBalance)}. Waardeer tijdig op (min. €100 ex. btw) om geen volgende leads te missen.`,
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
    .select('id, balance_cents, is_test, name')
    .eq('telegram_user_id', telegramUserId)
    .maybeSingle()

  if (!contractor) {
    await tg
      .sendMessage({
        chat_id: telegramUserId,
        // Onbekende afzender: de router kan hem niet opzoeken, maar dit is een
        // privéantwoord en nooit een bericht aan de monteursgroep.
        text: 'Je Telegram-account is nog niet gekoppeld aan VoltFix. Neem contact op met VoltFix.',
        routing: { event: 'unlinked_account_notice', productionSafe: true },
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
      routing: { event: 'account_summary', contractor },
    })
    .catch(() => {})
}
