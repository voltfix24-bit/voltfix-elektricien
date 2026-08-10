import { createFileRoute } from "@tanstack/react-router";

import heroImg from "@/assets/voltfix-lamp-ophangen.webp.asset.json";
import { ServicePage } from "@/components/service-page";
import { Prose } from "@/components/prose";
import { EnAreaLinks } from "@/components/en-area-links";
import { LocationCtaBlock } from "@/components/location-cta-block";
import {
  absoluteUrl,
  altLinks,
  breadcrumbSchema,
  faqSchema,
  ldScript,
  pageMeta,
  locationServiceSchema,
} from "@/lib/seo";

const nlPath = "/elektricien-amsterdam-zuid";
const enPath = "/en-gb/electrician-amsterdam-zuid";
const area = "Amsterdam Zuid";

const postcodes = "1071–1083";
const neighborhoods = ["Apollobuurt", "Rivierenbuurt", "Zuidas", "Oud-Zuid", "Stadionbuurt", "Willemspark", "Buitenveldert"];

const faqs = [
  {
    q: `Do you work across all of ${area}, including Zuidas and Apollobuurt?`,
    a: `Yes. We work daily across ${area} — from Apollobuurt and Rivierenbuurt to Oud-Zuid and Zuidas offices, and into Buitenveldert. For emergencies we're often on site within 30–45 minutes.`,
  },
  {
    q: `Can you replace a fuse box in a 1930s apartment in Oud-Zuid?`,
    a: `Yes. We have extensive experience with the compact meter cupboards typical of the Beethovenstraat, Van Baerlestraat and Apollolaan. We upgrade to NEN 1010 while preserving the existing structure wherever possible — usually without breaking plasterwork.`,
  },
  {
    q: `Do you install EV chargers on Zuidas or in Buitenveldert parking garages?`,
    a: `Yes. We install home chargers on private driveways in Buitenveldert and shared VvE parking on Zuidas — including load-balancing, a separate kWh meter and the grid operator (Liander) notification.`,
  },
  {
    q: `Do you handle NEN 3140 inspections for offices and restaurants on Zuidas?`,
    a: `Yes. We run periodic NEN 3140 inspections for offices, restaurants and hotels around Gustav Mahlerlaan, Strawinskylaan and Zuidplein, and deliver a full report for your insurer.`,
  },
  {
    q: "Are you NEN 1010 certified and do you provide a warranty?",
    a: "Yes. All work is delivered to the NEN 1010 standard with a written warranty on labour and installed materials. VoltFix is KvK-registered (95572589) and fully insured.",
  },
  {
    q: "Do you speak English?",
    a: "Yes. Our electricians handle the entire job in English — from quote and site visit to invoice.",
  },
  {
    q: `What does an electrician in ${area} cost?`,
    a: "Transparent rates with a fixed price agreed up front, so there are no surprises. We share the call-out fee and hourly rate before we start.",
  },
];

export const Route = createFileRoute("/en-gb/electrician-amsterdam-zuid")({
  head: () => ({
    meta: pageMeta({
      title: `English Electrician ${area} (Zuidas) | VoltFix`,
      description: `English electrician in ${area} — Apollobuurt, Rivierenbuurt, Zuidas, Buitenveldert (${postcodes}). NEN 1010, fixed price, 30-min emergency response.`,
      path: enPath,
      ogTitle: `Electrician ${area} | VoltFix`,
      ogDescription: `Local, English-speaking electrician for Apollobuurt, Zuidas and Buitenveldert. Fixed price, NEN 1010.`,
      locale: "en",
    }),
    links: [{ rel: "canonical", href: absoluteUrl(enPath) }, ...altLinks(nlPath)],
    scripts: [
      ldScript(
        locationServiceSchema({
          name: `Electrician ${area}`,
          description: `English-speaking electrician in ${area} — emergencies, fuse boxes, perilex, EV chargers and NEN 1010/3140 inspections across ${neighborhoods.join(", ")} (postcodes ${postcodes}).`,
          path: enPath,
          postcodes: ["1071", "1072", "1073", "1074", "1075", "1076", "1077", "1078", "1079", "1080", "1081", "1082", "1083"],
          neighborhoods,
          containedIn: "Amsterdam",
          lang: "en",
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
      title={`Electrician ${area} — Apollobuurt, Zuidas & Buitenveldert`}
      intro={`Local, English-speaking electrician covering ${area} (postcodes ${postcodes}) — from 1930s homes in Apollobuurt to Zuidas offices and Buitenveldert villas. NEN 1010 certified, fixed price up front, 30-minute emergency response.`}
      image={heroImg.url}
      imageAlt={`VoltFix electrician on a job in ${area}`}
      whatsappMessage={`Hi VoltFix, I'm looking for an English-speaking electrician in ${area}.`}
      faqs={faqs}
    >
      <Prose>
        <p>
          Looking for a reliable, <strong>English-speaking electrician in {area}</strong>? VoltFix
          is your local expert across postcodes {postcodes} — covering{" "}
          {neighborhoods.join(", ")}. We work daily in the characteristic 1930s buildings of
          Apollobuurt and Oud-Zuid, the family apartments of Rivierenbuurt and the modern towers on
          Zuidas.
        </p>
        <h2>Electrician in Apollobuurt, Rivierenbuurt and on Zuidas</h2>
        <p>
          Apollobuurt and Willemspark are full of characteristic 1930s homes with compact,
          outdated meter cupboards. In Rivierenbuurt and Oud-Zuid we frequently see apartments
          where residents need more capacity for induction, a heat pump or a home office. On
          Zuidas we work on offices and penthouses with modern installations where the control
          layer (dimmers, KNX, smart home) needs the most care.
        </p>
        <h2>Common work in {area}</h2>
        <ul>
          <li>Fuse box replacement in 1930s homes on Beethovenstraat and Van Baerlestraat</li>
          <li>Extra circuits for induction or heat pumps on Zuidas and in Buitenveldert</li>
          <li>Short circuits caused by old wiring in listed buildings in Oud-Zuid</li>
          <li>Lighting, dimmers and spots in offices on Zuidas</li>
          <li>RCD replacement and NEN 3140 inspections for companies</li>
          <li>EV charger on your own parking space in Buitenveldert and Rivierenbuurt</li>
        </ul>
        <h2>Why a local electrician in Zuid?</h2>
        <p>
          {area} is busy, with plenty of one-way streets, loading zones and limited parking around
          Zuidas. A local engineer saves you both travel time and frustration: we know where to
          park quickly around Cornelis Trooststraat, Beethovenplein or Gustav Mahlerlaan, so the
          hourly rate doesn't add up with search time.
        </p>
        <h2>Emergency electrician in {area}</h2>
        <p>
          No power, a short circuit or an RCD that keeps tripping? Our emergency electrician is
          available 24/7 in {area} and is often at your door within 30–45 minutes — in Apollobuurt,
          Rivierenbuurt or on Zuidas.
        </p>
      </Prose>
      <LocationCtaBlock name={area} lang="en" postcodes={postcodes.split("–")} gtmLocation={`location-cta-${enPath.replace(/^\//, "")}`} />
      <EnAreaLinks currentPath={enPath} />
    </ServicePage>
  );
}
