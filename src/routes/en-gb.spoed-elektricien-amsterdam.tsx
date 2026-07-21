import { createFileRoute } from "@tanstack/react-router";

import heroImg from "@/assets/voltfix-spoed-scene.png.asset.json";
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

const nlPath = "/spoed-elektricien-amsterdam";
const enPath = "/en-gb/spoed-elektricien-amsterdam";

const faqs = [
  {
    q: "How fast is an emergency electrician at my place in Amsterdam?",
    a: "For emergencies we aim to be on site within 30 to 60 minutes in Amsterdam. The exact time depends on your location and the time of day, but we always set off as quickly as possible.",
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
];

export const Route = createFileRoute("/en-gb/spoed-elektricien-amsterdam")({
  head: () => ({
    meta: pageMeta({
      title: "Emergency Electrician Amsterdam | 24/7 | VoltFix",
      description:
        "Need an emergency electrician in Amsterdam? VoltFix is available 24/7 for faults, short circuits, power outages and fuse box problems. Often on site within the hour.",
      path: enPath,
      ogTitle: "Emergency Electrician Amsterdam | VoltFix",
      ogDescription: "24/7 fault service across Amsterdam. Often on site within the hour.",
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
        }),
      ),
      ldScript(faqSchema(faqs)),
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
    <ServicePage
      path={enPath}
      eyebrow="24/7 fault service"
      title="Emergency electrician Amsterdam"
      intro="A fault, short circuit or suddenly no power? VoltFix is your emergency electrician in Amsterdam. Available day and night and often with you within the hour, at home or at your business."
      image={heroImg.url}
      imageAlt="VoltFix emergency electrician fixing a fault in a fuse box in Amsterdam"
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
          usually with you within 30 to 60 minutes. We arrive in a fully equipped van, so we can
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
      </Prose>
    </ServicePage>
  );
}
