import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

const VARIANTS = {
  A: { path: '/contact', label: 'Test A · NL · toestemming', withTestClick: true },
  B: { path: '/en-gb/contact', label: 'Test B · EN · weigeren', withTestClick: false },
  C: { path: '/perilex-amsterdam', label: 'Test C · NL · geen keuze', withTestClick: false },
} as const

/** Alleen een beheerder kan een testlink aanmaken (30 min geldig, één aanvraag). */
export const createFormTestLinkFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ variant: z.enum(['A', 'B', 'C']) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error } = await (context.supabase as any).rpc('has_role', {
      _user_id: context.userId,
      _role: 'admin',
    })
    if (error) throw new Error(error.message)
    if (!isAdmin) throw new Error('Geen beheerdersrechten.')
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { createFormTestLink } = await import('./form-test-link.server')
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
