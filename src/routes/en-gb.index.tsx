import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  BatteryCharging,
  CalendarClock,
  Clock,
  Gauge,
  MapPin,
  Phone,
  PhoneCall,
  Plug,
  ShieldCheck,
  Star,
  Wrench,
  Zap,
  ZapOff,
} from "lucide-react";

import amsterdamImg from "@/assets/amsterdam-map.webp.asset.json";
import heroImg from "@/assets/voltfix-hero-illustration.webp.asset.json";
import { ServiceAreaMap } from "@/components/service-area-map";

import { CertificationStrip } from "@/components/certifications";

import { CtaBand } from "@/components/cta-band";
import { EnAreaLinks } from "@/components/en-area-links";
import { GoogleReviewsSection } from "@/components/google-reviews-section";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ServiceFaq } from "@/components/service-faq";
import { business, serviceAreas, telHref, whatsappHref } from "@/lib/business";
import { whatsappMessageFor } from "@/lib/whatsapp-messages";
import { absoluteUrl, altLinks, faqSchema, imageObjectSchema, ldScript, pageMeta, ratesSchema, warrantySchema } from "@/lib/seo";
import { useTrackConversion } from "@/lib/analytics";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { aggregateRating } from "@/data/reviews";

import {
  allInSublabelEn,
  eurEn,
  firstHourAllInEn,
  firstHourNoteEn,
  fromEn,
  noSurprisePromiseEn,
  perHourEn,
  prices,
  vatConsumerNoteEn,
} from "@/lib/pricing";
import { GuideLinks } from "@/components/guide-links";

const enPath = "/en-gb";
const HERO_PHOTO = heroImg.url;

const ratingEn = aggregateRating.ratingValue.toString();

// Homepage-FAQ: vragen die álle bezoekers hebben. De uitgebreide
// stroomstoringvragen (inclusief de Liander-uitleg) staan op
// /stroomstoring-amsterdam.
const homeFaqs = [
  {
    q: "What does a first electrician visit in Amsterdam cost?",
    a: `During office hours you pay ${firstHourAllInEn(prices.emergencyFirstHour)} — call-out included. Outside office hours (evenings, nights, weekends and public holidays), it is ${firstHourAllInEn(prices.offHoursFirstHour)}. ${firstHourNoteEn} If the job runs over or materials are needed, the electrician stops and explains the extra cost first.`,
  },
  {
    q: "How quickly can you get here?",
    a: "For emergencies we are usually at your door within 60 minutes across Amsterdam — 24/7, including evenings, weekends and public holidays. Planned work is arranged with you, often within 48 hours.",
  },
  {
    q: "Do you also work for homeowners’ associations and businesses?",
    a: "Yes. We work for homeowners, homeowners’ associations (VvEs), hospitality businesses, shops and offices in Amsterdam. For ongoing maintenance or larger projects, we assess the work and provide a clear quote in advance.",
  },
  {
    q: "What warranty do you provide?",
    a: "You get a 12-month warranty on our electricians’ work and a 2-year manufacturer warranty on installed materials. All work complies with the NEN 1010 standard.",
  },
  {
    q: "Can I pay the electrician by card?",
    a: "Yes, you can pay by card on site. Prefer to pay by invoice afterwards? Just let the electrician know and we will email you the invoice.",
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
    to: "/en-gb/groepenkast-amsterdam",
    title: "Fuse box replacement",
    icon: Gauge,
    text: "A safe, modern fuse box with extra circuits and RCDs.",
  },
  {
    to: "/en-gb/perilex-amsterdam",
    title: "Perilex connection",
    icon: Plug,
    text: "Cooker circuit and Perilex socket for induction hobs and ranges.",
  },
  {
    to: "/en-gb/ev-charger-installation-amsterdam",
    title: "EV charger installation",
    icon: BatteryCharging,
    text: "Home or VvE EV charger — dedicated circuit and grid operator notification included.",
  },
  {
    to: "/en-gb/stroomstoring-amsterdam",
    title: "Power outage repair",
    icon: Zap,
    text: "The cause of short circuits and power loss found and fixed fast.",
  },
  {
    to: "/en-gb/elektricien-amsterdam",
    title: "Hire an electrician",
    icon: Wrench,
    text: "Planned work: renovations, extra circuits or a complete installation.",
  },
];

const fixedJobs = [
  {
    to: "/en-gb/groepenkast-amsterdam",
    title: "Fuse box replacement",
    price: fromEn(prices.groepenkastFrom),
    unit: "incl. materials — installation warranty",
    points: ["RCD protection", "Extra circuits available", "NEN 1010 compliant"],
  },
  {
    to: "/en-gb/perilex-amsterdam",
    title: "Perilex / cooker circuit",
    price: fromEn(prices.perilexFrom),
    unit: "connection — fixed price up front",
    points: ["Induction hobs & ranges", "2- or 3-phase", "Safely connected"],
  },
];

export const Route = createFileRoute("/en-gb/")({
  head: () => ({
    meta: pageMeta({
      title: "Power outage Amsterdam? Electrician within 60 min | VoltFix",
      description:
        "Power outage in Amsterdam? VoltFix sends a certified electrician within 60 minutes. 24/7 emergency, fixed rates, no surprises.",
      path: enPath,
      locale: "en",
      ogType: "website",
      ogTitle: "Power outage in Amsterdam? Electrician on site within 60 min — VoltFix",
      ogDescription:
        `For emergencies: on site within 60 minutes across Amsterdam. Certified electrician, 24/7 reachable, fixed all-in rates. Call ${business.phoneInternational} or WhatsApp us.`,
    }),

    links: [
      { rel: "canonical", href: absoluteUrl(enPath) },
      { rel: "preload", as: "image", href: heroImg.url, fetchpriority: "high" },
      ...altLinks("/"),
    ],
    scripts: [
      ldScript(faqSchema(homeFaqs, "en", enPath)),
      ldScript(ratesSchema(enPath, "en")),
      ldScript(warrantySchema(enPath, "en")),
      ldScript(
        imageObjectSchema({
          url: `${business.url}${amsterdamImg.url}`,
          name: "VoltFix electrician Amsterdam service area",
          description:
            "Map of the VoltFix electrician service area in Amsterdam and surrounding areas. 24/7 emergency service, power outages, fuse box replacement, Perilex connections, EV charger installation and NEN 1010 inspection in Centre, South, West, East, North, De Pijp, IJburg and surrounding areas.",
          caption: "VoltFix service area across Amsterdam and surrounding areas",
          width: 1920,
          height: 1440,
          contentLocation: "Amsterdam",
          about: "Electrician service area Amsterdam",
        }),
      ),
    ],
  }),
  component: Home,
});

function StarRating({ className }: { className?: string }) {
  return (
    <span className={`flex gap-0.5 text-primary ${className ?? ""}`} aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-current" />
      ))}
    </span>
  );
}

function RatePanel() {
  const [evening, setEvening] = useState(false);
  const amount = evening ? prices.offHoursFirstHour : prices.emergencyFirstHour;
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h3 className="t-h3">Hourly rates &amp; faults</h3>
      <ToggleGroup
        type="single"
        value={evening ? "evening" : "day"}
        onValueChange={(value) => { if (value) setEvening(value === "evening"); }}
        aria-label="Rate period"
        className="mt-4 grid grid-cols-2 rounded-2xl border border-border bg-background p-1"
      >
        <ToggleGroupItem value="day" className="h-auto min-h-11 whitespace-normal rounded-xl px-2 py-2 t-meta font-bold data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
          Mon–Fri 08:00–18:00
        </ToggleGroupItem>
        <ToggleGroupItem value="evening" className="h-auto min-h-11 whitespace-normal rounded-xl px-2 py-2 t-meta font-bold data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
          Evenings, weekends &amp; holidays
        </ToggleGroupItem>
      </ToggleGroup>
      <p className="mt-4 t-amount text-primary">{firstHourAllInEn(amount)}</p>
      <p className="t-meta text-muted-foreground">{allInSublabelEn}</p>
      <ul className="mt-4 space-y-2 t-meta text-muted-foreground">
        <li className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 shrink-0 text-primary" /> {firstHourNoteEn}
        </li>
        <li className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 shrink-0 text-primary" /> Standard hourly rate{" "}
          {perHourEn(prices.hourly)} for planned work
        </li>
        <li className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 shrink-0 text-primary" /> Evening surcharge{" "}
          {eurEn(prices.eveningSurcharge)} on the first hour
        </li>
      </ul>
      <p className="mt-4 flex flex-wrap items-center gap-2 t-meta font-semibold text-foreground">
        <StarRating />
        {ratingEn} from {aggregateRating.reviewCount} Google reviews
      </p>
    </div>
  );
}

function Home() {
  const track = useTrackConversion();
  const yearsActive = new Date().getFullYear() - Number(business.foundingDate);
  return (
    <>
      {/* 01 — HERO met bewijs */}
      <section className="relative overflow-hidden bg-background text-foreground">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 right-1/3 h-[520px] w-[520px] rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-32 h-[520px] w-[520px] rounded-full bg-butter/50 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto grid max-w-7xl gap-8 px-4 pb-10 pt-6 sm:pt-10 lg:grid-cols-[55fr_45fr] lg:items-center lg:pt-16">
          <div className="flex max-w-xl flex-col justify-center">
            <a
              href={telHref}
              className="gtm-cta-call inline-flex w-fit items-center gap-2 rounded-full bg-destructive px-3.5 py-1.5 t-meta font-bold text-destructive-foreground shadow-md ring-1 ring-destructive/70"
              data-gtm="cta-call"
              data-gtm-location="home-hero-urgency"
              onClick={() => track("call", "home-hero-urgency")}
              aria-label="24/7 emergency — call now"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-destructive-foreground/20">
                <Zap className="h-3 w-3" fill="currentColor" />
              </span>
              24/7 Emergency — Call Now
            </a>

            <h1 className="mt-5 t-display text-balance">
              <span className="text-foreground">Power outage in Amsterdam?</span>
              <br />
              <span className="text-primary">At your door within 60 minutes.</span>
            </h1>

            <p className="mt-4 measure t-body font-medium text-foreground/85">
              Call, speak directly to an electrician and know the cost up front.
              We also handle planned electrical work across Amsterdam.
            </p>

            {/* Bellen dominant, WhatsApp secundair, diensten als tekstlink */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href={telHref}
                className="gtm-cta-call inline-flex h-14 items-center justify-center gap-3 rounded-xl bg-primary px-6 text-base font-black text-primary-foreground shadow-lg transition hover:brightness-110 sm:text-lg"
                data-gtm="cta-call"
                data-gtm-location="home-hero-primary"
                onClick={() => track("call", "home-hero-primary")}
              >
                <Phone className="h-5 w-5" /> Call {business.phoneDisplay}
              </a>
              <a
                href={whatsappHref(whatsappMessageFor(enPath, "en"), {
                  campaign: enPath,
                  content: "home-hero-primary",
                  term: "en",
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="gtm-cta-whatsapp inline-flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-whatsapp bg-background px-5 t-meta font-bold text-whatsapp transition hover:bg-whatsapp/10"
                data-gtm="cta-whatsapp"
                data-gtm-location="home-hero-primary"
                onClick={() => track("whatsapp", "home-hero-primary")}
              >
                <WhatsAppIcon className="h-4 w-4" ariaLabel="WhatsApp" /> WhatsApp
              </a>
            </div>

            {/* Bewijs direct onder de knoppen */}
            <p className="mt-4 flex flex-wrap items-center gap-2 t-meta font-semibold text-foreground">
              <StarRating />
              {ratingEn} from {aggregateRating.reviewCount} Google reviews
              <a href="#reviews" className="font-medium text-primary underline underline-offset-4">
                read the reviews
              </a>
            </p>

            <ul className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 t-meta">
              {[
                { icon: Clock, label: "24/7", sub: "available" },
                { icon: MapPin, label: `${yearsActive} years`, sub: "in Amsterdam" },
                { icon: ShieldCheck, label: "NEN 1010", sub: "& 12-month warranty" },
              ].map(({ icon: Icon, label, sub }) => (
                <li key={label} className="flex items-center gap-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="leading-tight">
                    <span className="block font-semibold text-foreground">{label}</span>
                    <span className="block text-muted-foreground">{sub}</span>
                  </span>
                </li>
              ))}
            </ul>

            <p className="mt-5 t-meta">
              <a
                href="#services"
                className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
              >
                Explore our services
                <ArrowRight className="h-4 w-4" />
              </a>
            </p>
          </div>

          <div className="relative flex justify-center lg:justify-end">
            <img
              src={HERO_PHOTO}
              alt="VoltFix electricians with a service van in front of Amsterdam canal houses"
              width={1024}
              height={1024}
              loading="eager"
              fetchPriority="high"
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="block aspect-square w-full max-w-[460px] rounded-3xl object-cover shadow-xl"
            />
          </div>
        </div>
      </section>

      {/* 02 — SPOED NÚ / KLUS PLANNEN */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto grid max-w-5xl gap-4 px-4 py-10 sm:grid-cols-2">
          <div className="flex flex-col rounded-2xl border-2 border-destructive/30 bg-background p-6 shadow-sm">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
              <PhoneCall className="h-5 w-5" />
            </span>
            <h2 className="mt-4 t-h3">I need urgent help</h2>
            <p className="mt-2 flex-1 t-body text-muted-foreground">
              No power, a short circuit or a tripped circuit? Call or WhatsApp us for an immediate
              assessment. For emergencies, we are at your door within 60 minutes.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <a
                href={telHref}
                className="gtm-cta-call inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-destructive px-4 t-meta font-bold text-destructive-foreground shadow-sm transition hover:brightness-110"
                data-gtm="cta-call"
                data-gtm-location="home-split-urgent"
                onClick={() => track("call", "home-split-urgent")}
              >
                <Phone className="h-4 w-4" /> Call now
              </a>
              <a
                href={whatsappHref(whatsappMessageFor(enPath, "en"), {
                  campaign: enPath,
                  content: "home-split-urgent",
                  term: "en",
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="gtm-cta-whatsapp inline-flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-whatsapp bg-background px-4 t-meta font-bold text-whatsapp transition hover:bg-whatsapp/10"
                data-gtm="cta-whatsapp"
                data-gtm-location="home-split-urgent"
                onClick={() => track("whatsapp", "home-split-urgent")}
              >
                <WhatsAppIcon className="h-4 w-4" ariaLabel="WhatsApp" /> WhatsApp
              </a>
            </div>
          </div>

          <div className="flex flex-col rounded-2xl border-2 border-primary/30 bg-background p-6 shadow-sm">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <CalendarClock className="h-5 w-5" />
            </span>
            <h2 className="mt-4 t-h3">I want to plan a job</h2>
            <p className="mt-2 flex-1 t-body text-muted-foreground">
              Fuse box, Perilex, EV charger or renovation? Tell us your preferred time — we
              confirm personally and agree a fixed price up front.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <a
                href="#installatiemoment"
                className="gtm-cta-schedule inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-4 t-meta font-bold text-primary-foreground shadow-sm transition hover:brightness-110"
                data-gtm="cta-schedule"
                data-gtm-location="home-split-plan"
                onClick={() => track("schedule", "home-split-plan")}
              >
                <CalendarClock className="h-4 w-4" /> Request a time
              </a>
              <Link
                to="/en-gb/elektricien-amsterdam"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-primary bg-background px-4 t-meta font-bold text-primary transition hover:bg-primary/5"
              >
                Planned work
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 03 — WAT GEBEURT ER NA JE TELEFOONTJE */}
      <section className="mx-auto max-w-6xl px-4 section-y">
        <div>
          <h2 className="t-h2">What happens after you call?</h2>
          <p className="mt-3 measure t-body text-muted-foreground">
            No waiting for a quote in the post. Three clear steps, so you know what to expect.
          </p>
        </div>
        <ol className="mt-10 grid gap-6 sm:grid-cols-3">
          {[
            {
              title: "Call or WhatsApp us",
              text: "Within minutes, you get a phone assessment of the cause, the time needed and the cost.",
            },
            {
              title: "The electrician visits",
              text: "Your electrician checks the situation on site and gives you a fixed price before starting. We only begin once you agree.",
            },
            {
              title: "Finished, tested and documented",
              text: "The work is tested and completed to NEN 1010, with a warranty and a clear invoice.",
            },
          ].map((s, i) => (
            <li key={s.title} className="rounded-xl border border-border bg-card p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-base font-black text-primary-foreground">
                {i + 1}
              </span>
              <h3 className="mt-4 t-h3">{s.title}</h3>
              <p className="mt-2 t-body text-muted-foreground">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* 04 — TARIEVEN */}
      <section id="rates" className="scroll-mt-24 border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 section-y">
          <div>
            <h2 className="t-h2">Rates</h2>
            <p className="mt-3 measure t-body text-muted-foreground">
              You always get a fixed price up front, tailored to your situation.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <RatePanel />
            <div className="grid gap-4 sm:grid-cols-2">
              {fixedJobs.map((p) => (
                <Link key={p.title} to={p.to} className="group block">
                  <div className="h-full rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-[var(--shadow-gold)]">
                    <h3 className="t-h3">{p.title}</h3>
                    <p className="mt-2 t-h2 text-primary">{p.price}</p>
                    <p className="t-meta text-muted-foreground">{p.unit}</p>
                    <ul className="mt-4 space-y-2 t-meta text-muted-foreground">
                      {p.points.map((pt) => (
                        <li key={pt} className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 shrink-0 text-primary" /> {pt}
                        </li>
                      ))}
                    </ul>
                    <span className="mt-4 inline-flex items-center gap-1 t-meta font-semibold text-primary">
                      Learn more
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border-2 border-primary/30 bg-background p-6">
            <h3 className="t-h3">{noSurprisePromiseEn.title}</h3>
            <p className="mt-2 t-body text-muted-foreground">
              If the job takes longer or materials are needed, the electrician stops and tells you
              the cost first. Only then do we continue.
            </p>
          </div>

          <p className="mt-6 t-fine text-muted-foreground">
            Indicative prices. {vatConsumerNoteEn} The exact price depends on your situation and
            is agreed in advance.
          </p>
        </div>
      </section>

      {/* 05 — REVIEWS */}
      <div id="reviews" className="scroll-mt-24">
        <Testimonials showFilters />
      </div>

      {/* 06 — DIENSTEN (één keer) */}
      <section id="services" className="scroll-mt-24 border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 section-y">
          <div>
            <h2 className="t-h2">Our services</h2>
            <p className="mt-3 measure t-body text-muted-foreground">
              From an urgent fault to a complete fuse box — all electrical work for homes and
              businesses in Amsterdam.
            </p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map(({ to, title, icon: Icon, text }) => (
              <Link
                key={to}
                to={to}
                className="group flex flex-col rounded-xl border border-border bg-background p-6 transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-[var(--shadow-gold)]"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 t-h3">{title}</h3>
                <p className="mt-2 flex-1 t-body text-muted-foreground">{text}</p>
                <span className="mt-4 inline-flex items-center gap-1 t-meta font-semibold text-primary">
                  Learn more
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 07 — WERKGEBIED */}
      <section className="mx-auto max-w-6xl px-4 section-y">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <ServiceAreaMap
            alt="VoltFix electrician Amsterdam service area: emergency repairs, fuse boxes, Perilex and EV chargers in Centre, South, West, East, North, De Pijp, IJburg and surrounding areas"
            caption="VoltFix service area: electrician across Amsterdam and surrounding areas, often on site within 60 minutes for emergencies."
            previewLabel="Enlarge map"
          />
          <div>
            <h2 className="t-h2">Electrician across Amsterdam and surrounding areas</h2>
            <p className="mt-3 text-muted-foreground">
              VoltFix is your local electrician in Amsterdam. We cover every neighbourhood — Centre,
              South, West, East, North, De Pijp, Jordaan, Oud-West, Bos en Lommer, Watergraafsmeer,
              IJburg and South-East — plus nearby Amstelveen, Diemen, Ouder-Amstel and
              Zaandam.
            </p>
            <ul className="mt-6 grid grid-cols-2 gap-2 t-meta sm:grid-cols-3">
              {serviceAreas.map((a) => (
                <li key={a} className="flex items-center gap-2 text-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" /> {a}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <GuideLinks currentPath={enPath} />
      <EnAreaLinks />

      {/* 08 — VEILIGHEID, GARANTIE & CERTIFICERINGEN */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-4xl px-4 pt-16">
          <div>
            <h2 className="t-h2">Safety, warranty &amp; certifications</h2>
            <p className="mt-3 measure t-body text-muted-foreground">
              Electrical work leaves no room for risks. We work safely, meet the standards and
              stand behind our work.
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              "All work to NEN 1010",
              "12-month labour warranty, 2 years on materials",
              "Fuse box safety inspection on request",
              "Qualified, VCA VOL-certified electricians",
            ].map((t) => (
              <div
                key={t}
                className="flex items-start gap-3 rounded-lg border border-border bg-background p-4"
              >
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span className="t-body text-foreground">{t}</span>
              </div>
            ))}
          </div>
        </div>
        <CertificationStrip />
      </section>

      {/* 09 — FAQ + één slot-CTA */}
      <ServiceFaq faqs={homeFaqs} title="Frequently asked questions about an electrician in Amsterdam" />

      <CtaBand
        title="Ready to solve your electrical problem?"
        text={`Call ${business.phoneDisplay}, send a WhatsApp or request a time. VoltFix is here for you across Amsterdam.`}
      />
    </>
  );
}
