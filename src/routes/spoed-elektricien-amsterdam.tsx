import { createFileRoute, Link } from "@tanstack/react-router";

import monteurImg from "@/assets/voltfix-monteur.webp.asset.json";
import { emergencyCheckFaqs } from "@/components/emergency-flowchart";
import { EmergencyLandingPage } from "@/components/emergency-landing-page";
import { NeighborhoodLinks } from "@/components/neighborhood-links";
import { Prose } from "@/components/prose";
import { business } from "@/lib/business";
import {
  allInSublabelNl,
  firstHourAllInNl,
  firstHourNoteNl,
  prices,
  vatConsumerNoteNl,
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

const path = "/spoed-elektricien-amsterdam";

const faqs = [
  {
    q: "Hoe snel is een spoed elektricien in Amsterdam bij mij?",
    a: "Bij spoed zijn we binnen 60 minuten in heel Amsterdam ter plaatse. Je hoort tijdens het telefoongesprek direct een realistische aankomsttijd, afhankelijk van verkeer en beschikbaarheid.",
  },
  {
    q: "Kan ik 's nachts of in het weekend een spoed elektricien bellen?",
    a: `Ja, onze spoedservice is 24 uur per dag en 7 dagen per week bereikbaar, ook 's nachts, in het weekend en op feestdagen. Bel ${business.phoneDisplay} — je krijgt direct een vakman aan de lijn, geen callcenter.`,
  },
  {
    q: "Wat moet ik doen bij kortsluiting of een doorgeslagen groep?",
    a: "Zet bij gevaar de hoofdschakelaar uit, raak geen blootliggende draden aan en houd kinderen en huisdieren uit de buurt. Trek verdachte apparaten uit het stopcontact. Bel daarna VoltFix; wij vinden de oorzaak en lossen het veilig op.",
  },
  {
    q: "Wat kost een spoed elektricien in Amsterdam?",
    a: `Overdag kost het eerste uur ${firstHourAllInNl(prices.emergencyFirstHour)}. In de avond, nacht, het weekend en op feestdagen is dat ${firstHourAllInNl(prices.offHoursFirstHour)}. ${allInSublabelNl.charAt(0).toUpperCase() + allInSublabelNl.slice(1)}. ${firstHourNoteNl} ${vatConsumerNoteNl}`,
  },
  {
    q: "Kom ik voor verrassingen te staan als de storing langer duurt?",
    a: "Nee. Nooit een verrassing op de factuur: loopt het uit of is er extra materiaal nodig, dan stopt de monteur en hoor je eerst wat het extra kost. We gaan alleen verder met jouw akkoord.",
  },
  {
    q: "Hoe kan ik betalen?",
    a: "Je kunt na afloop pinnen of op factuur betalen. Je ontvangt altijd een gespecificeerde factuur met btw.",
  },
  {
    q: "Mijn hele straat zit zonder stroom, kunnen jullie helpen?",
    a: "Is de storing buiten je meterkast, dan ligt het vaak bij netbeheerder Liander. Kijk eerst op liander.nl/storingen of bel 0800-9009. Wij lossen storingen binnen je eigen installatie op.",
  },
  {
    q: "Geven jullie garantie op spoedreparaties?",
    a: "Ja. Je krijgt 12 maanden garantie op ons werk en 2 jaar fabrieksgarantie op geplaatste materialen. Ook bij een spoedreparatie in de avond of het weekend.",
  },
];

export const Route = createFileRoute("/spoed-elektricien-amsterdam")({
  head: () => ({
    meta: pageMeta({
      title: "Spoed Elektricien Amsterdam | Binnen 60 Minuten",
      description: `Stroomstoring of kortsluiting? Bel ${business.phoneDisplay}. VoltFix is 24/7 bereikbaar en binnen 60 minuten in Amsterdam. €120/€145 eerste uur all-in.`,
      path,
      ogTitle: "Spoed Elektricien Amsterdam | VoltFix",
      ogDescription: "24/7 storingsdienst in Amsterdam. Binnen 60 minuten ter plaatse en een duidelijke all-in prijs vooraf.",
    }),
    links: [
      { rel: "canonical", href: absoluteUrl(path) },
      { rel: "preload", as: "image", href: monteurImg.url, fetchPriority: "high" },
      ...altLinks(path),
    ],
    scripts: [
      ldScript(serviceSchema({ name: "Spoed elektricien Amsterdam", description: "24/7 spoedservice voor storingen, kortsluiting, stroomuitval en meterkastproblemen in Amsterdam.", path, emergency: true })),
      // Exact de zichtbare vragen in paginavolgorde: eerst de spoed-check,
      // daarna de FAQ. Geen automatisch toegevoegde extra vraag.
      ldScript(faqSchema([...emergencyCheckFaqs("nl"), ...faqs], "nl", path, false)),
      ldScript(ratesSchema(path)),
      ldScript(warrantySchema(path)),
      ldScript(breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Spoed elektricien Amsterdam", path }])),
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <EmergencyLandingPage path={path} image={monteurImg.url} imageAlt="VoltFix spoed elektricien in Amsterdam met multimeter-meetpennen, klaar voor een storingsmelding" faqs={faqs}>
      <Prose>
        <p>
          Een elektrische storing komt altijd op het verkeerde moment. Zonder stroom valt je huishouden of bedrijf stil. VoltFix is je lokale spoed elektricien in Amsterdam: je spreekt direct een vakman, krijgt een duidelijke inschatting en we zijn bij spoed binnen 60 minuten ter plaatse.
        </p>

        <h2>Wanneer bel je een spoed elektricien?</h2>
        <p>Bel direct bij een storing die niet veilig tot morgen kan wachten:</p>
        <ul>
          <li><strong>Kortsluiting</strong> waarbij de stroom telkens uitvalt of een groep niet aan blijft.</li>
          <li><strong>Volledige stroomuitval</strong> in je woning of bedrijfspand terwijl de buren wel stroom hebben.</li>
          <li><strong>Een aardlekschakelaar</strong> die direct opnieuw uitschakelt.</li>
          <li><strong>Brandlucht, vonken of een warme meterkast</strong> — zet de hoofdschakelaar uit en bel bij zichtbaar vuur eerst 112.</li>
          <li><strong>Beschadigde kabels of stopcontacten</strong> na waterschade of een verbouwing.</li>
        </ul>
        <p>Twijfel je? Bel gerust. We beoordelen telefonisch hoe acuut het is en wat je veilig kunt doen totdat de monteur er is.</p>

        <h2>Veelvoorkomende storingen in Amsterdamse woningen</h2>
        <p>
          In oudere panden zien we geregeld verouderde bedrading, vochtproblemen en overbelaste groepen. In nieuwere woningen gaat het vaker om een defect apparaat of een aardlekschakelaar die uitspringt. We sporen de oorzaak op, herstellen wat veilig direct kan en leggen uit wanneer vervolgwerk verstandig is.
        </p>

        <h2>Wat kun je veilig zelf controleren?</h2>
        <p>
          Kijk eerst of de buren ook zonder stroom zitten. Bij een straatbrede uitval controleer je de storing bij Liander. Zit het probleem alleen in jouw woning, schakel dan verdachte apparaten uit en raak nooit blootliggende of beschadigde draden aan. Ruik je brand of zie je rook? Zet de hoofdschakelaar uit, houd afstand en bel bij zichtbaar vuur 112.
        </p>

        <h2>Blijvende oplossing na de storing</h2>
        <p>
          Is de directe storing veilig opgelost maar blijkt de installatie verouderd, dan bespreken we rustig een blijvende oplossing. Denk aan het <Link to="/groepenkast-amsterdam" className="font-medium text-primary underline underline-offset-4">vervangen van de groepenkast</Link> of een veilige <Link to="/perilex-amsterdam" className="font-medium text-primary underline underline-offset-4">Perilex-aansluiting</Link>. Vervolgwerk gebeurt alleen na een duidelijke prijsafspraak.
        </p>

        <NeighborhoodLinks title="Spoed elektricien per wijk in Amsterdam" intro="Directe hulp bij stroomstoring in jouw wijk. Kies je locatie voor lokale informatie." includeEmergency={false} />
      </Prose>
    </EmergencyLandingPage>
  );
}