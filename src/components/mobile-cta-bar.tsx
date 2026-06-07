import { FileText, MessageCircle, Phone } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { defaultWhatsappMessage, telHref, whatsappHref } from "@/lib/business";

// Sticky bottom action bar — mobile only.
export function MobileCtaBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur lg:hidden">
      <div className="grid grid-cols-3 divide-x divide-border">
        <a
          href={telHref}
          className="flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-semibold text-foreground"
        >
          <Phone className="h-5 w-5 text-primary" />
          Bellen
        </a>
        <a
          href={whatsappHref(defaultWhatsappMessage)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-semibold text-foreground"
        >
          <MessageCircle className="h-5 w-5 text-whatsapp" />
          WhatsApp
        </a>
        <Link
          to="/contact"
          className="flex flex-col items-center justify-center gap-1 bg-primary py-2.5 text-xs font-bold text-primary-foreground"
        >
          <FileText className="h-5 w-5" />
          Offerte
        </Link>
      </div>
    </div>
  );
}
