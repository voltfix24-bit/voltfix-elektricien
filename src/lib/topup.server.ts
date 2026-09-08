// Server-only: opwaarderen van ZZP-tegoed via de ingebouwde betalingen.

import { createStripeClient, type StripeEnv } from '@/lib/stripe.server'

export function paymentsEnv(): StripeEnv {
  return process.env['STRIPE_LIVE_API_KEY'] ? 'live' : 'sandbox'
}

function siteOrigin(): string {
  return (
    process.env['PUBLIC_SITE_URL'] ??
    'https://project--44824aa3-8135-44e1-a592-63fc39da8084-dev.lovable.app'
  )
}

/**
 * Maakt een betaallink voor een opwaardering. Geeft de checkout-URL terug of
 * null wanneer de monteur niet gekoppeld is.
 */
export async function createTopupCheckout(
  telegramUserId: number,
  euros: number,
): Promise<string | null> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const { data: contractor } = await supabaseAdmin
    .from('contractors')
    .select('id, name, email')
    .eq('telegram_user_id', telegramUserId)
    .maybeSingle()
  if (!contractor) return null

  const amountCents = Math.round(euros * 100)
  const stripe = createStripeClient(paymentsEnv())
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    ui_mode: 'embedded_page',
    return_url: `${siteOrigin()}/topup-klaar?session_id={CHECKOUT_SESSION_ID}`,
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: { name: `VoltFix leadtegoed €${euros}` },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
    payment_intent_data: { description: `VoltFix leadtegoed ${contractor.name}` },
    ...(contractor.email ? { customer_email: contractor.email } : {}),
    metadata: {
      kind: 'contractor_topup',
      contractor_id: contractor.id,
      telegram_user_id: String(telegramUserId),
      amount_cents: String(amountCents),
    },
  })

  return session.url ?? null
}

/** Boekt een geslaagde betaling bij op het tegoed (idempotent per sessie). */
export async function creditTopup(session: any): Promise<void> {
  const meta = session?.metadata ?? {}
  if (meta.kind !== 'contractor_topup') return
  const contractorId = meta.contractor_id as string | undefined
  const amountCents = Number(meta.amount_cents)
  if (!contractorId || !Number.isFinite(amountCents) || amountCents <= 0) return

  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const paymentRef = `payment:${session.id}`

  const { data: existing } = await supabaseAdmin
    .from('contractor_transactions')
    .select('id')
    .eq('contractor_id', contractorId)
    .eq('note', paymentRef)
    .maybeSingle()
  if (existing) return

  const { data: contractor } = await supabaseAdmin
    .from('contractors')
    .select('id, balance_cents, telegram_user_id')
    .eq('id', contractorId)
    .maybeSingle()
  if (!contractor) return

  const newBalance = (contractor.balance_cents ?? 0) + amountCents
  await supabaseAdmin.from('contractors').update({ balance_cents: newBalance }).eq('id', contractorId)
  await supabaseAdmin.from('contractor_transactions').insert({
    contractor_id: contractorId,
    amount_cents: amountCents,
    balance_after_cents: newBalance,
    kind: 'topup',
    note: paymentRef,
  })

  if (contractor.telegram_user_id) {
    const tg = await import('@/lib/telegram.server')
    await tg
      .sendMessage({
        chat_id: contractor.telegram_user_id,
        text: `✅ Betaling ontvangen! Je saldo is verhoogd met ${tg.euro(amountCents)}.\n\nNieuw saldo: <b>${tg.euro(newBalance)}</b>`,
      })
      .catch(() => {})
  }
}
