import { createFileRoute, Link } from "@tanstack/react-router";

import { absoluteUrl, altLinks, cookieFaqSchema, cookiePolicySchema, pageMeta } from "@/lib/seo";
import { business, mailHref } from "@/lib/business";
import { openConsentPreferences } from "@/lib/consent";

const path = "/en-gb/cookie-policy";
const lastUpdated = "1 August 2026";
const lastUpdatedISO = "2026-08-01";
const pageTitle = "Cookie Policy | VoltFix";
const pageDescription =
  "Which cookies does VoltFix use, why, and how do you change your consent? Full overview of necessary, analytics and marketing cookies.";

export const Route = createFileRoute("/en-gb/cookie-policy")({
  head: () => ({
    meta: [
      ...pageMeta({
        title: pageTitle,
        description: pageDescription,
        path,
        ogType: "article",
        locale: "en",
      }),
      { name: "robots", content: "index,follow" },
    ],
    links: [{ rel: "canonical", href: absoluteUrl(path) }, ...altLinks("/cookiebeleid")],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          cookiePolicySchema({
            path,
            title: pageTitle,
            description: pageDescription,
            locale: "en",
            dateModified: lastUpdatedISO,
          }),
        ),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(cookieFaqSchema("en")),
      },
    ],
  }),
  component: CookiePage,
});

function CookiePage() {
  return (
    <div className="bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <header className="mb-10 border-b border-border pb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Legal</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Cookie Policy
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            VoltFix uses cookies to make the website work, to measure how visitors use the site
            and — with your consent — to measure ads. This page explains which cookies we use and
            how to change your choice.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
        </header>

        <article className="prose prose-slate max-w-none prose-headings:scroll-mt-24 prose-headings:font-bold prose-headings:tracking-tight prose-h2:mt-12 prose-h2:text-2xl prose-a:text-primary prose-a:font-medium prose-a:underline-offset-4 hover:prose-a:underline prose-strong:text-foreground prose-table:text-sm">
          <h2>1. What are cookies?</h2>
          <p>
            Cookies are small text files your browser stores when you visit a website. We also
            use similar technologies such as localStorage. In this policy, "cookies" covers all
            of these.
          </p>

          <h2>2. Categories of cookies</h2>
          <ul>
            <li>
              <strong>Necessary</strong> — required for the basic operation of the website (e.g.
              remembering your language preference and cookie choice). Always on.
            </li>
            <li>
              <strong>Analytics</strong> — help us measure how the website is used so we can
              improve it. Only placed after your consent.
            </li>
            <li>
              <strong>Marketing</strong> — measure the effectiveness of ads (Google Ads) and
              enable remarketing. Only placed after your consent.
            </li>
          </ul>

          <h2>3. Which cookies do we set?</h2>
          <div className="not-prose overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left">
                  <th className="p-3 font-semibold">Name</th>
                  <th className="p-3 font-semibold">Provider</th>
                  <th className="p-3 font-semibold">Category</th>
                  <th className="p-3 font-semibold">Purpose</th>
                  <th className="p-3 font-semibold">Retention</th>
                </tr>
              </thead>
              <tbody className="[&>tr]:border-b [&>tr]:border-border">
                <tr>
                  <td className="p-3 align-top">voltfix.lang (localStorage)</td>
                  <td className="p-3 align-top">VoltFix</td>
                  <td className="p-3 align-top">Necessary</td>
                  <td className="p-3 align-top">Remember language preference (NL/EN)</td>
                  <td className="p-3 align-top">Until you clear it manually</td>
                </tr>
                <tr>
                  <td className="p-3 align-top">voltfix.consent (localStorage)</td>
                  <td className="p-3 align-top">VoltFix</td>
                  <td className="p-3 align-top">Necessary</td>
                  <td className="p-3 align-top">Remember your cookie choice</td>
                  <td className="p-3 align-top">Until you clear it manually</td>
                </tr>
                <tr>
                  <td className="p-3 align-top">_ga, _ga_*</td>
                  <td className="p-3 align-top">Google Analytics 4</td>
                  <td className="p-3 align-top">Analytics</td>
                  <td className="p-3 align-top">Anonymous measurement of site usage</td>
                  <td className="p-3 align-top">Up to 14 months</td>
                </tr>
                <tr>
                  <td className="p-3 align-top">_gcl_*</td>
                  <td className="p-3 align-top">Google Ads / Tag Manager</td>
                  <td className="p-3 align-top">Marketing</td>
                  <td className="p-3 align-top">Conversion tracking for Google Ads</td>
                  <td className="p-3 align-top">Up to 90 days</td>
                </tr>
                <tr>
                  <td className="p-3 align-top">IDE, test_cookie</td>
                  <td className="p-3 align-top">Google (doubleclick.net)</td>
                  <td className="p-3 align-top">Marketing</td>
                  <td className="p-3 align-top">Remarketing and ad personalisation</td>
                  <td className="p-3 align-top">Up to 13 months</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>4. Consent and Consent Mode v2</h2>
          <p>
            On your first visit you'll see a cookie banner where you can choose{" "}
            <em>accept all</em>, <em>only necessary</em> or <em>settings</em> (analytics and
            marketing separately). Analytics and marketing cookies are only placed after your
            consent. We use Google Consent Mode v2 so Google Analytics and Google Ads
            automatically respect your choice.
          </p>

          <h2>5. Changing or withdrawing consent</h2>
          <p>
            You can change or withdraw your choice at any time using the button below or via the{" "}
            <em>Cookie settings</em> link at the bottom of every page.
          </p>
          <p className="not-prose">
            <button
              type="button"
              onClick={openConsentPreferences}
              className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Open cookie settings
            </button>
          </p>
          <p>
            You can also manage or delete cookies in your browser settings (Chrome, Safari,
            Firefox, Edge). Turning off functional cookies may affect how the website behaves.
          </p>

          <h2>6. More information</h2>
          <p>
            For more on how VoltFix handles personal data, see our{" "}
            <Link to="/en-gb/privacy-policy">privacy policy</Link>. Questions? Email{" "}
            <a href={mailHref}>{business.email}</a>.
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
