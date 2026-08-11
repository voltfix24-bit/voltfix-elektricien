import { createFileRoute } from "@tanstack/react-router";

import { CtaBand } from "@/components/cta-band";
import { ServiceFaq, type Faq } from "@/components/service-faq";
import { RatesTable } from "@/components/rates-table";
import { TechnicianByline } from "@/components/technician-byline";
import { business } from "@/lib/business";
import { prices, warranties, eurEn, perHourEn } from "@/lib/pricing";
import { absoluteUrl, altLinks, breadcrumbSchema, faqSchema, ldScript, pageMeta } from "@/lib/seo";

const nlPath = "/veelgestelde-vragen";
const enPath = "/en-gb/faq";

export const faqsEn: Faq[] = [
  {
    q: "How much does an electrician in Amsterdam cost?",
    a: `During office hours we charge ${perHourEn(prices.hourly)} (Mon–Fri 08:00–18:00), call-out within Amsterdam included. A fault call is ${eurEn(prices.emergencyFirstHour)} for the first hour all-in. In the evening, at night, at weekends and on public holidays it is ${eurEn(prices.offHoursFirstHour)} for the first hour. After that we bill per 15 minutes.`,
  },
  {
    q: "What does an emergency electrician cost at night or at the weekend?",
    a: `Outside office hours — evening, night, weekend and public holidays — the start rate is ${eurEn(prices.offHoursFirstHour)} for the first hour all-in. For an emergency during office hours you simply pay the normal fault rate of ${eurEn(prices.emergencyFirstHour)}, with no surcharge.`,
  },
  {
    q: "How quickly can VoltFix be on site?",
    a: "For emergencies we are on site within 60 minutes across Amsterdam. Call 24/7 for short circuits, power cuts or a fuse box that will not switch back on.",
  },
  {
    q: "What warranty does VoltFix provide?",
    a: `${warranties.en.sentence} ${warranties.en.startNote}`,
  },
  {
    q: "Which certifications do you hold?",
    a: "Our electrician Hassan has worked in electrical installation since 2010, is VCA-certified and trained as an Electrical Technician (MBO level 4, Deltion College). VoltFix works to NEN 1010 and NEN 3140 and is a registered, recognised training company.",
  },
  {
    q: "What does replacing a fuse box cost?",
    a: `Replacing a standard fuse box starts from ${eurEn(prices.groepenkastFrom)} including materials (range ${eurEn(prices.groepenkastFrom)}–${eurEn(prices.groepenkastTo)}) for up to three circuits with RCD protection. You always get a fixed price up front.`,
  },
  {
    q: "What does connecting a perilex or cooker circuit cost?",
    a: `A perilex connection starts from ${eurEn(prices.perilexFrom)}. If a new cooker circuit from the fuse box is needed, that starts from ${eurEn(prices.perilexWithNewGroupFrom)}, including materials and testing.`,
  },
  {
    q: "Can you install an EV charger?",
    a: `Yes. A 1-phase wallbox installation starts from ${eurEn(prices.laadpaal1PhaseFrom)} and 3-phase from ${eurEn(prices.laadpaal3PhaseFrom)}, including a dedicated circuit and NEN 1010 installation certificate.`,
  },
  {
    q: "What does an electrical inspection cost?",
    a: `A NEN 1010 handover inspection or NEN 3140 periodic inspection for a home, owners' association or business starts from ${eurEn(prices.keuringWoningFrom)}, including a digital report and certificate. A re-inspection starts from ${eurEn(prices.keuringHerkeuringFrom)}.`,
  },
  {
    q: "My RCD keeps tripping — what now?",
    a: "We test the installation circuit by circuit with professional measuring equipment. Common causes are moisture, a faulty appliance or outdated wiring. We fix the cause and then check the whole installation.",
  },
  {
    q: "Which areas do you cover?",
    a: "All of Amsterdam (Centre, Zuid, West, Oost, Noord, De Pijp, Jordaan, Watergraafsmeer, Zuidoost, IJburg) and the surrounding region: Amstelveen, Diemen, Ouder-Amstel, Zaandam and Haarlem.",
  },
  {
    q: "Do you speak English?",
    a: "Yes — our engineers help expats in English, by phone, WhatsApp and on site.",
  },
  {
    q: "Do I get a price up front?",
    a: "Yes. Fixed services get a fixed price up front. If a job runs over or extra materials are needed, the engineer stops and tells you the extra cost first — only then do we continue.",
  },
  {
    q: "How do I book an appointment?",
    a: `Call ${business.phoneDisplay}, send a WhatsApp message or request a quote through the contact form. For appointments within 48 hours, calling or WhatsApp is fastest.`,
  },
];

export const Route = createFileRoute("/en-gb/faq")({
  head: () => ({
    meta: pageMeta({
      title: "FAQ | Electrician Amsterdam — VoltFix",
      description:
        "Answers on rates, emergencies, warranty and certification. €90/hour office hours, €145 first hour evenings and weekends, 24/7 English-speaking.",
      path: enPath,
      locale: "en",
    }),
    links: [{ rel: "canonical", href: absoluteUrl(enPath) }, ...altLinks(nlPath)],
    scripts: [
      ldScript(faqSchema(faqsEn)),
      ldScript(
        breadcrumbSchema([
          { name: "Home", path: "/en-gb" },
          { name: "FAQ", path: enPath },
        ]),
      ),
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <>
      <section className="border-b border-border bg-primary text-primary-foreground">
        <div className="mx-auto max-w-3xl px-4 py-14 text-center">
          <h1 className="text-3xl font-bold text-balance text-white sm:text-4xl">
            Frequently asked questions about electricians in Amsterdam
          </h1>
          <p className="mt-4 text-lg text-white/85">
            Clear answers on rates, emergency call-outs, warranty and how we work — no small print.
          </p>
        </div>
      </section>

      <ServiceFaq faqs={faqsEn} title="All answers in one place" />

      <RatesTable />

      <TechnicianByline />

      <CtaBand
        title="Question not answered?"
        text="Call or WhatsApp us — you speak to an experienced electrician straight away."
        location="faq-hub"
      />
    </>
  );
}
