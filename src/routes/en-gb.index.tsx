import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeEuro,
  Clock,
  Gauge,
  Phone,
  Plug,
  ShieldCheck,
  Wrench,
  Zap,
  ZapOff,
} from "lucide-react";

import heroImg from "@/assets/hero-electrician.jpg";
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
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute inset-0 bg-grid-brand opacity-50" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 lg:grid-cols-2 lg:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-semibold text-white">
              <Clock className="h-3.5 w-3.5" /> 24/7 emergency service in Amsterdam
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-[1.05] text-balance text-white sm:text-5xl lg:text-6xl">
              Electrician Amsterdam
            </h1>
            <p className="mt-4 max-w-xl text-lg text-white/85">
              Fast, reliable and local. VoltFix helps with faults, fuse boxes,
              perilex and all electrical work in your home or business — with a
              fixed price agreed up front. English-speaking electrician for
              Amsterdam's expat community.
            </p>

            <div className="mt-7">
              <CtaButtons location="home-hero" onBrand />
            </div>

            <a
              href={telHref}
              className="gtm-cta-call mt-5 inline-flex items-center gap-3 text-2xl font-bold text-white"
              data-gtm="cta-call"
              data-gtm-location="home-hero"
              onClick={() => track("call", "home-hero")}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-primary">
                <Phone className="h-5 w-5" />
              </span>
              {business.phoneDisplay}
            </a>

            <div className="mt-8">
              <TrustRow onBrand />
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-2xl border border-white/20 shadow-[var(--shadow-elegant)]">
              <img
                src={heroImg}
                alt="VoltFix electrician working on a fuse box in an Amsterdam home"
                width={1920}
                height={1080}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-4 -left-4 hidden rounded-xl border border-border bg-card px-4 py-3 shadow-[var(--shadow-gold)] sm:block">
              <p className="text-sm font-semibold text-foreground">Often on site in 30–60 min</p>
              <p className="text-xs text-muted-foreground">for emergencies in Amsterdam</p>
            </div>
          </div>
        </div>
      </section>

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
