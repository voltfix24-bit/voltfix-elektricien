/**
 * Vaste, verzonnen beoordelingsscenario's voor visuele controle.
 *
 * Uitsluitend bedoeld voor de dev-preview en screenshots: geen echte klant,
 * geen database, geen Telegrambericht. De data staat letterlijk in deze
 * module, zodat elke screenshot identiek reproduceerbaar is.
 */

const AT = '2026-02-11T09:20:00.000Z'

export type AssessmentScenarioId =
  | 'fixed_price'
  | 'safety_block'
  | 'missing_info'
  | 'priority_unconfirmed'
  | 'survey_required'

type Scenario = {
  id: AssessmentScenarioId
  label: string
  /** Naam en telefoon zijn verzonnen; nooit een echte klant. */
  phone: string
  data: Record<string, unknown>
}

function assessment(over: Record<string, unknown>) {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    quote_request_id: '00000000-0000-4000-8000-0000000000aa',
    lead_id: null,
    service_id: 'perilex',
    assessment_status: 'in_review',
    decision: null,
    checklist: {},
    safety_flags: [],
    work_items: [],
    missing_info: [],
    internal_notes: null,
    priority_requested: false,
    availability_confirmed_by: null,
    availability_confirmed_at: null,
    price_rule_id: null,
    amount_ex_vat_cents: null,
    price_snapshot: null,
    catalog_version: '2026-01',
    assigned_to: null,
    decided_by: null,
    decided_at: null,
    created_by: null,
    version: 3,
    created_at: AT,
    updated_at: AT,
    ...over,
  }
}

const attachments = [
  {
    id: '00000000-0000-4000-8000-0000000000b1',
    category: 'consumer_unit',
    original_filename: 'groepenkast.jpg',
    mime_type: 'image/jpeg',
    size_bytes: 412_000,
    sanitization_status: 'metadata_stripped',
  },
  {
    id: '00000000-0000-4000-8000-0000000000b2',
    category: 'kitchen_plan',
    original_filename: 'keukentekening.pdf',
    mime_type: 'application/pdf',
    size_bytes: 1_240_000,
    sanitization_status: 'not_applicable',
  },
]

const events = [
  { id: 'e1', event_type: 'assessment_created', created_at: AT, reason: null },
  { id: 'e2', event_type: 'draft_saved', created_at: AT, reason: null },
]

export const assessmentScenarios: readonly Scenario[] = [
  {
    id: 'fixed_price',
    label: 'Vaste prijs mogelijk',
    phone: '+31 6 12 34 56 78',
    data: {
      assessment: assessment({
        assessment_status: 'ready',
        decision: 'fixed_price_standard',
        amount_ex_vat_cents: 19_500,
        price_rule_id: 'perilex_standard',
        checklist: {
          existing_perilex_socket: 'yes',
          socket_condition: 'good',
          working_suitable_circuit: 'yes',
          supply_phase: 'three_phase',
          protection_suitable: 'yes',
          cable_suitable: 'yes',
        },
        version: 4,
      }),
      attachments,
      events: [...events, { id: 'e3', event_type: 'decision_recorded', created_at: AT, reason: null }],
      customerRequestedPriority: false,
    },
  },
  {
    id: 'safety_block',
    label: 'Veiligheidsmarkering blokkeert vaste prijs',
    phone: '+31 6 87 65 43 21',
    data: {
      assessment: assessment({
        assessment_status: 'in_review',
        safety_flags: ['burn_marks', 'overheating'],
        internal_notes: 'Klant meldt brandlucht. Eerst bellen, geen prijs noemen.',
      }),
      attachments: [attachments[0]],
      events: [...events, { id: 'e3', event_type: 'decision_rejected', created_at: AT, reason: 'safety_flag_blocks_fixed_price' }],
      customerRequestedPriority: false,
    },
  },
  {
    id: 'missing_info',
    label: 'Wacht op informatie van de klant',
    phone: '+31 6 11 22 33 44',
    data: {
      assessment: assessment({
        assessment_status: 'waiting_customer',
        missing_info: ['photo_consumer_unit', 'appliance_model'],
      }),
      attachments: [],
      events,
      customerRequestedPriority: false,
    },
  },
  {
    id: 'priority_unconfirmed',
    label: 'Voorrang gevraagd, beschikbaarheid onbevestigd',
    phone: '+31 6 55 44 33 22',
    data: {
      assessment: assessment({ assessment_status: 'in_review', priority_requested: true }),
      attachments: [attachments[0]],
      events,
      customerRequestedPriority: true,
    },
  },
  {
    id: 'survey_required',
    label: 'Zwaar werk: opname nodig',
    phone: '+31 6 99 88 77 66',
    data: {
      assessment: assessment({
        assessment_status: 'in_review',
        work_items: ['new_circuit', 'consumer_unit_extension'],
        internal_notes: 'Nieuwe groep nodig; geen automatische vaste prijs.',
      }),
      attachments,
      events: [...events, { id: 'e3', event_type: 'decision_rejected', created_at: AT, reason: 'heavy_work_requires_quote' }],
      customerRequestedPriority: false,
    },
  },
]

export function assessmentScenario(id: string): Scenario {
  return assessmentScenarios.find(scenario => scenario.id === id) ?? assessmentScenarios[0]!
}
