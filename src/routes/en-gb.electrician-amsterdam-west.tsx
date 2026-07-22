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

const nlPath = "/elektricien-amsterdam-west";
const enPath = "/en-gb/electrician-amsterdam-west";
const area = "Amsterdam West";

const faqs = [
  {
    q: `Do you serve De Baarsjes, Oud-West and Westerpark?`,
    a: `Yes. We work daily across ${area} — from De Baarsjes and Bos en Lommer to Oud-West and Westerpark. For emergencies we're often on site within 30–45 minutes.`,
  },
  {
    q: "Are you NEN 1010 certified?",
    a: "Yes. All work is delivered to the NEN 1010 standard, with a written warranty on labour and installed materials.",
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

export const Route = createFileRoute("/en-gb/electrician-amsterdam-west")({
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
          is your local expert for emergencies, fuse box replacements, perilex connections and
          full electrical installations across De Baarsjes, Bos en Lommer, Oud-West and Westerpark.
        </p>
        <h2>What we handle in {area}</h2>
        <ul>
          <li>24/7 emergency electrician — short circuits, tripped RCDs, power loss</li>
          <li>Fuse box replacement in canal houses and pre-war apartments</li>
          <li>Perilex sockets (400V) for induction hobs and ovens</li>
          <li>Extra circuits for heat pumps, EV chargers and home offices</li>
          <li>NEN 1010 &amp; NEN 3140 inspections for rentals and businesses</li>
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
