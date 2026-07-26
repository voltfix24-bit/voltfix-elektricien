import vcaBadge from "@/assets/cert-vca.png.asset.json";
import isoBadge from "@/assets/cert-iso9001.png.asset.json";
import leerbedrijfBadge from "@/assets/cert-leerbedrijf.png.asset.json";

type Cert = {
  key: string;
  src: string;
  alt: string;
  label: string;
  title: string;
  text: string;
};

const certs: Cert[] = [
  {
    key: "vca",
    src: vcaBadge.url,
    alt: "VCA** gecertificeerd — VoltFix elektricien Amsterdam",
    label: "VCA** gecertificeerd",
    title: "Veilig werken",
    text: "Veiligheid is een vast onderdeel van onze werkwijze, zowel op locatie als binnen onze organisatie.",
  },
  {
    key: "iso",
    src: isoBadge.url,
    alt: "ISO 9001 gecertificeerd — kwaliteitsmanagement VoltFix",
    label: "ISO 9001 gecertificeerd",
    title: "Kwaliteit geborgd",
    text: "We werken volgens vaste processen voor voorbereiding, uitvoering, controle en verbetering.",
  },
  {
    key: "leerbedrijf",
    src: leerbedrijfBadge.url,
    alt: "Erkend leerbedrijf — VoltFix leidt elektriciens op",
    label: "Erkend leerbedrijf",
    title: "Vakmanschap voor de toekomst",
    text: "Als erkend leerbedrijf investeren we actief in de opleiding en ontwikkeling van elektriciens.",
  },
];

/** Compacte trust-strip direct onder de hero. */
export function CertificationStrip() {
  return (
    <section
      id="certificeringen"
      aria-labelledby="cert-strip-heading"
      className="scroll-mt-24 bg-surface"
    >
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
        <div className="text-center">
          <h2
            id="cert-strip-heading"
            className="text-xl font-bold text-foreground sm:text-2xl"
          >
            Gecertificeerd vakmanschap
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Veilig, gecontroleerd en professioneel uitgevoerd.
          </p>
        </div>

        <ul className="mx-auto mt-6 grid max-w-3xl auto-rows-fr grid-cols-3 items-stretch gap-2 sm:mt-8 sm:gap-6">
          {certs.map((c) => (
            <li
              key={c.key}
              className="flex h-full min-w-0 flex-col items-center justify-start rounded-xl border border-border bg-background p-3 text-center shadow-sm sm:p-5"
            >
              <div className="aspect-square w-full max-w-[80px] shrink-0 sm:max-w-[112px]">
                <img
                  src={c.src}
                  alt={c.alt}
                  width={224}
                  height={224}
                  loading="lazy"
                  className="h-full w-full object-contain"
                />
              </div>
              <p className="mt-2 text-[11px] font-semibold leading-tight text-foreground sm:mt-3 sm:text-sm">
                {c.label}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Uitgebreide trust-sectie: drie cards met korte uitleg. */
export function CertificationCards() {
  return (
    <section
      id="vakwerk-vertrouwen"
      aria-labelledby="cert-cards-heading"
      className="scroll-mt-24 bg-surface"
    >
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="cert-cards-heading" className="text-3xl font-bold text-foreground">
            Vakwerk waarop je kunt vertrouwen
          </h2>
          <p className="mt-3 text-muted-foreground">
            Bij VoltFix combineren we praktisch vakmanschap met aantoonbare aandacht voor
            veiligheid, kwaliteit en opleiding.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {certs.map((c) => (
            <article
              key={c.key}
              className="flex flex-col items-center rounded-2xl border border-border bg-background p-6 text-center shadow-sm transition-colors hover:border-primary/40"
            >
              <div className="flex aspect-square w-28 items-center justify-center">
                <img
                  src={c.src}
                  alt={c.alt}
                  width={280}
                  height={280}
                  loading="lazy"
                  className="h-full w-full object-contain"
                />
              </div>
              <span className="mt-3 inline-block rounded-full bg-butter px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-butter-foreground">
                {c.label}
              </span>
              <h3 className="mt-3 text-lg font-semibold text-foreground">{c.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Kleine footer-strip met de drie badges naast elkaar. */
export function CertificationFooterMark() {
  return (
    <div className="border-t border-white/15">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-5 text-xs text-white/75 sm:flex-row sm:justify-between">
        <span className="font-semibold uppercase tracking-wide text-white/80">
          Gecertificeerd &amp; erkend
        </span>
        <ul className="flex items-center gap-4 sm:gap-6">
          {certs.map((c) => (
            <li key={c.key} className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-white/95 p-1">
                <img
                  src={c.src}
                  alt={c.alt}
                  width={80}
                  height={80}
                  loading="lazy"
                  className="h-full w-full object-contain"
                />
              </span>
              <span className="hidden text-white/80 sm:inline">{c.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
