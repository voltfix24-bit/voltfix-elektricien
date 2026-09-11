// Kleine globale vlag: staat de bookingflow open?
// De sitebrede sticky CTA verbergt zich zodra dit true is.
// Daarnaast houden we de context bij waarmee de flow geopend is
// (dienst, intentie, bronpagina, eventueel voorgeselecteerd pakket).
import type { BookingContext } from './booking/types';

let active = false;
let context: BookingContext | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function setBookingActive(next: boolean, nextContext?: BookingContext) {
  if (nextContext !== undefined) context = nextContext;
  if (!next) context = null;
  if (active === next) { emit(); return; }
  active = next;
  emit();
}

/** Opent de flow met expliciete dienstcontext. */
export function openBooking(nextContext: BookingContext) {
  setBookingActive(true, nextContext);
}

export function subscribeBookingActive(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export const getBookingActive = () => active;
export const getBookingActiveServer = () => false;
export const getBookingContext = () => context;
