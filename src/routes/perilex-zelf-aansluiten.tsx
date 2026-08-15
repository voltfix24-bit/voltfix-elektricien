import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

import { PerilexWizardToggle } from "@/components/perilex-wizard-toggle";
import { Prose } from "@/components/prose";
import {
  absoluteUrl,
  altLinks,
  breadcrumbSchema,
  howToSchema,
  ldScript,
  pageMeta,
} from "@/lib/seo";

const path = "/perilex-zelf-aansluiten";

export const Route = createFileRoute("/perilex-zelf-aansluiten")({
  head: () => ({
    meta: pageMeta({
      title: "Perilex zelf aansluiten — stappenplan | VoltFix",
      description:
        "Stap-voor-stap wizard om zelf een perilex stopcontact aan te sluiten: meten, kabel en aders. Of laat VoltFix het veilig doen in Amsterdam.",
      path,
      ogTitle: "Perilex zelf aansluiten — stappenplan | VoltFix",
      ogDescription:
        "Interactieve wizard: check veilig of je zelf een perilex kunt aansluiten of laat VoltFix het regelen.",
      ogType: "article",
    }),
    links: [{ rel: "canonical", href: absoluteUrl(path) }, ...altLinks(path)],
    scripts: [
      ldScript(
        howToSchema({
          name: "Perilex zelf aansluiten — stappenplan",
          description:
            "Stap-voor-stap veilig een perilex stopcontact aansluiten voor inductie of fornuis. Bij twijfel of werk aan de meterkast: laat VoltFix het doen.",
          path,
          totalTime: "PT45M",
          tools: [
            "Goedgekeurde dubbelpolige spanningstester",
            "Kruiskop- en platte schroevendraaier",
            "Striptang",
            "Zijkniptang",
          ],
          supplies: [
            "Perilex stekker (2- of 3-fase, passend bij de configuratie)",
            "Perilex kabel met juiste doorsnede",
          ],
          steps: [
            {
              name: "Meet de configuratie",
              text: "Bepaal met een dubbelpolige spanningstester welke contacten fase (L) en nul (N) zijn. Markeer de bedrading van de bestaande contactdoos.",
            },
            {
              name: "Spanning eraf",
              text: "Schakel de juiste groep in de meterkast uit en controleer met de spanningstester dat er geen spanning meer op de aansluiting staat.",
            },
            {
              name: "Kabel voorbereiden",
              text: "Strip de buitenmantel en losse aders op de juiste lengte. Houd de aardader (geel-groen) iets langer dan de fasen en de nul.",
            },
            {
              name: "Aders op kleurcode aansluiten",
              text: "Sluit elke ader aan op de gemarkeerde klem in de perilex stekker. Volg de labels op de stekker; geen blank koper buiten de klem.",
            },
            {
              name: "Trekontlasting vastzetten",
              text: "Zet de kabelklem stevig vast op de buitenmantel — nooit op losse aders — zodat de aansluiting bij trekken niet loskomt.",
            },
            {
              name: "Apparaatzijde: bruggen instellen",
              text: "Stel de bruggen op het aansluitblok van het apparaat in volgens het fabrikantsschema voor 1-, 2- of 3-fase, passend bij je gemeten configuratie.",
            },
            {
              name: "Sluiten & controleren",
              text: "Schroef de stekker dicht, controleer of alle schroeven vastzitten en niets klemt. Schakel daarna pas de groep weer in en test de werking.",
            },
          ],
        }),
      ),
      ldScript(
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Perilex aansluiten Amsterdam", path: "/perilex-amsterdam" },
          { name: "Perilex zelf aansluiten", path },
        ]),
      ),
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-14">
      <nav className="mb-4 flex items-center gap-1 text-xs text-muted-foreground" aria-label="Kruimelpad">
        <Link to="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/perilex-amsterdam" className="hover:text-foreground">Perilex Amsterdam</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">Zelf aansluiten</span>
      </nav>

      <Prose>
        <h1>Perilex zelf aansluiten — stap-voor-stap</h1>
        <p>
          Wil je je perilex stopcontact zelf aansluiten? Doorloop dan eerst deze gratis wizard.
          We nemen je mee door de zeven stappen: meten, spanning eraf, kabel voorbereiden, aders
          aansluiten, trekontlasting, bruggen op het apparaat en de eindcontrole. Twijfel je of
          moet er iets aan de meterkast gebeuren? Laat het{" "}
          <Link to="/perilex-amsterdam" className="font-medium text-primary underline underline-offset-4">
            VoltFix veilig doen in Amsterdam
          </Link>
          .
        </p>
      </Prose>

      <PerilexWizardToggle />

      <Prose>
        <h2>Liever niet zelf?</h2>
        <p>
          Werk aan een perilex staat vaak onder spanning en raakt de meterkast. Bij twijfel is een{" "}
          <Link to="/perilex-amsterdam" className="font-medium text-primary underline underline-offset-4">
            gecertificeerde elektricien
          </Link>{" "}
          altijd de veilige keus. We werken volgens NEN 1010, geven garantie op arbeid en leveren
          vaste prijs vooraf.
        </p>
      </Prose>
    </article>
  );
}
