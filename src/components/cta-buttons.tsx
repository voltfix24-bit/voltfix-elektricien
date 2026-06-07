import { FileText, MessageCircle, Phone } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { defaultWhatsappMessage, telHref, whatsappHref } from "@/lib/business";

type Props = {
  message?: string;
  className?: string;
  size?: "default" | "lg" | "xl";
  /** Where the CTA lives, used for GTM event context (e.g. "hero", "cta-band"). */
  location?: string;
  /** Use on blue brand surfaces (hero / CTA band) so the Offerte button stays legible. */
  onBrand?: boolean;
};

// The three primary conversion actions: Bel direct (red), WhatsApp (green), Offerte.
// Each action carries data-gtm + a gtm-* class so Google Tag Manager can
// track clicks without further code changes.
export function CtaButtons({ message, className, size = "lg", location = "page", onBrand }: Props) {
  return (
    <div className={`flex flex-wrap gap-3 ${className ?? ""}`}>
      <Button asChild variant="call" size={size}>
        <a
          href={telHref}
          className="gtm-cta-call"
          data-gtm="cta-call"
          data-gtm-location={location}
        >
          <Phone /> Bel direct
        </a>
      </Button>
      <Button asChild variant="whatsapp" size={size}>
        <a
          href={whatsappHref(message ?? defaultWhatsappMessage)}
          target="_blank"
          rel="noopener noreferrer"
          className="gtm-cta-whatsapp"
          data-gtm="cta-whatsapp"
          data-gtm-location={location}
        >
          <MessageCircle /> WhatsApp
        </a>
      </Button>
      <Button asChild variant={onBrand ? "outlineBrand" : "outlineLight"} size={size}>
        <Link
          to="/contact"
          className="gtm-cta-quote"
          data-gtm="cta-quote"
          data-gtm-location={location}
        >
          <FileText /> Offerte aanvragen
        </Link>
      </Button>
    </div>
  );
}
