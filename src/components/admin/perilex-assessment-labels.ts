import type {
  AssessmentDecision,
  AssessmentStatus,
  ChecklistCode,
  MissingInfoItem,
  SafetyFlag,
  WorkItem,
} from '@/lib/booking/perilex-assessment'

/** Nederlandse labels bij de stabiele codes. Alleen weergave — nooit opslag. */

export const statusLabel: Record<AssessmentStatus, string> = {
  new: 'Nieuw',
  in_review: 'In beoordeling',
  waiting_customer: 'Wacht op klantinformatie',
  ready_fixed_price: 'Klaar voor vaste prijs',
  survey_proposed: 'Schouw voorgesteld',
  survey_scheduled: 'Schouw gepland',
  quote_required: 'Offerte nodig',
  safety_contact_required: 'Veiligheidscontact nodig',
  scheduled: 'Ingepland',
  completed: 'Afgerond',
  cancelled: 'Geannuleerd',
}

export const checklistLabel: Record<ChecklistCode, string> = {
  existing_perilex_socket: 'Bestaand Perilex-stopcontact aanwezig',
  socket_condition: 'Staat van het stopcontact',
  working_suitable_circuit: 'Werkende geschikte groep aanwezig',
  supply_phase: 'Aansluiting',
  circuit_type: 'Groepstype',
  protection_suitable: 'Beveiliging passend',
  cable_suitable: 'Kabel/aansluiting passend',
  appliance_model_known: 'Apparaatmodel bekend',
  manufacturer_diagram_available: 'Fabrikantschema beschikbaar',
  install_location_ready: 'Aansluitlocatie gereed en bereikbaar',
  kitchen_drawing_available: 'Keukentekening beschikbaar',
  extra_survey_or_measurement_needed: 'Aanvullende opname/meting nodig',
}

export const optionLabel: Record<string, string> = {
  yes: 'Ja',
  no: 'Nee',
  unclear: 'Onduidelijk',
  na: 'N.v.t.',
  good: 'Goed',
  damaged: 'Beschadigd',
  unknown: 'Onbekend',
  single_phase: '1-fase',
  three_phase: '3-fase',
  cooking_2x16a: 'Kookgroep 2×16A',
  power_3x16a: 'Krachtgroep 3×16A',
  other: 'Anders',
  to_measure: 'Nog meten',
  to_check: 'Nog controleren',
}

export const workItemLabel: Record<WorkItem, string> = {
  connect_plug_only: 'Alleen stekker aan apparaat aansluiten',
  measure_and_verify: 'Meten en aansluiting controleren',
  replace_perilex_socket: 'Perilex-wandcontactdoos plaatsen/vervangen',
  new_cable: 'Nieuwe kabel trekken',
  new_circuit: 'Nieuwe groep plaatsen',
  consumer_unit_change: 'Groepenkast aanpassen',
  move_connection_point: 'Aansluitpunt verplaatsen',
  construction_work: 'Bouwkundige werkzaamheden',
  other_unclear: 'Anders/onduidelijk',
}

export const safetyLabel: Record<SafetyFlag, string> = {
  circuit_trips: 'Groep valt uit',
  socket_or_plug_hot: 'Stopcontact of stekker wordt warm',
  burning_smell_sparks_discolouration: 'Brandlucht, vonken of verkleuring',
  loose_or_damaged_connection: 'Losse of beschadigde aansluiting',
  unsafe_situation_suspected: 'Onveilige situatie vermoed',
  direct_phone_contact_needed: 'Direct telefonisch contact nodig',
}

export const missingInfoLabel: Record<MissingInfoItem, string> = {
  photo_consumer_unit: 'Foto meterkast',
  photo_existing_outlet: 'Foto bestaand stopcontact',
  photo_installation_location: 'Foto aansluitlocatie',
  photo_appliance_label: 'Foto typeplaatje',
  kitchen_plan: 'Keukentekening',
  manufacturer_diagram: 'Fabrikantschema',
  appliance_model: 'Merk en type apparaat',
  phone_contact_safety: 'Telefonisch contact (veiligheid)',
  access_details: 'Toegang / bereikbaarheid',
}

export const decisionLabel: Record<AssessmentDecision, string> = {
  fixed_existing_standard: 'Vaste prijs € 120 excl. btw',
  fixed_existing_priority_24h: 'Voorrang 24 uur € 145 excl. btw',
  site_survey: 'Schouw € 90 excl. btw (verrekenbaar)',
  additional_information_required: 'Aanvullende informatie nodig',
  custom_quote_required: 'Offerte nodig',
  safety_contact_required: 'Veiligheidscontact nodig',
  outside_service_area: 'Buiten werkgebied',
  declined: 'Afgewezen',
}

export const rejectionLabel: Record<string, string> = {
  safety_flag_blocks_fixed_price: 'Veiligheidsmarkering blokkeert een vaste prijs. Bel de klant of kies veiligheidscontact.',
  insufficient_technical_certainty: 'Te weinig technische zekerheid voor een vaste prijs. Vul de checklist aan of kies schouw.',
  heavy_work_requires_quote: 'Bij dit werk hoort een offerte of schouw, geen vaste prijs.',
  priority_not_requested_by_customer: 'De klant heeft geen voorrang binnen 24 uur gevraagd.',
  priority_availability_not_confirmed: 'Bevestig eerst expliciet de beschikbaarheid binnen 24 uur.',
  unknown_decision: 'Onbekende beslissing.',
  version_conflict: 'Iemand anders heeft deze beoordeling gewijzigd. Herlaad en vergelijk voordat je opslaat.',
  invalid_transition: 'Deze statusovergang is niet toegestaan.',
}

export const eventLabel: Record<string, string> = {
  assessment_created: 'Beoordeling geopend',
  draft_saved: 'Concept opgeslagen',
  status_changed: 'Status gewijzigd',
  decision_recorded: 'Beslissing vastgelegd',
  decision_rejected: 'Beslissing geweigerd',
  availability_confirmation: 'Beschikbaarheid bevestigd of ingetrokken',
}

export const categoryLabel: Record<string, string> = {
  consumer_unit: 'Meterkast',
  existing_outlet: 'Bestaand stopcontact',
  installation_location: 'Aansluitlocatie',
  appliance_label: 'Typeplaatje',
  kitchen_plan: 'Keukentekening',
  other: 'Overig',
}
