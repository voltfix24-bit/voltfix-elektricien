import { createFileRoute } from "@tanstack/react-router";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import { ContactForm } from "@/components/contact-form";
import { Button } from "@/components/ui/button";
import {
  business,
  defaultWhatsappMessage,
  mailHref,
  serviceAreas,
  telHref,
  whatsappHref,
} from "@/lib/business";

const path = "/contact";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact & Offerte | Elektricien Amsterdam | VoltFix" },
      {
        name: "description",
        content:
          "Neem contact op met VoltFix, uw elektricien in Amsterdam. Bel direct, stuur een WhatsApp of vraag online een offerte aan. Snel antwoord en een vaste prijs vooraf.",
      },
      { property: "og:title", content: "Contact & Offerte | VoltFix Amsterdam" },
      {
        property: "og:description",
        content: "Bel, WhatsApp of vraag een offerte aan bij uw lokale elektricien in Amsterdam.",
      },
      { property: "og:url", content: path },
    ],
    links: [{ rel: "canonical", href: path }],
  }),
  component: Page,
});

function Page() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-grid opacity-40" aria-hidden />
        <div className="mx-auto max-w-3xl px-4 py-14 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Clock className="h-3.5 w-3.5" /> Snel antwoord, ook bij spoed
          </span>
          <h1 className="mt-5 text-4xl font-bold text-balance sm:text-5xl">
            Contact &amp; offerte aanvragen
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
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
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Phone className="h-6 w-6" />
              </span>
              <span>
                <span className="block text-sm text-muted-foreground">Bel direct</span>
                <span className="block text-lg font-bold">{business.phoneDisplay}</span>
              </span>
            </a>

            <a
              href={whatsappHref(defaultWhatsappMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-whatsapp/60"
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
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
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
            <Button asChild variant="gold" size="xl" className="w-full">
              <a href={telHref}>
                <Phone /> Of bel direct: {business.phoneDisplay}
              </a>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
