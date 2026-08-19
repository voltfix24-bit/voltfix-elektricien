import { createFileRoute } from "@tanstack/react-router";

import heroImg from "@/assets/voltfix-keuring-scene.webp.asset.json";
import { ServicePage } from "@/components/service-page";
import { Prose } from "@/components/prose";
import {
  absoluteUrl,
  altLinks,
  breadcrumbSchema,
  faqSchema,
  howToSchema,
  ldScript,
  pageMeta,
} from "@/lib/seo";
import { eurEn, prices } from "@/lib/pricing";
import { GuideLinks } from "@/components/guide-links";

const path = "/en-gb/how-to-assemble-a-fuse-box";

const faqs = [
  {
    q: "What does 'assembling a fuse box' mean?",
    a: "Assembling a fuse box (Dutch: groepenkast samenstellen) means deciding how many circuits, RCBOs and main switches your home or business needs, and how they are laid out to comply with NEN 1010. That plan is the blueprint your electrician uses to build or replace the consumer unit.",
  },
  {
    q: "How many circuits do I need?",
    a: "A typical Amsterdam family home has 8–12 circuits: separate ones for the induction hob (Perilex), washing machine, dishwasher, bathroom, lighting per floor and sockets per room. Larger homes, EV chargers and solar panels usually require extra circuits.",
  },
  {
    q: "What's the difference between an RCD and an RCBO?",
    a: "An RCD (aardlekschakelaar) protects several circuits at once against earth leakage. An RCBO (aardlekautomaat) combines earth-leakage and overcurrent protection into one module and protects a single circuit. Since NEN 1010:2020 an RCBO per circuit is the safest — and now standard — choice.",
  },
  {
    q: "Do I need 3-phase power or Perilex?",
    a: "Modern induction hobs and ranges above about 7.4 kW need a Perilex socket or a 3-phase (400V) circuit. Include that circuit while planning the fuse box — otherwise the unit will need to be extended later.",
  },
  {
    q: "Can I assemble a fuse box myself?",
    a: "You can prepare the layout, but connecting the consumer unit to the main supply is reserved for a certified electrician in the Netherlands. VoltFix calculates your requirements to NEN 1010 and provides a fixed quote for supply and installation.",
  },
  {
    q: "What does a new fuse box cost in Amsterdam?",
    a: `A standard replacement with 8–12 RCBOs starts at roughly ${eurEn(prices.groepenkastFullReplacementFrom)} including materials, labour and a NEN 1010 inspection. Additional capacity for EV chargers, solar or 3-phase supply may increase the price.`,
  },
];

export const Route = createFileRoute("/en-gb/how-to-assemble-a-fuse-box")({
  head: () => ({
    meta: pageMeta({
      title: "How to Assemble a Fuse Box (NEN 1010) | Amsterdam | VoltFix",
      description:
        "Planning a new fuse box in Amsterdam? How many circuits, RCBOs and Perilex points you need under NEN 1010 — VoltFix checklist.",
      path,
      locale: "en",
      ogTitle: "How to Assemble a Fuse Box — practical NEN 1010 guide | VoltFix",
      ogDescription:
        "How many circuits, which RCBOs and when do you need Perilex? A complete NEN 1010 checklist for your new consumer unit.",
    }),
    links: [{ rel: "canonical", href: absoluteUrl(path) }, ...altLinks("/groepenkast-samenstellen")],
    scripts: [
      ldScript(
        howToSchema({
          name: "How to assemble a fuse box under NEN 1010",
          description:
            "Step-by-step guide to designing a modern consumer unit: counting circuits, choosing RCBOs, planning for Perilex and EV chargers, and installing to NEN 1010.",
          path,
          totalTime: "PT30M",
          tools: ["Notebook or planning tool", "Floor plan", "NEN 1010 guidelines"],
          supplies: [
            "Main switch 40A",
            "RCBOs 16A/B (per circuit)",
            "Perilex RCBO 3x16A (cooker circuit)",
            "DIN-rail enclosure (12–24 modules)",
          ],
          steps: [
            {
              name: "List every fixed appliance",
              text: "Walk through each room and note the fixed loads: induction hob, oven, washer, dryer, dishwasher, water heater, boiler, air-con, EV charger and solar inverter. Every heavy load gets its own circuit.",
            },
            {
              name: "Count the circuits",
              text: "Add one lighting circuit per floor and one socket circuit per larger room. An average Amsterdam family home lands at 8–12 circuits; renovated or larger homes at 14+.",
            },
            {
              name: "Choose an RCBO per circuit",
              text: "Under NEN 1010:2020 each circuit deserves its own RCBO (30 mA, curve B or C). This keeps a single fault from tripping the whole house.",
            },
            {
              name: "Plan Perilex or 3-phase power",
              text: "Induction hobs above 7.4 kW and industrial equipment need a Perilex or 3-phase (400V) circuit. Reserve 3 modules for it in the unit.",
            },
            {
              name: "Leave space for the future (EV, PV, heat pump)",
              text: "Keep 2–4 modules free for future additions such as an EV charger, heat pump or extra solar panels. That saves you a second consumer unit within a few years.",
            },
            {
              name: "Install and certify",
              text: "A certified electrician mounts the unit, connects it to the main supply and issues a NEN 1010 inspection certificate. VoltFix delivers this end-to-end for Amsterdam properties.",
            },
          ],
        }),
      ),
      ldScript(faqSchema(faqs, "en", path)),
      ldScript(
        breadcrumbSchema([
          { name: "Home", path: "/en-gb" },
          { name: "Fuse box Amsterdam", path: "/en-gb/groepenkast-amsterdam" },
          { name: "How to assemble a fuse box", path },
        ]),
      ),
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <ServicePage reviewCategory="groepenkast"
      path={path}
      eyebrow="Guide · NEN 1010"
      title="How to assemble a fuse box — step by step"
      intro="A new or extended fuse box starts with a plan. This guide walks you through the number of circuits, RCBOs and connections you need — so your consumer unit is future-proof and compliant with NEN 1010."
      image={heroImg.url}
      imageAlt="Modern consumer unit with RCBOs assembled to NEN 1010 by VoltFix in Amsterdam"
      whatsappMessage="Hi VoltFix, I'd like help designing a new fuse box for my Amsterdam property."
      faqs={faqs}
    >
      <Prose>
        <p>
          Assembling a fuse box (Dutch: <em>groepenkast samenstellen</em>) isn't something you do
          every day. A good layout prevents nuisance trips, improves safety and gets your home
          ready for <strong>EV chargers, solar panels and heat pumps</strong>. This guide covers
          the key decisions — and how VoltFix handles it across Amsterdam.
        </p>

        <h2>1. Why the layout matters</h2>
        <p>
          The fuse box distributes power to the whole property. A cramped unit means that a single
          issue — a leaky washing machine or a faulty lamp — trips multiple rooms at once. Under
          modern <strong>NEN 1010:2020</strong> each circuit should have its own RCBO
          (aardlekautomaat).
        </p>

        <h2>2. How many circuits do you need?</h2>
        <ul>
          <li>1 circuit for the <strong>induction hob</strong> (Perilex or 3-phase).</li>
          <li>1 for the <strong>washing machine</strong>, 1 for the <strong>tumble dryer</strong>.</li>
          <li>1 for the <strong>dishwasher</strong>.</li>
          <li>1 <strong>bathroom</strong> circuit (kept separate from bedrooms).</li>
          <li>1 lighting circuit per floor.</li>
          <li>1 socket circuit per larger room or floor.</li>
          <li>Optional dedicated circuits for <strong>EV charger</strong>,
            <strong> heat pump</strong> and <strong>solar inverter</strong>.</li>
        </ul>
        <p>
          Plan for at least 8–12 circuits in an average family home and 14+ for larger or renovated
          properties.
        </p>

        <h2>3. RCBOs or RCDs?</h2>
        <p>
          Classic units use one RCD per 4 circuits — one leakage fault knocks out four circuits at
          once. Modern units use <strong>RCBOs</strong> (30 mA, curve B or C) per circuit, so if
          one trips the rest keeps running. Safer and more comfortable — and the current standard
          for new-builds and renovations.
        </p>

        <h2>4. Perilex, 3-phase and heavy loads</h2>
        <p>
          Modern induction hobs above 7.4 kW require a <strong>Perilex socket</strong> or a{" "}
          <strong>3-phase (400V) circuit</strong>. Reserve 3 modules for it and use a suitable
          Perilex RCBO. See our page on{" "}
          <a href="/en-gb/perilex-amsterdam">Perilex installation in Amsterdam</a> for the wiring
          side.
        </p>

        <h2>5. Plan for the future</h2>
        <p>
          The energy transition puts more and more load on the consumer unit. Keep{" "}
          <strong>2 to 4 modules free</strong> for future additions such as an{" "}
          <a href="/en-gb/ev-charger-installation-amsterdam">EV charger</a>, heat pump or extra
          solar panels — that saves you a second unit within a few years.
        </p>

        <h2>6. Installation and certification</h2>
        <p>
          Connecting the unit to the main supply is reserved for a certified electrician. VoltFix
          delivers design, installation and{" "}
          NEN 1010 inspection as one project.
          You receive a digital certificate — accepted by insurers, homeowner associations and
          landlords.
        </p>

        <h2>Ready to plan yours?</h2>
        <p>
          Share your wishlist via WhatsApp or the contact form. You get a <strong>fixed price</strong>
          within one business day for supply and installation — inspection and warranty included.
          See our main page on{" "}
          <a href="/en-gb/groepenkast-amsterdam">fuse box replacement in Amsterdam</a>.
        </p>
      </Prose>
      <GuideLinks currentPath={"/en-gb/how-to-assemble-a-fuse-box"} />
    </ServicePage>
  );
}
