import { createFileRoute, Link } from "@tanstack/react-router";

import { absoluteUrl, altLinks, pageMeta, privacyPolicySchema } from "@/lib/seo";
import { business, mailHref, telHref } from "@/lib/business";

const path = "/en-gb/privacy-policy";
const lastUpdated = "27 July 2026";

export const Route = createFileRoute("/en-gb/privacy-policy")({
  head: () => ({
    meta: [
      ...pageMeta({
        title: "Privacy Policy | VoltFix",
        description:
          "How VoltFix handles your personal data: what we process, why, how long we keep it and your rights under the GDPR.",
        path,
        ogType: "article",
        locale: "en",
      }),
      { name: "robots", content: "index,follow" },
    ],
    links: [
      { rel: "canonical", href: absoluteUrl(path) },
      ...altLinks("/privacybeleid"),
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          privacyPolicySchema({
            path,
            title: "Privacy Policy | VoltFix",
            description:
              "How VoltFix handles your personal data: what we process, why, how long we keep it and your rights under the GDPR.",
            locale: "en",
            dateModified: "2026-07-27",
          }),
        ),
      },
    ],
  }),
  component: PrivacyPage,
});

type Section = { id: string; title: string };

const sections: Section[] = [
  { id: "controller", title: "1. Who is the data controller?" },
  { id: "data", title: "2. What personal data do we process?" },
  { id: "sources", title: "3. How do we obtain your data?" },
  { id: "purposes", title: "4. Why and on which legal basis?" },
  { id: "sharing", title: "5. Who do we share personal data with?" },
  { id: "transfer", title: "6. Transfers outside the EEA" },
  { id: "retention", title: "7. How long do we keep data?" },
  { id: "cookies", title: "8. Cookies, Google Ads and analytics" },
  { id: "security", title: "9. Security" },
  { id: "automated", title: "10. Automated decision-making" },
  { id: "children", title: "11. Children" },
  { id: "rights", title: "12. Your rights" },
  { id: "changes", title: "13. Changes" },
];

function PrivacyPage() {
  return (
    <div className="bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <header className="mb-10 border-b border-border pb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Legal</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            VoltFix handles your personal data with care. This policy explains in plain language
            which data we process, why, and which rights you have under the EU General Data
            Protection Regulation (GDPR).
          </p>
          <p className="mt-4 text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
        </header>

        <nav
          aria-label="Table of contents"
          className="mb-12 rounded-2xl border border-border bg-muted/40 p-5"
        >
          <p className="mb-3 text-sm font-semibold text-foreground">Contents</p>
          <ol className="grid gap-1.5 text-sm sm:grid-cols-2">
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="text-primary underline-offset-4 hover:underline focus-visible:underline"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="prose prose-slate max-w-none prose-headings:scroll-mt-24 prose-headings:font-bold prose-headings:tracking-tight prose-h2:mt-12 prose-h2:text-2xl prose-h3:text-lg prose-a:text-primary prose-a:font-medium prose-a:underline-offset-4 hover:prose-a:underline prose-strong:text-foreground prose-table:text-sm">
          <h2 id="controller">1. Who is the data controller?</h2>
          <p>
            The data controller for personal data processed via this website and our services is{" "}
            <strong>{business.legalName}</strong>, trading as <strong>{business.name}</strong>.
          </p>
          <ul>
            <li>Chamber of Commerce (KvK) number: {business.kvk}</li>
            <li>VAT identification number: {business.btw}</li>
            <li>
              Registered business address: {business.registeredAddress.streetAddress},{" "}
              {business.registeredAddress.postalCode} {business.registeredAddress.city}, the
              Netherlands
            </li>
            <li>
              Visiting and service location: {business.streetAddress}, {business.postalCode}{" "}
              {business.city} — by appointment only
            </li>
            <li>
              Email: <a href={mailHref}>{business.email}</a>
            </li>
            <li>
              Phone: <a href={telHref}>{business.phoneDisplay}</a>
            </li>
            <li>
              Website:{" "}
              <a href={business.url} target="_blank" rel="noopener noreferrer">
                {business.domain}
              </a>
            </li>
          </ul>
          <p>
            Any questions about privacy? Email <a href={mailHref}>{business.email}</a>. We will
            respond in principle within one month.
          </p>

          <h2 id="data">2. What personal data do we process?</h2>
          <p>Depending on your contact with VoltFix, we may process, among others:</p>
          <ul>
            <li>Name</li>
            <li>Email address</li>
            <li>Phone number</li>
            <li>Postcode, address and location of the work</li>
            <li>Content of your request, quote enquiry or message</li>
            <li>Information about the desired work (job type, situation on site)</li>
            <li>Preferred date and availability for an appointment</li>
            <li>Photos or documents you send us (maximum 3 photos, 20 MB each)</li>
            <li>Communication via phone, email and WhatsApp</li>
            <li>Customer, order, invoice and payment status data</li>
            <li>IP address, device, browser and technical log data</li>
            <li>Cookie and analytics data (see section 8)</li>
          </ul>
          <p>
            VoltFix does not knowingly ask for special categories of personal data (such as
            health, religion or political opinion) or your BSN (Dutch citizen service number).
            Please do not send such information via the contact form or WhatsApp.
          </p>

          <h2 id="sources">3. How do we obtain your data?</h2>
          <p>
            We almost always receive your data directly from you: via the contact/quote form,
            phone, WhatsApp, email, or during an appointment or completed job. Technical data
            (such as IP address and browser) is collected automatically when you visit the
            website — for cookies and analytics, section 8 applies.
          </p>

          <h2 id="purposes">4. Why and on which legal basis?</h2>
          <div className="not-prose overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left">
                  <th className="p-3 font-semibold">Purpose</th>
                  <th className="p-3 font-semibold">Data</th>
                  <th className="p-3 font-semibold">GDPR legal basis</th>
                </tr>
              </thead>
              <tbody className="[&>tr]:border-b [&>tr]:border-border">
                <tr>
                  <td className="p-3 align-top">Responding to questions and quote requests</td>
                  <td className="p-3 align-top">Name, email, phone, postcode, job description, photos</td>
                  <td className="p-3 align-top">Necessary for pre-contractual steps</td>
                </tr>
                <tr>
                  <td className="p-3 align-top">Scheduling appointments and carrying out work</td>
                  <td className="p-3 align-top">Contact and address details, preferred time, job info</td>
                  <td className="p-3 align-top">Performance of the contract</td>
                </tr>
                <tr>
                  <td className="p-3 align-top">Contact about work, service and warranty</td>
                  <td className="p-3 align-top">Contact details, job information</td>
                  <td className="p-3 align-top">Performance of the contract and legitimate interest</td>
                </tr>
                <tr>
                  <td className="p-3 align-top">Quotes, worksheets, invoices and administration</td>
                  <td className="p-3 align-top">Name, address, job and invoice data</td>
                  <td className="p-3 align-top">Performance of the contract and legal obligation</td>
                </tr>
                <tr>
                  <td className="p-3 align-top">Security, abuse prevention and technical operation of the website</td>
                  <td className="p-3 align-top">IP address, technical log data</td>
                  <td className="p-3 align-top">Legitimate interest</td>
                </tr>
                <tr>
                  <td className="p-3 align-top">Analytics, ad measurement and remarketing (non-essential)</td>
                  <td className="p-3 align-top">Cookie and measurement data (see section 8)</td>
                  <td className="p-3 align-top">Consent</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            We do <em>not</em> use consent as the legal basis for the data we need to handle your
            request or perform a job — that processing is necessary. VoltFix does not currently
            send a commercial newsletter.
          </p>

          <h2 id="sharing">5. Who do we share personal data with?</h2>
          <p>
            VoltFix does not sell your data. We only share what is needed with parties that help
            us deliver our services and run our business. Our current setup involves the
            following:
          </p>
          <div className="not-prose overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left">
                  <th className="p-3 font-semibold">Provider</th>
                  <th className="p-3 font-semibold">Purpose</th>
                  <th className="p-3 font-semibold">Possible data</th>
                  <th className="p-3 font-semibold">Region</th>
                  <th className="p-3 font-semibold">Privacy statement</th>
                </tr>
              </thead>
              <tbody className="[&>tr]:border-b [&>tr]:border-border">
                <tr>
                  <td className="p-3 align-top">Lovable Cloud (Supabase)</td>
                  <td className="p-3 align-top">Database, storage of photo uploads and quote requests</td>
                  <td className="p-3 align-top">All form fields, photos, IP</td>
                  <td className="p-3 align-top">EU</td>
                  <td className="p-3 align-top">
                    <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">
                      supabase.com/privacy
                    </a>
                  </td>
                </tr>
                <tr>
                  <td className="p-3 align-top">Cloudflare</td>
                  <td className="p-3 align-top">Hosting, CDN, DDoS protection, technical logs</td>
                  <td className="p-3 align-top">IP address, request metadata</td>
                  <td className="p-3 align-top">Worldwide (EU edge)</td>
                  <td className="p-3 align-top">
                    <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer">
                      cloudflare.com/privacypolicy
                    </a>
                  </td>
                </tr>
                <tr>
                  <td className="p-3 align-top">Google (Analytics, Tag Manager, Ads)</td>
                  <td className="p-3 align-top">Measuring website use and ad effectiveness</td>
                  <td className="p-3 align-top">Cookie ID, IP (truncated), click and page events</td>
                  <td className="p-3 align-top">EU / US</td>
                  <td className="p-3 align-top">
                    <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
                      policies.google.com/privacy
                    </a>
                  </td>
                </tr>
                <tr>
                  <td className="p-3 align-top">WhatsApp / Meta</td>
                  <td className="p-3 align-top">Only if you contact us via WhatsApp yourself</td>
                  <td className="p-3 align-top">Phone number, message content</td>
                  <td className="p-3 align-top">EU / US</td>
                  <td className="p-3 align-top">
                    <a href="https://www.whatsapp.com/legal/privacy-policy-eea" target="_blank" rel="noopener noreferrer">
                      whatsapp.com/legal
                    </a>
                  </td>
                </tr>
                <tr>
                  <td className="p-3 align-top">Google Maps</td>
                  <td className="p-3 align-top">Map of our location and service area via link</td>
                  <td className="p-3 align-top">IP and device data (when opening the map)</td>
                  <td className="p-3 align-top">EU / US</td>
                  <td className="p-3 align-top">
                    <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
                      policies.google.com/privacy
                    </a>
                  </td>
                </tr>
                <tr>
                  <td className="p-3 align-top">Our electricians</td>
                  <td className="p-3 align-top">Carrying out the job on site</td>
                  <td className="p-3 align-top">Name, address, job description, contact details</td>
                  <td className="p-3 align-top">NL</td>
                  <td className="p-3 align-top">—</td>
                </tr>
                <tr>
                  <td className="p-3 align-top">Accountant / administration</td>
                  <td className="p-3 align-top">Invoicing and tax obligations</td>
                  <td className="p-3 align-top">Name, address, invoice data</td>
                  <td className="p-3 align-top">NL / EU</td>
                  <td className="p-3 align-top">—</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            If a legal obligation requires us to do so (for example a request from the Dutch tax
            authority or the judiciary), we may also share data with government authorities.
          </p>

          <h2 id="transfer">6. Transfers outside the EEA</h2>
          <p>
            Our database and hosting partners process data primarily within the European Economic
            Area (EEA). For some services (in particular Google and Meta/WhatsApp), data may also
            be processed outside the EEA, in particular in the United States. Those parties do so
            on the basis of safeguards approved by the European Commission, such as the{" "}
            <em>EU-U.S. Data Privacy Framework</em> adequacy decision and/or Standard
            Contractual Clauses (SCCs). For details, please refer to the privacy statements in
            the table above.
          </p>

          <h2 id="retention">7. How long do we keep data?</h2>
          <ul>
            <li>
              <strong>Unanswered or non-converted contact and quote requests:</strong> a maximum
              of 12 months after the last contact.
            </li>
            <li>
              <strong>Completed jobs (customer file):</strong> as long as necessary for service,
              warranty and possible claims, with a maximum of 7 years after completion (in line
              with the Dutch tax retention obligation).
            </li>
            <li>
              <strong>Invoices and tax administration:</strong> 7 years (article 52 AWR); longer
              if a specific statutory retention obligation applies.
            </li>
            <li>
              <strong>WhatsApp and email communication:</strong> no longer than necessary for
              the request, job or possible claims.
            </li>
            <li>
              <strong>Cookie and analytics data:</strong> in line with the standard retention
              period of the tool used (Google Analytics: up to 14 months).
            </li>
            <li>
              <strong>Technical server/hosting logs:</strong> a maximum of 30 days, unless needed
              for abuse investigation.
            </li>
          </ul>
          <p>
            Data is deleted or anonymised sooner as soon as it is no longer needed, unless a
            statutory retention obligation applies.
          </p>

          <h2 id="cookies">8. Cookies, Google Ads and analytics</h2>
          <p>The following cookies and scripts are currently loaded on this website:</p>
          <div className="not-prose overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left">
                  <th className="p-3 font-semibold">Cookie / storage</th>
                  <th className="p-3 font-semibold">Provider</th>
                  <th className="p-3 font-semibold">Category</th>
                  <th className="p-3 font-semibold">Purpose</th>
                  <th className="p-3 font-semibold">Retention</th>
                </tr>
              </thead>
              <tbody className="[&>tr]:border-b [&>tr]:border-border">
                <tr>
                  <td className="p-3 align-top">voltfix-lang (localStorage)</td>
                  <td className="p-3 align-top">VoltFix</td>
                  <td className="p-3 align-top">Functional</td>
                  <td className="p-3 align-top">Remembers your language preference (NL/EN)</td>
                  <td className="p-3 align-top">Until you clear it manually</td>
                </tr>
                <tr>
                  <td className="p-3 align-top">_ga, _ga_*</td>
                  <td className="p-3 align-top">Google Analytics 4</td>
                  <td className="p-3 align-top">Analytics</td>
                  <td className="p-3 align-top">Anonymous measurement of website use</td>
                  <td className="p-3 align-top">Up to 14 months</td>
                </tr>
                <tr>
                  <td className="p-3 align-top">_gcl_*, IDE, test_cookie</td>
                  <td className="p-3 align-top">Google Ads / Tag Manager</td>
                  <td className="p-3 align-top">Marketing</td>
                  <td className="p-3 align-top">Conversion measurement and remarketing for Google Ads</td>
                  <td className="p-3 align-top">Up to 13 months</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            <strong>Honest about the current status:</strong> Google Analytics and Google Tag
            Manager are currently loaded as soon as you open the website. We are working on a
            consent banner (Consent Mode v2) that will let you choose upfront between{" "}
            <em>accept all</em>, <em>essential only</em> and <em>manage preferences</em>, and
            withdraw your choice later. Until then, you can refuse cookies via your browser
            settings; this does not affect how the website or the form works.
          </p>

          <h2 id="security">9. Security</h2>
          <p>
            VoltFix takes appropriate technical and organisational measures to protect your data
            against loss, misuse, unauthorised access and unlawful modification. Concretely:
          </p>
          <ul>
            <li>Traffic with this website runs over HTTPS (TLS).</li>
            <li>
              Photo uploads are stored in a private bucket at our database provider; only VoltFix
              has access.
            </li>
            <li>
              Access to customer and job data is limited to staff who need it for their work.
            </li>
            <li>Form submissions are validated to prevent abuse and spam.</li>
          </ul>

          <h2 id="automated">10. Automated decision-making</h2>
          <p>
            VoltFix does not make decisions with significant consequences for individuals based
            solely on automated processing or profiling. Every quote and appointment is reviewed
            by a person.
          </p>

          <h2 id="children">11. Children</h2>
          <p>
            Our services and website are not directed at children under 16. We do not knowingly
            collect personal data from children. If you believe we have, please contact{" "}
            <a href={mailHref}>{business.email}</a> and we will delete the data.
          </p>

          <h2 id="rights">12. Your rights</h2>
          <p>Under the GDPR you have the following rights:</p>
          <ul>
            <li>Right of access to the data we process about you</li>
            <li>Right to rectification of inaccurate data</li>
            <li>Right to erasure ("right to be forgotten")</li>
            <li>Right to restriction of processing</li>
            <li>Right to object</li>
            <li>Right to data portability</li>
            <li>Right to withdraw consent you have given</li>
            <li>
              Right to lodge a complaint with the{" "}
              <a
                href="https://www.autoriteitpersoonsgegevens.nl/en"
                target="_blank"
                rel="noopener noreferrer"
              >
                Dutch Data Protection Authority (Autoriteit Persoonsgegevens)
              </a>
            </li>
          </ul>
          <p>
            Send your request to <a href={mailHref}>{business.email}</a>. We will respond in
            principle within one month. We do not routinely ask for a copy of your ID; if there
            is doubt about your identity, we may ask for additional information in a
            proportionate and secure way.
          </p>

          <h2 id="changes">13. Changes</h2>
          <p>
            This privacy policy may change when our services, the website or legislation change.
            The current version is always on this page; we update the date at the top on every
            substantive change.
          </p>
        </article>

        <div className="mt-12 border-t border-border pt-6 text-sm text-muted-foreground">
          Back to the{" "}
          <Link to="/en-gb" className="font-medium text-primary underline-offset-4 hover:underline">
            homepage
          </Link>
          .
        </div>
      </div>
    </div>
  );
}
