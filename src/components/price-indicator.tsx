import { Check, Clock } from "lucide-react";

import { CtaButtons } from "@/components/cta-buttons";
import { useT } from "@/lib/i18n";
import { whatsappHref } from "@/lib/business";
import { useTrackConversion } from "@/lib/analytics";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";


export type PriceRow = {
  title: string;
  price: string;
  unit: string;
  points: string[];
  featured?: boolean;
};

type Props = {
  title?: string;
  intro?: string;
  rows: PriceRow[];
  message?: string;
  location?: string;
};

// Prijsindicatieblok voor dienstpagina's (o.a. groepenkast en perilex).
export function PriceIndicator({
  title,
  intro,
  rows,
  message,
  location = "price-indicator",
}: Props) {
  const t = useT();
  const track = useTrackConversion();
  const lang = t.contactTo.startsWith("/en-gb") ? "en" : "nl";
  const cardCta = lang === "en" ? "Request fixed price" : "Vraag vaste prijs";
  const responseNote =
    lang === "en"
      ? "Reply asap via WhatsApp · Mon–Sun 07:00–22:00"
      : "Reactie zsm via WhatsApp · ma–zo 07:00–22:00";

  return (
    <section className="border-t border-border bg-surface">
      <div className="mx-auto max-w-5xl px-4 py-14">
        <div className="text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">{title ?? t.priceTitle}</h2>
          {intro && (
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">{intro}</p>
          )}
        </div>
        <div
          className={`mt-10 grid gap-6 ${rows.length > 1 ? "md:grid-cols-2 lg:grid-cols-3" : "max-w-md mx-auto"}`}
        >
          {rows.map((p) => {
            const cardMsg = message
              ? `${message} — ${p.title} (${p.price})`
              : `${p.title} (${p.price})`;
            const cardLoc = `${location}-card-${p.title.toLowerCase().replace(/\s+/g, "-").slice(0, 24)}`;
            return (
              <div
                key={p.title}
                className={`flex flex-col rounded-xl border p-6 ${
                  p.featured
                    ? "border-primary bg-card shadow-[var(--shadow-gold)]"
                    : "border-border bg-card"
                }`}
              >
                {p.featured && (
                  <span className="mb-3 inline-block w-fit rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground">
                    {t.priceMostChosen}
                  </span>
                )}
                <h3 className="text-lg font-semibold">{p.title}</h3>
                <p className="mt-2 text-3xl font-bold text-primary">{p.price}</p>
                <p className="text-xs text-muted-foreground">{p.unit}</p>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {p.points.map((pt) => (
                    <li key={pt} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" /> {pt}
                    </li>
                  ))}
                </ul>
                <a
                  href={whatsappHref(cardMsg, {
                    campaign: location,
                    content: cardLoc,
                    term: lang,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track("whatsapp", cardLoc)}
                  data-gtm="cta-whatsapp"
                  data-gtm-location={cardLoc}
                  className="gtm-cta-whatsapp mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 text-sm font-bold text-white shadow-sm transition hover:brightness-110"
                >
                  <WhatsAppIcon className="h-4 w-4" ariaLabel="WhatsApp" /> {cardCta}
                </a>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">{t.priceFootnote}</p>
        <div className="mt-6 flex items-center justify-center gap-2 text-xs font-medium text-primary">
          <Clock className="h-3.5 w-3.5" /> {responseNote}
        </div>
        <div className="mt-6 flex justify-center">
          <CtaButtons message={message} location={location} />
        </div>
      </div>
    </section>
  );
}
