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

const nlPath = "/elektricien-amsterdam-west";
const enPath = "/en-gb/electrician-amsterdam-west";
const area = "Amsterdam West";

const postcodes = "1051–1058";
const neighborhoods = ["De Baarsjes", "Bos en Lommer", "Oud-West", "Westerpark", "Houthavens", "Kolenkit"];

const faqs = [
  {
    q: `Do you cover De Baarsjes, Oud-West, Bos en Lommer and Westerpark?`,
    a: `Yes. We work daily across ${area} — from De Baarsjes and Bos en Lommer to Oud-West, Kolenkitbuurt, Houthavens and Westerpark. For emergencies we're often on site within 30–45 minutes via the S102 or A10.`,
  },
  {
    q: `Can you replace the fuse box in a small upstairs flat in Oud-West?`,
    a: `Yes. We adapt the new fuse box to the space available in the existing meter cupboard and make everything NEN 1010 compliant — often without breaking plasterwork in the hallway.`,
  },
  {
    q: `Do you install perilex 400V for a rental in the Kinkerbuurt?`,
    a: `Yes. We install perilex sockets for induction hobs and ovens across De Baarsjes and Oud-West, and can provide a written installation report for your landlord or VvE.`,
  },
  {
    q: `Do you install EV chargers in Westerpark and Houthavens?`,
    a: `Yes. Whether it's a private space in Houthavens or a shared VvE garage in Westerpark, we handle the cable run, extra circuit with kWh meter and Liander notification.`,
  },
  {
    q: "Are you NEN 1010 certified and insured?",
    a: "Yes. All work is delivered to the NEN 1010 standard with a written warranty on labour and materials. VoltFix is KvK-registered (95572589) and fully insured.",
  },
  {
    q: "Do you speak English?",
    a: "Yes. Our electricians handle the entire job in English — from quote to invoice.",
  },
  {
    q: `What does an electrician in ${area} cost?`,
    a: "Transparent rates with a fixed price agreed up front. We share the call-out fee and hourly rate before we start.",
  },
];

export const Route = createFileRoute("/en-gb/electrician-amsterdam-west")({
  head: () => ({
    meta: pageMeta({
      title: `English Electrician ${area} (De Baarsjes) | VoltFix`,
      description: `English electrician in ${area} — De Baarsjes, Oud-West, Bos en Lommer, Westerpark (${postcodes}). Fuse box, perilex, EV charger. NEN 1010, fixed price.`,
      path: enPath,
      ogTitle: `Electrician ${area} | VoltFix`,
      ogDescription: `Local, English-speaking electrician for De Baarsjes, Oud-West, Bos en Lommer and Westerpark.`,
      locale: "en",
    }),
    links: [{ rel: "canonical", href: absoluteUrl(enPath) }, ...altLinks(nlPath)],
    scripts: [
      ldScript(
        locationServiceSchema({
          name: `Electrician ${area}`,
          description: `English-speaking electrician in ${area} — emergencies, fuse boxes, perilex, EV chargers and NEN 1010/3140 inspections across ${neighborhoods.join(", ")} (postcodes ${postcodes}).`,
          path: enPath,
          postcodes: ["1051", "1052", "1053", "1054", "1055", "1056", "1057", "1058"],
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
      title={`Electrician ${area} — De Baarsjes, Oud-West & Westerpark`}
      intro={`Local, English-speaking electrician covering ${area} (postcodes ${postcodes}) — from 1930s upstairs flats in De Baarsjes and Oud-West to new-builds in Westerpark and Houthavens. NEN 1010, fixed price up front, 30-minute emergency response.`}
      image={heroImg.url}
      imageAlt={`VoltFix electrician on a job in ${area}`}
      whatsappMessage={`Hi VoltFix, I'm looking for an English-speaking electrician in ${area}.`}
      faqs={faqs}
    >
      <Prose>
        <p>
          Looking for a reliable, <strong>English-speaking electrician in {area}</strong>? VoltFix
          is your local expert across postcodes {postcodes} — {neighborhoods.join(", ")}. We work
          daily in the compact upstairs flats of De Baarsjes and Oud-West, the 1950s/60s housing
          of Bos en Lommer and Kolenkit, and the modern new-builds of Westerpark and Houthavens.
        </p>
        <h2>Electrician in De Baarsjes, Bos en Lommer and Westerpark</h2>
        <p>
          De Baarsjes and Oud-West consist mostly of upstairs flats with compact, ageing meter
          cupboards — often still with ceramic fuses. In Bos en Lommer and Kolenkit we see many
          1950s/60s homes whose installations are due for replacement. In Westerpark and
          Houthavens it's modern new-builds where EV chargers and extra circuits for heat pumps
          matter most.
        </p>
        <h2>Common work in {area}</h2>
        <ul>
          <li>Fuse box replacement in upstairs flats in De Baarsjes and Oud-West</li>
          <li>Perilex sockets for induction or oven around Kinkerstraat and Jan Evertsenstraat</li>
          <li>Short circuits and tripping RCDs in 1930s properties</li>
          <li>Lighting, dimmers and spot fittings</li>
          <li>Extra circuits and NEN 3140 inspections for small businesses in Bellamybuurt</li>
          <li>EV charger installation in Westerpark, Houthavens and Bos en Lommer</li>
        </ul>
        <h2>Fast on site: no hunt for parking</h2>
        <p>
          Kinkerbuurt, Bellamybuurt and Da Costabuurt are busy and parking is scarce. We know the
          streets of {area} and plan visits so we're inside quickly — saving you hourly-rate time.
          For emergencies we route via the S102 (Jan van Galenstraat) or A10 (Bos en Lommerplein)
          for the fastest arrival.
        </p>
      </Prose>
      <LocationCtaBlock name={area} lang="en" postcodes={postcodes.split("–")} gtmLocation={`location-cta-${enPath.replace(/^\//, "")}`} />
      <EnAreaLinks currentPath={enPath} />
    </ServicePage>
  );
}
