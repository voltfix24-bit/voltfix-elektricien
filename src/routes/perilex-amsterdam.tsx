import { createFileRoute } from "@tanstack/react-router";

import heroImg from "@/assets/perilex.jpg";
import { ServicePage } from "@/components/service-page";
import { Prose } from "@/components/prose";
import { absoluteUrl, altLinks, breadcrumbSchema, faqSchema, ldScript, ogImage, serviceSchema } from "@/lib/seo";

const path = "/perilex-amsterdam";

const faqs = [
  {
    q: "Wat kost het aansluiten van een perilex in Amsterdam?",
    a: "Het aansluiten van een perilex stopcontact of kookgroep begint bij ongeveer € 175. De prijs hangt af van de afstand tot de meterkast en of er een nieuwe groep moet worden bijgeplaatst. U krijgt vooraf een vaste prijs.",
  },
  {
    q: "Wat is het verschil tussen 2-fase en 3-fase?",
    a: "Een gewone perilex (krachtstroom) gebruikt vaak 2 fasen voor zwaardere apparaten. Bij 3-fase wordt de belasting over drie fasen verdeeld, wat nodig kan zijn voor zware inductiekookplaten of fornuizen. Wij adviseren wat voor uw apparaat en woning nodig is.",
  },
  {
    q: "Heb ik een perilex nodig voor mijn inductiekookplaat?",
    a: "Veel inductiekookplaten hebben een eigen kookgroep of perilexaansluiting nodig vanwege het hoge vermogen. Controleer het aansluitvermogen van uw kookplaat; wij kijken graag mee welke aansluiting nodig is.",
  },
  {
    q: "Kan ik een gewoon stopcontact gebruiken voor inductie?",
    a: "Lichtere inductieplaten werken soms op een gewone groep, maar krachtigere modellen vereisen een aparte kookgroep of perilex om overbelasting en doorslaan van de groep te voorkomen.",
  },
  {
    q: "Moet er een extra groep in de meterkast komen?",
    a: "Vaak wel. Een kookgroep krijgt idealiter een eigen groep in de groepenkast. Als er geen ruimte is, kunnen we de groepenkast uitbreiden of aanpassen.",
  },
  {
    q: "Hoe lang duurt het aansluiten van een perilex?",
    a: "In de meeste gevallen is het binnen één tot twee uur geregeld. Als er bekabeling getrokken moet worden naar de meterkast, kan het iets langer duren.",
  },
  {
    q: "Sluiten jullie ook fornuizen en ovens aan?",
    a: "Ja, we sluiten inductiekookplaten, keramische platen, elektrische fornuizen en ovens veilig aan op de juiste groep en aansluiting in Amsterdam.",
  },
];

export const Route = createFileRoute("/perilex-amsterdam")({
  head: () => ({
    meta: [
      { title: "Perilex Aansluiten Amsterdam | Kookgroep | VoltFix" },
      {
        name: "description",
        content:
          "Perilex aansluiten in Amsterdam voor inductie of fornuis. VoltFix installeert kookgroepen en perilex stopcontacten veilig en vakkundig. Vanaf € 175.",
      },
      { property: "og:title", content: "Perilex Aansluiten Amsterdam | VoltFix" },
      {
        property: "og:description",
        content: "Kookgroep en perilex stopcontact voor inductie en fornuis. Veilig aangesloten.",
      },
      { property: "og:url", content: absoluteUrl(path) },
      { property: "og:type", content: "article" },
      { property: "og:image", content: ogImage },
      { name: "twitter:image", content: ogImage },
    ],
    links: [{ rel: "canonical", href: absoluteUrl(path) }, ...altLinks(path)],
    scripts: [
      ldScript(
        serviceSchema({
          name: "Perilex aansluiten Amsterdam",
          description:
            "Aansluiten van perilex stopcontacten en kookgroepen voor inductie en fornuis in Amsterdam, 2-fase en 3-fase.",
          path,
        }),
      ),
      ldScript(faqSchema(faqs)),
      ldScript(
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Perilex aansluiten Amsterdam", path },
        ]),
      ),
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <ServicePage
      path={path}
      eyebrow="Kookgroep installeren · vanaf € 175"
      title="Perilex aansluiten Amsterdam"
      intro="Een nieuwe inductiekookplaat of fornuis? VoltFix sluit uw perilex stopcontact en kookgroep veilig aan in Amsterdam. Vakkundig, volgens de norm en afgestemd op het vermogen van uw apparaat."
      image={heroImg}
      imageAlt="Elektricien van VoltFix sluit een perilex aansluiting aan voor een inductiekookplaat in Amsterdam"
      whatsappMessage="Hallo VoltFix, ik wil een perilex / kookgroep laten aansluiten in Amsterdam."
      faqs={faqs}
      priceTitle="Prijsindicatie perilex & kookgroep"
      priceIntro="Richtprijzen voor het aansluiten van een perilex of kookgroep in Amsterdam. U krijgt altijd een vaste prijs vooraf."
      priceRows={[
        {
          title: "Perilex aansluiten",
          price: "vanaf € 175",
          unit: "op bestaande groep",
          points: ["2- of 3-fase", "Inductie & fornuis", "Veilig aangesloten"],
          featured: true,
        },
        {
          title: "Kookgroep + nieuwe groep",
          price: "vanaf € 275",
          unit: "incl. extra groep",
          points: ["Eigen kookgroep", "Bekabeling naar meterkast", "NEN 1010 conform"],
        },
      ]}
    >

      <Prose>
        <p>
          Wie in Amsterdam overstapt van gas op inductie of een nieuw fornuis
          plaatst, krijgt al snel te maken met de vraag: welke aansluiting heb ik
          nodig? Krachtige kooktoestellen vragen meer stroom dan een gewoon
          stopcontact veilig kan leveren. Daarom is een{" "}
          <strong>perilex aansluiting of aparte kookgroep</strong> vaak
          noodzakelijk. VoltFix installeert deze veilig en vakkundig, zodat u
          zorgeloos kunt koken.
        </p>

        <h2>Wat is een perilex aansluiting?</h2>
        <p>
          Een perilex is een vijfpolige stekker-en-contactdoos die bedoeld is voor
          apparaten met een hoog vermogen, zoals elektrische fornuizen en zware
          inductiekookplaten. Een perilex kan meerdere fasen tegelijk gebruiken,
          waardoor er veel meer vermogen beschikbaar is dan via een standaard
          wandcontactdoos. Voor inductiekoken is dat belangrijk: meerdere
          kookzones tegelijk op vol vermogen trekken eenvoudig 7.000 watt of meer.
        </p>

        <h2>Kookgroep of perilex — wat heeft u nodig?</h2>
        <p>
          Niet elke inductiekookplaat heeft dezelfde aansluiting nodig. Het hangt
          af van het aansluitvermogen dat de fabrikant voorschrijft:
        </p>
        <ul>
          <li>
            <strong>Lichte inductieplaat:</strong> werkt soms op een eigen kookgroep
            (gewone 230V groep, zwaarder uitgevoerd).
          </li>
          <li>
            <strong>Zwaardere inductieplaat:</strong> vraagt vaak om een perilex met
            2 fasen.
          </li>
          <li>
            <strong>Krachtig fornuis of grote kookplaat:</strong> kan een 3-fase
            aansluiting nodig hebben.
          </li>
        </ul>
        <p>
          Wij kijken naar het typeplaatje en de handleiding van uw apparaat en
          adviseren u welke aansluiting veilig en passend is. Zo voorkomt u
          overbelasting en doorslaande groepen.
        </p>

        <h2>2-fase en 3-fase uitgelegd</h2>
        <p>
          In veel Amsterdamse woningen komt 1-fase stroom binnen, maar zwaardere
          apparaten vragen om een verdeling over meerdere fasen.{" "}
          <strong>Bij 2-fase</strong> wordt het vermogen over twee fasen verdeeld,
          wat genoeg is voor de meeste inductiekookplaten. <strong>Bij 3-fase</strong>{" "}
          (ook wel krachtstroom) wordt de belasting over drie fasen gespreid, ideaal
          voor zeer krachtige toestellen of meerdere zware apparaten. Heeft uw
          woning nog geen 3-fase aansluiting terwijl uw apparaat dit vraagt? Dan
          bekijken we samen de mogelijkheden, eventueel in overleg met de
          netbeheerder.
        </p>

        <h2>Zo gaan wij te werk</h2>
        <p>
          Het aansluiten van een perilex of kookgroep doen we netjes en veilig:
        </p>
        <ul>
          <li>We controleren uw groepenkast en de beschikbare ruimte voor een groep.</li>
          <li>Indien nodig plaatsen we een nieuwe, zwaardere kookgroep bij.</li>
          <li>We trekken de juiste bekabeling naar de keuken.</li>
          <li>We monteren het perilex stopcontact of de vaste aansluiting.</li>
          <li>We sluiten uw kookplaat of fornuis aan en testen alles door.</li>
        </ul>

        <h2>Veilig koken zonder zorgen</h2>
        <p>
          Een verkeerd aangesloten kookplaat kan zorgen voor oververhitting,
          doorslaande groepen of in het ergste geval brand. Door de aansluiting
          door een vakkundige elektricien te laten verzorgen, weet u zeker dat
          alles volgens de NEN 1010-norm is uitgevoerd. VoltFix levert het werk
          veilig op en geeft garantie. Zo geniet u zorgeloos van uw nieuwe keuken.
        </p>

        <h2>Wat kost perilex aansluiten in Amsterdam?</h2>
        <p>
          Het aansluiten van een perilex of kookgroep begint bij{" "}
          <strong>€ 175</strong>. De exacte prijs hangt af van de afstand tussen de
          keuken en de meterkast, of er een nieuwe groep nodig is en of er
          aanpassingen aan de groepenkast moeten gebeuren. U ontvangt vooraf een
          vaste prijs, zodat u nooit voor verrassingen komt te staan.
        </p>
        <p>
          Heeft u binnenkort een nieuwe inductiekookplaat of fornuis? Laat de
          aansluiting over aan VoltFix. Bel ons of stuur een WhatsApp met het type
          apparaat en uw adres in Amsterdam, dan regelen we de rest.
        </p>

        <h2>Perilex of krachtstroom: wat heeft u nodig?</h2>
        <p>
          Niet elk kookapparaat vraagt om dezelfde aansluiting. Een lichte
          inductiekookplaat kan soms op een gewone wandcontactdoos, maar de meeste
          inductieplaten en fornuizen hebben een aparte kookgroep of een perilex
          aansluiting nodig. Een perilex is een vijfpolige aansluiting die zowel
          2-fase als 3-fase kan leveren en daardoor geschikt is voor het hoge
          vermogen van moderne apparatuur. Twijfelt u welke aansluiting uw nieuwe
          apparaat nodig heeft? Stuur ons het type en merk door, dan adviseren we u
          direct en voorkomen we dat u een verkeerde of onveilige aansluiting
          krijgt.
        </p>

        <h2>Veilig aansluiten in Amsterdamse woningen</h2>
        <p>
          In veel Amsterdamse woningen is de meterkast niet zonder meer geschikt
          voor een zware kookgroep. In oudere panden ontbreekt soms de ruimte of de
          capaciteit voor een extra groep, terwijl in appartementen de afstand
          tussen meterkast en keuken extra leidingwerk vraagt. Wij beoordelen uw
          situatie ter plaatse, leggen waar nodig een nieuwe groep aan vanuit de
          groepenkast en zorgen voor een correcte aardlekbeveiliging. Alles wordt
          aangesloten volgens de NEN 1010-norm en na afloop getest, zodat u veilig
          en zonder zorgen kunt koken. U krijgt vooraf een vaste prijs en garantie
          op de uitvoering.
        </p>
      </Prose>
    </ServicePage>
  );
}
