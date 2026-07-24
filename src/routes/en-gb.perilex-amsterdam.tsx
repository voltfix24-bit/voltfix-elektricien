import { createFileRoute, Link } from "@tanstack/react-router";

import heroImg from "@/assets/voltfix-perilex-scene.png.asset.json";
import { ServicePage } from "@/components/service-page";
import { Prose } from "@/components/prose";
import { PerilexWizardToggle, PerilexWizardCta } from "@/components/perilex-wizard-toggle";
import {
  absoluteUrl,
  altLinks,
  breadcrumbSchema,
  faqSchema,
  howToSchema,
  ldScript,
  ogImage,
  serviceSchema,
  pageMeta,
} from "@/lib/seo";

const nlPath = "/perilex-amsterdam";
const enPath = "/en-gb/perilex-amsterdam";

const faqs = [
  {
    q: "What does connecting a perilex in Amsterdam cost?",
    a: "Connecting a perilex socket or cooker circuit starts at around €120. The price depends on the distance to the fuse box and whether a new circuit is needed. You get a fixed price up front.",
  },
  {
    q: "What is the difference between 2-phase and 3-phase?",
    a: "A standard perilex often uses 2 phases for heavier appliances. With 3-phase the load is spread across three phases, which may be required for powerful induction hobs or ranges. We advise what your appliance and home need.",
  },
  {
    q: "Do I need a perilex for my induction hob?",
    a: "Many induction hobs need their own cooker circuit or perilex connection because of their high power draw. Check your hob's connected load; we're happy to advise which connection is required.",
  },
  {
    q: "Can I use a normal socket for induction?",
    a: "Lighter induction hobs sometimes run on a normal circuit, but more powerful models require a dedicated cooker circuit or perilex to prevent overload and tripping.",
  },
  {
    q: "Does an extra circuit need to be added to the fuse box?",
    a: "Often yes. A cooker ideally gets its own circuit in the fuse box. If there's no room, we can extend or adapt the fuse box.",
  },
  {
    q: "How long does connecting a perilex take?",
    a: "In most cases it's done within one to two hours. If cabling has to be run to the fuse box, it can take a little longer.",
  },
  {
    q: "Do you also connect ranges and ovens?",
    a: "Yes, we safely connect induction hobs, ceramic hobs, electric ranges and ovens to the right circuit and connection in Amsterdam.",
  },
];

export const Route = createFileRoute("/en-gb/perilex-amsterdam")({
  head: () => ({
    meta: pageMeta({
      title: "Perilex Connection Amsterdam | Cooker Circuit | VoltFix",
      description:
        "Perilex connection in Amsterdam for induction hobs or ranges. Fixed price from €120, 1-year labour warranty. Safely installed by VoltFix.",
      path: enPath,
      ogTitle: "Perilex Connection Amsterdam | VoltFix",
      ogDescription:
        "Cooker circuit and perilex socket for induction hobs and ranges. Safely connected.",
      locale: "en",
    }),
    links: [{ rel: "canonical", href: absoluteUrl(enPath) }, ...altLinks(nlPath)],
    scripts: [
      ldScript(
        serviceSchema({
          name: "Perilex connection Amsterdam",
          description:
            "Connecting perilex sockets and cooker circuits for induction hobs and ranges in Amsterdam, 2-phase and 3-phase.",
          path: enPath,
        }),
      ),
      ldScript(faqSchema(faqs)),
      ldScript(
        howToSchema({
          name: "How to connect a perilex — step-by-step",
          description:
            "Step-by-step guide to safely connect a perilex socket for an induction hob or range in Amsterdam. When in doubt or when fuse-box work is needed: have VoltFix do it.",
          path: enPath,
          totalTime: "PT45M",
          tools: [
            "Approved two-pole voltage tester",
            "Phillips and flat-head screwdriver",
            "Wire stripper",
            "Side cutters",
          ],
          supplies: [
            "Perilex plug (2- or 3-phase, matching the configuration)",
            "Perilex cable with the correct cross-section",
          ],
          steps: [
            {
              name: "Measure the configuration",
              text: "Use a two-pole voltage tester to identify which contacts are live (L) and neutral (N). Note the wiring of the existing socket.",
            },
            {
              name: "Power off",
              text: "Switch off the correct circuit at the fuse box and verify with the voltage tester that no voltage remains on the connection.",
            },
            {
              name: "Prepare the cable",
              text: "Strip the outer sheath and individual cores to the correct length. Keep the earth core (green/yellow) slightly longer than live and neutral.",
            },
            {
              name: "Connect cores by colour code",
              text: "Connect each core to the labelled terminal on the perilex plug. Follow the labels on the plug; no bare copper outside the terminal.",
            },
            {
              name: "Tighten strain relief",
              text: "Clamp the cable firmly on the outer sheath — never on the individual cores — so the connection cannot pull loose under load.",
            },
            {
              name: "Appliance side: set bridges",
              text: "Set the bridges on the appliance terminal block according to the manufacturer's diagram for 1-, 2- or 3-phase, matching the configuration you measured.",
            },
            {
              name: "Close & check",
              text: "Close the plug, verify all screws are tight and nothing is pinched. Only then re-energise the circuit and test operation.",
            },
          ],
        }),
      ),
      ldScript(
        breadcrumbSchema([
          { name: "Home", path: "/en-gb" },
          { name: "Perilex connection Amsterdam", path: enPath },
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
      eyebrow="Cooker circuit · from €120"
      title="Perilex connection Amsterdam"
      intro="New induction hob or range? VoltFix connects your perilex socket and cooker circuit safely in Amsterdam. Expertly, to standard, and matched to your appliance's power."
      image={heroImg.url}
      imageAlt="VoltFix electrician connecting a perilex for an induction hob in Amsterdam"
      whatsappMessage="Hi VoltFix, I'd like a perilex / cooker circuit connected in Amsterdam."
      faqs={faqs}
      priceTitle="Price indication perilex & cooker circuit"
      priceIntro="Fixed price up front for connecting a perilex or cooker circuit in Amsterdam. Incl. VAT and 1-year warranty on labour."
      priceRows={[
        {
          title: "Perilex connection",
          price: "from €120",
          unit: "on existing circuit",
          points: ["2- or 3-phase", "Induction & range", "1-year labour warranty"],
          featured: true,
        },
        {
          title: "Cooker + new circuit",
          price: "from €275",
          unit: "incl. extra circuit",
          points: ["Dedicated cooker circuit", "Cabling to fuse box", "NEN 1010 compliant"],
        },
      ]}
    >
      <div className="mb-8">
        <PerilexWizardCta lang="en" />
      </div>

      <Prose>
        <p>
          Switching from gas to induction in Amsterdam, or installing a new range? You'll quickly
          face the question: which connection do I need? Powerful cooking appliances draw more
          current than a normal socket can safely supply. That's why a{" "}
          <strong>perilex connection or dedicated cooker circuit</strong> is often necessary. As
          your{" "}
          <Link to="/en-gb/electrician-amsterdam" className="font-medium text-primary underline underline-offset-4">
            certified electrician in Amsterdam
          </Link>
          , VoltFix installs these safely and expertly, so you can cook without worry.
        </p>

        <h2>What is a perilex connection?</h2>
        <p>
          A perilex is a five-pin plug and socket designed for high-power appliances such as
          electric ranges and heavy induction hobs. A perilex can use multiple phases at once,
          providing far more power than a standard wall socket. For induction cooking that matters:
          running several zones at full power easily draws 7,000 watts or more.
        </p>
      </Prose>

      <div className="my-8">
        <PerilexWizardCta lang="en" />
      </div>

      <Prose>
        <h2>Cooker circuit or perilex — what do you need?</h2>
        <p>
          Not every induction hob needs the same connection. It depends on the connected load the
          manufacturer specifies:
        </p>
        <ul>
          <li>
            <strong>Light induction hob:</strong> sometimes runs on its own cooker circuit (a
            heavier-duty 230V circuit).
          </li>
          <li>
            <strong>Heavier induction hob:</strong> often requires a 2-phase perilex.
          </li>
          <li>
            <strong>Powerful range or large hob:</strong> may need a 3-phase connection.
          </li>
        </ul>
        <p>
          We check your appliance's rating plate and manual and advise which connection is safe and
          suitable. That prevents overload and tripping circuits.
        </p>

        <h2>How we work</h2>
        <ul>
          <li>We check your fuse box and the available space for a circuit.</li>
          <li>If needed, we add a new, heavier-duty cooker circuit.</li>
          <li>We run the correct cabling to the kitchen.</li>
          <li>We fit the perilex socket or the fixed connection.</li>
          <li>We connect your hob or range and test everything.</li>
        </ul>

        <h2>Safe cooking without worries</h2>
        <p>
          An incorrectly connected hob can cause overheating, tripping circuits or, in the worst
          case, fire. Having the connection done by a qualified electrician means everything is
          carried out to the NEN 1010 standard. If a circuit trips mid-cook, our{" "}
          <Link to="/en-gb/emergency-electrician-amsterdam" className="font-medium text-primary underline underline-offset-4">
            24/7 emergency electrician in Amsterdam
          </Link>{" "}
          is on call. VoltFix completes the work safely and provides a warranty — you can{" "}
          <Link to="/en-gb/contact" className="font-medium text-primary underline underline-offset-4">
            request a free perilex installation quote
          </Link>{" "}
          with a fixed price up front.
        </p>
      </Prose>

      <div className="my-8">
        <PerilexWizardCta lang="en" />
      </div>

      <PerilexWizardToggle lang="en" />
    </ServicePage>
  );
}
