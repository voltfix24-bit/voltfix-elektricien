import { createFileRoute, Link } from "@tanstack/react-router";

import heroImg from "@/assets/voltfix-storing-scene.webp.asset.json";
import { ServicePage } from "@/components/service-page";
import { Prose } from "@/components/prose";
import { EnAreaLinks } from "@/components/en-area-links";
import {
  absoluteUrl,
  altLinks,
  breadcrumbSchema,
  faqSchema,
  ldScript,
  ogImage,
  ratesSchema,
  serviceSchema,
  warrantySchema,
  pageMeta,
} from "@/lib/seo";
import { priceProcessFaqs } from "@/data/service-faqs";

const nlPath = "/stroomstoring-amsterdam";
const enPath = "/en-gb/stroomstoring-amsterdam";

const faqs = [
  {
    q: "What should I do during a power outage in Amsterdam?",
    a: (
      <>
        First check whether only your home or the whole street is without power. Then look in the
        fuse box to see if an RCD or circuit has switched off. If you can't safely restore power,{" "}
        <Link
          to="/en-gb/spoed-elektricien-amsterdam"
          className="font-medium text-primary hover:underline"
        >
          call our emergency electrician directly
        </Link>{" "}
        or request a{" "}
        <Link
          to="/en-gb/contact"
          hash="offerte"
          className="font-medium text-primary hover:underline"
        >
          free quote
        </Link>{" "}
        via WhatsApp.
      </>
    ),
  },
  {
    q: "How do I know if the fault is mine or the grid operator's?",
    a: (
      <>
        If the whole street is without power, it's probably with grid operator Liander. If only
        your home is affected, the cause is in your own installation and we can fix it. Our{" "}
        <Link
          to="/en-gb/spoed-elektricien-amsterdam"
          className="font-medium text-primary hover:underline"
        >
          24/7 emergency service in Amsterdam
        </Link>{" "}
        helps you determine this quickly.
      </>
    ),
  },
  {
    q: "How do I fix a short circuit?",
    a: (
      <>
        Switch off the tripped circuit, unplug every appliance on that circuit and switch it back on.
        If it trips again, there's a fault in the installation or in an appliance — call an{" "}
        <Link
          to="/en-gb/spoed-elektricien-amsterdam"
          className="font-medium text-primary hover:underline"
        >
          emergency electrician
        </Link>{" "}
        to trace it safely.
      </>
    ),
  },
  {
    q: "Why does my RCD keep tripping?",
    a: (
      <>
        An RCD that keeps switching off indicates a leakage current, often from a faulty appliance,
        moisture or damaged wiring. We trace the cause precisely and fix the problem. If it trips
        regularly, we also advise whether your{" "}
        <Link
          to="/en-gb/groepenkast-amsterdam"
          className="font-medium text-primary hover:underline"
        >
          fuse box needs replacing or upgrading
        </Link>
        .
      </>
    ),
  },
  {
    q: "Is a power outage dangerous?",
    a: (
      <>
        The outage itself is mostly just inconvenient, but causes such as overheated wiring, sparks
        or a burning smell are genuinely dangerous. With those signs you should act immediately
        and{" "}
        <Link
          to="/en-gb/spoed-elektricien-amsterdam"
          className="font-medium text-primary hover:underline"
        >
          call an emergency electrician
        </Link>
        .
      </>
    ),
  },
  {
    q: "Can you come in the evening for a power outage?",
    a: (
      <>
        Yes, our{" "}
        <Link
          to="/en-gb/spoed-elektricien-amsterdam"
          className="font-medium text-primary hover:underline"
        >
          fault service is available 24/7
        </Link>
        . We come to you quickly in Amsterdam, including evenings, weekends and public holidays.
      </>
    ),
  },
  {
    q: "What does resolving a power outage cost?",
    a: (
      <>
        You pay a fixed all-in rate for the first hour, including call-out within Amsterdam. After
        the first hour we charge per 15 minutes. For exact rates and a no-obligation price estimate,
        you can{" "}
        <Link
          to="/en-gb/contact"
          hash="offerte"
          className="font-medium text-primary hover:underline"
        >
          request a quote
        </Link>
        .
      </>
    ),
  },
  ...priceProcessFaqs.en.stroomstoring,
];

export const Route = createFileRoute("/en-gb/stroomstoring-amsterdam")({
  head: () => ({
    meta: pageMeta({
      title: "Power Outage Amsterdam | Fix Short Circuit | VoltFix",
      description:
        "Power outage in Amsterdam? VoltFix fixes short circuits, power loss and tripping circuits fast. 24/7 fault service.",
      path: enPath,
      ogTitle: "Power Outage Amsterdam | VoltFix",
      ogDescription: "Short circuits and power loss fixed fast. 24/7 fault service in Amsterdam.",
      locale: "en",
    }),
    links: [{ rel: "canonical", href: absoluteUrl(enPath) }, ...altLinks(nlPath)],
    scripts: [
      ldScript(
        serviceSchema({
          name: "Power outage Amsterdam",
          description:
            "Tracing and fixing power outages, short circuits and power loss in Amsterdam. 24/7 fault service.",
          path: enPath,
          locale: "en",
        }),
      ),
      ldScript(faqSchema(faqs, "en", enPath)),
      ldScript(ratesSchema(enPath)),
      ldScript(warrantySchema(enPath)),
      ldScript(
        breadcrumbSchema([
          { name: "Home", path: "/en-gb" },
          { name: "Power outage Amsterdam", path: enPath },
        ]),
      ),
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <ServicePage reviewCategory="stroomstoring"
      path={enPath}
      eyebrow="Short circuit & power loss"
      title="Power outage Amsterdam"
      intro="Suddenly without power or a circuit that keeps tripping? VoltFix quickly traces the cause of your power outage in Amsterdam and fixes it safely. Available 24/7."
      image={heroImg.url}
      imageAlt="VoltFix electrician investigating a power outage in a fuse box in Amsterdam"
      whatsappMessage="Hi VoltFix, I have a power outage in Amsterdam, can you help?"
      faqs={faqs}
    >
      <Prose>
        <p>
          A power outage is more than an inconvenience — it brings your whole home to a standstill.
          The cause can range from a simple tripped circuit to a fault deeper in your installation.{" "}
          <strong>VoltFix traces and fixes power outages across Amsterdam</strong>, quickly and
          safely, with a 24/7 fault service.
        </p>

        <h2>Is the fault yours or the grid operator's?</h2>
        <p>
          The first step is to find out where the problem lies. If the whole street is dark, it's
          usually with grid operator Liander and you can report it to them. If only your home is
          affected, the cause is within your own installation — and that's exactly what we resolve.
          Check your fuse box to see whether an RCD or a circuit has switched off.
        </p>

        <h2>Common causes we resolve</h2>
        <ul>
          <li>A faulty RCD or a leakage current from an appliance</li>
          <li>An overloaded circuit from too many appliances</li>
          <li>Moisture problems in older buildings</li>
          <li>A damaged socket, switch or cable</li>
          <li>Outdated wiring in monumental canal houses</li>
        </ul>

        <h2>What you can do yourself</h2>
        <p>
          Before we arrive, you can often keep the situation safe. Check whether only your home or
          the whole street is affected. If in doubt, switch off the main switch, unplug appliances
          that may be causing the fault, and never touch exposed or damaged wires. Do you smell
          burning or see smoke from the fuse box? Keep your distance and call immediately.
        </p>

        <h2>Fast, transparent and safe</h2>
        <p>
          When you call, you get a professional on the line straight away who thinks along with you.
          We come to you quickly, measure the installation, trace the cause and agree a price up
          front. Many outages are resolved on the first visit, keeping costs down. Call directly or
          send a WhatsApp with a short description and your address in Amsterdam.
        </p>

      <EnAreaLinks />
      </Prose>
    </ServicePage>
  );
}
