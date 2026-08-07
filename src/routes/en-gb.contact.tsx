import { createFileRoute } from "@tanstack/react-router";
import { Clock, Mail, MapPin, Phone } from "lucide-react";

import { ContactForm } from "@/components/contact-form";
import { Button } from "@/components/ui/button";
import { absoluteUrl, altLinks, ogImage, pageMeta } from "@/lib/seo";
import { useTrackConversion } from "@/lib/analytics";
import { business, mailHref, serviceAreas, telHref, whatsappHref } from "@/lib/business";
import { whatsappMessageFor } from "@/lib/whatsapp-messages";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";


const nlPath = "/contact";
const enPath = "/en-gb/contact";

export const Route = createFileRoute("/en-gb/contact")({
  head: () => ({
    meta: pageMeta({
      title: "Contact & Quote | Electrician Amsterdam | VoltFix",
      description:
        "Get in touch with VoltFix, electrician in Amsterdam. Call, WhatsApp or request a quote online. Quick reply and a fixed price up front. English-speaking.",
      path: enPath,
      ogDescription: "Call, WhatsApp or request a quote from your local electrician in Amsterdam.",
      locale: "en",
    }),
    links: [{ rel: "canonical", href: absoluteUrl(enPath) }, ...altLinks(nlPath)],
  }),
  component: Page,
});

function Page() {
  const track = useTrackConversion();
  return (
    <>
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute inset-0 bg-grid-brand opacity-50" aria-hidden />
        <div className="relative mx-auto max-w-3xl px-4 py-14 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-semibold text-white">
            <Clock className="h-3.5 w-3.5" /> Quick reply, even for emergencies
          </span>
          <h1 className="mt-5 text-4xl font-bold text-balance text-white sm:text-5xl">
            Contact &amp; request a quote
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/85">
            Need help right away or a no-obligation quote? Call us, send a WhatsApp or fill in the
            form. VoltFix helps you quickly across Amsterdam.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-14 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-bold">Direct contact</h2>
          <p className="mt-2 text-muted-foreground">
            For emergencies, calling or WhatsApp is fastest. For a quote, use the form on the right.
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
                <span className="block text-sm text-muted-foreground">Call now</span>
                <span className="block text-lg font-bold">{business.phoneDisplay}</span>
              </span>
            </a>

            <a
              href={whatsappHref(whatsappMessageFor("/contact", "en"), {
                campaign: "/en-gb/contact",
                content: "contact-page",
                term: "en",
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="gtm-cta-whatsapp flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-whatsapp/60"
              data-gtm="cta-whatsapp"
              data-gtm-location="contact"
              onClick={() => track("whatsapp", "contact")}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-whatsapp text-whatsapp-foreground">
                <WhatsAppIcon className="h-6 w-6" />
              </span>
              <span>
                <span className="block text-sm text-muted-foreground">WhatsApp</span>
                <span className="block text-lg font-bold">Send a message</span>
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
                <span className="block text-sm text-muted-foreground">Email</span>
                <span className="block text-lg font-bold">{business.email}</span>
              </span>
            </a>
          </div>

          <div className="mt-8 rounded-xl border border-border bg-card p-5">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <Clock className="h-5 w-5 text-primary" /> Availability
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              <strong className="text-foreground">Emergencies:</strong> 24 hours a day, 7 days a
              week.
              <br />
              <strong className="text-foreground">Planned work:</strong> Mon–Sat, scheduled by
              arrangement.
            </p>
          </div>

          <div className="mt-6 rounded-xl border border-border bg-card p-5">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <MapPin className="h-5 w-5 text-primary" /> Service area Amsterdam
            </h3>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-muted-foreground sm:grid-cols-3">
              {serviceAreas.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>

          <div className="mt-6 rounded-xl border border-border bg-card p-5">
            <h3 className="text-lg font-semibold">Company details</h3>
            <dl className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              <div className="flex justify-between gap-4">
                <dt>Chamber of Commerce</dt>
                <dd className="font-medium text-foreground">{business.kvk || "to follow"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>VAT number</dt>
                <dd className="font-medium text-foreground">{business.btw || "to follow"}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div id="offerte">
          <h2 className="text-2xl font-bold">Request a quote</h2>
          <p className="mt-2 text-muted-foreground">
            Fill in your details and we'll get back to you as soon as possible.
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
                <Phone /> Or call directly: {business.phoneDisplay}
              </a>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
