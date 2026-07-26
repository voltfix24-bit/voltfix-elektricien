import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  MapPin,
  MessageCircle,
  Phone,
  Wrench,
  Zap,
} from "lucide-react";

import heroImg from "@/assets/voltfix-perilex-hero.png.asset.json";
import { CtaBand } from "@/components/cta-band";
import { DiyVsPro } from "@/components/diy-vs-pro";
import { PerilexMeasureCard } from "@/components/perilex-measure-card";
import PerilexMeasureGuide from "@/components/perilex/PerilexMeasureGuide";
import { PerilexWizardCta, PerilexWizardToggle } from "@/components/perilex-wizard-toggle";
import { PriceIndicator, type PriceRow } from "@/components/price-indicator";
import { Prose } from "@/components/prose";
import { RelatedServices } from "@/components/related-services";
import { SchedulePicker } from "@/components/schedule-picker";
import { ServiceFaq } from "@/components/service-faq";
import { Testimonials } from "@/components/testimonials";
import { TrustStrip } from "@/components/trust-strip";
import { business, telHref, whatsappHref } from "@/lib/business";
import { useTrackConversion } from "@/lib/analytics";
import { fromEn, prices } from "@/lib/pricing";
import {
  absoluteUrl,
  altLinks,
  breadcrumbSchema,
  faqSchema,
  howToSchema,
  ldScript,
  pageMeta,
  serviceSchema,
} from "@/lib/seo";

const nlPath = "/perilex-amsterdam";
const enPath = "/en-gb/perilex-amsterdam";
const whatsappMessage = "Hi VoltFix, I'd like a perilex / cooker circuit connected in Amsterdam.";

const faqs = [
  {
    q: "What does connecting a perilex in Amsterdam cost?",
    a: `Connecting a perilex socket or cooker circuit starts at around €${prices.perilexFrom}. The price depends on the distance to the fuse box and whether a new circuit is needed. You get a fixed price up front.`,
  },
  {
    q: "What is the difference between 2-phase and 3-phase?",
    a: "A standard perilex often uses 2 phases for heavier appliances. With 3-phase the load is spread across three phases, which may be required for powerful induction hobs or ranges. We advise what your appliance and home need.",
  },
  {
    q: "Do I need a perilex for my induction hob?",
    a: "Many induction hobs need their own cooker circuit or perilex connection because of their high power draw. Check your hob's connected load; we're happy to advise which connection is required.",
  },
  {
    q: "Can I use a normal socket for induction?",
    a: "Lighter induction hobs sometimes run on a normal circuit, but more powerful models require a dedicated cooker circuit or perilex to prevent overload and tripping.",
  },
  {
    q: "Does an extra circuit need to be added to the fuse box?",
    a: "Often yes. A cooker ideally gets its own circuit in the fuse box. If there's no room, we can extend or adapt the fuse box.",
  },
  {
    q: "How long does connecting a perilex take?",
    a: "In most cases it's done within one to two hours. If cabling has to be run to the fuse box, it can take a little longer.",
  },
  {
    q: "Do you also connect ranges and ovens?",
    a: "Yes, we safely connect induction hobs, ceramic hobs, electric ranges and ovens to the right circuit and connection in Amsterdam.",
  },
];

export const Route = createFileRoute("/en-gb/perilex-amsterdam")({
  head: () => ({
    meta: pageMeta({
      title: "Perilex Connection Amsterdam | Cooker Circuit | VoltFix",
      description: `Perilex connection in Amsterdam for induction hobs or ranges. Fixed price ${fromEn(prices.perilexFrom)}, labour warranty. Safely installed by VoltFix.`,
      path: enPath,
      ogTitle: "Perilex Connection Amsterdam | VoltFix",
      ogDescription:
        "Cooker circuit and perilex socket for induction hobs and ranges. Safely connected.",
      locale: "en",
    }),
    links: [{ rel: "canonical", href: absoluteUrl(enPath) }, ...altLinks(nlPath)],
    scripts: [
      ldScript(
        serviceSchema({
          name: "Perilex connection Amsterdam",
          description:
            "Connecting perilex sockets and cooker circuits for induction hobs and ranges in Amsterdam, 2-phase and 3-phase.",
          path: enPath,
        }),
      ),
      ldScript(faqSchema(faqs)),
      ldScript(
        howToSchema({
          name: "How to connect a perilex — step-by-step",
          description:
            "Step-by-step guide to safely connect a perilex socket for an induction hob or range in Amsterdam. When in doubt or when fuse-box work is needed: have VoltFix do it.",
          path: enPath,
          totalTime: "PT45M",
          tools: [
            "Approved two-pole voltage tester",
            "Phillips and flat-head screwdriver",
            "Wire stripper",
            "Side cutters",
          ],
          supplies: [
            "Perilex plug (2- or 3-phase, matching the configuration)",
            "Perilex cable with the correct cross-section",
          ],
          steps: [
            { name: "Measure the configuration", text: "Use a two-pole voltage tester to identify which contacts are live (L) and neutral (N). Note the wiring of the existing socket." },
            { name: "Power off", text: "Switch off the correct circuit at the fuse box and verify with the voltage tester that no voltage remains on the connection." },
            { name: "Prepare the cable", text: "Strip the outer sheath and individual cores to the correct length. Keep the earth core (green/yellow) slightly longer than live and neutral." },
            { name: "Connect cores by colour code", text: "Connect each core to the labelled terminal on the perilex plug. Follow the labels on the plug; no bare copper outside the terminal." },
            { name: "Tighten strain relief", text: "Clamp the cable firmly on the outer sheath — never on the individual cores — so the connection cannot pull loose under load." },
            { name: "Appliance side: set bridges", text: "Set the bridges on the appliance terminal block according to the manufacturer's diagram for 1-, 2- or 3-phase, matching the configuration you measured." },
            { name: "Close & check", text: "Close the plug, verify all screws are tight and nothing is pinched. Only then re-energise the circuit and test operation." },
          ],
        }),
      ),
      ldScript(
        breadcrumbSchema([
          { name: "Home", path: "/en-gb" },
          { name: "Perilex connection Amsterdam", path: enPath },
        ]),
      ),
    ],
  }),
  component: Page,
});

const priceRows: PriceRow[] = [
  {
    title: "Perilex connection",
    price: fromEn(prices.perilexFrom),
    unit: "on existing circuit",
    points: ["2- or 3-phase", "Induction & range", "labour warranty"],
    featured: true,
  },
  {
    title: "Cooker + new circuit",
    price: fromEn(prices.perilexWithNewGroupFrom),
    unit: "incl. extra circuit",
    points: ["Dedicated cooker circuit", "Cabling to fuse box", "NEN 1010 compliant"],
  },
];

const bandItems = [
  { icon: MapPin, label: "Local in Amsterdam" },
  { icon: Zap, label: "Fast service" },
  { icon: BadgeCheck, label: "Transparent pricing" },
  { icon: Wrench, label: "Certified work" },
];

function Page() {
  const track = useTrackConversion();

  return (
    <>
      {/* HERO — compact, conversion-focused, mirrors NL */}
      <section className="relative overflow-hidden bg-surface text-foreground">
        <div aria-hidden className="pointer-events-none absolute -top-24 right-[-6rem] h-72 w-72 rounded-full bg-butter/70 blur-2xl" />
        <div aria-hidden className="pointer-events-none absolute bottom-[-4rem] left-[-4rem] h-72 w-72 rounded-full bg-primary/25 blur-2xl" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_20%_35%,rgba(255,242,117,0.18),transparent_55%)]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-6 px-4 py-8 lg:grid-cols-[48fr_52fr] lg:py-10">
          <div className="relative z-10 flex max-w-xl flex-col">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-butter/80 px-3 py-1 text-xs font-bold text-butter-foreground shadow-sm ring-1 ring-butter">
              <span aria-hidden>★</span> 4.9 · 48 Google reviews
            </span>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 font-bold text-primary-foreground">
                €{prices.perilexFrom} all-in · fixed price
              </span>
            </div>

            <h1 className="mt-4 text-4xl font-black leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-[56px]">
              Perilex connection?
              <span className="block text-primary">VoltFix sorts it today.</span>
            </h1>

            <p className="mt-4 max-w-md text-base leading-relaxed text-foreground/80 sm:text-lg">
              Safe installation of perilex sockets, plugs and induction hobs in Amsterdam.
              Certified, with warranty on labour.
            </p>

            <a
              href={telHref}
              className="gtm-cta-call mt-5 inline-flex items-center gap-2 text-xl font-bold tracking-tight text-primary sm:text-2xl"
              data-gtm="cta-call"
              data-gtm-location="perilex-hero-phone"
              onClick={() => track("call", "perilex-hero-phone")}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                <Phone className="h-4 w-4" />
              </span>
              {business.phoneDisplay}
            </a>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <a
                href={telHref}
                className="gtm-cta-call inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-destructive px-5 text-sm font-bold text-destructive-foreground shadow-md transition hover:brightness-110 sm:flex-none"
                data-gtm="cta-call"
                data-gtm-location="perilex-hero"
                onClick={() => track("call", "perilex-hero")}
              >
                <Phone className="h-4 w-4" /> Call now
              </a>
              <a
                href={whatsappHref(whatsappMessage, {
                  campaign: enPath,
                  content: "perilex-hero",
                  term: "en",
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="gtm-cta-whatsapp inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-whatsapp px-5 text-sm font-bold text-whatsapp-foreground shadow-md transition hover:brightness-110 sm:flex-none"
                data-gtm="cta-whatsapp"
                data-gtm-location="perilex-hero"
                onClick={() => track("whatsapp", "perilex-hero")}
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp · reply within 60 min
              </a>
            </div>
          </div>

          <div className="relative flex items-center justify-center lg:justify-end">
            <img
              src={heroImg.url}
              alt="VoltFix electrician connecting a perilex for an induction hob in Amsterdam"
              width={1600}
              height={1200}
              className="h-auto w-full max-w-[520px] rounded-2xl object-contain shadow-[var(--shadow-elegant)] lg:max-w-[560px]"
            />
          </div>
        </div>
      </section>

      {/* USP BAND */}
      <div className="relative z-10 -mt-1 bg-butter">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <ul className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-8">
            {bandItems.map(({ icon: Icon, label }, i) => (
              <li
                key={label}
                className={`flex items-center gap-2 text-foreground sm:${i > 0 ? "border-l sm:pl-8" : ""}`}
              >
                <Icon className="h-4 w-4 text-foreground" />
                <span className="font-semibold">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* TRUST STRIP */}
      <TrustStrip lang="en" />

      {/* CONTENT */}
      <article className="mx-auto max-w-3xl px-4 py-14">
        <div className="mb-6">
          <CallbackForm lang="en" location="perilex-callback-top" topic="Amsterdam" />
        </div>

        <div className="mb-10">
          <SchedulePicker location="perilex" lang="en" />
        </div>

        <div className="mb-8">
          <PerilexWizardCta lang="en" />
        </div>


        <Prose>
          <p>
            Switching from gas to induction in Amsterdam, or installing a new range? You'll quickly
            face the question: which connection do I need? Powerful cooking appliances draw more
            current than a normal socket can safely supply. That's why a{" "}
            <strong>perilex connection or dedicated cooker circuit</strong> is often necessary. As
            your{" "}
            <Link to="/en-gb/elektricien-amsterdam" className="font-medium text-primary underline underline-offset-4">
              certified electrician in Amsterdam
            </Link>
            , VoltFix installs these safely and expertly, so you can cook without worry.
          </p>

          <h2>What is a perilex connection?</h2>
          <p>
            A perilex is a five-pin plug and socket designed for high-power appliances such as
            electric ranges and heavy induction hobs. A perilex can use multiple phases at once,
            providing far more power than a standard wall socket. For induction cooking that matters:
            running several zones at full power easily draws 7,000 watts or more.
          </p>

          <h2>Cooker circuit or perilex — what do you need?</h2>
          <p>
            Not every induction hob needs the same connection. It depends on the connected load the
            manufacturer specifies:
          </p>
          <ul>
            <li><strong>Light induction hob:</strong> sometimes runs on its own cooker circuit (a heavier-duty 230V circuit).</li>
            <li><strong>Heavier induction hob:</strong> often requires a 2-phase perilex.</li>
            <li><strong>Powerful range or large hob:</strong> may need a 3-phase connection.</li>
          </ul>

          <h2>How we work</h2>
          <ul>
            <li>We check your fuse box and the available space for a circuit.</li>
            <li>If needed, we add a new, heavier-duty cooker circuit.</li>
            <li>We run the correct cabling to the kitchen.</li>
            <li>We fit the perilex socket or the fixed connection.</li>
            <li>We connect your hob or range and test everything.</li>
          </ul>

          <h2>Safe cooking without worries</h2>
          <p>
            An incorrectly connected hob can cause overheating, tripping circuits or, in the worst
            case, fire. Having the connection done by a qualified electrician means everything is
            carried out to the NEN 1010 standard. If a circuit trips mid-cook, our{" "}
            <Link to="/en-gb/spoed-elektricien-amsterdam" className="font-medium text-primary underline underline-offset-4">
              24/7 emergency electrician in Amsterdam
            </Link>{" "}
            is on call. VoltFix completes the work safely and provides a warranty — you can{" "}
            <Link to="/en-gb/contact" hash="offerte" className="font-medium text-primary underline underline-offset-4">
              request a free perilex installation quote
            </Link>{" "}
            with a fixed price up front.
          </p>
        </Prose>

        <div className="my-10">
          <PerilexWizardCta lang="en" />
        </div>

        <div className="mb-8">
          <PerilexMeasureCard lang="en" />
          <div className="mt-8">
            <PerilexMeasureGuide phone={business.phoneE164} />
          </div>
        </div>


        <PerilexWizardToggle lang="en" />
      </article>

      <CtaBand compact message={whatsappMessage} location="service-mid" />

      <PriceIndicator
        title="Price indication perilex & cooker circuit"
        intro="Fixed price up front for connecting a perilex or cooker circuit in Amsterdam. Incl. VAT and warranty on labour."
        rows={priceRows}
        message={whatsappMessage}
        location="service-price"
      />

      <DiyVsPro lang="en" message={whatsappMessage} />

      <Testimonials category="perilex" />

      <CtaBand message={whatsappMessage} location="service-cta" />

      <ServiceFaq faqs={faqs} />

      <RelatedServices currentPath={enPath} />

      <CtaBand compact title="Need help now?" message={whatsappMessage} location="service-footer" />
    </>
  );
}
