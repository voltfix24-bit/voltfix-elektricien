import { useMemo, useState } from "react";
import { CalendarClock, CalendarPlus, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  buildDayOption,
  generateDayOptions,
  type DayOption,
  type Lang,
  type SlotOption,
} from "@/lib/schedule";
import { cn } from "@/lib/utils";

interface Props {
  location?: string;
  lang?: Lang;
}

type Step = "pick" | "contact" | "done";

const COPY = {
  nl: {
    title: "Kies je installatie-moment",
    subtitle: "Snel op locatie in Amsterdam · plan tot 60 dagen vooruit",
    chosenDate: "Gekozen datum",
    pickOther: "Andere datum kiezen…",
    pickOtherActive: "Andere datum kiezen",
    eveningSurcharge: "avondtoeslag",
    full: "vol",
    ctaContinue: "Verder — vul je gegevens in",
    ctaPickFirst: "Kies eerst een dagdeel",
    change: "wijzig",
    name: "Naam",
    phone: "Telefoon",
    postcode: "Postcode",
    address: "Straat + huisnr",
    notes: "Opmerking (optioneel) — bijv. type kookplaat",
    reserve: "Reserveer dit moment",
    reserveNote: "Geen betaling nodig · we bevestigen binnen 15 min per WhatsApp of telefoon",
    doneTitle: "Voorkeur ontvangen — we bevestigen binnen 15 min",
    doneYou: "je",
    donePrefix: (name: string, phone: string) => (
      <>
        We bellen of appen {name} op <strong>{phone}</strong> om je installatie op{" "}
      </>
    ),
    doneSuffix: "definitief in te plannen.",
    doneFallback: "Nog niet ontvangen binnen 15 min? Bel direct — dan lossen we het meteen op.",
    locale: "nl-NL" as const,
  },
  en: {
    title: "Pick your installation slot",
    subtitle: "Fast on-site in Amsterdam · plan up to 60 days ahead",
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
    postcode: "Postcode",
    address: "Street + number",
    notes: "Note (optional) — e.g. type of hob",
    reserve: "Reserve this slot",
    reserveNote: "No payment needed · we confirm within 15 min by WhatsApp or phone",
    doneTitle: "Preference received — we confirm within 15 min",
    doneYou: "you",
    donePrefix: (name: string, phone: string) => (
      <>
        We'll call or WhatsApp {name} on <strong>{phone}</strong> to finalise your installation on{" "}
      </>
    ),
    doneSuffix: "",
    doneFallback: "Nothing received within 15 min? Call directly — we'll sort it right away.",
    locale: "en-GB" as const,
  },
} as const;

export function SchedulePicker({ location = "perilex", lang = "nl" }: Props) {
  const t = COPY[lang];
  const quickDays = useMemo(() => generateDayOptions(new Date(), lang), [lang]);
  const [customDate, setCustomDate] = useState<Date | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);

  const quickKeys = useMemo(() => new Set(quickDays.map((d) => d.key)), [quickDays]);
  const customDay = useMemo<DayOption | null>(() => {
    if (!customDate) return null;
    const day = buildDayOption(customDate, new Date(), lang);
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
  const [form, setForm] = useState({ name: "", phone: "", postcode: "", address: "", notes: "" });

  const activeDay: DayOption | undefined = days.find((d) => d.key === dayKey);
  const activeSlot = activeDay?.slots.find((s) => s.id === slotId);

  const minCalendarDate = new Date();
  minCalendarDate.setHours(0, 0, 0, 0);
  const maxCalendarDate = new Date();
  maxCalendarDate.setDate(maxCalendarDate.getDate() + 60);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (typeof window !== "undefined") {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: "schedule_request",
        schedule_day: activeDay?.label,
        schedule_date: activeDay?.key,
        schedule_slot: activeSlot?.id,
        schedule_location: location,
        schedule_lang: lang,
      });
    }
    setStep("done");
  }

  if (step === "done") {
    return (
      <section className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
          <div>
            <h3 className="text-xl font-bold text-foreground">{t.doneTitle}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t.donePrefix(form.name || t.doneYou, form.phone)}
              <strong>
                {activeDay?.label.toLowerCase()} {activeDay?.dateLabel} — {activeSlot?.label.toLowerCase()} (
                {activeSlot?.time})
              </strong>{" "}
              {t.doneSuffix}
            </p>
            <p className="mt-3 text-xs text-muted-foreground">{t.doneFallback}</p>
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
                    const day = buildDayOption(d, new Date(), lang);
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

          {/* Slotkeuze */}
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {activeDay?.slots.map((s) => {
              const active = s.id === slotId;
              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={s.full}
                  onClick={() => setSlotId(s.id)}
                  className={cn(
                    "relative flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-left transition",
                    s.full && "cursor-not-allowed border-border bg-muted/40 text-muted-foreground opacity-60",
                    !s.full && active && "border-primary bg-primary/5",
                    !s.full && !active && "border-border bg-background hover:border-primary/40",
                  )}
                >
                  <span className="flex items-center gap-1.5 text-sm font-bold">
                    <Clock className="h-3.5 w-3.5" /> {s.label}
                  </span>
                  <span className="text-xs text-muted-foreground">{s.time}</span>
                  {s.surcharge && !s.full && (
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-butter/70 px-2 py-0.5 text-[10px] font-bold text-butter-foreground">
                      <Sparkles className="h-3 w-3" /> {t.eveningSurcharge}
                    </span>
                  )}
                  {s.full && (
                    <span className="mt-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase">
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
        </>
      )}

      {step === "contact" && activeDay && activeSlot && (
        <form onSubmit={submit} className="grid gap-3">
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
          <textarea
            rows={2}
            placeholder={t.notes}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="rounded-lg border border-border bg-background p-3 text-sm"
          />

          <button
            type="submit"
            className="mt-1 inline-flex h-12 w-full items-center justify-center rounded-xl bg-whatsapp px-5 text-sm font-bold text-whatsapp-foreground shadow-sm transition hover:brightness-110"
          >
            {t.reserve}
          </button>
          <p className="text-center text-xs text-muted-foreground">{t.reserveNote}</p>
        </form>
      )}
    </section>
  );
}
