// Dunne laag bovenop src/lib/analytics.ts — geen tweede trackingsysteem.
// Nieuwe categorie 'intake' naast contact/consent/social; het bestaande
// event_name / event_category / event_label-schema blijft gelden, inclusief
// language en page_path.

export type IntakeEvent =
  | 'booking_started'
  | 'service_selected'
  | 'service_changed'
  | 'intent_selected'
  | 'intent_changed'
  | 'step_completed'
  | 'area_checked'
  | 'photo_added'
  | 'photo_deferred'
  | 'lead_partial_saved'
  | 'lead_submitted'
  | 'booking_abandoned';

const LABELS: Record<IntakeEvent, string> = {
  booking_started: 'Intake started',
  service_selected: 'Service selected',
  service_changed: 'Service changed',
  intent_selected: 'Intent selected',
  intent_changed: 'Intent changed',
  step_completed: 'Step completed',
  area_checked: 'Service area checked',
  photo_added: 'Photo added',
  photo_deferred: 'Photo deferred',
  lead_partial_saved: 'Draft lead saved',
  lead_submitted: 'Lead submitted',
  booking_abandoned: 'Intake abandoned',
};

type Params = Record<string, string | number | boolean | null>;

export function trackIntake(event: IntakeEvent, params: Params = {}): void {
  if (typeof window === 'undefined') return;
  const payload = {
    event,
    event_category: 'intake',
    event_label: LABELS[event],
    page_path: window.location.pathname,
    ...params,
  };
  window.dataLayer?.push(payload);
  window.gtag?.('event', event, payload);
}

// lead_submitted vuurt DAARNAAST de bestaande request_quote-conversie, anders
// breken je huidige Ads-conversies. Roep dit aan in plaats van trackIntake().
export function trackLeadSubmitted(params: Params = {}): void {
  trackIntake('lead_submitted', params);
  if (typeof window === 'undefined') return;
  const legacy = { event: 'request_quote', event_category: 'contact', event_label: 'Quote request', page_path: window.location.pathname, ...params };
  window.dataLayer?.push(legacy);
  window.gtag?.('event', 'request_quote', legacy);
}
