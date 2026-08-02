import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";

import heroImg from "@/assets/voltfix-lamp-ophangen.webp.asset.json";
import { ServicePage } from "@/components/service-page";
import { Prose } from "@/components/prose";
import { LocationCtaBlock } from "@/components/location-cta-block";
import { getLocationByPath, siblingLocations, type Location } from "@/data/locations";
import {
  absoluteUrl,
  altLinks,
  breadcrumbSchema,
  faqSchema,
  ldScript,
  locationServiceSchema,
  pageMeta,
} from "@/lib/seo";

type Props = { path: string };

/**
 * Head-metadata generator voor hyperlokale landingspagina's.
 * Gebruik in het route-bestand:
 *   head: () => locationHead("/elektricien-amstelveen")
 */
export function locationHead(path: string) {
  const location = getLocationByPath(path);
  if (!location) return { meta: [{ title: "Locatie niet gevonden" }] };
  return {
    meta: pageMeta({
      title: location.metaTitle,
      description: location.metaDescription,
      path,
      ogTitle: location.metaTitle,
      ogDescription: location.ogDescription,
      ogType: "article",
    }),
    links: [{ rel: "canonical", href: absoluteUrl(path) }, ...altLinks(path)],
    scripts: [
      ldScript(
        locationServiceSchema({
          name: `Elektricien ${location.name}`,
          description: `Lokale elektricien in ${location.name} voor spoed, storingen, groepenkast, perilex, laadpaal en NEN-keuring${location.postcodes && location.postcodes.length > 0 ? ` (postcodes ${location.postcodes.join(", ")})` : ""}.`,
          path,
          postcodes: location.postcodes,
          neighborhoods: location.neighborhoods,
          containedIn: location.region === "Amsterdam" ? "Amsterdam" : location.name,
          lang: "nl",
        }),
      ),
      ldScript(faqSchema(location.faqs)),
      ldScript(
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: `Elektricien ${location.region}`, path: "/elektricien-amsterdam" },
          { name: location.name, path },
        ]),
      ),
    ],
  };
}

/**
 * Hyperlocal landing-page template.
 * Rendert een volledige lokale SEO pagina op basis van één entry uit
 * `src/data/locations.ts`. Voegt automatisch:
 *  - H1 "Elektricien {locatie}"
 *  - Klikbaar telefoonnummer boven de vouw (via ServicePage hero)
 *  - Body met kopjes en lijstjes
 *  - Interne links naar buurten en aangrenzende locaties
 *  - FAQ + FAQPage schema (via ServicePage/head van de route)
 */
export function LocationPage({ path }: Props) {
  const location = getLocationByPath(path);
  if (!location) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <p className="text-muted-foreground">Locatie niet gevonden.</p>
      </div>
    );
  }

  const siblings = siblingLocations(path);

  return (
    <ServicePage
      path={location.path}
      eyebrow={location.eyebrow}
      title={`Elektricien ${location.name}`}
      intro={location.intro}
      image={heroImg.url}
      imageAlt={`VoltFix elektricien aan het werk in ${location.name}`}
      whatsappMessage={location.whatsappMessage}
      faqs={location.faqs}
    >
      <Prose>
        {location.sections.map((s, i) => {
          if (s.type === "p") return <p key={i}>{s.text}</p>;
          if (s.type === "h2") return <h2 key={i}>{s.text}</h2>;
          if (s.type === "h3") return <h3 key={i}>{s.text}</h3>;
          return (
            <ul key={i}>
              {s.items.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>
          );
        })}


        {location.neighborhoods && location.neighborhoods.length > 0 && (
          <>
            <h2>Werkgebied in {location.name}</h2>
            <p>
              We werken in heel {location.name}, waaronder{" "}
              {location.neighborhoods.map((n, i, arr) => (
                <span key={n}>
                  <strong>{n}</strong>
                  {i < arr.length - 2 ? ", " : i === arr.length - 2 ? " en " : "."}
                </span>
              ))}
            </p>
          </>
        )}
      </Prose>

      <LocationCtaBlock
        name={location.name}
        lang="nl"
        postcodes={location.postcodes}
        whatsappMessage={location.whatsappMessage}
        gtmLocation={`location-cta-${location.path.replace(/^\//, "")}`}
      />

      <LocalServiceLinks name={location.name} />

      {siblings.length > 0 && <SiblingLocations current={location} siblings={siblings} />}
    </ServicePage>
  );
}

const LOCAL_SERVICES: { to: string; label: (n: string) => string }[] = [
  { to: "/spoed-elektricien-amsterdam", label: (n) => `Spoed elektricien in ${n}` },
  { to: "/Groepenkast-Amsterdam", label: (n) => `Groepenkast vervangen in ${n}` },
  { to: "/perilex-amsterdam", label: (n) => `Perilex aansluiten in ${n}` },
  { to: "/laadpaal-amsterdam", label: (n) => `Laadpaal installeren in ${n}` },
  { to: "/keuring-amsterdam", label: (n) => `Elektrische keuring in ${n}` },
  { to: "/stroomstoring-amsterdam", label: (n) => `Stroomstoring in ${n}` },
];

function LocalServiceLinks({ name }: { name: string }) {
  return (
    <section className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl font-bold sm:text-3xl">Diensten in {name}</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Van spoed en storingen tot laadpaal, groepenkast en NEN-keuring — VoltFix is uw lokale
          elektricien voor alle elektra in {name}.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {LOCAL_SERVICES.map((s) => (
            <Link
              key={s.to}
              to={s.to}
              className="group inline-flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 text-sm font-medium transition-colors hover:border-primary/50 hover:bg-primary/5"
            >
              <MapPin className="h-4 w-4 text-primary" />
              {s.label(name)}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}


function SiblingLocations({ current, siblings }: { current: Location; siblings: Location[] }) {
  const heading =
    current.region === "Amsterdam"
      ? "Elektricien in andere wijken van Amsterdam"
      : "Elektricien in de regio Amsterdam";
  return (
    <section className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl font-bold sm:text-3xl">{heading}</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {siblings.map((s) => (
            <Link
              key={s.path}
              to={s.path}
              className="group inline-flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 text-sm font-medium transition-colors hover:border-primary/50 hover:bg-primary/5"
            >
              <MapPin className="h-4 w-4 text-primary" />
              Elektricien {s.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
