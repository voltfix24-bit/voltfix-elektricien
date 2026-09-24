import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

const VARIANTS = {
  A: { path: '/contact', label: 'Test A · NL · toestemming', withTestClick: true },
  B: { path: '/en-gb/contact', label: 'Test B · EN · weigeren', withTestClick: true },
  C: { path: '/perilex-amsterdam', label: 'Test C · NL · geen keuze', withTestClick: true },
} as const

/** Alleen een beheerder kan een testlink aanmaken (30 min geldig, één aanvraag). */
export const createFormTestLinkFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ variant: z.enum(['A', 'B', 'C']) }).parse(input))
  .handler(async ({ data, context }) => {
    const { assertFormTestAdmin, createFormTestLink } = await import('./form-test-link.server')
    await assertFormTestAdmin(context.supabase as any, context.userId)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { getRequest } = await import('@tanstack/react-start/server')
    const origin = new URL(getRequest().url).origin
    const v = VARIANTS[data.variant]
    return createFormTestLink(supabaseAdmin as any, {
      createdBy: context.userId,
      path: v.path,
      label: v.label,
      withTestClick: v.withTestClick,
      origin,
    })
  })
