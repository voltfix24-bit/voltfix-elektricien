import { createFileRoute } from "@tanstack/react-router";
import { Clock, Instagram, Linkedin, Mail, MapPin, Phone } from "lucide-react";

import { ContactForm } from "@/components/contact-form";
import { Button } from "@/components/ui/button";
import { absoluteUrl, altLinks, contactPageSchema, ldScript, ogImage, pageMeta } from "@/lib/seo";
import { useTrackConversion, useTrackSocialClick } from "@/lib/analytics";
import {
  business,
  instagramHref,
  linkedinHref,
  mailHref,
  serviceAreas,
  telHref,
  whatsappHref,
} from "@/lib/business";
import { useLocale, usePathname } from "@/lib/i18n";
import { whatsappMessageFor } from "@/lib/whatsapp-messages";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";


const path = "/contact";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: pageMeta({
      title: "Offerte Elektricien Amsterdam | Contact VoltFix",
      description:
        "Neem contact op met VoltFix, elektricien in Amsterdam. Bel, WhatsApp of vraag online een offerte aan. Snel antwoord en een vaste prijs vooraf.",
      path,
      ogType: "website",
    }),
    links: [{ rel: "canonical", href: absoluteUrl(path) }, ...altLinks(path)],
    scripts: [
      ldScript(
        contactPageSchema({
          path,
          name: "Contact VoltFix — elektricien Amsterdam",
          description:
            "Contactgegevens van VoltFix: adres in Amsterdam, telefoonnummer, WhatsApp en e-mail voor offertes en spoed.",
          locale: "nl",
        }),
      ),
    ],
  }),
  component: Page,
});

function Page() {
  const track = useTrackConversion();
  const trackSocial = useTrackSocialClick();
  const locale = useLocale();
  const pagePath = usePathname();
  return (
    <>
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute inset-0 bg-grid-brand opacity-50" aria-hidden />
        <div className="relative mx-auto max-w-3xl px-4 py-14 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-semibold text-white">
            <Clock className="h-3.5 w-3.5" /> Snel antwoord, ook bij spoed
          </span>
          <h1 className="mt-5 text-4xl font-bold text-balance text-white sm:text-5xl">
            Contact &amp; offerte aanvragen
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/85">
            Direct hulp nodig of een vrijblijvende offerte? Bel ons, stuur een WhatsApp of vul het
            formulier in. VoltFix helpt u snel verder in heel Amsterdam.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-14 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-bold">Direct contact</h2>
          <p className="mt-2 text-muted-foreground">
            Voor spoed is bellen of WhatsApp het snelst. Voor een offerte gebruikt u het formulier
            hiernaast.
          </p>

          <div className="mt-6 space-y-3">
            <a
              href={telHref}
              className="gtm-cta-call flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
              data-gtm="cta-call"
              data-gtm-location="contact"
              onClick={() => track("call", "contact")}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive text-destructive-foreground">
                <Phone className="h-6 w-6" />
              </span>
              <span>
                <span className="block text-sm text-muted-foreground">Bel direct</span>
                <span className="block text-lg font-bold">{business.phoneDisplay}</span>
              </span>
            </a>

            <a
              href={whatsappHref(whatsappMessageFor("/contact", "nl"), {
                campaign: "/contact",
                content: "contact-page",
                term: "nl",
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="gtm-cta-whatsapp flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-whatsapp/60"
              data-gtm="cta-whatsapp"
              data-gtm-location="contact"
              onClick={() => track("whatsapp", "contact")}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-whatsapp text-whatsapp-foreground">
                <WhatsAppIcon className="h-6 w-6" ariaLabel="WhatsApp" />
              </span>
              <span>
                <span className="block text-sm text-muted-foreground">WhatsApp</span>
                <span className="block text-lg font-bold">Stuur een bericht</span>
              </span>
            </a>

            <a
              href={mailHref}
              className="gtm-cta-email flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
              data-gtm="cta-email"
              data-gtm-location="contact"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Mail className="h-6 w-6" />
              </span>
              <span>
                <span className="block text-sm text-muted-foreground">E-mail</span>
                <span className="block text-lg font-bold">{business.email}</span>
              </span>
            </a>
          </div>


          <div className="mt-8 rounded-xl border border-border bg-card p-5">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <Clock className="h-5 w-5 text-primary" /> Bereikbaarheid
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              <strong className="text-foreground">Spoed:</strong> 24 uur per dag, 7 dagen per week.
              <br />
              <strong className="text-foreground">Geplande klussen:</strong> ma–za, in overleg
              ingepland.
            </p>
          </div>

          <div className="mt-6 rounded-xl border border-border bg-card p-5">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <MapPin className="h-5 w-5 text-primary" /> Locatie
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              <strong className="text-foreground">Bezoekadres:</strong>{" "}
              {business.streetAddress}, {business.postalCode} {business.city}
              <br />
              <span className="text-muted-foreground/80">Alleen op afspraak.</span>
            </p>
            <figure className="mt-4 overflow-hidden rounded-xl border border-border">
              <div className="relative aspect-video">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4872.5080343776235!2d4.8691992!3d52.3646213!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c5e33f0c7e75c1%3A0xddb05aff60cced4d!2sVoltFix!5e0!3m2!1snl!2snl!4v1786961399265!5m2!1snl!2snl"
                  title="Locatie VoltFix in Amsterdam"
                  loading="lazy"
                  width="100%"
                  height="100%"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full border-0"
                />
              </div>
              <figcaption className="bg-background px-4 py-2 text-center text-xs text-muted-foreground">
                Bezoeklocatie VoltFix in Amsterdam — op afspraak
              </figcaption>
            </figure>
          </div>

          <div className="mt-6 rounded-xl border border-border bg-card p-5">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <MapPin className="h-5 w-5 text-primary" /> Werkgebied Amsterdam
            </h3>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-muted-foreground sm:grid-cols-3">
              {serviceAreas.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>

          <div className="mt-6 rounded-xl border border-border bg-card p-5">
            <h3 className="text-lg font-semibold">Bedrijfsgegevens</h3>
            <dl className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              <div className="flex justify-between gap-4">
                <dt>KvK-nummer</dt>
                <dd className="font-medium text-foreground">{business.kvk || "volgt"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>BTW-nummer</dt>
                <dd className="font-medium text-foreground">{business.btw || "volgt"}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div id="offerte">
          <h2 className="text-2xl font-bold">Vraag een offerte aan</h2>
          <p className="mt-2 text-muted-foreground">
            Vul uw gegevens in, dan nemen we zo snel mogelijk contact met u op.
          </p>
          <div className="mt-6">
            <ContactForm />
          </div>
          <div className="mt-4 sm:hidden">
            <Button asChild variant="call" size="xl" className="w-full">
              <a
                href={telHref}
                className="gtm-cta-call"
                data-gtm="cta-call"
                data-gtm-location="contact-form"
                onClick={() => track("call", "contact-form")}
              >
                <Phone /> Of bel direct: {business.phoneDisplay}
              </a>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
