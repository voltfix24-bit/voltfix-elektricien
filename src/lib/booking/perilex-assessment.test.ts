import { describe, expect, it } from 'vitest';
import {
  allowedAssessmentTransitions,
  assessmentStatuses,
  buildAssessmentNotification,
  canTransitionAssessment,
  checklistCodes,
  decideAssessment,
  findStatusConflicts,
  fixedPriceEligible,
  hasCriticalSafetyFlag,
  isAssessmentStatus,
  normaliseChecklist,
  reconcileAssessmentStatus,
  type ChecklistAnswers,
  type DecisionInput,
} from './perilex-assessment';
import { perilexCatalogVersion } from './pricing-catalog';

const certainChecklist: ChecklistAnswers = {
  existing_perilex_socket: 'yes',
  socket_condition: 'good',
  working_suitable_circuit: 'yes',
  supply_phase: 'three_phase',
  circuit_type: 'power_3x16a',
  protection_suitable: 'yes',
  cable_suitable: 'yes',
  appliance_model_known: 'yes',
  manufacturer_diagram_available: 'yes',
  install_location_ready: 'yes',
  kitchen_drawing_available: 'na',
  extra_survey_or_measurement_needed: 'no',
};

const base = (over: Partial<DecisionInput> = {}): DecisionInput => ({
  decision: 'fixed_existing_standard',
  checklist: certainChecklist,
  safetyFlags: [],
  workItems: ['connect_plug_only'],
  customerRequestedPriority: false,
  ...over,
});

describe('checklist', () => {
  it('kent alle gevraagde codes', () => {
    expect(checklistCodes).toContain('existing_perilex_socket');
    expect(checklistCodes).toContain('circuit_type');
    expect(checklistCodes).toContain('kitchen_drawing_available');
    expect(checklistCodes).toHaveLength(12);
  });

  it('verwijdert onbekende codes en ongeldige waarden', () => {
    expect(normaliseChecklist({ existing_perilex_socket: 'yes', hack: 'yes', cable_suitable: 'maybe' })).toEqual({
      existing_perilex_socket: 'yes',
    });
    expect(normaliseChecklist(null)).toEqual({});
    expect(normaliseChecklist('x')).toEqual({});
  });
});

describe('statusovergangen', () => {
  it('staat de gewone werkvolgorde toe', () => {
    expect(canTransitionAssessment('not_started', 'in_review')).toBe(true);
    expect(canTransitionAssessment('in_review', 'waiting_customer')).toBe(true);
    expect(canTransitionAssessment('waiting_customer', 'ready')).toBe(true);
    expect(canTransitionAssessment('in_review', 'ready')).toBe(true);
    expect(canTransitionAssessment('ready', 'closed')).toBe(true);
  });

  it('weigert sprongen die niet mogen', () => {
    expect(canTransitionAssessment('not_started', 'ready')).toBe(false);
    expect(canTransitionAssessment('not_started', 'waiting_customer')).toBe(false);
    expect(canTransitionAssessment('closed', 'ready')).toBe(false);
    expect(canTransitionAssessment('closed', 'waiting_customer')).toBe(false);
  });

  it('laat dezelfde status altijd toe en documenteert de opties', () => {
    expect(canTransitionAssessment('in_review', 'in_review')).toBe(true);
    expect(allowedAssessmentTransitions('closed')).toEqual(['in_review']);
    expect(allowedAssessmentTransitions('not_started')).toEqual(['in_review', 'closed']);
  });

  it('kent geen planning- of uitvoeringsstatussen — die horen bij de lead', () => {
    expect(assessmentStatuses).toEqual(['not_started', 'in_review', 'waiting_customer', 'ready', 'closed']);
    for (const operational of ['scheduled', 'completed', 'cancelled', 'dispatched', 'claimed']) {
      expect(isAssessmentStatus(operational)).toBe(false);
    }
  });
});

describe('combinaties lead ↔ beoordeling', () => {
  it('staat normale combinaties toe', () => {
    expect(findStatusConflicts({ leadStatus: 'new', assessmentStatus: 'in_review' })).toEqual([]);
    expect(findStatusConflicts({ leadStatus: 'dispatched', assessmentStatus: 'ready', decision: 'fixed_existing_standard' })).toEqual([]);
    expect(findStatusConflicts({ leadStatus: 'claimed', assessmentStatus: 'ready', decision: 'site_survey' })).toEqual([]);
    expect(findStatusConflicts({ leadStatus: 'cancelled', assessmentStatus: 'closed', decision: 'declined' })).toEqual([]);
    expect(findStatusConflicts({ leadStatus: null, assessmentStatus: 'not_started' })).toEqual([]);
  });

  it('ziet een gesloten opdracht met een openstaande beoordeling', () => {
    expect(findStatusConflicts({ leadStatus: 'cancelled', assessmentStatus: 'waiting_customer' })).toContain('lead_closed_with_open_assessment');
    expect(findStatusConflicts({ leadStatus: 'blocked_spam', assessmentStatus: 'ready' })).toContain('lead_closed_with_open_assessment');
  });

  it('ziet een opgepakte opdracht met een openstaand informatieverzoek', () => {
    expect(findStatusConflicts({ leadStatus: 'claimed', assessmentStatus: 'waiting_customer' })).toContain(
      'lead_claimed_with_open_information_request',
    );
    expect(findStatusConflicts({ leadStatus: 'claimed', assessmentStatus: 'ready', missingInfo: ['kitchen_plan'] })).toContain(
      'lead_claimed_with_open_information_request',
    );
  });

  it('ziet een gesloten beoordeling terwijl de lead nog loopt', () => {
    expect(findStatusConflicts({ leadStatus: 'new', assessmentStatus: 'closed' })).toContain('assessment_closed_while_lead_active');
    expect(findStatusConflicts({ leadStatus: 'dispatched', assessmentStatus: 'closed' })).toContain('assessment_closed_while_lead_active');
  });

  it('ziet een beslissing die niet bij de status past', () => {
    expect(findStatusConflicts({ leadStatus: 'new', assessmentStatus: 'ready', decision: 'declined' })).toContain(
      'closing_decision_without_closed_assessment',
    );
    expect(findStatusConflicts({ leadStatus: 'cancelled', assessmentStatus: 'closed', decision: 'fixed_existing_standard' })).toContain(
      'priced_decision_on_closed_assessment',
    );
  });

  it('laat de leadstatus de beoordeling sluiten', () => {
    expect(reconcileAssessmentStatus('cancelled', 'waiting_customer')).toBe('closed');
    expect(reconcileAssessmentStatus('blocked_spam', 'ready')).toBe('closed');
    expect(reconcileAssessmentStatus('dispatched', 'in_review')).toBe('in_review');
    expect(reconcileAssessmentStatus(null, 'in_review')).toBe('in_review');
  });
});


describe('veiligheid', () => {
  it('herkent kritieke markeringen', () => {
    expect(hasCriticalSafetyFlag(['socket_or_plug_hot'])).toBe(true);
    expect(hasCriticalSafetyFlag(['burning_smell_sparks_discolouration'])).toBe(true);
    expect(hasCriticalSafetyFlag(['circuit_trips'])).toBe(false);
    expect(hasCriticalSafetyFlag([])).toBe(false);
  });

  it('blokkeert een vaste prijs', () => {
    const result = decideAssessment(base({ safetyFlags: ['unsafe_situation_suspected'] }));
    expect(result).toEqual({ ok: false, reason: 'safety_flag_blocks_fixed_price' });
    expect(fixedPriceEligible({ checklist: certainChecklist, safetyFlags: ['socket_or_plug_hot'], workItems: [] })).toBe(false);
  });
});

describe('serverbeslissing', () => {
  it('rekent €120 excl. btw bij voldoende zekerheid', () => {
    const result = decideAssessment(base());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.priceRuleId).toBe('existing_connection_standard');
    expect(result.amountExVatCents).toBe(12000);
    expect(result.money?.amount_inc_vat_cents).toBe(14520);
    expect(result.money?.display_tax_mode).toBe('ex_vat');
    expect(result.catalogVersion).toBe(perilexCatalogVersion);
    expect(result.status).toBe('ready');
  });

  it('weigert een vaste prijs bij onvoldoende technische zekerheid', () => {
    expect(decideAssessment(base({ checklist: { ...certainChecklist, cable_suitable: 'to_check' } }))).toEqual({
      ok: false,
      reason: 'insufficient_technical_certainty',
    });
    expect(decideAssessment(base({ checklist: { ...certainChecklist, socket_condition: 'unknown' } }))).toEqual({
      ok: false,
      reason: 'insufficient_technical_certainty',
    });
    expect(decideAssessment(base({ checklist: {} }))).toEqual({ ok: false, reason: 'insufficient_technical_certainty' });
  });

  it('weigert een vaste prijs bij zwaar werk', () => {
    for (const item of ['new_circuit', 'new_cable', 'replace_perilex_socket', 'consumer_unit_change', 'construction_work']) {
      expect(decideAssessment(base({ workItems: ['connect_plug_only', item] }))).toEqual({
        ok: false,
        reason: 'heavy_work_requires_quote',
      });
    }
  });

  it('rekent €145 alleen met klantverzoek én bevestigde beschikbaarheid', () => {
    const priority: Partial<DecisionInput> = { decision: 'fixed_existing_priority_24h' };
    expect(decideAssessment(base({ ...priority, customerRequestedPriority: false }))).toEqual({
      ok: false,
      reason: 'priority_not_requested_by_customer',
    });
    expect(decideAssessment(base({ ...priority, customerRequestedPriority: true }))).toEqual({
      ok: false,
      reason: 'priority_availability_not_confirmed',
    });
    expect(
      decideAssessment(
        base({
          ...priority,
          customerRequestedPriority: true,
          availabilityConfirmedBy: 'd3b07384-d9a0-4c9b-8b4b-1a2b3c4d5e6f',
          availabilityConfirmedAt: null,
        }),
      ),
    ).toEqual({ ok: false, reason: 'priority_availability_not_confirmed' });

    const ok = decideAssessment(
      base({
        ...priority,
        customerRequestedPriority: true,
        availabilityConfirmedBy: 'd3b07384-d9a0-4c9b-8b4b-1a2b3c4d5e6f',
        availabilityConfirmedAt: '2026-09-13T08:00:00.000Z',
      }),
    );
    expect(ok.ok).toBe(true);
    if (!ok.ok) return;
    expect(ok.amountExVatCents).toBe(14500);
    expect(ok.priceRuleId).toBe('existing_connection_priority_24h');
  });

  it('rekent de schouw op €90 en markeert die als verrekenbaar', () => {
    const result = decideAssessment(base({ decision: 'site_survey', checklist: {}, workItems: ['new_circuit'] }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.amountExVatCents).toBe(9000);
    expect(result.deductible).toBe(true);
    expect(result.status).toBe('ready');
  });

  it('geeft geen bedrag bij beoordeling, offerte, veiligheid of afwijzing', () => {
    for (const decision of [
      'additional_information_required',
      'custom_quote_required',
      'safety_contact_required',
      'outside_service_area',
      'declined',
    ] as const) {
      const result = decideAssessment(base({ decision }));
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.amountExVatCents).toBeNull();
      expect(result.money).toBeNull();
    }
  });

  it('weigert een onbekende beslissing', () => {
    expect(decideAssessment(base({ decision: 'handmatig_bedrag' as never }))).toEqual({ ok: false, reason: 'unknown_decision' });
  });
});

describe('meldingspayload', () => {
  const payload = buildAssessmentNotification({
    quoteRequestId: '11111111-2222-3333-4444-555555555555',
    intent: 'connect_existing',
    route: 'photo_review',
    priceStatus: 'review_needed',
    priorityRequested: true,
    postalArea: '1017',
    attachmentCategories: ['consumer_unit', 'kitchen_plan', 'consumer_unit'],
    baseUrl: 'https://www.voltfix.nl/',
  });

  it('bevat alleen veilige velden', () => {
    expect(payload.attachment_count).toBe(3);
    expect(payload.attachment_categories).toEqual(['consumer_unit', 'kitchen_plan']);
    expect(payload.postal_area).toBe('1017');
    expect(payload.review_url).toBe(
      'https://www.voltfix.nl/admin/leads?aanvraag=11111111-2222-3333-4444-555555555555',
    );
  });

  it('bevat geen bestanden, opslagpaden of signed URL’s', () => {
    const json = JSON.stringify(payload);
    expect(json).not.toContain('quote-attachments');
    expect(json).not.toContain('/storage/v1/');
    expect(json).not.toContain('token=');
    expect(json).not.toContain('perilex/');
    expect(Object.keys(payload)).not.toContain('internal_notes');
  });
});
