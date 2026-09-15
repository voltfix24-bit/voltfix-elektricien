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

  if (bookingActive) return null;

  return (
    <a
      href={whatsappHref(waMessage, { campaign: pathname, content: "float-button", term: locale })}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp"
      className="fixed bottom-[4.75rem] right-4 z-50 flex items-center justify-center rounded-full bg-whatsapp-brand p-3.5 text-whatsapp-brand-foreground shadow-lg shadow-whatsapp-brand/30 transition-transform hover:scale-110 hover:shadow-xl lg:bottom-6 lg:right-6"
      data-gtm="cta-whatsapp"
      data-gtm-location="float-button"
      onClick={() => track("whatsapp", "float-button")}
    >
      <WhatsAppIcon className="h-7 w-7" ariaLabel="WhatsApp" />
    </a>
  );
}
