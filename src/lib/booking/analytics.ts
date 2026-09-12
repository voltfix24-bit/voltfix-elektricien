import { isLikelyBot, pushToDataLayer } from '@/lib/analytics';
import type { BookingContext, BookingIntent, BookingServiceId } from './types';

export type BookingEvent =
  | 'booking_started'
  | 'service_selected'
  | 'intent_selected'
  | 'booking_step_completed'
  | 'photo_added'
  | 'lead_submitted'
  | 'booking_abandoned';

export type BookingEventPayload = {
  service: BookingServiceId;
  intent?: BookingIntent;
  sourcePage?: string;
  /** Richtprijs in euro, of null wanneer de prijs pas na controle volgt. */
  estimatedPrice?: number | null;
  /** Statuslabel zoals de gebruiker het in de footer ziet. */
  status?: string;
  /** Fotocontrole, foto-later of schouw. */
  route?: string;
  /** Alleen de 4 cijfers van de postcode — geen volledig adres. */
  postalArea?: string;
  step?: number;
  stepId?: string;
  /** Prijsstatus zoals de routebeslissing die oplevert (fixed/review_needed/none). */
  priceStatus?: string | null;
  /** Stabiele identifier van de toegepaste prijsregel. */
  priceRuleId?: string | null;
  /** Dienstspecifieke intake-antwoorden als stabiele codes, zonder persoonsgegevens. */
  answers?: Record<string, string | null>;
};

/** Uniform booking-event naar GTM/GA4 met dienstcontext. */
export function trackBooking(event: BookingEvent, payload: BookingEventPayload) {
  if (isLikelyBot()) return;
  pushToDataLayer({
    event,
    event_category: 'booking',
    booking_service: payload.service,
    booking_intent: payload.intent ?? null,
    booking_source_page: payload.sourcePage ?? (typeof window === 'undefined' ? null : window.location.pathname),
    booking_estimated_price: payload.estimatedPrice ?? null,
    booking_status: payload.status ?? null,
    booking_route: payload.route ?? null,
    booking_postal_area: payload.postalArea ?? null,
    booking_step: payload.step ?? null,
    booking_step_id: payload.stepId ?? null,
    booking_price_status: payload.priceStatus ?? null,
    booking_price_rule_id: payload.priceRuleId ?? null,
    booking_answers: payload.answers ?? null,
  });
}

/** Alleen het cijferdeel van een postcode (1017 uit "1017 AB"). */
export function postalArea(postalCode: string): string | undefined {
  const match = /^\s*([1-9]\d{3})/.exec(postalCode);
  return match ? match[1] : undefined;
}

export const contextPayload = (context: BookingContext): Pick<BookingEventPayload, 'service' | 'intent' | 'sourcePage'> => ({
  service: context.initialService,
  intent: context.initialIntent,
  sourcePage: context.sourcePage,
});
