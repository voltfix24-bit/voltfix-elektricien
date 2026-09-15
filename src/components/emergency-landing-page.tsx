import { type ReactNode } from "react";
import {
  BadgeCheck,
  Building2,
  Check,
  ExternalLink,
  Phone,
  ReceiptText,
  Shield,
  ShieldCheck,
  Star,
  TimerReset,
  UserRoundCheck,
  Wrench,
} from "lucide-react";

import vcaBadge from "@/assets/cert-vca.webp.asset.json";
import isoBadge from "@/assets/cert-iso9001.webp.asset.json";
import leerbedrijfBadge from "@/assets/cert-leerbedrijf.webp.asset.json";
import { Button } from "@/components/ui/button";
import { CtaBand } from "@/components/cta-band";
import { EmergencyFlowchart } from "@/components/emergency-flowchart";
import { RatesTable } from "@/components/rates-table";
import { RelatedServices } from "@/components/related-services";
import { ResponseTimes } from "@/components/response-times";
import { ServiceFaq, type Faq } from "@/components/service-faq";
import { ServiceQuickLinks } from "@/components/service-quick-links";
import { TechnicianByline } from "@/components/technician-byline";
import { Testimonials } from "@/components/testimonials";
import { TrustRow } from "@/components/trust-row";
import { aggregateRating } from "@/data/reviews";
import { useTrackConversion } from "@/lib/analytics";
import { business, telHref } from "@/lib/business";
import { useLocale } from "@/lib/i18n";
import { eurEn, eurNl, prices } from "@/lib/pricing";

type Props = {
  path: string;
  image: string;
  imageAlt: string;
  faqs: Faq[];
  children: ReactNode;
};

const certificationBadges = [
  { key: "vca", image: vcaBadge, nl: "VCA VOL", en: "VCA VOL" },
  { key: "iso", image: isoBadge, nl: "ISO 9001", en: "ISO 9001" },
  { key: "school", image: leerbedrijfBadge, nl: "Erkend Leerbedrijf", en: "Recognised training company" },
] as const;

// Eén beknopte insluit/uitsluit-regel, identiek in hero en prijszekerheid-sectie.
function priceInclusionLine(en: boolean) {
  return en
    ? "Included: call-out, diagnosis and the first hour of work. Possible extra: parts/materials — always agreed with you before we continue."
    : "Inbegrepen: voorrijden, diagnose en het eerste uur werk. Eventueel extra: onderdelen/materiaal — altijd eerst besproken en akkoord voordat we doorgaan.";
}

export function EmergencyLandingPage({ path, image, imageAlt, faqs, children }: Props) {
  const locale = useLocale();
  const en = locale === "en";
  const track = useTrackConversion();
  const callLabel = en
    ? `Call Now: ${business.phoneDisplay}`
    : `Bel Nu Direct: ${business.phoneDisplay}`;
  const rating = en
    ? `${aggregateRating.ratingValue} from ${aggregateRating.reviewCount} Google reviews`
    : `${aggregateRating.ratingValue.toString().replace(".", ",")} uit ${aggregateRating.reviewCount} Google-reviews`;
  const money = en ? eurEn : eurNl;

  return (
    <div className="emergency-page max-w-[100vw] overflow-x-clip">
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 py-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)] lg:py-14">
          <div className="min-w-0">
            <span className="inline-flex max-w-full items-center gap-2 break-words rounded-full border border-white/30 bg-white/15 px-3 py-1 t-meta font-bold text-white">
              <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
              </span>
              {en ? "EMERGENCY SERVICE ACTIVE IN AMSTERDAM" : "SPOEDDIENST NU ACTIEF IN AMSTERDAM"}
            </span>
            <h1 className="mt-4 max-w-3xl break-words text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-[2.65rem]">
              {en
                ? "Power outage or short circuit? With you within 60 minutes."
                : "Stroomstoring of kortsluiting? Binnen 60 minuten bij je."}
            </h1>
            <p className="mt-3 max-w-2xl text-lg font-medium text-white/90">
              {en
                ? "Direct help, no call center — you speak to the electrician himself."
                : "Directe hulp, geen callcenter — je spreekt zo de monteur zelf."}
            </p>
            <a
              href={business.googleBusinessProfile}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex max-w-full flex-wrap items-center gap-2 text-sm font-semibold text-white underline-offset-4 hover:underline"
            >
              <StarRating value={aggregateRating.ratingValue} className="text-white" />
              <span>{rating}</span>
              <ExternalLink className="h-4 w-4" aria-hidden />
            </a>


            <dl data-wa-float-clear className="mt-6 grid max-w-2xl grid-cols-1 overflow-hidden rounded-lg border border-white/25 bg-white/10 backdrop-blur-sm sm:grid-cols-2">
              <div className="p-4 sm:p-5">
                <dt className="text-sm font-semibold text-white/80">{en ? "Daytime" : "Overdag"}</dt>
                <dd className="mt-1 text-2xl font-bold text-white">{money(prices.emergencyFirstHour)} all-in</dd>
                <p className="mt-1 text-xs leading-relaxed text-white/75">{en ? "Includes call-out + first hour" : "Inclusief voorrijden + eerste uur werk"}</p>
              </div>
              <div className="border-t border-white/25 p-4 sm:border-l sm:border-t-0 sm:p-5">
                <dt className="text-sm font-semibold text-white/80">{en ? "Evening / night / weekend" : "Avond / nacht / weekend"}</dt>
                <dd className="mt-1 text-2xl font-bold text-white">{money(prices.offHoursFirstHour)} all-in</dd>
                <p className="mt-1 text-xs leading-relaxed text-white/75">{en ? "Includes call-out + first hour" : "Inclusief voorrijden + eerste uur werk"}</p>
              </div>
            </dl>

            <p className="mt-3 max-w-2xl text-xs leading-relaxed text-white/75">{priceInclusionLine(en)}</p>

            <Button asChild variant="whatsapp" size="xl" className="mt-6 h-auto min-h-14 w-full whitespace-normal px-5 py-3 text-base sm:w-fit">
              <a href={telHref} className="gtm-cta-call" data-gtm="cta-call" data-gtm-location="emergency-hero" onClick={() => track("call", "emergency-hero")}><Phone aria-hidden />{callLabel}</a>
            </Button>
          </div>
          <div className="flex max-h-[42vh] items-center justify-center lg:max-h-none">
            <img src={image} alt={imageAlt} width={1024} height={768} className="h-full w-full object-contain" loading="eager" fetchPriority="high" decoding="async" />
          </div>
        </div>
      </section>

      <EmergencyAssurance en={en} />
      <ServiceQuickLinks currentPath={path} />
      {/* Neutrale band i.p.v. de gele pill-variant: groen/geel blijven voorbehouden aan de CTA. */}
      <div className="border-b border-border bg-surface py-6"><div className="mx-auto max-w-6xl px-4"><TrustRow variant="band" /></div></div>
      <EmergencyProcess en={en} callLabel={callLabel} />
      <EmergencyFlowchart message={en ? "Hi VoltFix, I urgently need an electrician in Amsterdam." : "Hallo VoltFix, ik heb met spoed een elektricien nodig in Amsterdam."} />
      <ResponseTimes />

      <article className="mx-auto max-w-3xl px-4 py-14">{children}</article>
      <CtaBand compact title={en ? "Need help now?" : "Direct hulp nodig?"} location="emergency-mid" />
      <RatesTable />
      <TechnicianByline />
      <Testimonials category="spoed" />
      <CtaBand title={en ? "Need an emergency electrician now?" : "Nu een spoed elektricien nodig?"} location="emergency-cta" />
      <ServiceFaq faqs={faqs} />
      <RelatedServices currentPath={path} />
      <CtaBand compact title={en ? "Need help now?" : "Direct hulp nodig?"} location="emergency-footer" />
    </div>
  );
}

function EmergencyAssurance({ en }: { en: boolean }) {
  const money = en ? eurEn : eurNl;
  const guarantees = en
    ? [
        { icon: ReceiptText, title: "Fixed price before we start", text: "You know the agreed price before any repair begins." },
        { icon: TimerReset, title: "We stop and discuss extras", text: "More time or materials needed? The electrician asks you first." },
        { icon: Shield, title: "Warranty on all work", text: "If a problem comes back later, we'll come and fix it for you." },
      ]
    : [
        { icon: ReceiptText, title: "Vaste prijs vóór de start", text: "Je weet de afgesproken prijs voordat de reparatie begint." },
        { icon: TimerReset, title: "We stoppen en overleggen", text: "Meer tijd of materiaal nodig? De monteur vraagt eerst je akkoord." },
        { icon: Shield, title: "Garantie op elk werk", text: "Mocht er later toch een probleem zijn, dan komen we het voor je oplossen." },
      ];

  return (
    <section className="border-b border-border bg-background" aria-labelledby="price-certainty-heading">
      <div className="mx-auto max-w-6xl px-4 section-y">
        <h2 id="price-certainty-heading" className="t-h2 max-w-3xl">
          {en ? "Why you'll never face surprise costs with VoltFix" : "Waarom je bij VoltFix nooit voor verrassingen komt te staan"}
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {guarantees.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-4 border-t-2 border-primary pt-5">
              <Icon className="h-7 w-7 shrink-0 text-primary" aria-hidden />
              <div><h3 className="font-bold text-foreground">{title}</h3><p className="mt-1 text-sm text-muted-foreground">{text}</p></div>
            </div>
          ))}
        </div>

        <div data-wa-float-clear className="mt-10 grid overflow-hidden rounded-lg border border-border md:grid-cols-2">
          <div className="bg-muted p-6">
            <p className="text-sm font-bold uppercase text-muted-foreground">{en ? "Some call-out services" : "Andere partijen"}</p>
            <p className="mt-2 font-semibold text-foreground">{en ? "Low headline price, with hidden call-out costs added later." : "Een lage lokprijs, met verborgen voorrijkosten achteraf."}</p>
          </div>
          <div className="bg-primary p-6 text-primary-foreground">
            <p className="text-sm font-bold uppercase text-white/75">VoltFix</p>
            <p className="mt-2 font-bold text-white">{money(prices.emergencyFirstHour)} / {money(prices.offHoursFirstHour)} all-in</p>
            <p className="mt-1 text-sm text-white/85">{en ? "Call-out and first hour included. Never a surprise on the invoice." : "Voorrijden en het eerste uur inbegrepen. Nooit een verrassing op de factuur."}</p>
            <p className="mt-2 text-xs leading-relaxed text-white/70">{priceInclusionLine(en)}</p>
          </div>
        </div>

        <div className="mt-10 grid items-center gap-8 lg:grid-cols-[1fr_auto]">
          <div>
            {/* Twee even zware signalen naast elkaar: de Google-score die een
                consument meteen begrijpt, en het brancheligmaatschap. */}
            <div className="flex flex-wrap items-stretch gap-3">
              <a
                href={business.googleBusinessProfile}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex max-w-full flex-wrap items-center gap-2 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 font-bold text-foreground underline-offset-4 hover:underline"
              >
                <Star className="h-5 w-5 shrink-0 fill-current text-primary" aria-hidden />
                <span className="text-lg">{en ? `${aggregateRating.ratingValue} out of 5` : `${aggregateRating.ratingValue.toString().replace(".", ",")} uit 5`}</span>
                <span className="text-sm font-semibold text-muted-foreground">{en ? `${aggregateRating.reviewCount} Google reviews` : `${aggregateRating.reviewCount} Google-reviews`}</span>
                <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              </a>
              <span className="inline-flex max-w-full flex-wrap items-center gap-2 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 font-bold text-foreground">
                <BadgeCheck className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                <span className="text-lg">Techniek Nederland</span>
                <span className="text-sm font-semibold text-muted-foreground">{en ? "Member" : "Lid"}</span>
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2" aria-label={en ? "Standards and certifications" : "Normen en certificeringen"}>
              {["NEN 1010", "NEN 3140"].map((label) => <span key={label} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-2 text-sm font-bold text-foreground"><ShieldCheck className="h-4 w-4 text-primary" />{label}</span>)}
            </div>
            <p className="mt-5 flex items-start gap-2 font-semibold text-foreground"><Building2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />{en ? "Based in Amsterdam — not an anonymous national call centre" : "Gevestigd in Amsterdam — geen anoniem landelijk callcenter"}</p>
          </div>
          <ul className="grid grid-cols-3 gap-3">
            {certificationBadges.map((badge) => (
              <li key={badge.key} className="flex max-w-32 flex-col items-center text-center">
                <span className="flex aspect-square w-16 items-center justify-center rounded-md border border-border bg-card p-1.5"><img src={badge.image.url} alt="" aria-hidden width={80} height={80} className="h-full w-full object-contain" loading="lazy" /></span>
                <span className="mt-2 text-xs font-semibold text-foreground">{en ? badge.en : badge.nl}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function EmergencyProcess({ en, callLabel }: { en: boolean; callLabel: string }) {
  const track = useTrackConversion();
  const steps = en
    ? [
        { icon: UserRoundCheck, title: "Speak directly to the electrician", text: "We assess the situation by phone and set off quickly." },
        { icon: ReceiptText, title: "Fixed price up front", text: "After diagnosis, you hear the price before we continue." },
        { icon: Wrench, title: "Solved quickly and safely", text: "We test the repair. Pay by card or receive an invoice." },
      ]
    : [
        { icon: UserRoundCheck, title: "Direct de monteur aan de lijn", text: "We schatten de situatie telefonisch in en gaan snel op weg." },
        { icon: ReceiptText, title: "Vaste prijs vooraf", text: "Na de diagnose hoor je de prijs voordat we verdergaan." },
        { icon: Wrench, title: "Snel & veilig opgelost", text: "We testen het herstel. Je kunt pinnen of krijgt een factuur." },
      ];
  return (
    <section className="border-b border-border bg-surface" aria-labelledby="emergency-process-heading">
      <div className="mx-auto max-w-6xl px-4 section-y">
        <h2 id="emergency-process-heading" className="t-h2 text-center">{en ? "What happens when you call now?" : "Wat gebeurt er als je nu belt?"}</h2>
        <ol className="mt-10 grid gap-8 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, text }, index) => (
            <li key={title} className="relative border-t border-border pt-6">
              <span className="absolute -top-5 left-0 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{index + 1}</span>
              <Icon className="ml-12 h-6 w-6 text-primary" aria-hidden />
              <h3 className="mt-5 text-lg font-bold text-foreground">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-10 flex justify-center">
          <Button asChild variant="whatsapp" size="xl" className="h-auto min-h-14 w-full whitespace-normal px-5 py-3 text-base sm:w-fit">
            <a href={telHref} className="gtm-cta-call" data-gtm="cta-call" data-gtm-location="emergency-process" onClick={() => track("call", "emergency-process")}><Phone aria-hidden />{callLabel}</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
// Reviewsterren als echte SVG's (Lucide), met halve-sterondersteuning.
// Sterren zijn bewust gevuld: een outline-ster leest niet als een score.
function StarRating({ value, className = "" }: { value: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.min(1, Math.max(0, value - i));
        return (
          <span key={i} className="relative inline-flex h-4 w-4">
            <Star className="absolute inset-0 h-4 w-4 opacity-40" strokeWidth={1.75} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className="h-4 w-4 fill-current" strokeWidth={1.75} />
            </span>
          </span>
        );
      })}
    </span>
  );
}
