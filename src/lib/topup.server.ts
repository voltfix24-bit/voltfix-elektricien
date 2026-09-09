// Server-only: opwaarderen van ZZP-tegoed via de ingebouwde betalingen.

import { createStripeClient, type StripeEnv } from '@/lib/stripe.server'

/** Vaste opwaardeerproducten in het betaalsysteem. */
export const TOPUP_PRICE_IDS: Record<number, string> = {
  50: 'leadtegoed_50_eenmalig',
  100: 'leadtegoed_100_eenmalig',
  200: 'leadtegoed_200_eenmalig',
}

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
  const priceLookupKey = TOPUP_PRICE_IDS[euros]
  if (!priceLookupKey) return null

  const stripe = createStripeClient(paymentsEnv())
  const prices = await stripe.prices.list({ lookup_keys: [priceLookupKey] })
  const price = prices.data[0]
  if (!price) return null
  const productId = typeof price.product === 'string' ? price.product : price.product.id

  const origin = siteOrigin()
  const successUrl = `${origin}/topup-klaar?session_id={CHECKOUT_SESSION_ID}`

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    ui_mode: 'hosted_page',
    success_url: successUrl,
    cancel_url: `${origin}/topup-klaar?canceled=1`,
    // Bedragen zijn netto (B2B): 21% btw wordt bovenop het tegoed berekend.
    line_items: [
      {
        price_data: {
          currency: price.currency,
          product: productId,
          unit_amount: amountCents,
          tax_behavior: 'exclusive' as const,
        },
        quantity: 1,
      },
    ],
    automatic_tax: { enabled: true },
    invoice_creation: { enabled: true },
    billing_address_collection: 'required' as const,
    tax_id_collection: { enabled: true },
    payment_intent_data: { description: `VoltFix leadtegoed \u20ac${euros} — ${contractor.name}` },
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

  // Atomische bijschrijving in de database: rijvergrendeling + increment,
  // zodat een gelijktijdige lead-claim of dubbele webhook niets overschrijft.
  const { data: result, error } = await supabaseAdmin.rpc('credit_contractor_topup', {
    _contractor_id: contractorId,
    _amount_cents: amountCents,
    _payment_ref: paymentRef,
  })
  if (error) throw error

  const credit = result as {
    ok: boolean
    reason?: string
    balance_cents?: number
    name?: string | null
    email?: string | null
    telegram_user_id?: number | null
  } | null
  if (!credit?.ok) return

  const newBalance = credit.balance_cents ?? 0
  const contractor = {
    name: credit.name ?? '',
    email: credit.email ?? null,
    telegram_user_id: credit.telegram_user_id ?? null,
  }

  const { sendTemplateEmail } = await import('@/lib/email-templates/send-email')
  const amountLabel = `\u20ac${(amountCents / 100).toFixed(2).replace('.', ',')}`
  const balanceLabel = `\u20ac${(newBalance / 100).toFixed(2).replace('.', ',')}`

  // Factuur bij voorkeur naar het administratie-adres.
  const { data: billing } = await supabaseAdmin
    .from('contractors')
    .select('invoice_email')
    .eq('id', contractorId)
    .maybeSingle()
  const receiptTo = billing?.invoice_email || contractor.email

  if (receiptTo) {
    await sendTemplateEmail('topup-receipt', receiptTo, {
      idempotencyKey: `topup-receipt-${session.id}`,
      templateData: {
        name: contractor.name,
        amount: amountLabel,
        newBalance: balanceLabel,
        paymentRef: session.id,
        date: new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }),
      },
    }).catch((e) => console.error('topup receipt email failed', e))
  }

  await sendTemplateEmail('topup-notification', '', {
    idempotencyKey: `topup-notify-${session.id}`,
    templateData: {
      name: contractor.name,
      amount: amountLabel,
      newBalance: balanceLabel,
      paymentRef: session.id,
    },
  }).catch((e) => console.error('topup notification email failed', e))

  // Factuurlink uit de betaling ophalen (mag ontbreken).
  let invoiceUrl: string | null = null
  try {
    const invoiceId = typeof session.invoice === 'string' ? session.invoice : session.invoice?.id
    if (invoiceId) {
      const stripe = createStripeClient(paymentsEnv())
      const invoice = await stripe.invoices.retrieve(invoiceId)
      invoiceUrl = invoice.hosted_invoice_url ?? invoice.invoice_pdf ?? null
    }
  } catch (e) {
    console.error('invoice lookup failed', e)
  }

  if (contractor.telegram_user_id) {
    const tg = await import('@/lib/telegram.server')
    await tg
      .sendMessage({
        chat_id: contractor.telegram_user_id,
        text: [
          `✅ <b>Betaling ontvangen</b>`,
          ``,
          `Opgewaardeerd: ${tg.euroExVat(amountCents)}`,
          `Btw (21%): ${tg.euro(Math.round(amountCents * 0.21))}`,
          `Nieuw saldo: <b>${tg.euroExVat(newBalance)}</b>`,
          ``,
          invoiceUrl ? `🧾 Je factuur staat klaar — ook per e-mail verstuurd.` : `🧾 Je factuur is per e-mail verstuurd.`,
        ].join('\n'),
        ...(invoiceUrl
          ? {
              reply_markup: {
                inline_keyboard: [[{ text: '🧾 Bekijk/download factuur', url: invoiceUrl }]],
              },
            }
          : {}),
      })
      .catch(() => {})
  }
}
