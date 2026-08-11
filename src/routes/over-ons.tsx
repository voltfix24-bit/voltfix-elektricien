import { createFileRoute } from "@tanstack/react-router";
import {
  BadgeCheck,
  Clock,
  Heart,
  Instagram,
  Linkedin,
  MapPin,
  ShieldCheck,
  Users,
} from "lucide-react";

import monteurImg from "@/assets/voltfix-monteur.png.asset.json";
import { CtaBand } from "@/components/cta-band";
import { CtaButtons } from "@/components/cta-buttons";
import { TrustRow } from "@/components/trust-row";
import { useTrackSocialClick } from "@/lib/analytics";
import { business, instagramHref, linkedinHref } from "@/lib/business";
import { useLocale, usePathname } from "@/lib/i18n";
import { absoluteUrl, altLinks, ogImage, pageMeta } from "@/lib/seo";

const path = "/over-ons";

export const Route = createFileRoute("/over-ons")({
  head: () => ({
    meta: pageMeta({
      title: "Elektricien Amsterdam Over Ons | VoltFix",
      description:
        "Maak kennis met VoltFix, uw lokale elektricien in Amsterdam. Vakbekwaam, snel bereikbaar en eerlijk over de prijs. Lees ons verhaal.",
      path,
      ogType: "website",
    }),
    links: [{ rel: "canonical", href: absoluteUrl(path) }, ...altLinks(path)],
  }),
  component: Page,
});

function Page() {
  const trackSocial = useTrackSocialClick();
  const locale = useLocale();
  const pagePath = usePathname();
  return (
    <>
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute inset-0 bg-grid-brand opacity-50" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pt-14 pb-28 sm:py-14 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-semibold text-white">
              Lokaal &amp; vakbekwaam
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight text-balance text-white sm:text-5xl">
              Uw lokale elektricien in Amsterdam
            </h1>
            <p className="mt-4 text-lg text-white/85">
              VoltFix is opgericht vanuit één overtuiging: elektra-problemen verdienen een vakman
              die snel komt, eerlijk is over de prijs en het werk netjes oplevert. Geen gedoe,
              gewoon betrouwbaar vakwerk in heel Amsterdam.
            </p>
            <div className="mt-7">
              <CtaButtons location="over-ons-hero" onBrand />
            </div>
            <div className="mt-8">
              <TrustRow onBrand />
            </div>
          </div>
          <div className="flex max-h-[35vh] items-start justify-center pb-24 sm:max-h-none sm:items-center sm:pb-0">
            <img
              src={monteurImg.url}
              alt="VoltFix spoed elektricien in Amsterdam met multimeter-meetpennen, klaar voor een storingsmelding"
              width={815}
              height={996}
              className="h-full w-full object-contain"
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-14">
        <div className="space-y-5 text-[0.975rem] leading-relaxed text-muted-foreground">
          <h2 className="text-2xl font-bold text-foreground">Het verhaal van VoltFix</h2>
          <p>
            VoltFix is een Amsterdamse elektrotechnisch installateur met hart voor het vak. We
            kennen de stad, haar karakteristieke grachtenpanden en de moderne appartementen op
            IJburg en in Zuidoost. Die kennis maakt het verschil: we weten hoe oudere installaties
            in elkaar zitten en hoe we ze veilig naar de eisen van vandaag brengen.
          </p>
          <p>
            Of het nu gaat om een acute storing midden in de nacht, het vervangen van een verouderde
            groepenkast of het aansluiten van een nieuwe inductiekookplaat — wij pakken elke klus
            aan met dezelfde precisie en betrokkenheid. We leggen uit wat we doen, waarom we het
            doen en wat het kost. Zo houdt u altijd de regie.
          </p>
          <h2 className="text-2xl font-bold text-foreground">Waar wij voor staan</h2>
          <p>
            Vertrouwen verdien je niet met grote beloftes, maar met daden. Daarom werken we volgens
            de NEN 1010-norm, geven we garantie op ons werk en communiceren we altijd transparant.
            We laten uw woning netjes achter en denken met u mee over wat écht nodig is — niet over
            wat het meeste oplevert.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {[
            {
              icon: Clock,
              title: "Altijd bereikbaar",
              text: "24/7 spoedservice. Bij storingen vaak binnen 60 minuten ter plaatse.",
            },
            {
              icon: MapPin,
              title: "Echt lokaal",
              text: "Geen landelijk callcenter, maar een Amsterdamse vakman die de stad kent.",
            },
            {
              icon: BadgeCheck,
              title: "Transparant",
              text: "Vaste prijsafspraak vooraf. Geen verrassingen op de rekening.",
            },
            {
              icon: ShieldCheck,
              title: "Veilig & vakkundig",
              text: "Werk volgens NEN 1010 met garantie op materialen en uitvoering.",
            },
            {
              icon: Heart,
              title: "Betrokken",
              text: "We denken met u mee en adviseren eerlijk over wat nodig is.",
            },
            {
              icon: Users,
              title: "Voor iedereen",
              text: "Particulieren, VvE's en bedrijven in heel Amsterdam.",
            },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-xl border border-border bg-card p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-14">
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-foreground">Volg VoltFix online</h2>
          <p className="mt-3 text-muted-foreground">
            Blijf op de hoogte van onze klussen, tips en het laatste nieuws uit de Amsterdamse
            elektrotechniek.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <a
              href={instagramHref({ pagePath, location: "about-social", language: locale })}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Volg VoltFix op Instagram"
              className="gtm-cta-social group flex items-center gap-4 rounded-xl border border-border bg-background p-4 transition-colors hover:border-primary/30 hover:bg-primary/5"
              data-gtm="cta-social"
              data-gtm-event="social_click"
              data-gtm-location="about-social"
              data-gtm-network="instagram"
              data-gtm-page={pagePath}
              data-gtm-language={locale}
              onClick={() => trackSocial("instagram", "about-social")}
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                <Instagram className="h-6 w-6" />
              </span>
              <div>
                <h3 className="font-semibold text-foreground">Instagram</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Achter de schermen bij onze klussen in Amsterdam.
                </p>
              </div>
            </a>

            <a
              href={linkedinHref({ pagePath, location: "about-social", language: locale })}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Volg VoltFix op LinkedIn"
              className="gtm-cta-social group flex items-center gap-4 rounded-xl border border-border bg-background p-4 transition-colors hover:border-primary/30 hover:bg-primary/5"
              data-gtm="cta-social"
              data-gtm-event="social_click"
              data-gtm-location="about-social"
              data-gtm-network="linkedin"
              data-gtm-page={pagePath}
              data-gtm-language={locale}
              onClick={() => trackSocial("linkedin", "about-social")}
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                <Linkedin className="h-6 w-6" />
              </span>
              <div>
                <h3 className="font-semibold text-foreground">LinkedIn</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Bedrijfsnieuws, vacatures en vakinhoudelijke updates.
                </p>
              </div>
            </a>
          </div>
        </div>
      </section>

      <CtaBand
        title="Maak kennis met VoltFix"
        text="Vragen over een klus of benieuwd wat we voor u kunnen betekenen? Neem gerust vrijblijvend contact op."
      />
    </>
  );
}
