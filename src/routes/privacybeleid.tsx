import { createFileRoute, Link } from "@tanstack/react-router";

import { absoluteUrl, pageMeta } from "@/lib/seo";
import { business, mailHref, telHref } from "@/lib/business";

const path = "/privacybeleid";
const lastUpdated = "27 juli 2026";

export const Route = createFileRoute("/privacybeleid")({
  head: () => ({
    meta: [
      ...pageMeta({
        title: "Privacybeleid | VoltFix",
        description:
          "Zo gaat VoltFix om met je persoonsgegevens: welke gegevens we verwerken, waarom, hoe lang en welke rechten je hebt onder de AVG.",
        path,
        ogType: "article",
        locale: "nl",
      }),
      { name: "robots", content: "index,follow" },
    ],
    links: [{ rel: "canonical", href: absoluteUrl(path) }],
  }),
  component: PrivacyPage,
});

type Section = { id: string; title: string };

const sections: Section[] = [
  { id: "verantwoordelijk", title: "1. Wie is verantwoordelijk?" },
  { id: "gegevens", title: "2. Welke persoonsgegevens verwerken we?" },
  { id: "herkomst", title: "3. Hoe verkrijgen we de gegevens?" },
  { id: "doelen", title: "4. Waarom verwerken we gegevens en op welke grondslag?" },
  { id: "delen", title: "5. Met wie delen we persoonsgegevens?" },
  { id: "doorgifte", title: "6. Doorgifte buiten de EER" },
  { id: "bewaartermijnen", title: "7. Hoe lang bewaren we gegevens?" },
  { id: "cookies", title: "8. Cookies, Google Ads en analyse" },
  { id: "beveiliging", title: "9. Beveiliging" },
  { id: "geautomatiseerd", title: "10. Geautomatiseerde besluitvorming" },
  { id: "kinderen", title: "11. Kinderen" },
  { id: "rechten", title: "12. Jouw rechten" },
  { id: "wijzigingen", title: "13. Wijzigingen" },
];

function PrivacyPage() {
  return (
    <div className="bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <header className="mb-10 border-b border-border pb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Juridisch
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Privacybeleid
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            VoltFix gaat zorgvuldig om met je persoonsgegevens. In dit privacybeleid leggen we in
            duidelijke taal uit welke gegevens we verwerken, waarom we dat doen en welke rechten
            je hebt.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Laatst bijgewerkt: {lastUpdated}
          </p>
        </header>

        <nav
          aria-label="Inhoudsopgave"
          className="mb-12 rounded-2xl border border-border bg-muted/40 p-5"
        >
          <p className="mb-3 text-sm font-semibold text-foreground">Inhoudsopgave</p>
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
          <h2 id="verantwoordelijk">1. Wie is verantwoordelijk?</h2>
          <p>
            Verwerkingsverantwoordelijke voor de persoonsgegevens die via deze website en onze
            dienstverlening worden verwerkt, is <strong>{business.legalName}</strong>, handelend
            onder de naam <strong>{business.name}</strong>.
          </p>
          <ul>
            <li>KvK-nummer: {business.kvk}</li>
            <li>BTW-identificatienummer: {business.btw}</li>
            <li>
              Geregistreerd bedrijfsadres: {business.registeredAddress.streetAddress},{" "}
              {business.registeredAddress.postalCode} {business.registeredAddress.city}
            </li>
            <li>
              Bezoek- en servicelocatie: {business.streetAddress}, {business.postalCode}{" "}
              {business.city} — alleen op afspraak
            </li>
            <li>
              E-mail: <a href={mailHref}>{business.email}</a>
            </li>
            <li>
              Telefoon: <a href={telHref}>{business.phoneDisplay}</a>
            </li>
            <li>
              Website:{" "}
              <a href={business.url} target="_blank" rel="noopener noreferrer">
                {business.domain}
              </a>
            </li>
          </ul>
          <p>
            Vragen over privacy? Mail <a href={mailHref}>{business.email}</a>. We reageren in
            beginsel binnen één maand.
          </p>


          <h2 id="gegevens">2. Welke persoonsgegevens verwerken we?</h2>
          <p>Afhankelijk van je contact met VoltFix kunnen we onder andere verwerken:</p>
          <ul>
            <li>Naam</li>
            <li>E-mailadres</li>
            <li>Telefoonnummer</li>
            <li>Postcode, adres en locatie van de werkzaamheden</li>
            <li>Inhoud van je aanvraag, offerteverzoek of bericht</li>
            <li>Informatie over de gewenste werkzaamheden (type klus, situatie ter plaatse)</li>
            <li>Voorkeursdatum en beschikbaarheid voor een afspraak</li>
            <li>Foto's of documenten die je zelf meestuurt (maximaal 3 foto's, 20 MB per stuk)</li>
            <li>Communicatie via telefoon, e-mail en WhatsApp</li>
            <li>Klant-, opdracht-, factuur- en betaalstatusgegevens</li>
            <li>IP-adres, apparaat-, browser- en technische loggegevens</li>
            <li>Cookie- en analysegegevens (zie sectie 8)</li>
          </ul>
          <p>
            VoltFix vraagt niet bewust om bijzondere persoonsgegevens (zoals gezondheid, religie
            of politieke voorkeur) of om je BSN. Stuur deze informatie niet mee via het
            contactformulier of WhatsApp.
          </p>

          <h2 id="herkomst">3. Hoe verkrijgen we de gegevens?</h2>
          <p>
            We ontvangen je gegevens vrijwel altijd rechtstreeks van jou: via het
            contact-/offerteformulier, telefoon, WhatsApp, e-mail, of tijdens een afspraak of
            uitgevoerde opdracht. Technische gegevens (zoals IP-adres en browser) worden
            automatisch verzameld wanneer je de website bezoekt — voor cookies en analyse geldt
            wat in sectie 8 staat.
          </p>

          <h2 id="doelen">4. Waarom verwerken we gegevens en op welke grondslag?</h2>
          <div className="not-prose overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left">
                  <th className="p-3 font-semibold">Doel</th>
                  <th className="p-3 font-semibold">Gegevens</th>
                  <th className="p-3 font-semibold">AVG-grondslag</th>
                </tr>
              </thead>
              <tbody className="[&>tr]:border-b [&>tr]:border-border">
                <tr>
                  <td className="p-3 align-top">Reageren op vragen en offerteaanvragen</td>
                  <td className="p-3 align-top">Naam, e-mail, telefoon, postcode, klusomschrijving, foto's</td>
                  <td className="p-3 align-top">Noodzakelijk voor stappen vóór een overeenkomst</td>
                </tr>
                <tr>
                  <td className="p-3 align-top">Afspraken plannen en werkzaamheden uitvoeren</td>
                  <td className="p-3 align-top">Contact- en adresgegevens, voorkeursmoment, klusinformatie</td>
                  <td className="p-3 align-top">Uitvoering van de overeenkomst</td>
                </tr>
                <tr>
                  <td className="p-3 align-top">Contact over werk, service en garantie</td>
                  <td className="p-3 align-top">Contactgegevens, opdrachtinformatie</td>
                  <td className="p-3 align-top">Uitvoering overeenkomst en gerechtvaardigd belang</td>
                </tr>
                <tr>
                  <td className="p-3 align-top">Offertes, werkbonnen, facturen en administratie</td>
                  <td className="p-3 align-top">NAW, opdracht- en factuurgegevens</td>
                  <td className="p-3 align-top">Uitvoering overeenkomst en wettelijke verplichting</td>
                </tr>
                <tr>
                  <td className="p-3 align-top">Beveiliging, misbruikpreventie en technische werking website</td>
                  <td className="p-3 align-top">IP-adres, technische loggegevens</td>
                  <td className="p-3 align-top">Gerechtvaardigd belang</td>
                </tr>
                <tr>
                  <td className="p-3 align-top">Analyse, advertentiemeting en remarketing (niet-noodzakelijk)</td>
                  <td className="p-3 align-top">Cookie- en meetgegevens (zie sectie 8)</td>
                  <td className="p-3 align-top">Toestemming</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            We gebruiken toestemming <em>niet</em> als grondslag voor de gegevens die we nodig
            hebben om je aanvraag te behandelen of een opdracht uit te voeren — die verwerking
            is noodzakelijk. VoltFix verstuurt op dit moment geen commerciële nieuwsbrief.
          </p>

          <h2 id="delen">5. Met wie delen we persoonsgegevens?</h2>
          <p>
            VoltFix verkoopt je gegevens niet. We delen alleen wat nodig is met partijen die ons
            helpen bij dienstverlening en bedrijfsvoering. Uit onze huidige opzet blijkt het
            volgende overzicht:
          </p>
          <div className="not-prose overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left">
                  <th className="p-3 font-semibold">Leverancier</th>
                  <th className="p-3 font-semibold">Doel</th>
                  <th className="p-3 font-semibold">Mogelijke gegevens</th>
                  <th className="p-3 font-semibold">Regio</th>
                  <th className="p-3 font-semibold">Privacyverklaring</th>
                </tr>
              </thead>
              <tbody className="[&>tr]:border-b [&>tr]:border-border">
                <tr>
                  <td className="p-3 align-top">Lovable Cloud (Supabase)</td>
                  <td className="p-3 align-top">Database, opslag van foto-uploads en offerteaanvragen</td>
                  <td className="p-3 align-top">Alle formuliervelden, foto's, IP</td>
                  <td className="p-3 align-top">EU</td>
                  <td className="p-3 align-top">
                    <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">
                      supabase.com/privacy
                    </a>
                  </td>
                </tr>
                <tr>
                  <td className="p-3 align-top">Cloudflare</td>
                  <td className="p-3 align-top">Hosting, CDN, DDoS-bescherming, technische logs</td>
                  <td className="p-3 align-top">IP-adres, request-metadata</td>
                  <td className="p-3 align-top">Wereldwijd (EU-edge)</td>
                  <td className="p-3 align-top">
                    <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer">
                      cloudflare.com/privacypolicy
                    </a>
                  </td>
                </tr>
                <tr>
                  <td className="p-3 align-top">Google (Analytics, Tag Manager, Ads)</td>
                  <td className="p-3 align-top">Websitegebruik meten en advertentie-effectiviteit meten</td>
                  <td className="p-3 align-top">Cookie-ID, IP (verkort), klik- en paginagebeurtenissen</td>
                  <td className="p-3 align-top">EU / VS</td>
                  <td className="p-3 align-top">
                    <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
                      policies.google.com/privacy
                    </a>
                  </td>
                </tr>
                <tr>
                  <td className="p-3 align-top">WhatsApp / Meta</td>
                  <td className="p-3 align-top">Alleen als je zelf via WhatsApp contact opneemt</td>
                  <td className="p-3 align-top">Telefoonnummer, berichtinhoud</td>
                  <td className="p-3 align-top">EU / VS</td>
                  <td className="p-3 align-top">
                    <a href="https://www.whatsapp.com/legal/privacy-policy-eea" target="_blank" rel="noopener noreferrer">
                      whatsapp.com/legal
                    </a>
                  </td>
                </tr>
                <tr>
                  <td className="p-3 align-top">Google Maps</td>
                  <td className="p-3 align-top">Kaart van vestigings- en werkgebied via link</td>
                  <td className="p-3 align-top">IP en apparaatgegevens (bij openen kaart)</td>
                  <td className="p-3 align-top">EU / VS</td>
                  <td className="p-3 align-top">
                    <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
                      policies.google.com/privacy
                    </a>
                  </td>
                </tr>
                <tr>
                  <td className="p-3 align-top">Onze monteurs</td>
                  <td className="p-3 align-top">Ter plaatse uitvoeren van de opdracht</td>
                  <td className="p-3 align-top">Naam, adres, klusomschrijving, contactgegevens</td>
                  <td className="p-3 align-top">NL</td>
                  <td className="p-3 align-top">—</td>
                </tr>
                <tr>
                  <td className="p-3 align-top">Boekhouder / administratie</td>
                  <td className="p-3 align-top">Facturatie en fiscale verplichtingen</td>
                  <td className="p-3 align-top">NAW, factuurgegevens</td>
                  <td className="p-3 align-top">NL / EU</td>
                  <td className="p-3 align-top">—</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            Als een wettelijke verplichting ons daartoe dwingt (bijvoorbeeld een verzoek van de
            Belastingdienst of justitie), kunnen we ook gegevens delen met overheidsinstanties.
          </p>

          <h2 id="doorgifte">6. Doorgifte buiten de EER</h2>
          <p>
            Onze database- en hostingpartners verwerken gegevens primair binnen de Europese
            Economische Ruimte (EER). Voor sommige diensten (met name Google en Meta/WhatsApp)
            kunnen gegevens ook buiten de EER worden verwerkt, met name in de Verenigde Staten.
            Deze partijen doen dat op basis van door de Europese Commissie goedgekeurde
            waarborgen, zoals de <em>EU-U.S. Data Privacy Framework</em>-adequaatheidsbesluit
            en/of standaardcontractbepalingen (SCC's). Voor details verwijzen we naar de
            privacyverklaringen in de tabel hierboven.
          </p>

          <h2 id="bewaartermijnen">7. Hoe lang bewaren we gegevens?</h2>
          <ul>
            <li>
              <strong>Onbeantwoorde of niet-doorgezette contact- en offerteaanvragen:</strong>{" "}
              maximaal 12 maanden na het laatste contact.
            </li>
            <li>
              <strong>Uitgevoerde opdrachten (klantdossier):</strong> zolang noodzakelijk voor
              service, garantie en mogelijke aanspraken, met een maximum van 7 jaar na afronding
              (gelijkgetrokken met de fiscale bewaarplicht).
            </li>
            <li>
              <strong>Facturen en fiscale administratie:</strong> 7 jaar (artikel 52 AWR); langer
              als een specifieke wettelijke bewaarplicht geldt.
            </li>
            <li>
              <strong>WhatsApp- en e-mailcommunicatie:</strong> niet langer dan noodzakelijk voor
              de aanvraag, opdracht of mogelijke aanspraken.
            </li>
            <li>
              <strong>Cookie- en analysegegevens:</strong> volgens de standaardbewaartermijn van
              de gebruikte tool (Google Analytics: maximaal 14 maanden).
            </li>
            <li>
              <strong>Technische server-/hostinglogs:</strong> maximaal 30 dagen, tenzij nodig
              voor onderzoek naar misbruik.
            </li>
          </ul>
          <p>
            Gegevens worden eerder verwijderd of geanonimiseerd zodra ze niet langer nodig zijn,
            tenzij een wettelijke bewaarplicht van toepassing is.
          </p>

          <h2 id="cookies">8. Cookies, Google Ads en analyse</h2>
          <p>
            Op deze website worden op dit moment de volgende cookies en scripts geladen:
          </p>
          <div className="not-prose overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left">
                  <th className="p-3 font-semibold">Cookie / opslag</th>
                  <th className="p-3 font-semibold">Provider</th>
                  <th className="p-3 font-semibold">Categorie</th>
                  <th className="p-3 font-semibold">Doel</th>
                  <th className="p-3 font-semibold">Bewaartermijn</th>
                </tr>
              </thead>
              <tbody className="[&>tr]:border-b [&>tr]:border-border">
                <tr>
                  <td className="p-3 align-top">voltfix-lang (localStorage)</td>
                  <td className="p-3 align-top">VoltFix</td>
                  <td className="p-3 align-top">Functioneel</td>
                  <td className="p-3 align-top">Onthouden van taalvoorkeur (NL/EN)</td>
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
                  <td className="p-3 align-top">_gcl_*, IDE, test_cookie</td>
                  <td className="p-3 align-top">Google Ads / Tag Manager</td>
                  <td className="p-3 align-top">Marketing</td>
                  <td className="p-3 align-top">Conversiemeting en remarketing voor Google Ads</td>
                  <td className="p-3 align-top">Tot 13 maanden</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            <strong>Eerlijk over de huidige status:</strong> op dit moment worden Google
            Analytics en Google Tag Manager al bij het openen van de website geladen. We werken
            aan een toestemmingsbanner (Consent Mode v2) waarmee je vooraf een keuze kunt maken
            tussen <em>alles accepteren</em>, <em>alleen noodzakelijk</em> en{" "}
            <em>voorkeuren instellen</em>, en waarmee je je keuze later kunt intrekken. Tot die
            tijd kun je cookies weigeren via de instellingen van je browser; dat heeft geen
            invloed op de werking van de website of het formulier.
          </p>

          <h2 id="beveiliging">9. Beveiliging</h2>
          <p>
            VoltFix neemt passende technische en organisatorische maatregelen om je gegevens te
            beschermen tegen verlies, misbruik, onbevoegde toegang en ongeoorloofde wijziging.
            Concreet:
          </p>
          <ul>
            <li>Verkeer met deze website loopt via HTTPS (TLS).</li>
            <li>
              Foto-uploads worden opgeslagen in een privé-bucket bij onze database-leverancier;
              alleen VoltFix heeft toegang.
            </li>
            <li>
              Toegang tot klant- en opdrachtgegevens is beperkt tot medewerkers die deze nodig
              hebben voor hun werk.
            </li>
            <li>Formulierinzendingen worden gevalideerd om misbruik en spam te voorkomen.</li>
          </ul>

          <h2 id="geautomatiseerd">10. Geautomatiseerde besluitvorming</h2>
          <p>
            VoltFix neemt geen besluiten met belangrijke gevolgen voor personen die uitsluitend
            zijn gebaseerd op geautomatiseerde verwerking of profilering. Iedere offerte en
            afspraak wordt door een medewerker beoordeeld.
          </p>

          <h2 id="kinderen">11. Kinderen</h2>
          <p>
            Onze dienstverlening en website zijn niet gericht op kinderen jonger dan 16 jaar. We
            verzamelen niet bewust persoonsgegevens van kinderen. Kom je hier toch achter? Neem
            contact op via <a href={mailHref}>{business.email}</a>, dan verwijderen we de
            gegevens.
          </p>

          <h2 id="rechten">12. Jouw rechten</h2>
          <p>Onder de AVG heb je de volgende rechten:</p>
          <ul>
            <li>Recht op inzage in de gegevens die we van je verwerken</li>
            <li>Recht op correctie van onjuiste gegevens</li>
            <li>Recht op verwijdering ("recht om vergeten te worden")</li>
            <li>Recht op beperking van de verwerking</li>
            <li>Recht om bezwaar te maken</li>
            <li>Recht op gegevensoverdraagbaarheid</li>
            <li>Recht om gegeven toestemming in te trekken</li>
            <li>
              Recht om een klacht in te dienen bij de{" "}
              <a
                href="https://www.autoriteitpersoonsgegevens.nl"
                target="_blank"
                rel="noopener noreferrer"
              >
                Autoriteit Persoonsgegevens
              </a>
            </li>
          </ul>
          <p>
            Stuur je verzoek naar <a href={mailHref}>{business.email}</a>. We reageren in
            beginsel binnen één maand. We vragen niet standaard om een kopie van je
            identiteitsbewijs; bij twijfel over je identiteit kunnen we op een proportionele en
            veilige manier aanvullende informatie vragen.
          </p>

          <h2 id="wijzigingen">13. Wijzigingen</h2>
          <p>
            Dit privacybeleid kan wijzigen wanneer onze dienstverlening, de website of de
            wetgeving verandert. De actuele versie staat altijd op deze pagina; bij iedere
            inhoudelijke wijziging passen we de datum bovenaan aan.
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
