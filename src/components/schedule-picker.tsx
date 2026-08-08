import { useMemo, useState } from "react";
import { CalendarClock, CalendarPlus, CheckCircle2, Clock, Phone, Sparkles, Zap } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  amsterdamNow,
  buildDayOption,
  generateDayOptions,
  parseKey,
  type DayOption,
  type Lang,
  type SlotOption,
} from "@/lib/schedule";
import { business, telHref } from "@/lib/business";
import { cn } from "@/lib/utils";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { trackConversion as trackConversionEvent, trackLeadSuccess } from "@/lib/analytics";




interface Props {
  location?: string;
  lang?: Lang;
}

type Step = "pick" | "contact" | "done";

const COPY = {
  nl: {
    title: "Kies je aankomsttijd",
    subtitle: "De elektricien arriveert binnen het gekozen uur in Amsterdam",
    chosenDate: "Gekozen datum",
    pickOther: "Andere datum kiezen…",
    pickOtherActive: "Andere datum kiezen",
    eveningSurcharge: "avondtoeslag",
    full: "vol",
    ctaContinue: "Verder — vul je gegevens in",
    ctaPickFirst: "Kies eerst een tijdslot",
    change: "wijzig",
    name: "Naam",
    phone: "Telefoon",
    email: "E-mail (optioneel — voor bevestiging)",
    postcode: "Postcode",
    address: "Straat + huisnr",
    notes: "Opmerking (optioneel) — bijv. type kookplaat",
    consent: "Ik ga akkoord dat VoltFix mijn gegevens gebruikt om contact op te nemen over deze afspraak.",
    consentRequired: "Bevestig eerst de toestemming om verder te gaan.",
    reserve: "Reserveer dit tijdslot",
    reserving: "Bezig met versturen…",
    reserveNote: "Geen betaling nodig · we bevestigen zsm per WhatsApp of telefoon",
    orDivider: "of stuur direct met je voorkeur",
    whatsapp: "Stuur via WhatsApp",
    call: "Bel direct",
    errorGeneric: "Versturen mislukt. Probeer opnieuw of gebruik WhatsApp/Bel hieronder.",
    waIntro: "Hoi VoltFix, ik wil graag een afspraak inplannen",

    urgentTitle: "Snelle hulp nodig?",
    urgentText:
      "Voor afspraken binnen 48 uur is bellen of WhatsApp sneller. We kunnen je meteen inplannen of direct langskomen.",
    urgentCall: "Bel sneller",
    urgentWhatsApp: "WhatsApp sneller",
    stillBook: "Toch online boeken",

    doneTitle: "Voorkeur ontvangen — we bevestigen zsm",
    doneYou: "je",
    donePrefix: (name: string, phone: string) => (
      <>
        We bellen of appen {name} op <strong>{phone}</strong> om je installatie op{" "}
      </>
    ),
    doneSuffix: "definitief in te plannen.",
    doneFallback: "Nog niets ontvangen? Bel direct — dan lossen we het meteen op.",
    locale: "nl-NL" as const,
  },
  en: {
    title: "Choose your arrival time",
    subtitle: "The electrician arrives within the selected hour in Amsterdam",
    chosenDate: "Chosen date",
    pickOther: "Pick another date…",
    pickOtherActive: "Pick another date",
    eveningSurcharge: "evening surcharge",
    full: "full",
    ctaContinue: "Continue — enter your details",
    ctaPickFirst: "Pick a time slot first",
    change: "change",
    name: "Name",
    phone: "Phone",
    email: "Email (optional — for confirmation)",
    postcode: "Postcode",
    address: "Street + number",
    notes: "Note (optional) — e.g. type of hob",
    consent: "I agree that VoltFix may use my details to contact me about this appointment.",
    consentRequired: "Please confirm consent to continue.",

    reserve: "Reserve this time slot",
    reserving: "Sending…",
    reserveNote: "No payment needed · we confirm asap by WhatsApp or phone",
    orDivider: "or send your preference directly",
    whatsapp: "Send via WhatsApp",
    call: "Call now",
    errorGeneric: "Sending failed. Please try again or use WhatsApp/Call below.",
    waIntro: "Hi VoltFix, I'd like to book an appointment",

    urgentTitle: "Need fast help?",
    urgentText:
      "For appointments within 48 hours, calling or WhatsApp is faster. We can schedule you immediately or come right over.",
    urgentCall: "Call faster",
    urgentWhatsApp: "WhatsApp faster",
    stillBook: "Book online anyway",

    doneTitle: "Preference received — we confirm asap",
    doneYou: "you",
    donePrefix: (name: string, phone: string) => (
      <>
        We'll call or WhatsApp {name} on <strong>{phone}</strong> to finalise your installation on{" "}
      </>
    ),
    doneSuffix: "",
    doneFallback: "Nothing received? Call directly — we'll sort it right away.",
    locale: "en-GB" as const,
  },
} as const;


function waHref(message: string) {
  const digits = business.phoneE164.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function isWithin48Hours(day: DayOption, slot: SlotOption, now: Date): boolean {
  const startHour = Number(slot.id.split(":")[0] ?? 0);
  const selected = parseKey(day.key);
  selected.setHours(startHour, 0, 0, 0);
  const diffHours = (selected.getTime() - now.getTime()) / 36e5;
  return diffHours > 0 && diffHours <= 48;
}

function buildScheduleMessage(

  t: (typeof COPY)[Lang],
  location: string,
  day: DayOption,
  slot: SlotOption,
  form: { name: string; phone: string; email: string; postcode: string; address: string; notes: string },
) {
  const lines = [
    `${t.waIntro} (${location}).`,
    ``,
    `📅 ${day.label} ${day.dateLabel} · ${slot.label} (${slot.time})`,
  ];
  if (form.name) lines.push(`👤 ${form.name}`);
  if (form.phone) lines.push(`📞 ${form.phone}`);
  if (form.email) lines.push(`✉️ ${form.email}`);
  const addr = [form.address, form.postcode].filter(Boolean).join(", ");

  if (addr) lines.push(`📍 ${addr}`);
  if (form.notes) lines.push(``, form.notes);
  return lines.join("\n");
}

function UrgentBanner({
  t,
  scheduleMessage,
  onStillBook,
  trackConversion,
}: {
  t: (typeof COPY)[Lang];
  scheduleMessage: string;
  onStillBook: () => void;
  trackConversion: (kind: "whatsapp" | "call") => void;
}) {

  return (
    <div className="rounded-xl border-2 border-butter bg-butter/10 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-butter text-butter-foreground">
          <Zap className="h-4 w-4" />
        </span>
        <div className="flex-1">
          <h4 className="font-bold text-foreground">{t.urgentTitle}</h4>
          <p className="mt-1 text-sm text-muted-foreground">{t.urgentText}</p>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <a
              href={waHref(scheduleMessage)}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackConversion("whatsapp")}
              data-conversion="whatsapp"
              data-source="schedule_picker_urgent"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-whatsapp px-4 text-sm font-bold text-whatsapp-foreground shadow-sm transition hover:brightness-110"
            >
              <WhatsAppIcon className="h-4 w-4" ariaLabel="WhatsApp" /> {t.urgentWhatsApp}
            </a>
            <a
              href={telHref}
              onClick={() => trackConversion("call")}
              data-conversion="call"
              data-source="schedule_picker_urgent"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border-2 border-primary bg-background px-4 text-sm font-bold text-primary shadow-sm transition hover:bg-primary/5"
            >
              <Phone className="h-4 w-4" /> {t.urgentCall}
            </a>
          </div>

          <button
            type="button"
            onClick={onStillBook}
            className="mt-3 text-xs font-semibold text-primary underline underline-offset-2 transition hover:text-primary/80"
          >
            {t.stillBook}
          </button>
        </div>
      </div>
    </div>
  );
}

export function SchedulePicker({ location = "perilex", lang = "nl" }: Props) {
  const t = COPY[lang];
  const quickDays = useMemo(() => generateDayOptions(amsterdamNow(), lang), [lang]);

  const [customDate, setCustomDate] = useState<Date | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);

  const quickKeys = useMemo(() => new Set(quickDays.map((d) => d.key)), [quickDays]);
  const customDay = useMemo<DayOption | null>(() => {
    if (!customDate) return null;
    const day = buildDayOption(customDate, amsterdamNow(), lang);
    if (quickKeys.has(day.key)) return null;
    return day;
  }, [customDate, quickKeys, lang]);

  const days = useMemo<DayOption[]>(
    () => (customDay ? [...quickDays, customDay] : quickDays),
    [quickDays, customDay],
  );

  const [dayKey, setDayKey] = useState<string>(quickDays[0]?.key ?? "");
  const [slotId, setSlotId] = useState<SlotOption["id"] | null>(null);
  const [step, setStep] = useState<Step>("pick");
  const [form, setForm] = useState({ name: "", phone: "", email: "", postcode: "", address: "", notes: "" });
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const activeDay: DayOption | undefined = days.find((d) => d.key === dayKey);
  const activeSlot = activeDay?.slots.find((s) => s.id === slotId);

  const minCalendarDate = new Date();
  minCalendarDate.setHours(0, 0, 0, 0);
  const maxCalendarDate = new Date();
  maxCalendarDate.setDate(maxCalendarDate.getDate() + 60);

  const scheduleMessage =
    activeDay && activeSlot
      ? buildScheduleMessage(t, location, activeDay, activeSlot, form)
      : "";

  const urgent = Boolean(activeDay && activeSlot && isWithin48Hours(activeDay, activeSlot, amsterdamNow()));

  function trackConversion(kind: "whatsapp" | "call") {
    // Centrale trackingfunctie i.p.v. losse dataLayer-pushes: klikken blijven
    // interactie-events (geen generate_lead).
    trackConversionEvent({
      type: kind,
      language: lang,
      pagePath: typeof window !== "undefined" ? window.location.pathname : "/",
      location: `schedule-picker-${location}`,
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeDay || !activeSlot || submitting) return;
    if (!consent) {
      setError(t.consentRequired);
      return;
    }
    setSubmitting(true);
    setError(null);
    // Geen conversie-events vóór de POST.

    // Submit to existing quote endpoint so the customer + owner both get an email.
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("phone", form.phone);
      // Use real email when provided; fall back to placeholder so the owner alert still fires.
      const emailValue = form.email.trim()
        ? form.email.trim()
        : `${form.phone.replace(/\D/g, "") || "afspraak"}@no-email.voltfix.nl`;
      fd.append("email", emailValue);
      fd.append("postalCode", form.postcode);
      fd.append("jobType", `Afspraak · ${location}`);

      const messageBody = [
        `📅 Ingeplande voorkeur: ${activeDay.label} ${activeDay.dateLabel} · ${activeSlot.label} (${activeSlot.time})`,
        `📍 ${form.address}, ${form.postcode}`,
        form.notes ? `\n${form.notes}` : "",
      ]
        .filter(Boolean)
        .join("\n");
      fd.append("message", messageBody);
      fd.append("locale", lang);
      fd.append("appointmentDate", `${activeDay.label} ${activeDay.dateLabel} (${activeDay.key})`);
      fd.append("appointmentSlot", `${activeSlot.label}`);
      fd.append("appointmentNote", activeSlot.time);
      if (typeof window !== "undefined") fd.append("sourcePath", window.location.pathname);

      const res = await fetch("/api/public/quote-request", { method: "POST", body: fd });
      const data = (await res.json().catch(() => ({}))) as { success?: boolean; id?: string };
      if (!res.ok || !data.success) throw new Error(`HTTP ${res.status}`);
      // Bevestigde boeking: één keer schedule_request_success met server-lead-ID.
      if (data.id) {
        trackLeadSuccess({
          type: "schedule",
          leadId: String(data.id),
          language: lang,
          pagePath: typeof window !== "undefined" ? window.location.pathname : "/",
          location: `schedule-picker-${location}`,
        });
      }
      setStep("done");
    } catch (err) {
      console.error("Schedule submit failed", err);
      setError(t.errorGeneric);
    } finally {
      setSubmitting(false);
    }
  }


  if (step === "done") {
    const doneWa = activeDay && activeSlot ? scheduleMessage : t.waIntro;
    return (
      <section className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
          <div className="w-full">
            <h3 className="text-xl font-bold text-foreground">{t.doneTitle}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t.donePrefix(form.name || t.doneYou, form.phone)}
              <strong>
                {activeDay?.label.toLowerCase()} {activeDay?.dateLabel} · {activeSlot?.label} ({activeSlot?.time})
              </strong>{" "}
              {t.doneSuffix}
            </p>
            <p className="mt-3 text-xs text-muted-foreground">{t.doneFallback}</p>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <a
                href={waHref(doneWa)}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackConversion("whatsapp")}
                data-conversion="whatsapp"
                data-source="schedule_picker_done"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-whatsapp px-4 text-sm font-bold text-whatsapp-foreground shadow-sm transition hover:brightness-110"
              >
                <WhatsAppIcon className="h-4 w-4" ariaLabel="WhatsApp" /> {t.whatsapp}
              </a>
              <a
                href={telHref}
                onClick={() => trackConversion("call")}
                data-conversion="call"
                data-source="schedule_picker_done"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border-2 border-primary bg-background px-4 text-sm font-bold text-primary shadow-sm transition hover:bg-primary/5"
              >
                <Phone className="h-4 w-4" /> {t.call} · {business.phoneDisplay}
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-background p-5 shadow-sm sm:p-7">
      <div className="mb-4 flex items-center gap-2">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-butter text-butter-foreground">
          <CalendarClock className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-lg font-bold leading-tight text-foreground sm:text-xl">{t.title}</h3>
          <p className="text-xs text-muted-foreground">{t.subtitle}</p>
        </div>
      </div>

      {step === "pick" && (
        <>
          {/* Dagkeuze */}
          <div className={cn("grid gap-2", days.length >= 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3")}>
            {days.map((d) => {
              const active = d.key === dayKey;
              const isCustom = customDay?.key === d.key;
              return (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => {
                    setDayKey(d.key);
                    setSlotId(null);
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-xl border-2 px-2 py-3 text-center transition",
                    active
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-background text-foreground hover:border-primary/40",
                  )}
                >
                  <span className="text-xs font-bold uppercase tracking-wide">
                    {isCustom ? t.chosenDate : d.label}
                  </span>
                  <span className="mt-0.5 text-sm font-semibold">
                    {d.dayName} {d.dateLabel}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Andere datum trigger */}
          <div className="mt-2">
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-primary/40 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/10"
                >
                  <CalendarPlus className="h-3.5 w-3.5" />
                  {customDay ? t.pickOtherActive : t.pickOther}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customDate}
                  onSelect={(d) => {
                    if (!d) return;
                    setCustomDate(d);
                    const day = buildDayOption(d, amsterdamNow(), lang);
                    setDayKey(day.key);
                    setSlotId(null);
                    setCalendarOpen(false);
                  }}
                  disabled={{ before: minCalendarDate, after: maxCalendarDate }}
                  weekStartsOn={1}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Slotkeuze — concrete 1-uurs aankomstslots */}
          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {activeDay?.slots.map((s) => {
              const active = s.id === slotId;
              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={s.full}
                  onClick={() => setSlotId(s.id)}
                  className={cn(
                    "relative flex flex-col items-start gap-0.5 rounded-xl border-2 p-2.5 text-left transition sm:p-3",
                    s.full && "cursor-not-allowed border-border bg-muted/40 text-muted-foreground opacity-60",
                    !s.full && active && "border-primary bg-primary/5",
                    !s.full && !active && "border-border bg-background hover:border-primary/40",
                  )}
                >
                  <span className="flex items-center gap-1 text-sm font-bold">
                    <Clock className="h-3.5 w-3.5" /> {s.label}
                  </span>
                  <span className="text-[11px] leading-tight text-muted-foreground">{s.time}</span>
                  {s.surcharge && !s.full && (
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-butter/70 px-1.5 py-0.5 text-[10px] font-bold text-butter-foreground">
                      <Sparkles className="h-3 w-3" /> {t.eveningSurcharge}
                    </span>
                  )}
                  {s.full && (
                    <span className="mt-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase">
                      {t.full}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            disabled={!slotId}
            onClick={() => setStep("contact")}
            className={cn(
              "mt-5 inline-flex h-12 w-full items-center justify-center rounded-xl px-5 text-sm font-bold shadow-sm transition",
              slotId
                ? "bg-whatsapp text-whatsapp-foreground hover:brightness-110"
                : "cursor-not-allowed bg-muted text-muted-foreground",
            )}
          >
            {slotId ? t.ctaContinue : t.ctaPickFirst}
          </button>

          {/* Snelle route tonen bij keuzes binnen 48 uur */}
          {urgent && activeDay && activeSlot && (
            <div className="mt-3">
              <UrgentBanner
                t={t}
                scheduleMessage={scheduleMessage}
                onStillBook={() => setStep("contact")}
                trackConversion={trackConversion}
              />
            </div>
          )}

          {/* Direct WhatsApp/Bel shortcut zodra een slot is gekozen (niet-urgent) */}
          {activeDay && activeSlot && !urgent && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <a
                href={waHref(scheduleMessage)}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackConversion("whatsapp")}
                data-conversion="whatsapp"
                data-source="schedule_picker_pick"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border-2 border-whatsapp bg-background px-4 text-sm font-bold text-whatsapp transition hover:bg-whatsapp/10"
              >
                <WhatsAppIcon className="h-4 w-4" ariaLabel="WhatsApp" /> {t.whatsapp}
              </a>
              <a
                href={telHref}
                onClick={() => trackConversion("call")}
                data-conversion="call"
                data-source="schedule_picker_pick"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border-2 border-primary bg-background px-4 text-sm font-bold text-primary transition hover:bg-primary/5"
              >
                <Phone className="h-4 w-4" /> {t.call}
              </a>
            </div>
          )}
        </>
      )}


      {step === "contact" && activeDay && activeSlot && (
        <form onSubmit={submit} className="grid gap-3">
          {urgent && (
            <UrgentBanner
              t={t}
              scheduleMessage={scheduleMessage}
              onStillBook={() => {}}
              trackConversion={trackConversion}
            />
          )}

          <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
            <div className="font-semibold text-foreground">
              {activeDay.label} {activeDay.dateLabel} · {activeSlot.label} ({activeSlot.time})
            </div>
            <button
              type="button"
              onClick={() => setStep("pick")}
              className="mt-1 text-xs font-medium text-primary underline underline-offset-2"
            >
              {t.change}
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">

            <input
              required
              placeholder={t.name}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="h-11 rounded-lg border border-border bg-background px-3 text-sm"
            />
            <input
              required
              type="tel"
              placeholder={t.phone}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="h-11 rounded-lg border border-border bg-background px-3 text-sm"
            />
            <input
              required
              placeholder={t.postcode}
              value={form.postcode}
              onChange={(e) => setForm({ ...form, postcode: e.target.value })}
              className="h-11 rounded-lg border border-border bg-background px-3 text-sm"
            />
            <input
              required
              placeholder={t.address}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="h-11 rounded-lg border border-border bg-background px-3 text-sm"
            />
          </div>
          <input
            type="email"
            placeholder={t.email}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="h-11 rounded-lg border border-border bg-background px-3 text-sm"
          />
          <textarea
            rows={2}
            placeholder={t.notes}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="rounded-lg border border-border bg-background p-3 text-sm"
          />

          <label className="flex items-start gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary"
              required
            />
            <span>{t.consent}</span>
          </label>


          <button
            type="submit"
            disabled={submitting}
            className={cn(
              "mt-1 inline-flex h-12 w-full items-center justify-center rounded-xl px-5 text-sm font-bold shadow-sm transition",
              submitting
                ? "cursor-wait bg-muted text-muted-foreground"
                : "bg-whatsapp text-whatsapp-foreground hover:brightness-110",
            )}
          >
            {submitting ? t.reserving : t.reserve}
          </button>
          <p className="text-center text-xs text-muted-foreground">{t.reserveNote}</p>

          {error && (
            <p className="rounded-lg border border-destructive/40 bg-destructive/5 p-2 text-center text-xs text-destructive">
              {error}
            </p>
          )}

          <div className="mt-1 flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            {t.orDivider}
            <span className="h-px flex-1 bg-border" />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <a
              href={waHref(scheduleMessage)}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackConversion("whatsapp")}
              data-conversion="whatsapp"
              data-source="schedule_picker_contact"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-whatsapp px-4 text-sm font-bold text-whatsapp-foreground shadow-sm transition hover:brightness-110"
            >
              <WhatsAppIcon className="h-4 w-4" ariaLabel="WhatsApp" /> {t.whatsapp}
            </a>
            <a
              href={telHref}
              onClick={() => trackConversion("call")}
              data-conversion="call"
              data-source="schedule_picker_contact"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border-2 border-primary bg-background px-4 text-sm font-bold text-primary shadow-sm transition hover:bg-primary/5"
            >
              <Phone className="h-4 w-4" /> {t.call} · {business.phoneDisplay}
            </a>
          </div>
        </form>
      )}
    </section>
  );
}
