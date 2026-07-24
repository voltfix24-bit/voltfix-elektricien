import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeEuro,
  BatteryCharging,
  ClipboardCheck,
  Clock,
  Gauge,
  MapPin,
  Plug,
  ShieldCheck,
  Wrench,
  Zap,
  ZapOff,
} from "lucide-react";


import heroImg from "@/assets/voltfix-hero-illustration.png.asset.json";
import amsterdamImg from "@/assets/amsterdam-map.png.asset.json";

import { CtaBand } from "@/components/cta-band";
import { HomeHero } from "@/components/home-hero";
import { ServiceFaq } from "@/components/service-faq";
import { Testimonials } from "@/components/testimonials";
import { business, serviceAreas } from "@/lib/business";
import { absoluteUrl, altLinks, faqSchema, ldScript, pageMeta } from "@/lib/seo";

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
      title: "Electrician Amsterdam | VoltFix",
      description:
        "Need an electrician in Amsterdam? VoltFix is fast, local and available 24/7 for emergencies, fuse boxes and perilex. Call now for a fixed price.",
      path: enPath,
      locale: "en",
      ogType: "website",
    }),
    links: [{ rel: "canonical", href: absoluteUrl(enPath) }, ...altLinks("/")],
    scripts: [ldScript(faqSchema(homeFaqs))],
  }),
  component: Home,
});

function Home() {
  return (
    <>
      <HomeHero
        badge="Local & qualified"
        titleMain="Your local electrician"
        titleAccent="in Amsterdam"
        description="VoltFix was founded on one belief: electrical problems deserve a professional who arrives quickly, is honest about the price and finishes the job neatly."
        servicesTo={`${enPath}/elektricien-amsterdam`}
        servicesLabel="Our services"
        heroImg={heroImg}
        heroAlt="VoltFix electricians with VW ID. Buzz service van in front of Amsterdam canal houses"
      />

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
