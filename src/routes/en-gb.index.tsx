import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeEuro,
  Clock,
  Gauge,
  MapPin,
  Phone,
  Plug,
  ShieldCheck,
  Wrench,
  Zap,
  ZapOff,
} from "lucide-react";

import heroImg from "@/assets/voltfix-hero-illustration.png.asset.json";
import amsterdamImg from "@/assets/amsterdam-homes.jpg";
import { CtaButtons } from "@/components/cta-buttons";
import { CtaBand } from "@/components/cta-band";
import { ServiceFaq } from "@/components/service-faq";
import { Testimonials } from "@/components/testimonials";
import { TrustRow } from "@/components/trust-row";
import { business, serviceAreas, telHref } from "@/lib/business";
import { absoluteUrl, altLinks, faqSchema, ldScript, ogImage } from "@/lib/seo";
import { useTrackConversion } from "@/lib/analytics";

const enPath = "/en-gb";

const homeFaqs = [
  {
    q: "How fast can VoltFix reach me in Amsterdam?",
    a: "For emergencies such as a power outage or short circuit we're often on site within 30 to 60 minutes in Amsterdam. For planned work we usually schedule an appointment within a few working days.",
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
    to: "/en-gb/stroomstoring-amsterdam",
    title: "Power outage",
    icon: Zap,
    text: "The cause of short circuits and power loss found and fixed fast.",
  },
];

export const Route = createFileRoute("/en-gb/")({
  head: () => ({
    meta: [
      { title: "Electrician Amsterdam | VoltFix" },
      {
        name: "description",
        content:
          "Need an electrician in Amsterdam? VoltFix is fast, local and available 24/7 for emergencies, fuse boxes and perilex. Call now for a fixed price.",
      },
      { property: "og:title", content: "Electrician Amsterdam | VoltFix" },
      {
        property: "og:description",
        content: "Fast, reliable and local. 24/7 emergency electrician across Amsterdam.",
      },
      { property: "og:url", content: absoluteUrl(enPath) },
      { property: "og:image", content: ogImage },
      { name: "twitter:image", content: ogImage },
    ],
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

        <div className="relative z-10 mx-auto grid max-w-7xl gap-8 px-4 pt-12 pb-0 lg:grid-cols-[47fr_53fr] lg:items-center lg:gap-6 lg:pt-16">
          <div className="flex max-w-xl flex-col justify-center lg:py-10">
            <span className="inline-flex items-center gap-2 text-sm font-bold text-primary">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-butter text-primary shadow-sm">
                <Zap className="h-4 w-4" fill="currentColor" />
              </span>
              Electrician in Amsterdam
            </span>

            <h1 className="mt-5 text-5xl font-black leading-[1.02] tracking-tight text-balance sm:text-6xl lg:text-[64px]">
              <span className="text-foreground">Reliable</span>
              <br />
              <span className="text-primary">electricians</span>
              <span
                className="ml-1 inline-block h-3 w-3 translate-y-[-0.1em] rounded-full bg-butter align-baseline sm:h-4 sm:w-4 lg:h-5 lg:w-5"
                aria-hidden
              />
            </h1>

            <p className="mt-5 max-w-lg text-lg text-muted-foreground">
              24/7 service for faults, installation and maintenance. On site
              fast across Amsterdam.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href={telHref}
                className="gtm-cta-call inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-4 text-base font-bold text-primary-foreground shadow-md transition hover:brightness-110"
                data-gtm="cta-call"
                data-gtm-location="home-hero-primary"
                onClick={() => track("call", "home-hero-primary")}
              >
                <Zap className="h-5 w-5" fill="currentColor" />
                Need help now
              </a>
              <Link
                to={`${enPath}/elektricien-amsterdam`}
                className="inline-flex items-center gap-2 rounded-xl bg-butter px-6 py-4 text-base font-bold text-foreground shadow-md transition hover:brightness-105"
              >
                Our services
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>

            <div className="mt-8 grid max-w-md grid-cols-3 gap-4 text-sm">
              {[
                { icon: Clock, label: "24/7", sub: "available" },
                { icon: ShieldCheck, label: "Certified", sub: "& trusted" },
                { icon: MapPin, label: "All of", sub: "Amsterdam" },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex flex-col items-start gap-2">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="leading-tight">
                    <span className="block font-semibold text-foreground">{label}</span>
                    <span className="block text-muted-foreground">{sub}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative -mx-4 flex items-end justify-center lg:mx-0 lg:-mr-4">
            <img
              src={heroImg.url}
              alt="VoltFix electricians with VW ID. Buzz service van in front of Amsterdam canal houses"
              width={1600}
              height={900}
              className="block h-auto w-full max-w-[720px] object-contain lg:max-w-none"
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
            A serious, local professional who responds fast and communicates
            honestly. No surprises, just quality work.
          </p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Clock,
              title: "On site fast",
              text: "Emergency service 24/7. For faults often within the hour in Amsterdam.",
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
              From an acute fault to a complete fuse box — all electrical work for
              homes and businesses in Amsterdam.
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
                  Learn more
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
              src={amsterdamImg}
              alt="Amsterdam canal houses where VoltFix works as a local electrician"
              width={1920}
              height={1080}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <h2 className="text-3xl font-bold">Service area Amsterdam</h2>
            <p className="mt-3 text-muted-foreground">
              VoltFix works throughout Amsterdam and the immediate surroundings.
              Whether you live in a canal house in the centre or an apartment on
              IJburg — we know the city and reach you quickly.
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

      <Testimonials />

      <ServiceFaq faqs={homeFaqs} title="Frequently asked questions about an electrician in Amsterdam" />

      <CtaBand
        title="Ready to solve your electrical problem?"
        text={`Call ${business.phoneDisplay}, send a WhatsApp or request a quote. VoltFix is here for you across Amsterdam.`}
      />
    </>
  );
}
