import { FileText, MessageCircle, Phone } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { defaultWhatsappMessage, telHref, whatsappHref } from "@/lib/business";

type Props = {
  message?: string;
  className?: string;
  size?: "default" | "lg" | "xl";
};

// The three primary conversion actions: Bel direct, WhatsApp, Offerte.
export function CtaButtons({ message, className, size = "lg" }: Props) {
  return (
    <div className={`flex flex-wrap gap-3 ${className ?? ""}`}>
      <Button asChild variant="gold" size={size}>
        <a href={telHref}>
          <Phone /> Bel direct
        </a>
      </Button>
      <Button asChild variant="whatsapp" size={size}>
        <a
          href={whatsappHref(message ?? defaultWhatsappMessage)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <MessageCircle /> WhatsApp
        </a>
      </Button>
      <Button asChild variant="outlineLight" size={size}>
        <Link to="/contact">
          <FileText /> Offerte aanvragen
        </Link>
      </Button>
    </div>
  );
}
