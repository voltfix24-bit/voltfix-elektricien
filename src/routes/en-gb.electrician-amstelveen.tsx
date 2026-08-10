import { createFileRoute } from "@tanstack/react-router";

import heroImg from "@/assets/voltfix-lamp-ophangen.webp.asset.json";
import { ServicePage } from "@/components/service-page";
import { Prose } from "@/components/prose";
import { EnAreaLinks } from "@/components/en-area-links";
import { LocationCtaBlock } from "@/components/location-cta-block";
import { responsePromiseEn } from "@/lib/business";

import {
  absoluteUrl,
  altLinks,
  breadcrumbSchema,
  faqSchema,
  ldScript,
  pageMeta,
  locationServiceSchema,
} from "@/lib/seo";

const nlPath = "/elektricien-amstelveen";
const enPath = "/en-gb/electrician-amstelveen";
const area = "Amstelveen";

const postcodes = "1181–1188";
const neighborhoods = ["Amstelveen-Oost", "Bovenkerk", "Westwijk", "Elsrijk", "Randwijck", "Groenelaan", "Kronenburg"];

const faqs = [
  {
    q: `Do you cover all of ${area}, including Kronenburg, Westwijk and Bovenkerk?`,
    a: `Yes. Our service area covers ${area} — Stadshart, Kronenburg, Westwijk, Bovenkerk, Elsrijk and Randwijck (postcodes ${postcodes}). ${responsePromiseEn}; for planned work we agree an arrival window with you when you call.`,

  },
  {
    q: `Can you replace an old fuse box in a 1960s home in Westwijk or Groenelaan?`,
    a: `Yes. We regularly upgrade the original fuse boxes in Westwijk, Groenelaan and Bankras to a modern NEN 1010 installation with proper RCDs. Fixed price agreed up front, typically completed in one day.`,
  },
  {
    q: `Do you install EV chargers on driveways in Elsrijk and Randwijck?`,
    a: `Yes. For a standard installation on a private driveway in Elsrijk, Randwijck or Bovenkerk we handle the extra circuit, a separate kWh meter and the Liander grid-operator notification.`,
  },
  {
    q: `Can you add extra circuits for a heat pump or solar setup in an Elsrijk villa?`,
    a: `Yes. Many villas in Elsrijk and Randwijck have a separate technical room where we add circuits for a heat pump, solar inverter or additional distribution — all NEN 1010 compliant.`,
  },
  {
    q: "Are you NEN 1010 certified and insured?",
    a: "Yes. All work is delivered to the NEN 1010 standard with a written warranty on labour and materials. VoltFix is KvK-registered (95572589) and fully insured.",
  },
  {
    q: "Do you speak English?",
    a: "Yes. Amstelveen has a large international community, and we handle every job entirely in English — from quote to invoice.",
  },
  {
    q: `What does an electrician in ${area} cost?`,
    a: "Transparent rates with a fixed price agreed up front. We share the call-out fee and hourly rate before we start.",
  },
];

export const Route = createFileRoute("/en-gb/electrician-amstelveen")({
  head: () => ({
    meta: pageMeta({
      title: `English Electrician ${area} — Westwijk, Elsrijk | VoltFix`,
      description: `English-speaking electrician in ${area} (${postcodes}) — Westwijk, Elsrijk, Bovenkerk. Fuse box, EV charger. NEN 1010.`,
      path: enPath,
      ogTitle: `Electrician ${area} | VoltFix`,
      ogDescription: `Local, English-speaking electrician for Amstelveen — Westwijk, Elsrijk, Bovenkerk.`,
      locale: "en",
    }),
    links: [{ rel: "canonical", href: absoluteUrl(enPath) }, ...altLinks(nlPath)],
    scripts: [
      ldScript(
        locationServiceSchema({
          name: `Electrician ${area}`,
          description: `English-speaking electrician in ${area} — emergencies, fuse boxes, perilex, EV chargers and NEN 1010/3140 inspections across ${neighborhoods.join(", ")} (postcodes ${postcodes}).`,
          path: enPath,
          postcodes: ["1181", "1182", "1183", "1184", "1185", "1186", "1187", "1188"],
          neighborhoods,
          containedIn: "Amstelveen",
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
      title={`Electrician ${area} — Westwijk, Elsrijk & Bovenkerk`}
      intro={`Local, English-speaking electrician for ${area} (postcodes ${postcodes}) — from 1960s terraced homes in Westwijk to modern apartments in Kronenburg and villas along the Amstel in Elsrijk. NEN 1010, fixed price up front.`}
      image={heroImg.url}
      imageAlt={`VoltFix electrician on a job in ${area}`}
      whatsappMessage={`Hi VoltFix, I'm looking for an English-speaking electrician in ${area}.`}
      faqs={faqs}
    >
      <Prose>
        <p>
          Looking for a reliable, <strong>English-speaking electrician in {area}</strong>? VoltFix
          is the trusted local expert for the international community in Amstelveen — covering{" "}
          {neighborhoods.join(", ")}.
        </p>
        <h2>Electrician in Bovenkerk, Westwijk and Elsrijk</h2>
        <p>
          Amstelveen has many 1960s and 1970s terraced houses in Westwijk, Groenelaan and Bankras
          where we regularly replace the original fuse box with a modern installation. In Elsrijk
          and Randwijck we work in larger villas — often with a dedicated technical room for a
          heat pump, solar setup and EV charger.
        </p>
        <h2>Common work in {area}</h2>
        <ul>
          <li>Fuse box replacement in outdated installations in Westwijk and Groenelaan</li>
          <li>Perilex socket for induction hob or oven</li>
          <li>EV charger on a private driveway in Elsrijk, Randwijck and Bovenkerk</li>
          <li>Extra circuits for a heat pump during sustainability upgrades</li>
          <li>Fault-finding and NEN 3140 inspections for local businesses</li>
          <li>Garden lighting, spots and dimmers in villas</li>
        </ul>
        <h2>Quick to Amstelveen via the A9 and Amstelveenseweg</h2>
        <p>
          From Amsterdam-Zuid and Buitenveldert we're on site in Amstelveen within around 30
          minutes via the Amstelveenseweg or the A9 — including emergencies in the evening or at
          the weekend.
        </p>
      </Prose>
      <LocationCtaBlock name={area} lang="en" postcodes={postcodes.split("–")} gtmLocation={`location-cta-${enPath.replace(/^\//, "")}`} />
      <EnAreaLinks currentPath={enPath} />
    </ServicePage>
  );
}
