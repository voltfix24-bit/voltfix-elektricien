import { createFileRoute, Link } from "@tanstack/react-router";

import monteurImg from "@/assets/voltfix-monteur.webp.asset.json";
import { emergencyCheckFaqs } from "@/components/emergency-flowchart";
import { EmergencyLandingPage } from "@/components/emergency-landing-page";
import { EnAreaLinks } from "@/components/en-area-links";
import { Prose } from "@/components/prose";
import { business } from "@/lib/business";
import {
  allInSublabelEn,
  firstHourAllInEn,
  firstHourNoteEn,
  prices,
  vatConsumerNoteEn,
} from "@/lib/pricing";
import {
  absoluteUrl,
  altLinks,
  breadcrumbSchema,
  faqSchema,
  ldScript,
  pageMeta,
  ratesSchema,
  serviceSchema,
  warrantySchema,
} from "@/lib/seo";

const nlPath = "/spoed-elektricien-amsterdam";
const enPath = "/en-gb/spoed-elektricien-amsterdam";

const faqs = [
  {
    q: "How fast can an emergency electrician reach me in Amsterdam?",
    a: "For emergencies, we are on site within 60 minutes across Amsterdam. You receive a realistic arrival time on the phone, depending on traffic and availability.",
  },
  {
    q: "Can I call an emergency electrician at night or at weekends?",
    a: `Yes. Our emergency service is available 24 hours a day, 7 days a week, including nights, weekends and public holidays. Call ${business.phoneDisplay} and speak directly to an electrician, not a call centre.`,
  },
  {
    q: "What should I do with a short circuit or tripped circuit?",
    a: "If there is danger, switch off the main switch, do not touch exposed wires and keep children and pets away. Unplug suspect appliances, then call VoltFix so we can trace and safely repair the fault.",
  },
  {
    q: "What does an emergency electrician in Amsterdam cost?",
    a: `During the day, the first hour is ${firstHourAllInEn(prices.emergencyFirstHour)}. Evenings, nights, weekends and public holidays are ${firstHourAllInEn(prices.offHoursFirstHour)}. ${allInSublabelEn.charAt(0).toUpperCase() + allInSublabelEn.slice(1)}. ${firstHourNoteEn} ${vatConsumerNoteEn}`,
  },
  {
    q: "Will I face extra costs if the fault takes longer?",
    a: "No. If more time or materials are needed, the electrician stops and tells you the extra cost first. We only continue with your approval.",
  },
  {
    q: "How can I pay?",
    a: "You can pay by card after the job or receive an invoice. You always receive an itemised invoice showing VAT.",
  },
  {
    q: "My whole street has no power. Can you help?",
    a: "If the fault is outside your fuse box, it is often the grid operator Liander. Check liander.nl/storingen or call 0800-9009 first. We repair faults within your own installation.",
  },
  {
    q: "Do you provide a warranty on emergency repairs?",
    a: "Yes. You receive a 12-month warranty on our work and a two-year manufacturer warranty on installed materials, including evening and weekend emergency repairs.",
  },
];

export const Route = createFileRoute("/en-gb/spoed-elektricien-amsterdam")({
  head: () => ({
    meta: pageMeta({
      title: "Emergency Electrician Amsterdam | Within 60 Minutes",
      description: `Power outage or short circuit? Call ${business.phoneDisplay}. VoltFix is available 24/7 and arrives within 60 minutes. €120/€145 first hour all-in.`,
      path: enPath,
      ogTitle: "Emergency Electrician Amsterdam | VoltFix",
      ogDescription: "24/7 emergency electrician in Amsterdam. On site within 60 minutes with a clear all-in price up front.",
      locale: "en",
    }),
    links: [{ rel: "canonical", href: absoluteUrl(enPath) }, { rel: "preload", as: "image", href: monteurImg.url, fetchPriority: "high" }, ...altLinks(nlPath)],
    scripts: [
      ldScript(serviceSchema({ name: "Emergency electrician Amsterdam", description: "24/7 emergency service for faults, short circuits, power outages and fuse box problems in Amsterdam.", path: enPath, locale: "en", emergency: true })),
      // Exact de zichtbare vragen in paginavolgorde: eerst de spoed-check,
      // daarna de FAQ. Geen automatisch toegevoegde extra vraag.
      ldScript(faqSchema([...emergencyCheckFaqs("en"), ...faqs], "en", enPath, false)),
      ldScript(ratesSchema(enPath)),
      ldScript(warrantySchema(enPath)),
      ldScript(breadcrumbSchema([{ name: "Home", path: "/en-gb" }, { name: "Emergency electrician Amsterdam", path: enPath }])),
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <EmergencyLandingPage path={enPath} image={monteurImg.url} imageAlt="VoltFix emergency electrician in Amsterdam with multimeter test leads, ready for a call-out" faqs={faqs}>
      <Prose>
        <p>
          An electrical fault always strikes at the worst moment. Without power, your home or business stops. VoltFix is your local emergency electrician in Amsterdam: you speak directly to an electrician, receive a clear assessment and, for emergencies, we arrive within 60 minutes.
        </p>

        <h2>When should you call an emergency electrician?</h2>
        <p>Call now when an electrical fault cannot safely wait until tomorrow:</p>
        <ul>
          <li><strong>A short circuit</strong> where the power keeps cutting out or a circuit will not stay on.</li>
          <li><strong>A complete power outage</strong> in your property while the neighbours still have power.</li>
          <li><strong>An RCD</strong> that trips again immediately after being reset.</li>
          <li><strong>A burning smell, sparks or a hot fuse box</strong> — switch off the main switch and call 112 first if you see fire.</li>
          <li><strong>Damaged cables or sockets</strong> after water damage or building work.</li>
        </ul>
        <p>Not sure whether it is urgent? Call us. We assess the risk by phone and explain what you can safely do until the electrician arrives.</p>

        <h2>Common faults in Amsterdam homes</h2>
        <p>
          In older properties, we regularly find ageing wiring, damp-related faults and overloaded circuits. In newer homes, the cause is more often a faulty appliance or an RCD that keeps tripping. We trace the cause, repair what can be made safe immediately and explain when follow-up work is sensible.
        </p>

        <h2>What can you safely check yourself?</h2>
        <p>
          First check whether your neighbours also lost power. For a street-wide outage, check Liander. If only your property is affected, unplug suspect appliances and never touch exposed or damaged wires. Can you smell burning or see smoke? Switch off the main switch, keep your distance and call 112 first if there is visible fire.
        </p>

        <h2>A lasting solution after the emergency</h2>
        <p>
          If the immediate fault is safe but the installation is outdated, we can discuss a lasting solution without pressure. This may include <Link to="/en-gb/groepenkast-amsterdam" className="font-medium text-primary underline underline-offset-4">replacing the fuse box</Link> or installing a safe <Link to="/en-gb/perilex-amsterdam" className="font-medium text-primary underline underline-offset-4">Perilex connection</Link>. Follow-up work only starts after a clear price agreement.
        </p>

        <EnAreaLinks currentPath={enPath} />
      </Prose>
    </EmergencyLandingPage>
  );
}