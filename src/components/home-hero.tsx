import { ArrowRight, BadgeEuro, Clock, MapPin, MessageCircle, Phone, ShieldCheck, Zap } from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { business, telHref, whatsappHref } from "@/lib/business";
import { whatsappMessageFor } from "@/lib/whatsapp-messages";
import { useTrackConversion } from "@/lib/analytics";
import { useLocale, useT } from "@/lib/i18n";

const uspIcons = [Clock, ShieldCheck, MapPin];
const trustIcons = [MapPin, Zap, BadgeEuro, ShieldCheck];

type Props = {
  badge: string;
  titleMain: string;
  titleAccent: string;
  description: string;
  servicesTo: string;
  servicesLabel: string;
  heroImg: { url: string };
  heroAlt: string;
};

export function HomeHero({
  badge,
  titleMain,
  titleAccent,
  description,
  servicesTo,
  servicesLabel,
  heroImg,
  heroAlt,
}: Props) {
  const t = useT();
  const locale = useLocale();
  const track = useTrackConversion();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const usps = [
    { label: "24/7", sub: locale === "nl" ? "bereikbaar" : "available" },
    { label: locale === "nl" ? "Gecertificeerd" : "Certified", sub: locale === "nl" ? "& betrouwbaar" : "& trusted" },
    { label: locale === "nl" ? "In heel" : "All of", sub: business.city },
  ];

  return (
    <section className="relative overflow-hidden bg-background text-foreground">
      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-6 pb-0 sm:pt-10 lg:pt-16">
        <div className="grid gap-6 lg:grid-cols-2 lg:items-center lg:gap-10">
          {/* LEFT — content */}
          <div className="flex max-w-xl flex-col justify-center lg:py-10">
            {/* Badge */}
            <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-butter px-3 py-1.5 text-xs font-semibold text-butter-foreground shadow-sm">
              <Zap className="h-3.5 w-3.5 fill-current" />
              {badge}
            </div>

            {/* Phone */}
            <a
              href={telHref}
              className="gtm-cta-call mt-4 inline-flex items-center gap-2 text-xl font-bold text-foreground sm:text-2xl"
              data-gtm="cta-call"
              data-gtm-location="home-hero-phone"
              onClick={() => track("call", "home-hero-phone")}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-primary">
                <Phone className="h-4 w-4" />
              </span>
              {business.phoneDisplay}
            </a>

            {/* Headline */}
            <h1 className="mt-3 text-[32px] font-extrabold leading-[1.1] tracking-tight text-balance sm:text-5xl lg:text-[56px]">
              <span className="text-foreground">{titleMain}</span>{" "}
              <span className="text-primary">{titleAccent}</span>
              <span
                className="ml-1 inline-block h-2.5 w-2.5 translate-y-[-0.15em] rounded-full bg-butter align-baseline sm:h-3.5 sm:w-3.5"
                aria-hidden
              />
            </h1>

            <p className="mt-4 max-w-md text-base text-muted-foreground sm:text-lg">
              {description}
            </p>

            {/* CTAs */}
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild variant="default" size="xl" className="w-full sm:w-auto">
                <a
                  href={telHref}
                  className="gtm-cta-call"
                  data-gtm="cta-call"
                  data-gtm-location="home-hero-primary"
                  onClick={() => track("call", "home-hero-primary")}
                >
                  <Phone className="h-4 w-4" /> {t.callDirect}
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                size="xl"
                className="w-full border-2 border-border bg-background text-foreground hover:bg-accent sm:w-auto"
              >
                <a
                  href={whatsappHref(whatsappMessageFor(pathname, locale), {
                    campaign: pathname,
                    content: "home-hero-primary",
                    term: locale,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gtm-cta-whatsapp"
                  data-gtm="cta-whatsapp"
                  data-gtm-location="home-hero-primary"
                  onClick={() => track("whatsapp", "home-hero-primary")}
                >
                  <MessageCircle className="h-4 w-4 text-whatsapp" /> {t.whatsapp}
                </a>
              </Button>
            </div>

            {/* Services link */}
            <Link
              to={servicesTo}
              className="mt-4 inline-flex items-center justify-center gap-1 text-sm font-bold text-primary transition hover:gap-2 sm:justify-start"
            >
              {servicesLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>

            {/* USPs */}
            <ul className="mt-8 flex justify-between gap-2 sm:justify-start sm:gap-8">
              {usps.map(({ label, sub }, i) => {
                const Icon = uspIcons[i] ?? ShieldCheck;
                return (
                  <li key={label + sub} className="flex flex-col items-center gap-2 text-center sm:flex-row sm:text-left">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary shadow-sm">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="leading-tight">
                      <span className="block text-xs font-bold text-foreground">{label}</span>
                      <span className="block text-[10px] text-muted-foreground sm:text-xs">{sub}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* RIGHT — illustration */}
          <div className="relative -mx-4 flex items-end justify-center lg:mx-0 lg:-mr-4">
            <img
              src={heroImg.url}
              alt={heroAlt}
              width={1600}
              height={900}
              loading="eager"
              fetchPriority="high"
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="block h-auto w-full max-w-[560px] object-contain lg:max-w-none"
            />
          </div>
        </div>

        {/* Trust band */}
        <div className="relative z-10 mx-auto max-w-7xl pb-8 pt-6 lg:pb-12 lg:pt-8">
          <div className="rounded-3xl bg-butter p-5 shadow-lg shadow-butter/40 lg:p-6">
            <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
              {t.trust.map((label, i) => {
                const Icon = trustIcons[i] ?? ShieldCheck;
                return (
                  <li key={label} className="flex flex-col items-center gap-2 text-center">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-xs font-bold text-butter-foreground sm:text-sm">{label}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
