import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeEuro,
  BatteryCharging,
  ClipboardCheck,
  Clock,
  Gauge,
  MapPin,
  MessageCircle,
  Phone,
  Plug,
  ShieldCheck,
  Wrench,
  Zap,
  ZapOff,
} from "lucide-react";


import heroImg from "@/assets/voltfix-hero-illustration.png.asset.json";
import amsterdamImg from "@/assets/amsterdam-map.png.asset.json";

import { CtaBand } from "@/components/cta-band";
import { ServiceFaq } from "@/components/service-faq";
import { Testimonials } from "@/components/testimonials";
import { TrustRow } from "@/components/trust-row";
import { business, serviceAreas, telHref, whatsappHref } from "@/lib/business";
import { whatsappMessageFor } from "@/lib/whatsapp-messages";
import { absoluteUrl, altLinks, faqSchema, ldScript, ogImage, pageMeta } from "@/lib/seo";
import { useTrackConversion } from "@/lib/analytics";

const enPath = "/en-gb";

const homeFaqs = [
  {
    q: "How fast can VoltFix reach me in Amsterdam?",
    a: "For emergencies we're on site within 60 minutes across Amsterdam — 24/7. For planned work we usually schedule an appointment within a few working days.",
  },
  {
    q: "Do you work evenings and weekends?",
    a: "Yes. Our emergency service is available 24/7, including evenings, weekends and public holidays. Feel free to call for current availability.",
  },
  {
    q: "What does an electrician in Amsterdam cost?",
    a: "We work with transparent rates and a fixed price agreed up front. We discuss the call-out fee and hourly rate straight away, so you're never faced with surprises.",
  },
  {
    q: "Are you certified and do you provide a warranty?",
    a: "Our electricians are fully qualified and work to the NEN 1010 standard. We provide a warranty on completed work and installed materials.",
  },
  {
    q: "Which parts of Amsterdam do you cover?",
    a: "We work throughout Amsterdam and the immediate surroundings, including Centrum, Zuid, West, Oost, Noord, De Pijp, Jordaan and IJburg.",
  },
];

const services = [
  {
    to: "/en-gb/spoed-elektricien-amsterdam",
    title: "Emergency electrician",
    icon: ZapOff,
    text: "Fault, short circuit or power loss? On site fast, 24/7.",
  },
  {
    to: "/en-gb/Groepenkast-Amsterdam",
    title: "Fuse box replacement",
    icon: Gauge,
    text: "A safe, modern fuse box with extra circuits and RCDs.",
  },
  {
    to: "/en-gb/perilex-amsterdam",
    title: "Perilex connection",
    icon: Plug,
    text: "Cooker circuit and perilex socket for induction hobs and ranges.",
  },
  {
    to: "/en-gb/ev-charger-installation-amsterdam",
    title: "EV charger installation",
    icon: BatteryCharging,
    text: "Home or VvE EV charger — dedicated circuit and grid operator notification included.",
  },
  {
    to: "/en-gb/electrical-inspection-amsterdam",
    title: "Electrical inspection",
    icon: ClipboardCheck,
    text: "NEN 1010 & NEN 3140 inspection for homes, rentals and business premises.",
  },
  {
    to: "/en-gb/stroomstoring-amsterdam",
    title: "Power outage",
    icon: Zap,
    text: "The cause of short circuits and power loss found and fixed fast.",
  },
];


export const Route = createFileRoute("/en-gb/")({
  head: () => ({
    meta: pageMeta({
      title: "Power outage Amsterdam? Electrician within 60 min | VoltFix",
      description:
        "Power outage in Amsterdam? VoltFix dispatches a certified electrician within 60 minutes. 24/7 emergency service, fixed rates, no surprises afterwards.",
      path: enPath,
      locale: "en",
      ogType: "website",
      ogTitle: "Power outage in Amsterdam? Electrician on site within 60 min — VoltFix",
      ogDescription:
        "For emergencies: on site within 60 minutes across Amsterdam. Certified electrician, 24/7 reachable, fixed all-in rates. Call +31 6 45 19 35 89 or WhatsApp us.",
    }),

    links: [{ rel: "canonical", href: absoluteUrl(enPath) }, ...altLinks("/")],
    scripts: [ldScript(faqSchema(homeFaqs))],
  }),
  component: Home,
});

function Home() {
  const track = useTrackConversion();
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-background text-foreground">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 right-1/3 h-[520px] w-[520px] rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-32 h-[520px] w-[520px] rounded-full bg-butter/50 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto grid max-w-7xl gap-6 px-4 pt-6 pb-0 sm:pt-10 lg:grid-cols-[47fr_53fr] lg:items-center lg:gap-6 lg:pt-16">
          <div className="flex max-w-xl flex-col justify-center lg:py-10">
            <a
              href={telHref}
              className="gtm-cta-call inline-flex w-fit items-center gap-2 rounded-full bg-destructive px-3.5 py-1.5 text-xs font-bold text-destructive-foreground shadow-md ring-1 ring-destructive/70 sm:text-sm"
              data-gtm="cta-call"
              data-gtm-location="home-hero-urgency"
              onClick={() => track("call", "home-hero-urgency")}
              aria-label="24/7 emergency — call now"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
                <Zap className="h-3 w-3" fill="currentColor" />
              </span>
              24/7 Emergency — Call Now
            </a>

            <a
              href={telHref}
              className="gtm-cta-call mt-3 inline-flex items-center gap-3 text-3xl font-black tracking-tight text-primary sm:text-4xl"
              data-gtm="cta-call"
              data-gtm-location="home-hero-phone"
              onClick={() => track("call", "home-hero-phone")}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md sm:h-12 sm:w-12">
                <Phone className="h-5 w-5" />
              </span>
              {business.phoneDisplay}
            </a>

            <h1 className="mt-5 text-[36px] font-black leading-[1.02] tracking-tight text-balance sm:text-6xl lg:text-[64px]">
              <span className="text-foreground">Power outage in Amsterdam?</span>
              <br />
              <span className="text-primary">Electrician within 60 min.</span>
              <span
                className="ml-1 inline-block h-3 w-3 translate-y-[-0.1em] rounded-full bg-butter align-baseline sm:h-4 sm:w-4 lg:h-5 lg:w-5"
                aria-hidden
              />
            </h1>

            <p className="mt-4 max-w-lg text-base font-medium text-foreground/85 sm:text-lg">
              Your <strong className="font-semibold text-foreground">electrician in Amsterdam</strong> —
              24/7 for faults, installation and maintenance. On site within 60 minutes for emergencies.
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href={telHref}
                className="gtm-cta-call inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-md transition hover:brightness-110"
                data-gtm="cta-call"
                data-gtm-location="home-hero-primary"
                onClick={() => track("call", "home-hero-primary")}
              >
                <Phone className="h-4 w-4" /> Call now
              </a>
              <a
                href={whatsappHref(whatsappMessageFor("/", "en"), {
                  campaign: "/en-gb",
                  content: "home-hero-primary",
                  term: "en",
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="gtm-cta-whatsapp inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 text-sm font-bold text-white shadow-md transition hover:brightness-110"
                data-gtm="cta-whatsapp"
                data-gtm-location="home-hero-primary"
                onClick={() => track("whatsapp", "home-hero-primary")}
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
              <Link
                to={`${enPath}/elektricien-amsterdam`}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-butter px-5 text-sm font-bold text-foreground shadow-md transition hover:brightness-105"
              >
                Our services
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <ul className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm lg:mt-8 lg:grid lg:max-w-md lg:grid-cols-3 lg:gap-4">
              {[
                { icon: Clock, label: "24/7", sub: "available" },
                { icon: ShieldCheck, label: "Certified", sub: "& trusted" },
                { icon: MapPin, label: "All of", sub: "Amsterdam" },
              ].map(({ icon: Icon, label, sub }) => (
                <li key={label} className="flex items-center gap-2 lg:flex-col lg:items-start">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm lg:h-11 lg:w-11">
                    <Icon className="h-4 w-4 lg:h-5 lg:w-5" />
                  </span>
                  <span className="leading-tight">
                    <span className="block font-semibold text-foreground">{label}</span>
                    <span className="block text-muted-foreground">{sub}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative -mx-4 flex items-end justify-center lg:mx-0 lg:-mr-4">
            <img
              src={heroImg.url}
              alt="VoltFix electricians with VW ID. Buzz service van in front of Amsterdam canal houses"
              width={1600}
              height={900}
              loading="eager"
              fetchPriority="high"
              sizes="(min-width: 1024px) 53vw, 100vw"
              className="block h-auto w-full max-w-[560px] object-contain lg:max-w-none"
            />
          </div>
        </div>
      </section>

      {/* USP BAND */}
      <div className="relative z-10 bg-butter">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <TrustRow variant="band" />
        </div>
      </div>

      {/* WHY VOLTFIX */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Why VoltFix?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            A serious, local professional who responds fast and communicates honestly. No surprises,
            just quality work.
          </p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Clock,
              title: "On site fast",
              text: "Emergency service 24/7. For faults often within 60 minutes in Amsterdam.",
            },
            {
              icon: BadgeEuro,
              title: "Transparent rates",
              text: "Fixed price agreed up front. You know exactly where you stand.",
            },
            {
              icon: ShieldCheck,
              title: "To NEN 1010",
              text: "Qualified work to the NEN 1010 standard, with a warranty on work and materials.",
            },
            {
              icon: Wrench,
              title: "Local in Amsterdam",
              text: "Familiar with the city, its buildings and Amsterdam's fuse boxes.",
            },
          ].map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SERVICES */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Our services</h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              From an acute fault to a complete fuse box — all electrical work for homes and
              businesses in Amsterdam.
            </p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {services.map(({ to, title, icon: Icon, text }) => (
              <Link
                key={to}
                to={to}
                className="group flex flex-col rounded-xl border border-border bg-background p-6 transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-[var(--shadow-gold)]"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{text}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  Learn more about {title}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />

      {/* SERVICE AREA */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-border">
            <img
              src={amsterdamImg.url}
              alt="Map of Amsterdam showing VoltFix electrician service area — Centre, Oud-West, Noord, Oost and surroundings"
              width={1920}
              height={1440}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <h2 className="text-3xl font-bold">Service area Amsterdam</h2>
            <p className="mt-3 text-muted-foreground">
              VoltFix works throughout Amsterdam and the immediate surroundings. Whether you live in
              a canal house in the centre or an apartment on IJburg — we know the city and reach you
              quickly.
            </p>
            <ul className="mt-6 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
              {serviceAreas.map((a) => (
                <li key={a} className="flex items-center gap-2 text-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" /> {a}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <CtaBand compact title="Prefer to talk right away?" />

      <Testimonials showFilters />

      <ServiceFaq
        faqs={homeFaqs}
        title="Frequently asked questions about an electrician in Amsterdam"
      />

      <CtaBand
        title="Ready to solve your electrical problem?"
        text={`Call ${business.phoneDisplay}, send a WhatsApp or request a quote. VoltFix is here for you across Amsterdam.`}
      />
    </>
  );
}
