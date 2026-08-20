import { createFileRoute, Link } from "@tanstack/react-router";

import monteurImg from "@/assets/voltfix-monteur.webp.asset.json";
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
  serviceSchema,
  pageMeta,
} from "@/lib/seo";
import { priceProcessFaqs } from "@/data/service-faqs";
import { business } from "@/lib/business";

const nlPath = "/spoed-elektricien-amsterdam";
const enPath = "/en-gb/spoed-elektricien-amsterdam";

const faqs = [
  {
    q: "How fast is an emergency electrician at my place in Amsterdam?",
    a: "For emergencies we're on site within 60 minutes across Amsterdam. In Centrum, Zuid, West, Oost and De Pijp usually 20–40 minutes; in Noord, IJburg, Zuidoost and Amstelveen typically 40–60 minutes, depending on time and traffic.",
  },
  {
    q: "Can I call an emergency electrician at night or on weekends?",
    a: "Yes, our emergency service is available 24 hours a day, 7 days a week, including nights, weekends and public holidays.",
  },
  {
    q: "What should I do with a short circuit or a tripped circuit?",
    a: "Switch off the main switch, don't touch any exposed wires and keep children and pets away. Then call VoltFix right away; we'll find the cause and fix it safely.",
  },
  {
    q: "What does an emergency electrician in Amsterdam cost?",
    a: "You pay a call-out fee plus an hourly rate. We agree a clear price up front, so there are no surprises, even for emergencies.",
  },
  {
    q: "My whole street has no power, can you help?",
    a: "If the fault is outside your fuse box, it's often with the grid operator (Liander). We'll help you quickly establish this and fix anything within your own installation.",
  },
  {
    q: "Do you also fix faults in business premises?",
    a: "Certainly. We help both private customers and businesses in Amsterdam with acute faults, circuit failures and fuse box problems.",
  },
  {
    q: "What if the fault occurs late in the evening?",
    a: "Feel free to call us, even late at night. Our engineers are set up for emergency work and carry the right materials to fix your problem on the spot.",
  },
  ...priceProcessFaqs.en.spoed,
];

export const Route = createFileRoute("/en-gb/spoed-elektricien-amsterdam")({
  head: () => ({
    meta: pageMeta({
      title: `Amsterdam Emergency Electrician 24/7 | ${business.phoneDisplay}`,
      description:
        `Amsterdam emergency electrician, available 24/7. Call ${business.phoneDisplay} — on site within 60 minutes for power cuts, short circuits and fuse box faults.`,
      path: enPath,
      ogTitle: `Amsterdam Emergency Electrician 24/7 | ${business.phoneDisplay}`,
      ogDescription: `24/7 emergency electrician in Amsterdam. Call ${business.phoneDisplay} — on site within 60 minutes.`,
      locale: "en",
    }),
    links: [{ rel: "canonical", href: absoluteUrl(enPath) }, ...altLinks(nlPath)],
    scripts: [
      ldScript(
        serviceSchema({
          name: "Emergency electrician Amsterdam",
          description:
            "24/7 emergency service for faults, short circuits, power outages and fuse box problems in Amsterdam.",
          path: enPath,
          locale: "en",
        }),
      ),
      ldScript(faqSchema(faqs, "en", enPath)),
      ldScript(
        breadcrumbSchema([
          { name: "Home", path: "/en-gb" },
          { name: "Emergency electrician Amsterdam", path: enPath },
        ]),
      ),
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <ServicePage reviewCategory="spoed"
      path={enPath}
      eyebrow="24/7 fault service"
      title="Emergency electrician Amsterdam"
      intro="Fault, short circuit or no power? Emergency electrician in Amsterdam — available 24/7, often on site within 60 minutes."
      image={monteurImg.url}
      imageAlt="VoltFix emergency electrician in Amsterdam with multimeter test leads, ready for a call-out"
      heroObjectFit="contain"
      heroTransparent
      whatsappMessage="Hi VoltFix, I urgently need an electrician in Amsterdam."
      faqs={faqs}
    >
      <Prose>
        <p>
          An electrical fault always strikes at the worst moment. Whether it's the middle of the
          night, while cooking or just as you're working from home — without power, the whole
          household grinds to a halt.{" "}
          <strong>VoltFix is your emergency electrician in Amsterdam</strong>, available 24 hours a
          day, 7 days a week. We're on site fast, trace the cause and make sure you have safe power
          again.
        </p>

        <h2>When should you call an emergency electrician?</h2>
        <p>Some situations can't wait until tomorrow. Call right away for:</p>
        <ul>
          <li>
            <strong>A short circuit</strong> where the power keeps cutting out or a circuit won't
            stay on.
          </li>
          <li>
            <strong>A complete power outage</strong> in your home or business.
          </li>
          <li>
            <strong>A tripped RCD</strong> that won't reset.
          </li>
          <li>
            <strong>A burning smell, sparks or a hot fuse box</strong> — always acutely dangerous.
          </li>
          <li>
            <strong>Failure of key appliances</strong> such as the boiler, fridge or security
            system.
          </li>
        </ul>

        <h2>On site fast across Amsterdam</h2>
        <p>
          VoltFix is a local electrician and knows Amsterdam inside out. Whether you live in
          Centrum, Zuid, West, Oost, Noord, De Pijp, the Jordaan or on IJburg — our electricians are
          with you within 60 minutes for emergencies — anywhere in Amsterdam. We arrive in a fully equipped van, so we can
          resolve most faults on the first visit. No unnecessary second appointment, just a
          solution.
        </p>

        <h2>Transparent rates, even for emergencies</h2>
        <p>
          With VoltFix, an emergency doesn't mean an unclear bill afterwards. We work with clear
          call-out fees and a fixed hourly rate, and always discuss the price up front. So you know
          exactly where you stand, even if we come in the evening or at the weekend. Need an
          electrician urgently in Amsterdam right now? Call directly, or send us a WhatsApp with a
          short description and your address.
        </p>

      <EnAreaLinks />
      </Prose>
    </ServicePage>
  );
}
