// Zichtbaarheid van de mobiele sticky aanvraagknop op de Perilexpagina.
// De pagina zet dit op basis van de primaire hero-actie; de sticky balk leest
// het. Zo blijft er één knop en stapelt er niets met de bel-/WhatsAppbalk.
let visible = false;
const listeners = new Set<() => void>();

export function setPerilexStickyVisible(next: boolean) {
  if (visible === next) return;
  visible = next;
  for (const listener of listeners) listener();
}

export function subscribePerilexSticky(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export const getPerilexSticky = () => visible;
export const getPerilexStickyServer = () => false;

// De sticky balk vraagt de pagina om de centrale aanvraag te openen; de pagina
// beslist zelf of dat kan (activatiecontrole) of dat bellen/WhatsApp volgt.
const requestListeners = new Set<() => void>();

export function requestPerilexBooking() {
  for (const listener of requestListeners) listener();
}

export function onPerilexBookingRequest(listener: () => void) {
  requestListeners.add(listener);
  return () => { requestListeners.delete(listener); };
}
