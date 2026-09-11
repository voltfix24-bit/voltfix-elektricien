// Kleine globale vlag: staat de cookiebanner open?
// De mobiele sticky CTA verbergt zich zolang dit true is.
let open = false;
const listeners = new Set<() => void>();

export function setCookieBannerOpen(next: boolean) {
  if (open === next) return;
  open = next;
  for (const listener of listeners) listener();
}

export function subscribeCookieBannerOpen(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export const getCookieBannerOpen = () => open;
export const getCookieBannerOpenServer = () => false;
