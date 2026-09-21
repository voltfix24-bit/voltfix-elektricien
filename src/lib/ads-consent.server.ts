/**
 * Toestemming als serverbesluit.
 *
 * De keuze in de browser is het begin; pas wanneer die keuze bij de gemeten
 * klikken en de bijbehorende dossiers staat, werkt een intrekking ook door in
 * wat er naar Google gaat. Deze module legt dat vast en zet wachtende
 * terugmeldingen die niet meer mogen meteen op "niet toegestaan".
 *
 * Wat hier nooit gebeurt: een al ingediende gebeurtenis terugdraaien (die is
 * de deur uit; dat vraagt een expliciete correctie) of een klantaanvraag
 * blokkeren.
 */

export type ConsentDecisionInput = {
  gclid: string | null
  gbraid: string | null
  wbraid: string | null
  clickRef: string | null
  adUserData: 'granted' | 'denied'
  adStorage: 'granted' | 'denied' | null
}

/** Statussen die nog niet de deur uit zijn en dus nog te blokkeren zijn. */
export const OPEN_OUTBOX_STATUSES = [
  'pending',
  'failed_temporary',
  'export_disabled',
  'config_missing',
  'no_evidence',
  'blocked_consent',
]

export async function applyConsentDecision(input: ConsentDecisionInput): Promise<{
  events: number
  leads: number
  blocked: number
}> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const ids = [input.gclid, input.gbraid, input.wbraid].filter(Boolean) as string[]

  // 1. De keuze vastleggen bij de gemeten klikken, zodat een latere koppeling
  //    vanuit de backoffice de juiste toestemming meeneemt.
  let events = 0
  for (const id of ids) {
    const { data } = await supabaseAdmin
      .from('conversion_events')
      .update({
        consent_ad_user_data: input.adUserData,
        ...(input.adStorage ? { consent_ad_storage: input.adStorage } : {}),
      })
      .or(`gclid.eq.${id},gbraid.eq.${id},wbraid.eq.${id}`)
      .select('id')
    events += (data ?? []).length
  }
  if (ids.length === 0 && input.clickRef) {
    const { data } = await supabaseAdmin
      .from('conversion_events')
      .update({
        consent_ad_user_data: input.adUserData,
        ...(input.adStorage ? { consent_ad_storage: input.adStorage } : {}),
      })
      .eq('click_ref', input.clickRef)
      .select('id, gclid, gbraid, wbraid')
    events += (data ?? []).length
    for (const row of (data ?? []) as any[]) {
      const id = row.gclid || row.gbraid || row.wbraid
      if (id && !ids.includes(id)) ids.push(id)
    }
  }
  if (ids.length === 0) return { events, leads: 0, blocked: 0 }

  // 2. Dezelfde keuze bij de dossiers die aan deze klik hangen.
  const leadIds: string[] = []
  for (const id of ids) {
    const { data } = await supabaseAdmin
      .from('leads')
      .update({ ad_consent_ad_user_data: input.adUserData })
      .or(`gclid.eq.${id},gbraid.eq.${id},wbraid.eq.${id}`)
      .select('id')
    for (const row of (data ?? []) as { id: string }[]) {
      if (!leadIds.includes(row.id)) leadIds.push(row.id)
    }
  }
  if (leadIds.length === 0) return { events, leads: 0, blocked: 0 }

  // 3. Wachtende terugmeldingen die nu niet meer mogen, meteen blokkeren.
  let blocked = 0
  if (input.adUserData === 'denied') {
    const { data } = await supabaseAdmin
      .from('ads_conversion_outbox')
      .update({
        status: 'blocked_consent',
        consent_ad_user_data: 'denied',
        last_error: 'Toestemming ingetrokken door de bezoeker.',
      })
      .in('lead_id', leadIds)
      .in('status', OPEN_OUTBOX_STATUSES)
      .select('id')
    blocked = (data ?? []).length
  } else {
    // Weer toegestaan: de wachtrij leest zelf opnieuw of alles klopt.
    await supabaseAdmin
      .from('ads_conversion_outbox')
      .update({ consent_ad_user_data: 'granted' })
      .in('lead_id', leadIds)
      .eq('status', 'blocked_consent')
  }

  return { events, leads: leadIds.length, blocked }
}
