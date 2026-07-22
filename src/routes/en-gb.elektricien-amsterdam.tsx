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
  ogImage,
  serviceSchema,
  pageMeta,
} from "@/lib/seo";

const nlPath = "/elektricien-amsterdam";
const enPath = "/en-gb/elektricien-amsterdam";

const faqs = [
  {
    q: "How fast can an electrician reach me in Amsterdam?",
    a: "For emergencies such as a fault or short circuit we're often on site within 30 to 60 minutes in Amsterdam. For planned work we usually schedule within a few working days.",
  },
  {
    q: "Do you have an emergency electrician in Amsterdam?",
    a: "Yes, our emergency service is available 24/7, including evenings, weekends and public holidays. Call us and we'll come as quickly as possible.",
  },
  {
    q: "What does an electrician in Amsterdam cost?",
    a: "We work with transparent rates and a fixed price agreed up front. We discuss the call-out fee and hourly rate straight away, so there are no surprises.",
  },
  {
    q: "What jobs does VoltFix handle?",
    a: "From faults and short circuits to fuse box replacement, perilex connections, extra sockets, lighting and complete installations — for homes and businesses across Amsterdam.",
  },
  {
    q: "Are you certified and do you give a warranty?",
    a: "Our electricians are fully qualified and work to the NEN 1010 standard. We provide a warranty on completed work and installed materials.",
  },
  {
    q: "Do you speak English?",
    a: "Yes. We help many expats in Amsterdam and are happy to handle your job entirely in English, from quote to completion.",
  },
];

export const Route = createFileRoute("/en-gb/elektricien-amsterdam")({
  head: () => ({
    meta: pageMeta({
      title: "Electrician Amsterdam | Fast & Local | VoltFix",
      description:
        "Need an electrician in Amsterdam? VoltFix is fast on site, local and available 24/7 for emergencies. English-speaking. Fixed price up front. Call now.",
      path: enPath,
      ogTitle: "Electrician Amsterdam | VoltFix",
      ogDescription: "Fast, reliable and local. 24/7 emergency electrician across Amsterdam.",
      locale: "en",
    }),
    links: [{ rel: "canonical", href: absoluteUrl(enPath) }, ...altLinks(nlPath)],
    scripts: [
      ldScript(
        serviceSchema({
          name: "Electrician Amsterdam",
          description:
            "Local electrician in Amsterdam for emergencies, faults, fuse boxes and all electrical installations. English-speaking.",
          path: enPath,
        }),
      ),
      ldScript(faqSchema(faqs)),
      ldScript(
        breadcrumbSchema([
          { name: "Home", path: enPath.replace("/elektricien-amsterdam", "") },
          { name: "Electrician Amsterdam", path: enPath },
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
      eyebrow="24/7 emergency service in Amsterdam"
      title="Electrician Amsterdam"
      intro="Looking for a reliable, English-speaking electrician in Amsterdam? VoltFix is fast on site for faults and emergencies, and expert with installations. Always a fixed price up front."
      image={heroImg.url}
      imageAlt="VoltFix electrician at work in an Amsterdam home"
      whatsappMessage="Hi VoltFix, I'm looking for an electrician in Amsterdam."
      faqs={faqs}
    >
      <Prose>
        <p>
          Finding a good <strong>electrician in Amsterdam</strong> who responds fast, communicates
          honestly and delivers quality work — that's what VoltFix stands for. Whether it's an acute
          fault, a new fuse box or extra sockets, we help you safely and with a fixed price agreed
          up front. We work in English, so expats can rely on us too.
        </p>

        <h2>Emergency electrician in Amsterdam</h2>
        <p>
          No power or a short circuit? Our <strong>emergency electrician</strong> is available 24/7
          — including evenings, weekends and public holidays. For emergencies we're often on site
          within 30 to 60 minutes in Amsterdam to trace the cause and get your power safely back on.
        </p>

        <h2>What can you call us for?</h2>
        <ul>
          <li>Fixing faults, short circuits and power outages</li>
          <li>Replacing or extending your fuse box with extra circuits</li>
          <li>Connecting perilex and cooker circuits for induction or ranges</li>
          <li>Extra sockets, switches and lighting</li>
          <li>RCDs and safety inspections</li>
          <li>Complete electrical installations for home and business</li>
        </ul>

        <h2>Local and fast across Amsterdam</h2>
        <p>
          We know the city, its buildings and Amsterdam's fuse boxes — from the canal houses in the
          centre to the apartments on IJburg. That means we reach you quickly and know exactly what
          to look out for in both older and newer homes.
        </p>

        <h2>Transparent rates and a warranty</h2>
        <p>
          You always get a fixed price agreed up front, so you're never faced with surprises. All
          our work is carried out to the NEN 1010 standard and we provide a warranty on completed
          work and installed materials. Call us or send a WhatsApp with your question and address in
          Amsterdam, and we'll take it from there.
        </p>
      </Prose>
      <EnAreaLinks currentPath={enPath} />
    </ServicePage>
  );
}
