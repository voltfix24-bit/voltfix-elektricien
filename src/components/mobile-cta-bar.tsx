import { FileText, MessageCircle, Phone } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { defaultWhatsappMessage, telHref, whatsappHref } from "@/lib/business";

// Sticky bottom action bar — mobile only.
// CTAs carry data-gtm + gtm-* classes for Google Tag Manager tracking.
export function MobileCtaBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur lg:hidden">
      <div className="grid grid-cols-3 divide-x divide-border">
        <a
          href={telHref}
          className="gtm-cta-call flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-semibold text-foreground"
          data-gtm="cta-call"
          data-gtm-location="mobile-bar"
        >
          <Phone className="h-5 w-5 text-primary" />
          Bellen
        </a>
        <a
          href={whatsappHref(defaultWhatsappMessage)}
          target="_blank"
          rel="noopener noreferrer"
          className="gtm-cta-whatsapp flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-semibold text-foreground"
          data-gtm="cta-whatsapp"
          data-gtm-location="mobile-bar"
        >
          <MessageCircle className="h-5 w-5 text-whatsapp" />
          WhatsApp
        </a>
        <Link
          to="/contact"
          className="gtm-cta-quote flex flex-col items-center justify-center gap-1 bg-primary py-2.5 text-xs font-bold text-primary-foreground"
          data-gtm="cta-quote"
          data-gtm-location="mobile-bar"
        >
          <FileText className="h-5 w-5" />
          Offerte
        </Link>
      </div>
    </div>
  );
}
