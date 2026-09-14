// ---------------------------------------------------------------------------
// Vangnet voor bel- en WhatsApp-kliks
// ---------------------------------------------------------------------------
// De meeste knoppen melden hun klik zelf (onClick → trackConversion). Een
// aantal WhatsApp-links in oudere blokken doet dat niet, en daardoor miste de
// conversieactie "whatsapp_klik" die kliks volledig.
//
// Deze globale kliklistener vangt ELKE klik op een tel:- of WhatsApp-link op
// (api.whatsapp.com, wa.me, web.whatsapp.com) en meldt de conversie alsnog —
// met exact dezelfde eventnaam, taal en paginapad als de knoppen die het wél
// zelf doen. Dubbeltelling is uitgesloten: als de knop de conversie in
// hetzelfde klikmoment al heeft gemeld, doet het vangnet niets.
//
// De listener staat op `document` in de bubble-fase: React-handlers draaien
// eerder, dus hun melding is al geregistreerd wanneer wij kijken.
// ---------------------------------------------------------------------------

import { trackConversion, wasRecentlyTracked, type ConversionType } from "./analytics";

const WHATSAPP_HOST = /^(?:https?:)?\/\/(?:api\.whatsapp\.com|wa\.me|web\.whatsapp\.com|chat\.whatsapp\.com)/i;

/** Conversietype van een link, of `null` als het geen contactlink is. */
export function contactLinkType(href: string): ConversionType | null {
  if (!href) return null;
  if (/^tel:/i.test(href)) return "call";
  if (WHATSAPP_HOST.test(href)) return "whatsapp";
  return null;
}

function languageForPath(pathname: string): "nl" | "en" {
  return pathname === "/en-gb" || pathname.startsWith("/en-gb/") ? "en" : "nl";
}

/** Plaatst het vangnet; geeft een opruimfunctie terug. */
export function installContactClickFallback(): () => void {
  if (typeof document === "undefined") return () => undefined;

  const onClick = (ev: Event) => {
    const target = ev.target as Element | null;
    const anchor = target?.closest?.("a[href]") as HTMLAnchorElement | null;
    if (!anchor) return;

    const type = contactLinkType(anchor.getAttribute("href") ?? "");
    if (!type) return;

    // De knop heeft deze klik al gemeld: niets doen (geen dubbeltelling).
    if (wasRecentlyTracked(type)) return;

    const pagePath = window.location.pathname;
    trackConversion({
      type,
      language: languageForPath(pagePath),
      pagePath,
      location: anchor.dataset.gtmLocation || (type === "call" ? "link-fallback-call" : "link-fallback-whatsapp"),
    });
  };

  document.addEventListener("click", onClick);
  return () => document.removeEventListener("click", onClick);
}
