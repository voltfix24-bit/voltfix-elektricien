import { useState } from "react";
import { Clock, Phone } from "lucide-react";

import { business, telHref, whatsappHref } from "@/lib/business";
import { useTrackConversion } from "@/lib/analytics";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";


type Lang = "nl" | "en";

const COPY: Record<Lang, {
  badge: string;
  title: string;
  sub: string;
  name: string;
  namePh: string;
  phone: string;
  phonePh: string;
  note: string;
  notePh: string;
  submit: string;
  or: string;
  callNow: string;
  reply: string;
  privacy: string;
}> = {
  nl: {
    badge: "Antwoord zsm",
    title: "Laat u terugbellen",
    sub: "Vul uw gegevens in — wij nemen zo snel mogelijk contact op met een vaste prijs voor uw perilex.",
    name: "Naam",
    namePh: "Uw naam",
    phone: "Telefoon",
    phonePh: "06 …",
    note: "Toelichting (optioneel)",
    notePh: "Bijv. merk kookplaat of adres in Amsterdam",
    submit: "Stuur via WhatsApp",
    or: "of",
    callNow: "Bel direct",
    reply: "Reactie zo snel mogelijk · ma–zo 07:00–22:00",
    privacy: "Wij bellen alleen terug voor uw offerte. Geen spam.",
  },
  en: {
    badge: "Reply asap",
    title: "Request a call back",
    sub: "Fill in your details — we'll contact you as soon as possible with a fixed price for your perilex.",
    name: "Name",
    namePh: "Your name",
    phone: "Phone",
    phonePh: "+31 …",
    note: "Notes (optional)",
    notePh: "E.g. hob brand or address in Amsterdam",
    submit: "Send via WhatsApp",
    or: "or",
    callNow: "Call now",
    reply: "Reply as soon as possible · Mon–Sun 07:00–22:00",
    privacy: "We only call back about your quote. No spam.",
  },
};

type Props = {
  lang?: Lang;
  location?: string;
  topic?: string; // included in message
};

export function CallbackForm({ lang = "nl", location = "callback-form", topic }: Props) {
  const t = COPY[lang];
  const track = useTrackConversion();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");

  const buildMessage = () => {
    if (lang === "en") {
      return `Hi VoltFix, please call me back about a perilex${topic ? ` (${topic})` : ""}.\nName: ${name || "-"}\nPhone: ${phone || "-"}${note ? `\nNote: ${note}` : ""}`;
    }
    return `Hallo VoltFix, graag terugbellen over een perilex${topic ? ` (${topic})` : ""}.\nNaam: ${name || "-"}\nTelefoon: ${phone || "-"}${note ? `\nToelichting: ${note}` : ""}`;
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    track("whatsapp", location);
    const href = whatsappHref(buildMessage(), {
      campaign: "/perilex-amsterdam",
      content: location,
      term: lang,
    });
    window.open(href, "_blank", "noopener,noreferrer");
  };

  return (
    <section
      aria-label={t.title}
      className="rounded-2xl border border-primary/20 bg-card p-5 shadow-[var(--shadow-gold)] sm:p-6"
    >
      <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
        <Clock className="h-3.5 w-3.5" /> {t.badge}
      </div>
      <h2 className="text-xl font-bold sm:text-2xl">{t.title}</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">{t.sub}</p>

      <form onSubmit={onSubmit} className="mt-4 grid gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-foreground">{t.name}</span>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.namePh}
              className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-foreground">{t.phone}</span>
            <input
              type="tel"
              required
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t.phonePh}
              className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
            />
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-foreground">{t.note}</span>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t.notePh}
            className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
          />
        </label>

        <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="submit"
            data-gtm="cta-whatsapp"
            data-gtm-location={location}
            className="gtm-cta-whatsapp inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 text-sm font-bold text-white shadow-md transition hover:brightness-110"
          >
            <WhatsAppIcon className="h-4 w-4" /> {t.submit}
          </button>
          <span className="text-xs text-muted-foreground sm:mx-1">{t.or}</span>
          <a
            href={telHref}
            data-gtm="cta-call"
            data-gtm-location={location}
            onClick={() => track("call", location)}
            className="gtm-cta-call inline-flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-primary bg-background px-5 text-sm font-bold text-primary transition hover:bg-primary/5"
          >
            <Phone className="h-4 w-4" /> {t.callNow} {business.phoneDisplay}
          </a>
        </div>

        <p className="mt-1 text-xs text-muted-foreground">{t.reply}</p>
        <p className="text-[11px] text-muted-foreground/80">{t.privacy}</p>
      </form>
    </section>
  );
}
