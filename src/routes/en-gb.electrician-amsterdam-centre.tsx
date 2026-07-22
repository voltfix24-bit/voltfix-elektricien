import { createFileRoute } from "@tanstack/react-router";

import heroImg from "@/assets/voltfix-lamp-ophangen.png.asset.json";
import { ServicePage } from "@/components/service-page";
import { Prose } from "@/components/prose";
import { EnAreaLinks } from "@/components/en-area-links";
import {
  absoluteUrl,
  altLinks,
  breadcrumbSchema,
  faqSchema,
  ldScript,
  pageMeta,
  serviceSchema,
} from "@/lib/seo";

const nlPath = "/elektricien-amsterdam-centrum";
const enPath = "/en-gb/electrician-amsterdam-centre";
const area = "Amsterdam Centre";

const faqs = [
  {
    q: `Do you work in the canal belt and Jordaan?`,
    a: `Yes. We work daily across ${area} — the canal belt (grachtengordel), Jordaan, Nieuwmarkt and the historic centre. For emergencies we're often on site within 30–45 minutes.`,
  },
  {
    q: "Can you work in listed monumental buildings?",
    a: "Yes. We have extensive experience with pre-war and monumental canal houses, and we work carefully around original detailing while bringing the installation up to NEN 1010.",
  },
  {
    q: "Do you speak English?",
    a: "Yes. Our electricians handle the entire job in English — from quote and site visit to invoice.",
  },
  {
    q: `What does an electrician in ${area} cost?`,
    a: "Transparent rates with a fixed price agreed up front. We share the call-out fee and hourly rate before we start, so there are no surprises.",
  },
];

export const Route = createFileRoute("/en-gb/electrician-amsterdam-centre")({
  head: () => ({
    meta: pageMeta({
      title: `English-speaking Electrician ${area} | VoltFix`,
      description: `Certified English-speaking electrician in ${area}. NEN 1010 compliant, transparent rates, 30-minute arrival for emergencies. Call VoltFix.`,
      path: enPath,
      ogTitle: `Electrician ${area} | VoltFix`,
      ogDescription: `Local, English-speaking electrician in ${area}. Fast, certified, fixed price up front.`,
      locale: "en",
    }),
    links: [{ rel: "canonical", href: absoluteUrl(enPath) }, ...altLinks(nlPath)],
    scripts: [
      ldScript(
        serviceSchema({
          name: `Electrician ${area}`,
          description: `English-speaking electrician in ${area} for emergencies, fuse boxes, perilex and installations. NEN 1010 certified.`,
          path: enPath,
        }),
      ),
      ldScript(faqSchema(faqs)),
      ldScript(
        breadcrumbSchema([
          { name: "Home", path: "/en-gb" },
          { name: "Electrician Amsterdam", path: "/en-gb/elektricien-amsterdam" },
          { name: area, path: enPath },
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
      eyebrow={`English-speaking electrician in ${area}`}
      title={`Electrician ${area}`}
      intro={`Certified English-speaking electrician in ${area}. NEN 1010 compliant, transparent rates, and 30-minute arrival for emergencies.`}
      image={heroImg.url}
      imageAlt={`VoltFix electrician on a job in ${area}`}
      whatsappMessage={`Hi VoltFix, I'm looking for an English-speaking electrician in ${area}.`}
      faqs={faqs}
    >
      <Prose>
        <p>
          Looking for a reliable, <strong>English-speaking electrician in {area}</strong>? VoltFix
          is your local expert for the canal belt, Jordaan, Nieuwmarkt and the historic centre —
          from emergency call-outs to fuse box upgrades in monumental canal houses.
        </p>
        <h2>What we handle in {area}</h2>
        <ul>
          <li>24/7 emergency electrician — short circuits, tripped RCDs, power loss</li>
          <li>Fuse box replacement in canal houses and listed buildings</li>
          <li>Perilex sockets (400V) for induction hobs and ovens</li>
          <li>Extra circuits, sockets and lighting for renovations</li>
          <li>NEN 1010 &amp; NEN 3140 inspections for rentals and hospitality</li>
        </ul>
        <h2>How we work</h2>
        <p>
          Every job starts with a clear scope and a fixed price agreed up front. We arrive on time,
          leave the space clean, and deliver a written warranty on labour and materials — all in
          English.
        </p>
      </Prose>
      <EnAreaLinks currentPath={enPath} />
    </ServicePage>
  );
}
