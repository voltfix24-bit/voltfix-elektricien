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

import { readAdClick } from "./ad-click";
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

/**
 * Plakt de advertentiecode én het volledige klik-id onderaan de voorgevulde
 * WhatsApp-tekst, zodat het gesprek zelf aanwijst uit welke advertentie de
 * klant kwam. De beheerder plakt code óf klik-id in het dossier om de klus
 * aan de advertentie te koppelen. Zonder advertentieklik of met de code er
 * al in verandert er niets.
 */
export function withClickRef(href: string, click: AdClick): string {
  const ref = click.ref;
  if (!ref) return href;
  try {
    const url = new URL(href, typeof window === "undefined" ? "https://voltfix.nl" : window.location.href);
    const marker = `Ref: ${ref}`;
    const text = url.searchParams.get("text") ?? "";
    if (text.includes(marker)) return href;
    const clickId = click.gclid || click.gbraid || click.wbraid;
    const idLine = clickId ? `\ngclid: ${clickId}` : "";
    url.searchParams.set("text", text ? `${text}\n\n${marker}${idLine}` : `${marker}${idLine}`);
    return url.toString();
  } catch {
    return href;
  }
}

/** Plaatst het vangnet; geeft een opruimfunctie terug. */
export function installContactClickFallback(): () => void {
  if (typeof document === "undefined") return () => undefined;

  const onClick = (ev: Event) => {
    const target = ev.target as Element | null;
    const anchor = target?.closest?.("a[href]") as HTMLAnchorElement | null;
    if (!anchor) return;

    const href = anchor.getAttribute("href") ?? "";
    const type = contactLinkType(href);
    if (!type) return;

    if (type === "whatsapp") {
      const withRef = withClickRef(href, readAdClick().ref);
      if (withRef !== href) anchor.setAttribute("href", withRef);
    }

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
