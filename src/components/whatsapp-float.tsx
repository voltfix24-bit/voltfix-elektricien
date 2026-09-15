import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouterState } from "@tanstack/react-router";

import { whatsappHref } from "@/lib/business";
import { whatsappMessageFor } from "@/lib/whatsapp-messages";
import { useLocale } from "@/lib/i18n";
import { useTrackConversion } from "@/lib/analytics";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { getBookingActive, getBookingActiveServer, subscribeBookingActive } from "@/lib/booking-active";


// Floating WhatsApp CTA — rechtsonder, op alle schermen. Op mobiel zweeft hij
// boven de sticky belbalk; de belknop blijft de dominante actie. Merkgroen van
// WhatsApp (--whatsapp-brand), bewust afwijkend van het CTA-groen.
export function WhatsAppFloat() {
  const locale = useLocale();
  const track = useTrackConversion();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const waMessage = whatsappMessageFor(pathname, locale);
  const bookingActive = useSyncExternalStore(subscribeBookingActive, getBookingActive, getBookingActiveServer);
  const [overlapsContent, setOverlapsContent] = useState(false);

  // Verdwijn (fade) wanneer de knop een gemarkeerd inhoudsblok zou bedekken
  // (bijv. de prijskaart), zodat tekst als "Inbegrepen: ..." nooit wordt afgesneden.
  useEffect(() => {
    const blocks = Array.from(document.querySelectorAll("[data-wa-float-clear]"));
    if (blocks.length === 0 || typeof IntersectionObserver === "undefined") {
      setOverlapsContent(false);
      return;
    }
    // rootMargin krimpt het viewport aan de rechterkant (breedte van de knop)
    // en onderkant (sticky belbalk + knophoogte) tot precies de knopzone.
    const observer = new IntersectionObserver(
      (entries) => setOverlapsContent(entries.some((e) => e.isIntersecting)),
      { rootMargin: "0px -88px -140px 0px", threshold: 0 },
    );
    blocks.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pathname]);

  if (bookingActive) return null;

  return (
    <a
      href={whatsappHref(waMessage, { campaign: pathname, content: "float-button", term: locale })}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp"
      aria-hidden={overlapsContent}
      tabIndex={overlapsContent ? -1 : undefined}
      className={`fixed bottom-[5.5rem] right-4 z-50 flex items-center justify-center rounded-full bg-whatsapp-brand p-3.5 text-whatsapp-brand-foreground shadow-lg shadow-whatsapp-brand/30 transition-all duration-200 hover:scale-110 hover:shadow-xl lg:bottom-6 lg:right-6 ${
        overlapsContent ? "pointer-events-none translate-y-2 opacity-0" : "opacity-100"
      }`}
      data-gtm="cta-whatsapp"
      data-gtm-location="float-button"
      onClick={() => track("whatsapp", "float-button")}
    >
      <WhatsAppIcon className="h-7 w-7" ariaLabel="WhatsApp" />
    </a>
  );
}
