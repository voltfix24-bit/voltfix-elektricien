import { type ReactNode } from "react";
import { Phone } from "lucide-react";

import { CtaButtons } from "@/components/cta-buttons";
import { CtaBand } from "@/components/cta-band";
import { ServiceFaq, type Faq } from "@/components/service-faq";
import { RelatedServices } from "@/components/related-services";
import { TrustRow } from "@/components/trust-row";
import { business, telHref } from "@/lib/business";

type Props = {
  path: string;
  eyebrow: string;
  title: string;
  intro: string;
  image: string;
  imageAlt: string;
  whatsappMessage: string;
  children: ReactNode;
  faqs: Faq[];
};

export function ServicePage({
  path,
  eyebrow,
  title,
  intro,
  image,
  imageAlt,
  whatsappMessage,
  children,
  faqs,
}: Props) {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-grid opacity-40" aria-hidden />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 lg:grid-cols-2 lg:py-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {eyebrow}
            </span>
            <h1 className="mt-5 text-3xl font-bold leading-tight text-balance sm:text-4xl lg:text-5xl">
              {title}
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted-foreground">{intro}</p>
            <div className="mt-7">
              <CtaButtons message={whatsappMessage} />
            </div>
            <a
              href={telHref}
              className="mt-5 inline-flex items-center gap-3 text-xl font-bold text-foreground"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Phone className="h-5 w-5" />
              </span>
              {business.phoneDisplay}
            </a>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border shadow-[var(--shadow-elegant)]">
            <img
              src={image}
              alt={imageAlt}
              width={1024}
              height={768}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      <div className="border-b border-border bg-card/50 py-6">
        <div className="mx-auto max-w-6xl px-4">
          <TrustRow />
        </div>
      </div>

      <article className="mx-auto max-w-3xl px-4 py-14">{children}</article>

      <CtaBand message={whatsappMessage} />

      <ServiceFaq faqs={faqs} />

      <RelatedServices currentPath={path} />

      <CtaBand
        title="Direct hulp nodig?"
        text={`Bel ${business.phoneDisplay} of stuur een WhatsApp. VoltFix helpt u snel verder in heel Amsterdam.`}
        message={whatsappMessage}
      />
    </>
  );
}
