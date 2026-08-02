import { createFileRoute } from "@tanstack/react-router";

import heroImg from "@/assets/voltfix-groepenkast-scene.png.asset.json";
import { ServicePage } from "@/components/service-page";
import { Prose } from "@/components/prose";
import {
  absoluteUrl,
  altLinks,
  breadcrumbSchema,
  faqSchema,
  ldScript,
  ogImage,
  serviceSchema,
  pageMeta,
} from "@/lib/seo";
import { eurEn, fromEn, prices, rangeEn } from "@/lib/pricing";
import { EnAreaLinks } from "@/components/en-area-links";
import { priceProcessFaqs } from "@/data/service-faqs";

const nlPath = "/Groepenkast-Amsterdam";
const enPath = "/en-gb/Groepenkast-Amsterdam";

const faqs = [
  {
    q: "What does replacing a fuse box in Amsterdam cost?",
    a: `A new fuse box costs between ${rangeEn(prices.groepenkastFrom, prices.groepenkastTo)} including materials for a standard situation. The exact price depends on the number of circuits, the state of the wiring and any extensions. You always get a fixed price up front.`,
  },
  {
    q: "How long does replacing a fuse box take?",
    a: "A standard replacement usually takes half to a full working day. You're only without power briefly; we plan the work to keep disruption to a minimum.",
  },
  {
    q: "When do I need to replace my fuse box?",
    a: "Replace your fuse box if there are no or too few RCDs, with old wire-fuse boxes, when circuits trip regularly, or if you want to connect solar panels, an EV charger or induction.",
  },
  {
    q: "Can I have extra circuits added straight away?",
    a: "Yes, that's the ideal moment. During replacement we're happy to extend your box with extra circuits for the kitchen, bathroom, EV charger or solar panels.",
  },
  {
    q: "Does the new fuse box meet safety requirements?",
    a: "We install every fuse box to the current NEN 1010 standard, with the correct RCDs and RCBOs. That keeps your installation safe and future-proof.",
  },
  {
    q: "Do I need to arrange anything myself before you arrive?",
    a: "Usually not. Make sure the fuse box is easy to access and that we can briefly switch off the power. We handle everything else — from materials to reporting.",
  },
  {
    q: "Do you provide a warranty on a new fuse box?",
    a: "Yes, we provide a warranty on the work carried out and the materials installed. On completion we check and document the full installation.",
  },
  ...priceProcessFaqs.en.groepenkast,
];

export const Route = createFileRoute("/en-gb/Groepenkast-Amsterdam")({
  head: () => ({
    meta: pageMeta({
      title: `Fuse Box Replacement Amsterdam | ${rangeEn(prices.groepenkastFrom, prices.groepenkastTo)} | VoltFix`,
      description:
        `Fuse box replacement in Amsterdam ${fromEn(prices.groepenkastFrom)} incl. materials. VoltFix installs safe, modern fuse boxes with RCDs. Fixed price and 12-month installation warranty.`,
      path: enPath,
      ogTitle: "Fuse Box Replacement Amsterdam | VoltFix",
      ogDescription: "A safe, modern fuse box with extra circuits. Fixed price up front.",
      locale: "en",
    }),
    links: [{ rel: "canonical", href: absoluteUrl(enPath) }, ...altLinks(nlPath)],
    scripts: [
      ldScript(
        serviceSchema({
          name: "Fuse box replacement Amsterdam",
          description:
            "Replacing and extending fuse boxes in Amsterdam to NEN 1010, with RCDs and extra circuits.",
          path: enPath,
        }),
      ),
      ldScript(faqSchema(faqs)),
      ldScript(
        breadcrumbSchema([
          { name: "Home", path: "/en-gb" },
          { name: "Fuse box replacement Amsterdam", path: enPath },
        ]),
      ),
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <ServicePage reviewCategory="groepenkast"
      path={enPath}
      eyebrow={`${rangeEn(prices.groepenkastFrom, prices.groepenkastTo)} incl. materials`}
      title="Fuse box replacement Amsterdam"
      intro="An outdated or overloaded fuse box increases the risk of faults and fire. VoltFix replaces your fuse box in Amsterdam safely, quickly and to standard — with room to expand."
      image={heroImg.url}
      imageAlt="Modern fuse box with RCDs installed by VoltFix in Amsterdam"
      whatsappMessage="Hi VoltFix, I'd like my fuse box replaced in Amsterdam."
      faqs={faqs}
      priceTitle="Price indication fuse box replacement"
      priceIntro="Fixed price up front for replacing a fuse box in Amsterdam. Incl. VAT, materials and 12-month warranty on installation work."
      priceRows={[
        {
          title: "Standard fuse box",
          price: rangeEn(prices.groepenkastFrom, prices.groepenkastTo),
          unit: "incl. materials",
          points: ["Up to 3 circuits", "RCDs included", "NEN 1010 compliant"],
          featured: true,
        },
        {
          title: "Fuse box + extension",
          price: "custom quote",
          unit: "incl. extra circuits",
          points: ["Extra circuits", "For EV charger & solar", "Induction & kitchen"],
        },
        {
          title: "Safety inspection",
          price: fromEn(prices.keuringHerkeuringFrom),
          unit: "fuse box check",
          points: ["Full check", "Honest advice", "Report of findings"],
        },
      ]}
    >
      <Prose>
        <p>
          The fuse box is the heart of the electrical installation in your home. A modern,
          well-protected fuse box guards you against short circuits, overload and electric shock.
          Yet many homes in Amsterdam — especially older buildings — still have an outdated box or
          one without enough RCDs.{" "}
          <strong>VoltFix replaces your fuse box expertly and safely</strong>, matched to today's
          usage.
        </p>

        <h2>When is a fuse box replacement needed?</h2>
        <ul>
          <li>
            <strong>An old box with wire fuses</strong> instead of breakers and RCDs.
          </li>
          <li>
            <strong>No or too few RCDs</strong> — a major safety risk.
          </li>
          <li>
            <strong>Circuits trip regularly</strong> because the box can no longer handle the load.
          </li>
          <li>
            <strong>Too few circuits</strong> for a modern kitchen, bathroom or home office.
          </li>
          <li>
            <strong>Expansion plans</strong> such as solar panels, an EV charger, induction or a
            heat pump.
          </li>
        </ul>

        <h2>What does replacing a fuse box involve?</h2>
        <p>
          At VoltFix, replacing a fuse box is a tidy process. We start with an inspection of your
          current installation and wiring. Together we then decide how many circuits you need and
          which protection is appropriate. Next we remove the old box, install the new one with the
          correct RCDs and RCBOs, and connect and label all circuits clearly. Finally we test the
          whole installation and hand it over safely.
        </p>

        <h2>Extend with extra circuits</h2>
        <p>
          Modern households ask more and more of the electrical installation. An induction hob,
          dishwasher, dryer, air conditioning, EV charger or solar panels often need their own
          circuit. The moment you replace your fuse box is ideal to{" "}
          <strong>add extra circuits straight away</strong>. That prevents overload and makes you
          ready for the future. We advise you honestly on how many circuits make sense in your
          situation.
        </p>

        <h2>Local electrician with a warranty</h2>
        <p>
          VoltFix is a local electrician in Amsterdam and knows the quirks of both new-build
          apartments and historic canal houses. We work tidily, clear up afterwards and provide a
          warranty on our work and the materials installed. Request a no-obligation quote for your
          fuse box replacement — call us or send a WhatsApp with your situation.
        </p>

      <EnAreaLinks />
      </Prose>
    </ServicePage>
  );
}
