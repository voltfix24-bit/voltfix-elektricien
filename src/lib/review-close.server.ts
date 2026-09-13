// Server-only: een reviewverzoek sluit zichzelf zeven dagen na de klus.
// Dit is geen fout, dus de tijdlijnregel krijgt een neutrale grijze stip.

import { REVIEW_CLOSE_DAYS, REVIEW_CLOSE_MS } from './lead-status'

export async function closeStaleReviews(): Promise<{ closed: number }> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const cutoff = new Date(Date.now() - REVIEW_CLOSE_MS).toISOString()
  const { data, error } = await supabaseAdmin
    .from('leads')
    .update({ review_closed_at: new Date().toISOString() })
    .eq('outcome', 'done')
    .is('reviewed_at', null)
    .is('review_closed_at', null)
    .lt('outcome_at', cutoff)
    .select('id')
  if (error) {
    console.error('closeStaleReviews failed', error)
    return { closed: 0 }
  }
  const rows = data ?? []
  if (rows.length) {
    await supabaseAdmin
      .from('lead_audit_logs')
      .insert(
        rows.map((row: { id: string }) => ({
          lead_id: row.id,
          actor_id: null,
          action: 'review_auto_closed',
          changes: { days: REVIEW_CLOSE_DAYS } as any,
        })),
      )
      .then(undefined, (e: unknown) => console.error('audit log (review close) failed', e))
  }
  return { closed: rows.length }
}
