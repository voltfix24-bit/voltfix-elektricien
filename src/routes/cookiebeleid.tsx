import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

import { absoluteUrl, altLinks, cookieFaqSchema, cookiePolicySchema, pageMeta } from "@/lib/seo";
import { business, mailHref } from "@/lib/business";
import { openConsentPreferences } from "@/lib/consent";
import { useTrackConsent } from "@/lib/analytics";


const path = "/cookiebeleid";
const lastUpdated = "1 augustus 2026";
const lastUpdatedISO = "2026-08-01";
const pageTitle = "Cookiebeleid | VoltFix";
const pageDescription =
  "Welke cookies gebruikt VoltFix, waarom en hoe pas je jouw toestemming aan? Volledig overzicht van functionele, analyse- en marketingcookies.";

export const Route = createFileRoute("/cookiebeleid")({
  head: () => ({
    meta: [
      ...pageMeta({
        title: pageTitle,
        description: pageDescription,
        path,
        ogType: "article",
        locale: "nl",
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
            locale: "nl",
            dateModified: lastUpdatedISO,
          }),
        ),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(cookieFaqSchema("nl")),
      },
    ],
  }),
  component: CookiePage,
});

function CookiePage() {
  const trackC = useTrackConsent();
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#instellingen") {
      trackC("open_settings", "cookie_policy");
      openConsentPreferences();
    }
  }, [trackC]);
  return (
    <div className="bg-background">

      <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <header className="mb-10 border-b border-border pb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Juridisch</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Cookiebeleid
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            VoltFix gebruikt cookies om de website goed te laten werken, om te meten hoe bezoekers
            de site gebruiken en — met jouw toestemming — om advertenties te meten. Op deze pagina
            lees je welke cookies dat zijn en hoe je jouw keuze aanpast.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">Laatst bijgewerkt: {lastUpdated}</p>
        </header>

        <article className="prose prose-slate max-w-none prose-headings:scroll-mt-24 prose-headings:font-bold prose-headings:tracking-tight prose-h2:mt-12 prose-h2:text-2xl prose-a:text-primary prose-a:font-medium prose-a:underline-offset-4 hover:prose-a:underline prose-strong:text-foreground prose-table:text-sm">
          <h2>1. Wat zijn cookies?</h2>
          <p>
            Cookies zijn kleine tekstbestanden die door je browser worden opgeslagen wanneer je een
            website bezoekt. Naast cookies gebruiken we ook vergelijkbare technieken zoals
            localStorage. In deze verklaring bedoelen we met "cookies" al deze technieken.
          </p>

          <h2>2. Categorieën cookies</h2>
          <p>We onderscheiden drie categorieën:</p>
          <ul>
            <li>
              <strong>Noodzakelijk</strong> — nodig voor de basiswerking van de website (bijv. het
              onthouden van je taalvoorkeur en het opslaan van je cookiekeuze). Deze cookies staan
              altijd aan.
            </li>
            <li>
              <strong>Analyse</strong> — helpen ons meten hoe de website wordt gebruikt zodat we
              hem kunnen verbeteren. Geplaatst na jouw toestemming.
            </li>
            <li>
              <strong>Marketing</strong> — meten de effectiviteit van advertenties (Google Ads) en
              maken remarketing mogelijk. Geplaatst na jouw toestemming.
            </li>
          </ul>

          <h2>3. Welke cookies plaatsen we?</h2>
          <div className="not-prose overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left">
                  <th className="p-3 font-semibold">Naam</th>
                  <th className="p-3 font-semibold">Provider</th>
                  <th className="p-3 font-semibold">Categorie</th>
                  <th className="p-3 font-semibold">Doel</th>
                  <th className="p-3 font-semibold">Bewaartermijn</th>
                </tr>
              </thead>
              <tbody className="[&>tr]:border-b [&>tr]:border-border">
                <tr>
                  <td className="p-3 align-top">voltfix.lang (localStorage)</td>
                  <td className="p-3 align-top">VoltFix</td>
                  <td className="p-3 align-top">Noodzakelijk</td>
                  <td className="p-3 align-top">Onthouden van taalvoorkeur (NL/EN)</td>
                  <td className="p-3 align-top">Totdat je het handmatig wist</td>
                </tr>
                <tr>
                  <td className="p-3 align-top">voltfix.consent (localStorage)</td>
                  <td className="p-3 align-top">VoltFix</td>
                  <td className="p-3 align-top">Noodzakelijk</td>
                  <td className="p-3 align-top">Onthouden van jouw cookiekeuze</td>
                  <td className="p-3 align-top">Totdat je het handmatig wist</td>
                </tr>
                <tr>
                  <td className="p-3 align-top">_ga, _ga_*</td>
                  <td className="p-3 align-top">Google Analytics 4</td>
                  <td className="p-3 align-top">Analyse</td>
                  <td className="p-3 align-top">Anoniem meten van websitegebruik</td>
                  <td className="p-3 align-top">Tot 14 maanden</td>
                </tr>
                <tr>
                  <td className="p-3 align-top">_gcl_*</td>
                  <td className="p-3 align-top">Google Ads / Tag Manager</td>
                  <td className="p-3 align-top">Marketing</td>
                  <td className="p-3 align-top">Conversiemeting voor Google Ads</td>
                  <td className="p-3 align-top">Tot 90 dagen</td>
                </tr>
                <tr>
                  <td className="p-3 align-top">IDE, test_cookie</td>
                  <td className="p-3 align-top">Google (doubleclick.net)</td>
                  <td className="p-3 align-top">Marketing</td>
                  <td className="p-3 align-top">Remarketing en advertentie-personalisatie</td>
                  <td className="p-3 align-top">Tot 13 maanden</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>4. Toestemming en Consent Mode v2</h2>
          <p>
            Bij je eerste bezoek zie je een cookie-banner waarmee je kunt kiezen tussen{" "}
            <em>alles accepteren</em>, <em>alleen noodzakelijk</em> of <em>instellingen</em>{" "}
            (analyse en marketing apart). Analyse- en marketingcookies worden pas geplaatst
            nadat je toestemming hebt gegeven. We gebruiken Google Consent Mode v2, zodat Google
            Analytics en Google Ads jouw keuze automatisch respecteren.
          </p>

          <h2 id="instellingen">5. Toestemming aanpassen of intrekken</h2>
          <p>
            Je kunt je keuze op elk moment wijzigen of intrekken via de knop hieronder. Ook via
            de link <em>Cookie-instellingen</em> onderaan iedere pagina.
          </p>
          <p className="not-prose">
            <button
              type="button"
              onClick={() => {
                trackC("open_settings", "cookie_policy");
                openConsentPreferences();
              }}
              className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Cookie-instellingen openen
            </button>
          </p>
          <p>
            Cookies kun je daarnaast beheren of verwijderen via de instellingen van je browser
            (Chrome, Safari, Firefox, Edge). Het uitzetten van functionele cookies kan invloed
            hebben op het gedrag van de website.
          </p>

          <h2>6. Meer informatie</h2>
          <p>
            Meer over hoe VoltFix omgaat met persoonsgegevens lees je in ons{" "}
            <Link to="/privacybeleid">privacybeleid</Link>. Vragen? Mail{" "}
            <a href={mailHref}>{business.email}</a>.
          </p>
        </article>

        <div className="mt-12 border-t border-border pt-6 text-sm text-muted-foreground">
          Terug naar de{" "}
          <Link to="/" className="font-medium text-primary underline-offset-4 hover:underline">
            homepage
          </Link>
          .
        </div>
      </div>
    </div>
  );
}
