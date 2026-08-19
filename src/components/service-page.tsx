import { type ReactNode } from "react";
import { Phone } from "lucide-react";

import { CtaButtons } from "@/components/cta-buttons";
import { CtaBand } from "@/components/cta-band";
import { ServiceFaq, type Faq } from "@/components/service-faq";
import { RelatedServices } from "@/components/related-services";
import { ServiceQuickLinks } from "@/components/service-quick-links";

import { Testimonials } from "@/components/testimonials";
import { PriceIndicator, type PriceRow } from "@/components/price-indicator";
import { RatesTable } from "@/components/rates-table";
import { TechnicianByline } from "@/components/technician-byline";
import { TrustRow } from "@/components/trust-row";
import { business, telHref } from "@/lib/business";
import { useTrackConversion } from "@/lib/analytics";
import type { ReviewCategory } from "@/data/reviews";

type Props = {
  path: string;
  eyebrow: string;
  title: string;
  intro: string;
  image: string;
  imageAlt: string;
  /** Responsieve varianten voor de hero-afbeelding (srcset/sizes). */
  imageSrcSet?: string;
  imageSizes?: string;
  /** Intrinsieke afmetingen van de hero-afbeelding (voorkomt layout shift). */
  imageWidth?: number;
  imageHeight?: number;
  whatsappMessage: string;
  children: ReactNode;
  faqs: Faq[];
  priceTitle?: string;
  priceIntro?: string;
  priceRows?: PriceRow[];
  /** Volledige-breedte blokken direct na de hero/trust-row, vóór de prose-content. */
  beforeContent?: ReactNode;
  /** Filter Testimonials op klustype (bv. "spoed", "perilex"). */
  reviewCategory?: ReviewCategory;
  /** Object-fit voor de hero-afbeelding (bijv. "contain" voor transparante cut-outs). */
  heroObjectFit?: "cover" | "contain";
  /** Verwijder rand/schaduw en centreer een transparante cut-out afbeelding. */
  heroTransparent?: boolean;
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
  priceTitle,
  priceIntro,
  priceRows,
  beforeContent,
  reviewCategory,
  heroObjectFit = "cover",
  heroTransparent = false,

}: Props) {

  const track = useTrackConversion();
  return (
    <>
      {/* Section 1 — Hero (actiegericht) */}
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute inset-0 bg-grid-brand opacity-50" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 lg:grid-cols-2 lg:py-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-semibold text-white">
              {eyebrow}
            </span>
            <h1 className="mt-5 text-3xl font-bold leading-tight text-balance text-white sm:text-4xl lg:text-5xl">
              {title}
            </h1>
            <p className="mt-4 max-w-xl text-lg text-white/85">{intro}</p>
            <a
              href={telHref}
              className="gtm-cta-call mt-6 inline-flex items-center gap-3 text-2xl font-bold text-white"
              data-gtm="cta-call"
              data-gtm-location="service-hero"
              onClick={() => track("call", "service-hero")}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-primary">
                <Phone className="h-5 w-5" />
              </span>
              {business.phoneDisplay}
            </a>
            <div className="mt-6">
              <CtaButtons message={whatsappMessage} location="service-hero" onBrand />
            </div>
            <p className="mt-4 text-sm text-white/75">
              VoltFix · Amsterdam · {business.phoneDisplay} · {business.email}
            </p>
          </div>
          <div
            className={
              heroTransparent
                ? "flex max-h-[45vh] items-center justify-center sm:max-h-none"
                : "max-h-[45vh] overflow-hidden rounded-2xl border border-white/20 shadow-[var(--shadow-elegant)] sm:max-h-none"
            }
          >
            <img
              src={image}
              alt={imageAlt}
              width={1024}
              height={768}
              className={`h-full w-full ${heroObjectFit === "contain" ? "object-contain" : "object-cover"}`}
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
          </div>
        </div>
      </section>

      {/* MOBIEL — dienst-doorkliks direct onder de hero, naast de bel-CTA */}
      <ServiceQuickLinks currentPath={path} />

      <div className="border-b border-border bg-surface py-6">
        <div className="mx-auto max-w-6xl px-4">
          <TrustRow />
        </div>
      </div>


      {beforeContent}

      {/* Section 2 — Content */}
      <article className="mx-auto max-w-3xl px-4 py-14">{children}</article>


      {/* Compact CTA na 2 secties */}
      <CtaBand compact message={whatsappMessage} location="service-mid" />

      {/* Section 3 — Prijsindicatie (optioneel) */}
      {priceRows && priceRows.length > 0 && (
        <PriceIndicator
          title={priceTitle}
          intro={priceIntro}
          rows={priceRows}
          message={whatsappMessage}
          location="service-price"
        />
      )}

      {/* Tarieven & garantie — feitelijk, citeerbaar voor AI */}
      <RatesTable />

      {/* Monteur + garantie — zichtbare E-E-A-T signalen */}
      <TechnicianByline />

      {/* Section 4 — Reviews */}
      <Testimonials muted={!priceRows} category={reviewCategory} />

      {/* CTA na 2 secties */}
      <CtaBand message={whatsappMessage} location="service-cta" />

      {/* Section 5 — FAQ */}
      <ServiceFaq faqs={faqs} />

      {/* Section 6 — Gerelateerde diensten */}
      <RelatedServices currentPath={path} />

      <CtaBand
        compact
        title="Direct hulp nodig?"
        message={whatsappMessage}
        location="service-footer"
      />
    </>
  );
}
