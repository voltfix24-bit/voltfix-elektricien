import { createFileRoute, Link } from "@tanstack/react-router";

import heroImg from "@/assets/voltfix-groepenkast-hero.webp.asset.json";
import { ServicePage } from "@/components/service-page";
import { Prose } from "@/components/prose";
import {
  absoluteUrl,
  altLinks,
  breadcrumbSchema,
  faqSchema,
  ldScript,
  serviceSchema,
  pageMeta,
} from "@/lib/seo";
import type { PriceRow } from "@/components/price-indicator";
import {
  eurNl,
  fromNl,
  rangeNl,
  prices,
  vatConsumerNoteNl,
} from "@/lib/pricing";
import { NeighborhoodLinks } from "@/components/neighborhood-links";
import { priceProcessFaqs } from "@/data/service-faqs";

const path = "/3-fase-aansluiting-amsterdam";

const faqs = [
  {
    q: "Wat kost een 3-fase aansluiting in Amsterdam?",
    a: `Het aanpassen van uw meterkast voor 3-fase (krachtstroom) kost doorgaans ${rangeNl(prices.groepenkastFrom, prices.groepenkastTo)} inclusief materiaal, afhankelijk van de staat van uw huidige groepenkast. Daarnaast vraagt u bij netbeheerder Liander de verzwaring van de hoofdaansluiting aan — die kosten betaalt u rechtstreeks aan Liander. U ontvangt van ons altijd eerst een vaste prijs. ${vatConsumerNoteNl}`,
  },
  {
    q: "Wat is het verschil tussen 1-fase en 3-fase aansluiting?",
    a: "Bij een 1-fase aansluiting komt alle stroom via één fase (meestal 35 of 40 ampère) uw woning binnen. Bij 3-fase krachtstroom komt de stroom via drie fasen van 25 ampère binnen — samen goed voor aanzienlijk meer vermogen, nodig voor inductiekoken, een laadpaal of een warmtepomp.",
  },
  {
    q: "Wie regelt de verzwaring: de elektricien of de netbeheerder?",
    a: "Beiden hebben een eigen rol. De netbeheerder (in Amsterdam: Liander) verzwaart de hoofdaansluiting in uw meterkast van 1×35A naar 3×25A en plaatst eventueel een nieuwe meter. Wij als elektricien bouwen uw groepenkast om naar 3-fase: nieuwe hoofdschakelaar, aardlekschakelaars per fase en een nette verdeling van de groepen. Wij stemmen het traject met Liander voor u af.",
  },
  {
    q: "Heb ik 3-fase nodig voor een inductiekookplaat?",
    a: "Meestal niet per se — een 2-fase kookgroep (2×16A) volstaat voor de meeste inductieplaten. Maar combineert u inductie met een laadpaal, warmtepomp of jacuzzi, dan is een echte 3-fase aansluiting de duurzame keuze. Wij rekenen uw totale verbruik voor u door.",
  },
  {
    q: "Hoe lang duurt de ombouw naar 3-fase krachtstroom?",
    a: "De ombouw van de groepenkast zelf is doorgaans binnen een halve tot hele werkdag klaar. De verzwaring door Liander heeft een eigen planning (vaak enkele weken wachttijd). Wij adviseren daarom: vraag de verzwaring bij Liander aan zodra u weet dat u 3-fase nodig heeft, dan plannen wij de ombouw direct daarna.",
  },
  ...priceProcessFaqs.nl.drieFase,
];

const priceRows: PriceRow[] = [
  {
    title: "Meterkast-check & advies",
    price: eurNl(prices.hourly),
    unit: "1 uur, incl. inspectie & adviesrapport",
    points: ["Capaciteitsberekening", "Advies 1-fase vs 3-fase", "Vaste prijs voor vervolgwerk"],
  },
  {
    title: "Ombouw groepenkast naar 3-fase",
    price: rangeNl(prices.groepenkastFrom, prices.groepenkastTo),
    unit: "incl. materiaal & montage",
    points: ["3-fase hoofdschakelaar", "Aardlekschakelaars per fase", "NEN 1010 oplevering"],
    featured: true,
  },
  {
    title: "Kookgroep of laadgroep erbij",
    price: fromNl(prices.laadpaalExtraGroupFrom),
    unit: "extra groep in bestaande meterkast",
    points: ["Voor inductie of laadpaal", "Direct meegenomen bij ombouw", "Garantie op arbeid"],
  },
];

export const Route = createFileRoute("/3-fase-aansluiting-amsterdam")({
  head: () => ({
    meta: pageMeta({
      title: "3-Fase Aansluiting Amsterdam | Krachtstroom | VoltFix",
      description:
        `3-fase aansluiting (krachtstroom) laten aanleggen in Amsterdam. Meterkast-ombouw ${rangeNl(prices.groepenkastFrom, prices.groepenkastTo)}, afstemming met Liander, NEN 1010.`,
      path,
      ogTitle: "3-Fase Aansluiting Amsterdam | VoltFix",
      ogDescription:
        "Van 1-fase naar 3-fase krachtstroom: groepenkast-ombouw, vaste prijs en regie richting netbeheerder Liander.",
      ogImage: absoluteUrl(heroImg.url),
    }),
    links: [{ rel: "canonical", href: absoluteUrl(path) }, ...altLinks(path)],
    scripts: [
      ldScript(
        serviceSchema({
          name: "3-fase aansluiting Amsterdam",
          description:
            "Aanleggen en ombouwen van 3-fase krachtstroom-aansluitingen in Amsterdam, inclusief groepenkast-aanpassing en afstemming met de netbeheerder.",
          path,
        }),
      ),
      ldScript(faqSchema(faqs, "nl", path)),
      ldScript(
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "3-fase aansluiting Amsterdam", path },
        ]),
      ),
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <ServicePage
      reviewCategory="groepenkast"
      path={path}
      eyebrow="Krachtstroom / 3-fase"
      title="3-fase aansluiting in Amsterdam"
      intro="Inductiekoken, een laadpaal of warmtepomp, maar uw aansluiting is 1-fase? VoltFix bouwt uw groepenkast in Amsterdam om naar 3-fase krachtstroom — met vaste prijs vooraf en volledige regie richting netbeheerder Liander."
      image={heroImg.url}
      imageAlt="Moderne 3-fase groepenkast geïnstalleerd door VoltFix in Amsterdam"
      whatsappMessage="Hallo VoltFix, ik wil mijn aansluiting in Amsterdam laten verzwaren naar 3-fase krachtstroom."
      faqs={faqs}
      priceRows={priceRows}
      priceTitle="Prijsindicatie 3-fase aansluiting"
      priceIntro="Richtprijzen voor de ombouw naar 3-fase krachtstroom in Amsterdam. De verzwaring van de hoofdaansluiting voert netbeheerder Liander uit; die kosten vallen buiten onze prijzen."
    >
      <Prose>
        <p>
          Steeds meer Amsterdamse woningen hebben een <strong>3-fase aansluiting</strong> (ook wel
          krachtstroom genoemd) nodig. Een inductiekookplaat, een{" "}
          <Link to="/laadpaal-amsterdam" className="font-medium text-primary underline underline-offset-4">
            laadpaal
          </Link>
          , een warmtepomp of airco vragen samen meer vermogen dan een klassieke 1-fase aansluiting
          van 35 of 40 ampère kan leveren. VoltFix verzorgt de complete ombouw van uw{" "}
          <Link to="/groepenkast-amsterdam" className="font-medium text-primary underline underline-offset-4">
            groepenkast
          </Link>{" "}
          naar 3-fase, veilig en volgens NEN 1010.
        </p>

        <h2>Wanneer heeft u 3-fase krachtstroom nodig?</h2>
        <ul>
          <li>
            <strong>Inductiekookplaat of fornuis</strong> — een kookgroep of{" "}
            <Link to="/perilex-amsterdam" className="font-medium text-primary underline underline-offset-4">
              perilex-aansluiting
            </Link>{" "}
            werkt het betrouwbaarst op een ruime aansluiting.
          </li>
          <li>
            <strong>Laadpaal thuis</strong> — snelladen met 11 kW of 22 kW vereist 3-fase.
          </li>
          <li>
            <strong>Warmtepomp of elektrische cv</strong> — piekverbruik vraagt extra capaciteit.
          </li>
          <li>
            <strong>Zonnepanelen met hoog vermogen</strong> — teruglevering over drie fasen
            voorkomt overbelasting van één fase.
          </li>
          <li>
            <strong>Zakelijk gebruik</strong> — ovens, machines of meerdere werkplekken in een
            atelier of horecagelegenheid.
          </li>
        </ul>

        <h2>De rol van de netbeheerder versus de elektricien</h2>
        <p>
          Dit is waar het vaak misgaat in de communicatie — daarom maken we het expliciet. In
          Amsterdam is <strong>Liander</strong> de netbeheerder. Zij zijn verantwoordelijk voor alles
          tot en met uw hoofdaansluiting en de meter: het verzwaren van 1×35A naar 3×25A en het
          plaatsen of omruilen van de meter. Dat vraagt u zelf (of via ons) bij Liander aan; zij
          rekenen daar eigen tarieven voor en hebben een eigen planning.
        </p>
        <p>
          <strong>Wij als elektricien</strong> zijn verantwoordelijk voor alles ná de meter: de
          ombouw van uw groepenkast met een 3-fase hoofdschakelaar, aardlekschakelaars verdeeld
          over de fasen, een logische groepsindeling en het doormeten van de installatie. Wij
          stemmen ons werk af op de afspraak met Liander, zodat u nooit dubbel zonder stroom zit.
        </p>

        <h2>Zo verloopt de ombouw naar 3-fase</h2>
        <ul>
          <li>We controleren uw huidige aansluiting en berekenen uw benodigde vermogen.</li>
          <li>U ontvangt een vaste prijs voor de ombouw van de groepenkast.</li>
          <li>U (of wij namens u) vraagt de verzwaring aan bij Liander.</li>
          <li>Na de verzwaring bouwen wij de groepenkast om — doorgaans binnen één werkdag.</li>
          <li>We meten alles door en leveren op volgens NEN 1010.</li>
        </ul>

        <h2>Veelvoorkomende situaties in Amsterdam</h2>
        <p>
          In oudere Amsterdamse panden — denk aan De Pijp, Oud-West of de grachtengordel — zien we
          vaak nog 1-fase aansluitingen met volle of verouderde groepenkasten. Juist daar combineren
          bewoners inductiekoken met een vaatwasser, droger en steeds vaker een laadpaal. Een
          3-fase ombouw is dan geen luxe maar de logische basis voor een woning die klaar is voor
          de toekomst. Wilt u eerst weten wat uw installatie aankan? Plan dan een{" "}
          <strong>meterkast-check</strong>: wij beoordelen de aansluiting en adviseren of 3-fase
          nodig is, of dat een gerichte uitbreiding met een extra groep volstaat.
        </p>
        <p>
          Heeft u vragen over uw situatie? Neem contact op met onze{" "}
          <Link to="/elektricien-amsterdam" className="font-medium text-primary underline underline-offset-4">
            elektricien in Amsterdam
          </Link>{" "}
          — u ontvangt vrijblijvend advies en een vaste prijs.
        </p>

        <NeighborhoodLinks
          title="3-fase aansluiting per wijk in Amsterdam"
          intro="Kies uw wijk voor lokale service bij de ombouw naar 3-fase krachtstroom."
          includeEmergency={false}
        />
      </Prose>
    </ServicePage>
  );
}
