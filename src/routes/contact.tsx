import { createFileRoute } from "@tanstack/react-router";
import { Clock, Instagram, Linkedin, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import { ContactForm } from "@/components/contact-form";
import { Button } from "@/components/ui/button";
import { absoluteUrl, altLinks, ogImage, pageMeta } from "@/lib/seo";
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
            Direct hulp nodig of een vrijblijvende offerte? Bel ons, stuur een
            WhatsApp of vul het formulier in. VoltFix helpt u snel verder in heel
            Amsterdam.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-14 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-bold">Direct contact</h2>
          <p className="mt-2 text-muted-foreground">
            Voor spoed is bellen of WhatsApp het snelst. Voor een offerte
            gebruikt u het formulier hiernaast.
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
              href={whatsappHref(whatsappMessageFor("/contact", "nl"), { campaign: "/contact", content: "contact-page", term: "nl" })}
              target="_blank"
              rel="noopener noreferrer"
              className="gtm-cta-whatsapp flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-whatsapp/60"
              data-gtm="cta-whatsapp"
              data-gtm-location="contact"
              onClick={() => track("whatsapp", "contact")}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-whatsapp text-whatsapp-foreground">
                <MessageCircle className="h-6 w-6" />
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

            <a
              href={instagramHref({ pagePath, location: "contact", language: locale })}
              target="_blank"
              rel="noopener noreferrer"
              className="gtm-cta-social flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
              data-gtm="cta-social"
              data-gtm-event="social_click"
              data-gtm-location="contact"
              data-gtm-network="instagram"
              data-gtm-page={pagePath}
              data-gtm-language={locale}
              onClick={() => trackSocial("instagram", "contact")}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-white">
                <Instagram className="h-6 w-6" />
              </span>
              <span>
                <span className="block text-sm text-muted-foreground">Instagram</span>
                <span className="block text-lg font-bold">@voltfix_elektricien</span>
              </span>
            </a>

            <a
              href={linkedinHref({ pagePath, location: "contact", language: locale })}
              target="_blank"
              rel="noopener noreferrer"
              className="gtm-cta-social flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
              data-gtm="cta-social"
              data-gtm-event="social_click"
              data-gtm-location="contact"
              data-gtm-network="linkedin"
              data-gtm-page={pagePath}
              data-gtm-language={locale}
              onClick={() => trackSocial("linkedin", "contact")}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#0A66C2] text-white">
                <Linkedin className="h-6 w-6" />
              </span>
              <span>
                <span className="block text-sm text-muted-foreground">LinkedIn</span>
                <span className="block text-lg font-bold">VoltFix</span>
              </span>
            </a>

          </div>

          <div className="mt-8 rounded-xl border border-border bg-card p-5">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <Clock className="h-5 w-5 text-primary" /> Bereikbaarheid
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              <strong className="text-foreground">Spoed:</strong> 24 uur per dag, 7
              dagen per week.
              <br />
              <strong className="text-foreground">Geplande klussen:</strong> ma–za,
              in overleg ingepland.
            </p>
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

        <div>
          <h2 className="text-2xl font-bold">Vraag een offerte aan</h2>
          <p className="mt-2 text-muted-foreground">
            Vul uw gegevens in, dan nemen we zo snel mogelijk contact met u op.
          </p>
          <div className="mt-6">
            <ContactForm />
          </div>
          <div className="mt-4 sm:hidden">
            <Button asChild variant="call" size="xl" className="w-full">
              <a href={telHref} className="gtm-cta-call" data-gtm="cta-call" data-gtm-location="contact-form" onClick={() => track("call", "contact-form")}>
                <Phone /> Of bel direct: {business.phoneDisplay}
              </a>
            </Button>
          </div>

        </div>
      </section>
    </>
  );
}
