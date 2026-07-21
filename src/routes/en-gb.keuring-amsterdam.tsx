import { createFileRoute } from "@tanstack/react-router";

import heroImg from "@/assets/voltfix-keuring-scene.png";
import { ServicePage } from "@/components/service-page";
import { Prose } from "@/components/prose";
import { absoluteUrl, altLinks, breadcrumbSchema, faqSchema, ldScript, ogImage, serviceSchema, localeMeta } from "@/lib/seo";
import type { PriceRow } from "@/components/price-indicator";

const nlPath = "/keuring-amsterdam";
const enPath = "/en-gb/keuring-amsterdam";

const faqs = [
  {
    q: "What is a NEN 1010 inspection?",
    a: "A NEN 1010 inspection verifies that a new or modified electrical installation is safe and built to the Dutch standard. Insurers, landlords and municipalities regularly request this certificate.",
  },
  {
    q: "What is the difference between NEN 1010 and NEN 3140?",
    a: "NEN 1010 covers the design and delivery of new installations. NEN 3140 is the periodic inspection standard for existing installations and electrical work equipment in business environments.",
  },
  {
    q: "How often should my installation be inspected?",
    a: "For commercial premises a NEN 3140 inspection is typical every 3 to 5 years, depending on use and risk. For private homes an inspection is recommended when buying, letting or after renovation.",
  },
  {
    q: "How much does an electrical inspection cost in Amsterdam?",
    a: "A basic residential inspection starts around € 195. For business NEN 3140 inspections we provide a quote based on the number of circuits and pieces of equipment. You always receive a fixed price up front.",
  },
  {
    q: "What happens if issues are found?",
    a: "Each defect is documented with photos and we indicate the required repair. You decide whether VoltFix carries out the repair. After remediation the report is updated.",
  },
  {
    q: "Do I get an official inspection report?",
    a: "Yes. You receive a digital inspection report with all measurements, photos, findings and the certificate — suitable for insurers, landlords and health-and-safety purposes.",
  },
];

const priceRows: PriceRow[] = [
  {
    title: "Home inspection (NEN 1010)",
    price: "from € 195",
    unit: "installation up to 6 circuits",
    points: ["Full report", "Photos & measurements", "Digital certificate"],
  },
  {
    title: "Business inspection (NEN 3140)",
    price: "on quote",
    unit: "installation & equipment",
    points: ["Office / VvE / retail", "Periodic inspection", "Compliance report"],
    featured: true,
  },
  {
    title: "Re-inspection after repair",
    price: "from € 95",
    unit: "follow-up inspection",
    points: ["Report update", "Certificate refreshed", "Scheduled quickly"],
  },
];

export const Route = createFileRoute("/en-gb/keuring-amsterdam")({
  head: () => ({
    meta: [
      { title: "Electrical Inspection Amsterdam | NEN 1010 & NEN 3140 | VoltFix" },
      {
        name: "description",
        content:
          "NEN 1010 and NEN 3140 electrical inspection in Amsterdam. Official report for insurer, landlord or VvE. Fixed price from € 195, scheduled quickly.",
      },
      { property: "og:title", content: "Electrical Inspection Amsterdam | VoltFix" },
      {
        property: "og:description",
        content: "NEN 1010 & NEN 3140 inspection with certificate — home, VvE and business in Amsterdam.",
      },
      { property: "og:url", content: absoluteUrl(enPath) },
      ...localeMeta("en"),
      { property: "og:type", content: "article" },
      { property: "og:image", content: ogImage },
      { name: "twitter:image", content: ogImage },
    ],
    links: [{ rel: "canonical", href: absoluteUrl(enPath) }, ...altLinks(nlPath)],
    scripts: [
      ldScript(
        serviceSchema({
          name: "Electrical inspection Amsterdam (NEN 1010 / NEN 3140)",
          description:
            "Inspection and certification of electrical installations in Amsterdam to NEN 1010 (new installations) and NEN 3140 (periodic / business), including digital certificate.",
          path: enPath,
        }),
      ),
      ldScript(faqSchema(faqs)),
      ldScript(
        breadcrumbSchema([
          { name: "Home", path: "/en-gb" },
          { name: "Electrical inspection Amsterdam", path: enPath },
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
      eyebrow="NEN 1010 & NEN 3140"
      title="Electrical inspection in Amsterdam"
      intro="Certainty about your electrical installation. VoltFix carries out NEN 1010 and NEN 3140 inspections for homes, VvE's and businesses across Amsterdam — with an official report and digital certificate."
      image={heroImg}
      imageAlt="VoltFix inspector measures a fuse box and fills in a NEN inspection report at an Amsterdam home"
      whatsappMessage="Hi VoltFix, I would like a NEN inspection of my electrical installation in Amsterdam."
      faqs={faqs}
      priceRows={priceRows}
      priceTitle="Inspection price indication"
      priceIntro="Indicative prices for NEN 1010 and NEN 3140 inspections in Amsterdam, including a digital report."
    >
      <Prose>
        <p>
          An electrical installation is only safe when you can prove it. Insurers,
          landlords, VvE's and municipalities increasingly ask for a valid{" "}
          <strong>inspection report to NEN 1010 or NEN 3140</strong>. VoltFix
          carries out these inspections across Amsterdam — expertly, independently
          and with a clear digital certificate.
        </p>

        <h2>NEN 1010: new build & delivery</h2>
        <p>
          NEN 1010 is the standard for the design of new electrical
          installations. After a renovation, new build or fuse box upgrade the
          installation is inspected. We measure insulation resistance, earthing,
          continuity and the operation of every RCD, and issue an{" "}
          <strong>NEN 1010 inspection certificate</strong>.
        </p>

        <h2>NEN 3140: periodic inspection</h2>
        <p>
          NEN 3140 is the standard for the <strong>periodic inspection</strong>{" "}
          of existing installations and work equipment in business settings.
          Under Dutch Arbo law employers are required to have these inspections
          done periodically. We inspect both the fixed installation and your
          electrical equipment (extension leads, tools, office kit) and deliver
          a complete report.
        </p>

        <h2>When should you get an inspection?</h2>
        <ul>
          <li>When buying, selling or letting a home or building.</li>
          <li>After a renovation or fuse box replacement.</li>
          <li>At the request of your insurer or mortgage lender.</li>
          <li>Periodically for commercial premises, VvE's and care facilities.</li>
          <li>When you're unsure about the safety of wiring or RCD protection.</li>
        </ul>

        <h2>How a VoltFix inspection works</h2>
        <ol>
          <li><strong>Visual inspection</strong> — fuse box, wiring, sockets
            and earthing.</li>
          <li><strong>Measurements</strong> — insulation resistance, earth
            resistance, short-circuit current and every RCD.</li>
          <li><strong>Report</strong> — all findings with photos,
            measurements and recommended remediation.</li>
          <li><strong>Certificate</strong> — digital, ready to share with
            insurer or VvE.</li>
        </ol>

        <h2>Why VoltFix?</h2>
        <p>
          Our inspectors know Amsterdam's building stock — from listed canal
          houses with outdated wiring to modern apartments on IJburg. We inspect
          independently and clearly: you know exactly what is fine, what can be
          improved and what must be fixed immediately. Choosing VoltFix for the
          repair is optional.
        </p>
      </Prose>
    </ServicePage>
  );
}
