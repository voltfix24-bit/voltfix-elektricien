import { createFileRoute } from "@tanstack/react-router";

import heroImg from "@/assets/perilex.jpg";
import { ServicePage } from "@/components/service-page";
import { Prose } from "@/components/prose";
import { PerilexWizardToggle, PerilexWizardCta } from "@/components/perilex-wizard-toggle";
import { absoluteUrl, altLinks, breadcrumbSchema, faqSchema, ldScript, ogImage, serviceSchema } from "@/lib/seo";

const nlPath = "/perilex-amsterdam";
const enPath = "/en-gb/perilex-amsterdam";

const faqs = [
  {
    q: "What does connecting a perilex in Amsterdam cost?",
    a: "Connecting a perilex socket or cooker circuit starts at around €175. The price depends on the distance to the fuse box and whether a new circuit is needed. You get a fixed price up front.",
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
];

export const Route = createFileRoute("/en-gb/perilex-amsterdam")({
  head: () => ({
    meta: [
      { title: "Perilex Connection Amsterdam | Cooker Circuit | VoltFix" },
      {
        name: "description",
        content:
          "Perilex connection in Amsterdam for induction hobs or ranges. VoltFix installs cooker circuits and perilex sockets safely and expertly. From €175.",
      },
      { property: "og:title", content: "Perilex Connection Amsterdam | VoltFix" },
      {
        property: "og:description",
        content: "Cooker circuit and perilex socket for induction hobs and ranges. Safely connected.",
      },
      { property: "og:url", content: absoluteUrl(enPath) },
      { property: "og:type", content: "article" },
      { property: "og:image", content: ogImage },
      { name: "twitter:image", content: ogImage },
    ],
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
      eyebrow="Cooker circuit · from €175"
      title="Perilex connection Amsterdam"
      intro="New induction hob or range? VoltFix connects your perilex socket and cooker circuit safely in Amsterdam. Expertly, to standard, and matched to your appliance's power."
      image={heroImg}
      imageAlt="VoltFix electrician connecting a perilex for an induction hob in Amsterdam"
      whatsappMessage="Hi VoltFix, I'd like a perilex / cooker circuit connected in Amsterdam."
      faqs={faqs}
      priceTitle="Price indication perilex & cooker circuit"
      priceIntro="Indicative prices for connecting a perilex or cooker circuit in Amsterdam. You always get a fixed price up front."
      priceRows={[
        {
          title: "Perilex connection",
          price: "from €175",
          unit: "on existing circuit",
          points: ["2- or 3-phase", "Induction & range", "Safely connected"],
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
      <Prose>
        <p>
          Switching from gas to induction in Amsterdam, or installing a new range?
          You'll quickly face the question: which connection do I need? Powerful
          cooking appliances draw more current than a normal socket can safely
          supply. That's why a <strong>perilex connection or dedicated cooker
          circuit</strong> is often necessary. VoltFix installs these safely and
          expertly, so you can cook without worry.
        </p>

        <h2>What is a perilex connection?</h2>
        <p>
          A perilex is a five-pin plug and socket designed for high-power
          appliances such as electric ranges and heavy induction hobs. A perilex
          can use multiple phases at once, providing far more power than a standard
          wall socket. For induction cooking that matters: running several zones at
          full power easily draws 7,000 watts or more.
        </p>

        <h2>Cooker circuit or perilex — what do you need?</h2>
        <p>
          Not every induction hob needs the same connection. It depends on the
          connected load the manufacturer specifies:
        </p>
        <ul>
          <li>
            <strong>Light induction hob:</strong> sometimes runs on its own cooker
            circuit (a heavier-duty 230V circuit).
          </li>
          <li>
            <strong>Heavier induction hob:</strong> often requires a 2-phase
            perilex.
          </li>
          <li>
            <strong>Powerful range or large hob:</strong> may need a 3-phase
            connection.
          </li>
        </ul>
        <p>
          We check your appliance's rating plate and manual and advise which
          connection is safe and suitable. That prevents overload and tripping
          circuits.
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
          An incorrectly connected hob can cause overheating, tripping circuits or,
          in the worst case, fire. Having the connection done by a qualified
          electrician means everything is carried out to the NEN 1010 standard.
          VoltFix completes the work safely and provides a warranty, so you can
          enjoy your new kitchen worry-free. You get a fixed price up front.
        </p>
      </Prose>

      <PerilexWizardToggle lang="en" />
    </ServicePage>
  );
}
