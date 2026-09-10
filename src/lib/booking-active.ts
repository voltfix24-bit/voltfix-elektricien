// Kleine globale vlag: staat de groepenkast-bookingflow open?
// De sitebrede sticky CTA verbergt zich zodra dit true is.
let active = false;
const listeners = new Set<() => void>();

export function setBookingActive(next: boolean) {
  if (active === next) return;
  active = next;
  for (const listener of listeners) listener();
}

export function subscribeBookingActive(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export const getBookingActive = () => active;
export const getBookingActiveServer = () => false;
