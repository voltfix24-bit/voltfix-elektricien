import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import {
  assessmentDecisions,
  assessmentStatuses,
  canTransitionAssessment,
  decideAssessment,
  isAssessmentStatus,
  missingInfoItems,
  normaliseChecklist,
  safetyFlags,
  workItems,
  type AssessmentStatus,
} from '@/lib/booking/perilex-assessment'

/**
 * Interne Perilex-beoordeling — serverfuncties (fase 5A).
 *
 * Regels die hier worden afgedwongen en nergens anders:
 * - alleen een beheerder mag lezen of schrijven (RLS + expliciete controle);
 * - elke beslissing wordt server-side herberekend uit de centrale catalogus;
 * - elke wijziging verhoogt `version`; een verouderde versie wordt geweigerd;
 * - elke status- en besliswijziging schrijft een append-only gebeurtenis;
 * - bijlagenlinks zijn maximaal 5 minuten geldig en worden gelogd.
 */

const SIGNED_URL_TTL_SECONDS = 300

async function assertAdmin(context: any) {
  const { data, error } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' })
  if (error) throw new Error(error.message)
  if (!data) throw new Error('Geen beheerdersrechten.')
}

/** Append-only gebeurtenis; bevat nooit klantgegevens of bestandslinks. */
async function writeEvent(input: {
  assessmentId: string
  quoteRequestId: string
  actorId: string
  eventType: string
  field?: string | null
  oldValue?: unknown
  newValue?: unknown
  reason?: string | null
}) {
  try {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    await supabaseAdmin.from('quote_request_assessment_events').insert({
      assessment_id: input.assessmentId,
      quote_request_id: input.quoteRequestId,
      actor_id: input.actorId,
      event_type: input.eventType,
      field: input.field ?? null,
      old_value: (input.oldValue ?? null) as any,
      new_value: (input.newValue ?? null) as any,
      reason: input.reason ?? null,
    })
  } catch (err) {
    console.error('Assessment event failed', input.eventType, err)
  }
}

const QUOTE_SELECT =
  'id, created_at, name, phone, email, street, house_number, postal_code, postal_area, city, job_type, message, locale, ' +
  'booking_service, booking_intent, booking_route, price_status, price_total_cents, price_snapshot, catalog_version, ' +
  'appointment_date, appointment_slot, appointment_note, service_answers'

const ASSESSMENT_SELECT = '*'

function priorityFromAnswers(answers: any): boolean {
  return answers?.urgency === 'priority_24h'
}

/** Haalt de aanvraag, de beoordeling (of maakt hem aan), bijlagen en de historie op. */
export const getAssessment = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ quoteRequestId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context)

    const quote = await context.supabase.from('quote_requests').select(QUOTE_SELECT).eq('id', data.quoteRequestId).maybeSingle()
    if (quote.error) throw new Error(quote.error.message)
    if (!quote.data) throw new Error('Aanvraag niet gevonden.')

    let assessment = (await context.supabase
      .from('quote_request_assessments')
      .select(ASSESSMENT_SELECT)
      .eq('quote_request_id', data.quoteRequestId)
      .maybeSingle()).data as any

    if (!assessment) {
      const created = await context.supabase
        .from('quote_request_assessments')
        .insert({
          quote_request_id: data.quoteRequestId,
          service_id: (quote.data as any).booking_service ?? 'perilex',
          created_by: context.userId,
          priority_requested: priorityFromAnswers((quote.data as any).service_answers),
        })
        .select(ASSESSMENT_SELECT)
        .single()
      if (created.error) throw new Error(created.error.message)
      assessment = created.data
      await writeEvent({
        assessmentId: assessment.id,
        quoteRequestId: data.quoteRequestId,
        actorId: context.userId,
        eventType: 'assessment_created',
        newValue: { assessment_status: 'new' },
      })
    }

    const [attachments, events, lead] = await Promise.all([
      context.supabase
        .from('quote_request_attachments')
        .select('id, attachment_id, category, original_filename, mime_type, size_bytes, status, sanitization_status, created_at')
        .eq('quote_request_id', data.quoteRequestId)
        .eq('status', 'stored')
        .order('created_at', { ascending: true }),
      context.supabase
        .from('quote_request_assessment_events')
        .select('*')
        .eq('assessment_id', assessment.id)
        .order('created_at', { ascending: false })
        .limit(100),
      context.supabase.from('leads').select('id, status, is_urgent').eq('external_ref', `quote:${data.quoteRequestId}`).maybeSingle(),
    ])

    return {
      quote: quote.data,
      assessment,
      attachments: attachments.data ?? [],
      events: events.data ?? [],
      lead: lead.data ?? null,
      customerRequestedPriority: priorityFromAnswers((quote.data as any).service_answers),
    }
  })

const draftSchema = z.object({
  assessmentId: z.string().uuid(),
  version: z.number().int().min(1),
  checklist: z.record(z.string(), z.string()).default({}),
  safetyFlags: z.array(z.enum(safetyFlags)).max(safetyFlags.length).default([]),
  workItems: z.array(z.enum(workItems)).max(workItems.length).default([]),
  missingInfo: z.array(z.enum(missingInfoItems)).max(missingInfoItems.length).default([]),
  internalNotes: z.string().max(4000).nullable().default(null),
  assessmentStatus: z.enum(assessmentStatuses).optional(),
})

/** Concept opslaan: geen eindbeslissing nodig, wel versiecontrole. */
export const saveAssessmentDraft = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => draftSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context)

    const current = await context.supabase
      .from('quote_request_assessments')
      .select(ASSESSMENT_SELECT)
      .eq('id', data.assessmentId)
      .maybeSingle()
    if (current.error) throw new Error(current.error.message)
    const row = current.data as any
    if (!row) throw new Error('Beoordeling niet gevonden.')
    if (row.version !== data.version) {
      return { ok: false as const, reason: 'version_conflict' as const, assessment: row }
    }

    const nextStatus: AssessmentStatus =
      data.assessmentStatus ?? (row.assessment_status === 'new' ? 'in_review' : (row.assessment_status as AssessmentStatus))
    if (!canTransitionAssessment(row.assessment_status as AssessmentStatus, nextStatus)) {
      return { ok: false as const, reason: 'invalid_transition' as const, assessment: row }
    }

    const checklist = normaliseChecklist(data.checklist)
    const updated = await context.supabase
      .from('quote_request_assessments')
      .update({
        checklist: checklist as any,
        safety_flags: data.safetyFlags,
        work_items: data.workItems,
        missing_info: data.missingInfo,
        internal_notes: data.internalNotes,
        assessment_status: nextStatus,
        assigned_to: row.assigned_to ?? context.userId,
        version: row.version + 1,
      })
      .eq('id', data.assessmentId)
      .eq('version', data.version)
      .select(ASSESSMENT_SELECT)
      .maybeSingle()
    if (updated.error) throw new Error(updated.error.message)
    if (!updated.data) return { ok: false as const, reason: 'version_conflict' as const, assessment: row }

    await writeEvent({
      assessmentId: data.assessmentId,
      quoteRequestId: row.quote_request_id,
      actorId: context.userId,
      eventType: 'draft_saved',
      oldValue: { assessment_status: row.assessment_status, version: row.version },
      newValue: { assessment_status: nextStatus, version: row.version + 1 },
    })
    if (nextStatus !== row.assessment_status) {
      await writeEvent({
        assessmentId: data.assessmentId,
        quoteRequestId: row.quote_request_id,
        actorId: context.userId,
        eventType: 'status_changed',
        field: 'assessment_status',
        oldValue: row.assessment_status,
        newValue: nextStatus,
      })
    }

    return { ok: true as const, assessment: updated.data }
  })

/** Beschikbaarheid voor 24-uursvoorrang expliciet bevestigen. */
export const confirmPriorityAvailability = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ assessmentId: z.string().uuid(), version: z.number().int().min(1), confirmed: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const current = await context.supabase
      .from('quote_request_assessments')
      .select(ASSESSMENT_SELECT)
      .eq('id', data.assessmentId)
      .maybeSingle()
    if (current.error) throw new Error(current.error.message)
    const row = current.data as any
    if (!row) throw new Error('Beoordeling niet gevonden.')
    if (row.version !== data.version) return { ok: false as const, reason: 'version_conflict' as const, assessment: row }

    const updated = await context.supabase
      .from('quote_request_assessments')
      .update({
        availability_confirmed_by: data.confirmed ? context.userId : null,
        availability_confirmed_at: data.confirmed ? new Date().toISOString() : null,
        version: row.version + 1,
      })
      .eq('id', data.assessmentId)
      .eq('version', data.version)
      .select(ASSESSMENT_SELECT)
      .maybeSingle()
    if (updated.error) throw new Error(updated.error.message)
    if (!updated.data) return { ok: false as const, reason: 'version_conflict' as const, assessment: row }

    await writeEvent({
      assessmentId: data.assessmentId,
      quoteRequestId: row.quote_request_id,
      actorId: context.userId,
      eventType: 'availability_confirmation',
      field: 'availability_confirmed_by',
      oldValue: row.availability_confirmed_at,
      newValue: (updated.data as any).availability_confirmed_at,
    })
    return { ok: true as const, assessment: updated.data }
  })

/** Eindbeslissing: bedrag en status komen uitsluitend uit de serverregels. */
export const decideAssessmentFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        assessmentId: z.string().uuid(),
        version: z.number().int().min(1),
        decision: z.enum(assessmentDecisions),
        reason: z.string().max(500).nullable().default(null),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context)

    const current = await context.supabase
      .from('quote_request_assessments')
      .select(ASSESSMENT_SELECT)
      .eq('id', data.assessmentId)
      .maybeSingle()
    if (current.error) throw new Error(current.error.message)
    const row = current.data as any
    if (!row) throw new Error('Beoordeling niet gevonden.')
    if (row.version !== data.version) return { ok: false as const, reason: 'version_conflict' as const, assessment: row }

    const quote = await context.supabase
      .from('quote_requests')
      .select('service_answers')
      .eq('id', row.quote_request_id)
      .maybeSingle()

    const outcome = decideAssessment({
      decision: data.decision,
      checklist: normaliseChecklist(row.checklist),
      safetyFlags: (row.safety_flags ?? []) as string[],
      workItems: (row.work_items ?? []) as string[],
      customerRequestedPriority: priorityFromAnswers((quote.data as any)?.service_answers) || Boolean(row.priority_requested),
      availabilityConfirmedBy: row.availability_confirmed_by,
      availabilityConfirmedAt: row.availability_confirmed_at,
    })

    if (!outcome.ok) {
      await writeEvent({
        assessmentId: data.assessmentId,
        quoteRequestId: row.quote_request_id,
        actorId: context.userId,
        eventType: 'decision_rejected',
        field: 'decision',
        oldValue: row.decision,
        newValue: data.decision,
        reason: outcome.reason,
      })
      return { ok: false as const, reason: outcome.reason, assessment: row }
    }

    if (!canTransitionAssessment(row.assessment_status as AssessmentStatus, outcome.status)) {
      return { ok: false as const, reason: 'invalid_transition' as const, assessment: row }
    }

    const updated = await context.supabase
      .from('quote_request_assessments')
      .update({
        decision: outcome.decision,
        assessment_status: outcome.status,
        price_rule_id: outcome.priceRuleId,
        amount_ex_vat_cents: outcome.amountExVatCents,
        price_snapshot: (outcome.money ? { money: outcome.money } : null) as any,
        catalog_version: outcome.catalogVersion,
        decided_by: context.userId,
        decided_at: new Date().toISOString(),
        version: row.version + 1,
      })
      .eq('id', data.assessmentId)
      .eq('version', data.version)
      .select(ASSESSMENT_SELECT)
      .maybeSingle()
    if (updated.error) throw new Error(updated.error.message)
    if (!updated.data) return { ok: false as const, reason: 'version_conflict' as const, assessment: row }

    await writeEvent({
      assessmentId: data.assessmentId,
      quoteRequestId: row.quote_request_id,
      actorId: context.userId,
      eventType: 'decision_recorded',
      field: 'decision',
      oldValue: { decision: row.decision, status: row.assessment_status },
      newValue: { decision: outcome.decision, status: outcome.status, price_rule_id: outcome.priceRuleId },
      reason: data.reason,
    })

    return { ok: true as const, assessment: updated.data }
  })

/** Handmatige statuswijziging binnen de toegestane overgangen. */
export const setAssessmentStatus = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        assessmentId: z.string().uuid(),
        version: z.number().int().min(1),
        status: z.enum(assessmentStatuses),
        reason: z.string().max(500).nullable().default(null),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const current = await context.supabase
      .from('quote_request_assessments')
      .select(ASSESSMENT_SELECT)
      .eq('id', data.assessmentId)
      .maybeSingle()
    if (current.error) throw new Error(current.error.message)
    const row = current.data as any
    if (!row) throw new Error('Beoordeling niet gevonden.')
    if (row.version !== data.version) return { ok: false as const, reason: 'version_conflict' as const, assessment: row }
    if (!isAssessmentStatus(row.assessment_status) || !canTransitionAssessment(row.assessment_status, data.status)) {
      return { ok: false as const, reason: 'invalid_transition' as const, assessment: row }
    }

    const updated = await context.supabase
      .from('quote_request_assessments')
      .update({ assessment_status: data.status, version: row.version + 1 })
      .eq('id', data.assessmentId)
      .eq('version', data.version)
      .select(ASSESSMENT_SELECT)
      .maybeSingle()
    if (updated.error) throw new Error(updated.error.message)
    if (!updated.data) return { ok: false as const, reason: 'version_conflict' as const, assessment: row }

    await writeEvent({
      assessmentId: data.assessmentId,
      quoteRequestId: row.quote_request_id,
      actorId: context.userId,
      eventType: 'status_changed',
      field: 'assessment_status',
      oldValue: row.assessment_status,
      newValue: data.status,
      reason: data.reason,
    })
    return { ok: true as const, assessment: updated.data }
  })

/**
 * Tijdelijke kijklink voor een afbeelding (max. 5 minuten).
 * PDF's lopen niet via deze functie maar via de gecontroleerde downloadroute.
 */
export const createAttachmentViewUrl = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ attachmentRowId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context)

    const row = await context.supabase
      .from('quote_request_attachments')
      .select('id, attachment_id, quote_request_id, storage_bucket, storage_path, mime_type, original_filename, status')
      .eq('id', data.attachmentRowId)
      .maybeSingle()
    if (row.error) throw new Error(row.error.message)
    const file = row.data as any
    if (!file || file.status !== 'stored') throw new Error('Bijlage niet gevonden.')
    if (file.mime_type === 'application/pdf') throw new Error('PDF wordt uitsluitend als download geopend.')

    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const signed = await supabaseAdmin.storage
      .from(file.storage_bucket)
      .createSignedUrl(file.storage_path, SIGNED_URL_TTL_SECONDS)
    if (signed.error || !signed.data) throw new Error('Kon geen tijdelijke link maken.')

    await supabaseAdmin.from('attachment_access_log').insert({
      attachment_id: file.attachment_id,
      quote_request_id: file.quote_request_id,
      actor_id: context.userId,
      action: 'view',
    })

    // Het opslagpad en de signed URL worden nooit opgeslagen of gelogd.
    return {
      url: signed.data.signedUrl,
      expiresInSeconds: SIGNED_URL_TTL_SECONDS,
      mimeType: file.mime_type as string,
      filename: file.original_filename as string,
    }
  })

/** Dry-run opruimrapport voor de bewaartermijn. Verwijdert niets. */
export const attachmentRetentionDryRun = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context)
    const now = new Date().toISOString()
    const [expired, total, missingDate] = await Promise.all([
      context.supabase
        .from('quote_request_attachments')
        .select('id', { count: 'exact', head: true })
        .lt('retention_expires_at', now),
      context.supabase.from('quote_request_attachments').select('id', { count: 'exact', head: true }),
      context.supabase
        .from('quote_request_attachments')
        .select('id', { count: 'exact', head: true })
        .is('retention_expires_at', null),
    ])
    return {
      generatedAt: now,
      totalAttachments: total.count ?? 0,
      expiredCount: expired.count ?? 0,
      withoutRetentionDate: missingDate.count ?? 0,
      deletionEnabled: false,
    }
  })
