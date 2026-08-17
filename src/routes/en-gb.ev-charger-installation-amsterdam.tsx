import { createFileRoute } from "@tanstack/react-router";

import heroImg from "@/assets/voltfix-laadpaal-scene.webp";
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
import type { PriceRow } from "@/components/price-indicator";
import { eurEn, fromEn, prices } from "@/lib/pricing";
import { EnAreaLinks } from "@/components/en-area-links";
import { priceProcessFaqs } from "@/data/service-faqs";

const nlPath = "/laadpaal-amsterdam";
const enPath = "/en-gb/ev-charger-installation-amsterdam";

const faqs = [
  {
    q: "How much does it cost to install an EV charger in Amsterdam?",
    a: `A standard EV wallbox installation starts around ${eurEn(prices.laadpaal1PhaseFrom)} including materials and a dedicated circuit. The final price depends on cable route, distance to the fuse box and desired power (1-phase or 3-phase). You get a fixed price up front.`,
  },
  {
    q: "Can I install an EV charger anywhere in Amsterdam?",
    a: "On private property (parking spot, driveway, garage) it's usually straightforward. Public street chargers are requested via the city of Amsterdam. We install home and business wallboxes on private property.",
  },
  {
    q: "Do I need 3-phase power for a fast charger?",
    a: "Fast charging (11 or 22 kW) requires a 3-phase connection. With 1-phase you charge at up to 3.7 or 7.4 kW. We check your fuse box and advise which connection fits your car and usage.",
  },
  {
    q: "Which brands of EV chargers do you install?",
    a: "We install Alfen, Wallbox, EVBox, Easee, Zaptec and Tesla Wall Connector, among others. If you don't have a charger yet, we're happy to advise on a model that matches your car, connection and budget.",
  },
  {
    q: "Is the wallbox installed to NEN 1010?",
    a: "Absolutely. Every charger gets a dedicated circuit with a type A-EV or type B RCBO and is installed to the NEN 1010 standard. We test the installation and provide an installation certificate.",
  },
  {
    q: "How long does the installation take?",
    a: "Most installations are completed within half a day to a full working day. If extra cabling or a fuse box upgrade is needed, we agree that with you in advance.",
  },
  ...priceProcessFaqs.en.laadpaal,
];

const priceRows: PriceRow[] = [
  {
    title: "EV charger installation (1-phase)",
    price: fromEn(prices.laadpaal1PhaseFrom),
    unit: "incl. materials & dedicated circuit",
    points: ["Up to 7.4 kW", "NEN 1010", "Type A RCBO"],
  },
  {
    title: "EV charger installation (3-phase)",
    price: fromEn(prices.laadpaal3PhaseFrom),
    unit: "incl. materials, 3-phase & dedicated circuit",
    points: ["11 or 22 kW fast charging", "Type B / A-EV RCBO", "Installation certificate"],
    featured: true,
  },
  {
    title: "Fuse box extension for EV",
    price: fromEn(prices.laadpaalExtraGroupFrom),
    unit: "extra circuit in existing fuse box",
    points: ["Dedicated charging circuit", "3-phase ready", "1 year labour warranty"],
  },
];

export const Route = createFileRoute("/en-gb/ev-charger-installation-amsterdam")({
  head: () => ({
    meta: pageMeta({
      title: "EV Charger Installation Amsterdam | Wallbox | VoltFix",
      description:
        `EV charger (wallbox) installation in Amsterdam. Fixed price ${fromEn(prices.laadpaal1PhaseFrom)}, NEN 1010 compliant, dedicated circuit and installation certificate.`,
      path: enPath,
      ogTitle: "EV Charger Installation Amsterdam | VoltFix",
      ogDescription: "Home wallbox installed in Amsterdam — fixed price, NEN 1010, fast service.",
      locale: "en",
    }),
    links: [{ rel: "canonical", href: absoluteUrl(enPath) }, ...altLinks(nlPath)],
    scripts: [
      ldScript(
        serviceSchema({
          name: "EV charger installation Amsterdam",
          description:
            "Installation of EV wallboxes for home and business in Amsterdam, including dedicated circuit and NEN 1010 certification.",
          path: enPath,
          locale: "en",
        }),
      ),
      ldScript(faqSchema(faqs, "en", enPath)),
      ldScript(
        breadcrumbSchema([
          { name: "Home", path: "/en-gb" },
          { name: "EV charger installation Amsterdam", path: enPath },
        ]),
      ),
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <ServicePage reviewCategory="laadpaal"
      path={enPath}
      eyebrow="EV charger / Wallbox"
      title="EV charger installation in Amsterdam"
      intro="Charge your electric car at home or at work without hassle. VoltFix installs your wallbox in Amsterdam with a dedicated circuit, to NEN 1010, at a fixed price agreed up front."
      image={heroImg}
      imageAlt="VoltFix electrician installing a white wallbox EV charger on the façade of an Amsterdam canal house next to an electric car"
      whatsappMessage="Hi VoltFix, I would like to have an EV charger / wallbox installed in Amsterdam."
      faqs={faqs}
      priceRows={priceRows}
      priceTitle="EV charger installation price indication"
      priceIntro="Indicative prices for a complete wallbox installation in Amsterdam, including materials and dedicated circuit."
    >
      <Prose>
        <p>
          More and more Amsterdam residents drive electric — and want to charge safely and quickly
          at home or on their own property. A <strong>private wallbox</strong> is more convenient,
          faster and cheaper than public charging. VoltFix installs your EV charger across
          Amsterdam, with a <strong>dedicated circuit in the fuse box</strong> and fully to NEN
          1010.
        </p>

        <h2>Which wallbox suits you?</h2>
        <p>
          The right choice depends on your car, connection and daily usage. For most residents of an
          Amsterdam apartment or canal house, a 1-phase wallbox at 3.7 or 7.4 kW is enough — your
          battery is full again overnight. Need faster charging or have multiple EVs? A 3-phase
          wallbox (11 or 22 kW) is a smart pick, provided your fuse box can handle it.
        </p>

        <h2>How we install your charger</h2>
        <ul>
          <li>We check your fuse box and available capacity.</li>
          <li>We advise on 1-phase versus 3-phase and the right power level.</li>
          <li>We add a dedicated circuit with the correct RCBO (type A or type B / A-EV).</li>
          <li>We route the cable neatly to the desired location (façade, garage or driveway).</li>
          <li>We mount and configure the wallbox and fully test it.</li>
          <li>
            You receive an <strong>NEN 1010 installation certificate</strong>.
          </li>
        </ul>

        <h2>Brands and models</h2>
        <p>
          VoltFix installs every popular brand, including{" "}
          <strong>Alfen, Wallbox, EVBox, Easee, Zaptec</strong> and Tesla Wall Connector. Haven't
          chosen a charger yet? We happily advise on a model that fits your car, connection and
          budget — including dynamic load balancing and solar integration.
        </p>

        <h2>Safe, fast and covered by warranty</h2>
        <p>
          A poorly installed wallbox can overload your fuse box or create unsafe situations. That's
          why our electricians work strictly to the <strong>NEN 1010 standard</strong> and use only
          certified materials. You get 1 year of warranty on labour and full manufacturer warranty
          on the installed hardware.
        </p>

      <EnAreaLinks />
      </Prose>
    </ServicePage>
  );
}
