import { createFileRoute } from "@tanstack/react-router";

import heroImg from "@/assets/voltfix-lamp-ophangen.png.asset.json";
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

const nlPath = "/elektricien-amsterdam-centrum";
const enPath = "/en-gb/electrician-amsterdam-centre";
const area = "Amsterdam Centre";

const postcodes = "1011–1018";
const neighborhoods = ["Jordaan", "Grachtengordel", "Nieuwmarkt", "Red Light District", "Haarlemmerbuurt", "Plantage"];

const faqs = [
  {
    q: `Do you work in the canal belt, Jordaan and Nieuwmarkt?`,
    a: `Yes. We work daily across ${area} — the grachtengordel, Jordaan, Nieuwmarkt, Haarlemmerbuurt and Plantage (postcodes ${postcodes}). For emergencies we're often on site within 30–45 minutes.`,
  },
  {
    q: `Can you work in listed monumental canal houses?`,
    a: `Yes. In a listed canal house you can't just chase new cables into every wall. We work in existing conduits and use surface-mount trunking in monument-approved colours, so the installation is compliant and the building keeps its character. Where needed, we coordinate with the VvE or heritage committee first.`,
  },
  {
    q: `Can you come to a café or bar in the Red Light District after closing?`,
    a: `Yes. For hospitality clients in the Centre we regularly work at night or very early morning, so the venue can stay open during service.`,
  },
  {
    q: `Do you provide NEN 3140 periodic inspections for hotels and restaurants?`,
    a: `Yes. We inspect hotels, restaurants and retail across the Centre and deliver a full NEN 3140 report suitable for your insurer.`,
  },
  {
    q: "Are you NEN 1010 certified and insured?",
    a: "Yes. All work is delivered to the NEN 1010 standard with a written warranty. VoltFix is KvK-registered (91447127) and fully insured.",
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

export const Route = createFileRoute("/en-gb/electrician-amsterdam-centre")({
  head: () => ({
    meta: pageMeta({
      title: `English Electrician ${area} — Canal Houses & Jordaan | VoltFix`,
      description: `English-speaking electrician in ${area} — canal belt, Jordaan, Nieuwmarkt (${postcodes}). Monument-friendly. Fuse box, perilex, hospitality. NEN 1010.`,
      path: enPath,
      ogTitle: `Electrician ${area} | VoltFix`,
      ogDescription: `Local, English-speaking electrician for the canal belt, Jordaan and Nieuwmarkt.`,
      locale: "en",
    }),
    links: [{ rel: "canonical", href: absoluteUrl(enPath) }, ...altLinks(nlPath)],
    scripts: [
      ldScript(
        serviceSchema({
          name: `Electrician ${area}`,
          description: `English-speaking electrician in ${area} — canal houses, hospitality, monument-friendly installations across ${neighborhoods.join(", ")}.`,
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
      title={`Electrician ${area} — Canal Houses, Jordaan & Nieuwmarkt`}
      intro={`English-speaking electrician for ${area} (postcodes ${postcodes}) — from monumental canal houses in the Jordaan and grachtengordel to hospitality on the Nieuwmarkt and shops on Haarlemmerstraat. Monument-friendly, NEN 1010 certified, fixed price up front.`}
      image={heroImg.url}
      imageAlt={`VoltFix electrician on a job in ${area}`}
      whatsappMessage={`Hi VoltFix, I'm looking for an English-speaking electrician in ${area}.`}
      faqs={faqs}
    >
      <Prose>
        <p>
          Looking for a reliable, <strong>English-speaking electrician in {area}</strong>? VoltFix
          works across the historic centre daily — {neighborhoods.join(", ")}. From monumental
          canal houses to hospitality venues on the Wallen and retail on Nieuwmarkt.
        </p>
        <h2>Electrician in the Jordaan, canal belt and Nieuwmarkt</h2>
        <p>
          Canal houses typically have a compact meter cupboard in the basement or under the stairs,
          old wiring and limited room to expand. We specialise in clean, safe installations in
          monumental buildings — respecting the original finishes and complying with the City of
          Amsterdam's requirements for protected cityscapes.
        </p>
        <h2>Common work in {area}</h2>
        <ul>
          <li>Fuse box replacement in canal houses on Herengracht and in the Jordaan</li>
          <li>Extra circuits for hospitality kitchens around Nieuwmarkt and the Wallen</li>
          <li>Lighting, dimmers and spots in shops on Haarlemmerstraat</li>
          <li>Tripping RCDs in apartments above bars and restaurants</li>
          <li>NEN 3140 inspections for hospitality, hotels and retail</li>
          <li>Emergency call-outs on the Wallen outside office hours</li>
        </ul>
        <h2>Working in monuments: what we watch for</h2>
        <p>
          In a listed building we work as much as possible with existing conduits and use
          surface-mount trunking in monument-appropriate colours, so the installation is compliant
          and the building keeps its character. Where needed, we coordinate with the VvE or the
          heritage committee before starting.
        </p>
      </Prose>
      <LocationCtaBlock name={area} lang="en" postcodes={postcodes.split("–")} gtmLocation={`location-cta-${enPath.replace(/^\//, "")}`} />
      <EnAreaLinks currentPath={enPath} />
    </ServicePage>
  );
}
