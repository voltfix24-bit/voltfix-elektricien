import { useSyncExternalStore } from "react";
import { ArrowRight, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouterState } from "@tanstack/react-router";
import { getBookingActive, getBookingActiveServer, setBookingActive, subscribeBookingActive } from "@/lib/booking-active";
import { getCookieBannerOpen, getCookieBannerOpenServer, subscribeCookieBannerOpen } from "@/lib/cookie-banner-open";
import { getPerilexSticky, getPerilexStickyServer, requestPerilexBooking, subscribePerilexSticky } from "@/lib/perilex-sticky";

import { business, telHref, whatsappHref } from "@/lib/business";
import { whatsappMessageFor } from "@/lib/whatsapp-messages";
import { useLocale, useT } from "@/lib/i18n";
import { useTrackConversion } from "@/lib/analytics";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";

// Sticky bottom action bar — mobile only.
// Bellen is de dominante actie; WhatsApp staat er als compact icoon naast.
// CTAs carry data-gtm + gtm-* classes for Google Tag Manager tracking.
export function MobileCtaBar() {
  const t = useT();
  const locale = useLocale();
  const track = useTrackConversion();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const waMessage = whatsappMessageFor(pathname, locale);
  const bookingActive = useSyncExternalStore(subscribeBookingActive, getBookingActive, getBookingActiveServer);
  const cookieBannerOpen = useSyncExternalStore(subscribeCookieBannerOpen, getCookieBannerOpen, getCookieBannerOpenServer);
  const perilexSticky = useSyncExternalStore(subscribePerilexSticky, getPerilexSticky, getPerilexStickyServer);
  const normalizedPath = pathname.replace(/\/+$/, "");
  const isEmergencyPage = ["/spoed-elektricien-amsterdam", "/en-gb/spoed-elektricien-amsterdam"].includes(normalizedPath);
  // Op spoedpagina's blijft de belactie bereikbaar; de cookiemelding staat erboven.
  if (cookieBannerOpen && !isEmergencyPage) return null;
  if (isEmergencyPage) {
    return <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden">
      <Button asChild variant="whatsapp" size="xl" className="h-auto min-h-12 w-full whitespace-normal px-3 py-3"><a href={telHref} className="gtm-cta-call flex items-center justify-center gap-2" data-gtm="cta-call" data-gtm-location="emergency-mobile-bar" onClick={() => track("call", "emergency-mobile-bar")}><Phone className="h-5 w-5" aria-hidden />{locale === "en" ? `Call Now: ${business.phoneDisplay}` : `Bel Nu Direct: ${business.phoneDisplay}`}</a></Button>
    </div>;
  }
  if (["/perilex-amsterdam", "/en-gb/perilex-amsterdam"].includes(pathname.replace(/\/+$/, ""))) {
    // Eén amber knop, alleen wanneer de hero-actie uit beeld is. Nooit samen
    // met de bel-/WhatsAppbalk, de bookingmodal of de cookiemelding.
    if (bookingActive || !perilexSticky) return null;
    return <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden">
      <Button variant="cta" size="xl" className="h-auto min-h-12 w-full whitespace-normal px-3 py-3" onClick={() => { track("quote", "perilex-mobile-bar"); requestPerilexBooking(); }}>{locale === "en" ? "Request a connection" : "Vraag aansluiting aan"}<ArrowRight /></Button>
    </div>;
  }
  if (["/groepenkast-amsterdam", "/en-gb/groepenkast-amsterdam"].includes(pathname.replace(/\/+$/, ""))) {
    if (bookingActive) return null;
    return <div className="groepenkast-page fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden">
      <Button asChild variant="cta" size="xl" className="h-auto min-h-12 w-full whitespace-normal px-3 py-3"><a href="#installatiemoment" onClick={() => { track("quote", "groepenkast-mobile-bar"); setBookingActive(true); }}>{locale === "en" ? "Calculate my fixed price" : "Bereken mijn vaste prijs"}<ArrowRight /></a></Button>
    </div>;
  }
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex items-stretch border-t border-border bg-white shadow-[0_-6px_20px_-10px_rgba(0,0,0,0.25)] lg:hidden">
      <a
        href={telHref}
        className="gtm-cta-call flex flex-1 items-center justify-center gap-2 bg-destructive py-3 text-sm font-bold text-destructive-foreground"
        data-gtm="cta-call"
        data-gtm-location="mobile-bar"
        onClick={() => track("call", "mobile-bar")}
      >
        <Phone className="h-5 w-5" />
        <span>
          {t.callDirect} · {business.phoneDisplay}
        </span>
      </a>
      <a
        href={whatsappHref(waMessage, { campaign: pathname, content: "mobile-bar", term: locale })}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t.whatsapp}
        className="gtm-cta-whatsapp flex w-16 shrink-0 items-center justify-center bg-whatsapp text-whatsapp-foreground"
        data-gtm="cta-whatsapp"
        data-gtm-location="mobile-bar"
        onClick={() => track("whatsapp", "mobile-bar")}
      >
        <WhatsAppIcon className="h-6 w-6" ariaLabel={t.whatsapp} />
      </a>
    </div>
  );
}
