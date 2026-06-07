import { FileText, MessageCircle, Phone } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { defaultWhatsappMessage, telHref, whatsappHref } from "@/lib/business";
import { useT } from "@/lib/i18n";
import { useTrackConversion } from "@/lib/analytics";

// Sticky bottom action bar — mobile only.
// CTAs carry data-gtm + gtm-* classes for Google Tag Manager tracking.
export function MobileCtaBar() {
  const t = useT();
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-3 border-t border-border bg-white shadow-[0_-6px_20px_-10px_rgba(0,0,0,0.25)] lg:hidden">
      <a
        href={telHref}
        className="gtm-cta-call flex flex-col items-center justify-center gap-1 bg-destructive py-2.5 text-xs font-bold text-destructive-foreground"
        data-gtm="cta-call"
        data-gtm-location="mobile-bar"
      >
        <Phone className="h-5 w-5" />
        {t.mobileCall}
      </a>
      <a
        href={whatsappHref(defaultWhatsappMessage)}
        target="_blank"
        rel="noopener noreferrer"
        className="gtm-cta-whatsapp flex flex-col items-center justify-center gap-1 bg-whatsapp py-2.5 text-xs font-bold text-whatsapp-foreground"
        data-gtm="cta-whatsapp"
        data-gtm-location="mobile-bar"
      >
        <MessageCircle className="h-5 w-5" />
        {t.whatsapp}
      </a>
      <Link
        to={t.contactTo}
        className="gtm-cta-quote flex flex-col items-center justify-center gap-1 bg-primary py-2.5 text-xs font-bold text-primary-foreground"
        data-gtm="cta-quote"
        data-gtm-location="mobile-bar"
      >
        <FileText className="h-5 w-5" />
        {t.mobileQuote}
      </Link>
    </div>
  );
}
