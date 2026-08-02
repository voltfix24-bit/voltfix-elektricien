// Slot generator voor de planningstool.
// Genereert concrete 1-uurs aankomstslots (bijv. 14:00-15:00) in plaats van
// ruime dagdelen, zodat de klant weet binnen welk uur de elektricien arriveert.

export type Lang = "nl" | "en";
export type SlotId = string; // bijv. "14:00-15:00"

export interface SlotOption {
  id: SlotId;
  label: string; // "14:00 – 15:00"
  time: string; // "Aankomst in dit uur" / "Arrival within this hour"
  surcharge?: boolean;
  full?: boolean;
}

export interface DayOption {
  key: string; // YYYY-MM-DD
  label: string; // Vandaag / Today / …
  dayName: string; // ma / mon
  dateLabel: string; // 12 nov / 12 Nov
  slots: SlotOption[];
}

const DAY_NAMES: Record<Lang, string[]> = {
  nl: ["zo", "ma", "di", "wo", "do", "vr", "za"],
  en: ["sun", "mon", "tue", "wed", "thu", "fri", "sat"],
};
const MONTHS: Record<Lang, string[]> = {
  nl: ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

const RELATIVE: Record<Lang, { today: string; tomorrow: string; dayAfter: string; onDate: string }> = {
  nl: { today: "Vandaag", tomorrow: "Morgen", dayAfter: "Overmorgen", onDate: "Op datum" },
  en: { today: "Today", tomorrow: "Tomorrow", dayAfter: "Day after", onDate: "On date" },
};

// 1-uurs aankomstslots van 08:00 tot 20:00.
const SLOT_START_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
const SURCHARGE_FROM_HOUR = 18; // 18:00-20:00 = avondtoeslag

function fmtKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtHour(h: number) {
  return `${String(h).padStart(2, "0")}:00`;
}

function slotLabel(start: number) {
  return `${fmtHour(start)} – ${fmtHour(start + 1)}`;
}

function slotArrivalText(lang: Lang) {
  return lang === "nl" ? "Aankomst in dit uur" : "Arrival within this hour";
}

function slotsForDay(d: Date, isToday: boolean, lang: Lang, now: Date): SlotOption[] {
  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
  const currentHour = now.getHours();

  return SLOT_START_HOURS.map((start, index) => {
    const isEvening = start >= SURCHARGE_FROM_HOUR;

    // Vandaag: al verstreken of binnen het komende uur = vol.
    const tooSoonToday = isToday && currentHour >= start - 1;
    // Weekend: lunchtijd en vroege avond vaak vol voor realisme.
    const weekendFull = isWeekend && (start === 12 || start === 13 || start === 17);
    // Toekomstige dagen: af en toe een vol slot.
    const randomFull = !isToday && !isWeekend && (index % 6 === 2);

    return {
      id: `${fmtHour(start)}-${fmtHour(start + 1)}`,
      label: slotLabel(start),
      time: slotArrivalText(lang),
      surcharge: isEvening,
      full: tooSoonToday || weekendFull || randomFull,
    };
  });
}

export function buildDayOption(date: Date, now: Date = new Date(), lang: Lang = "nl"): DayOption {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = Math.round((d.getTime() - today.getTime()) / 86_400_000);
  const isToday = diff === 0;
  const R = RELATIVE[lang];
  const label = diff === 0 ? R.today : diff === 1 ? R.tomorrow : diff === 2 ? R.dayAfter : R.onDate;
  return {
    key: fmtKey(d),
    label,
    dayName: DAY_NAMES[lang][d.getDay()],
    dateLabel: `${d.getDate()} ${MONTHS[lang][d.getMonth()]}`,
    slots: slotsForDay(d, isToday, lang, now),
  };
}

export function generateDayOptions(now: Date = new Date(), lang: Lang = "nl"): DayOption[] {
  const days: DayOption[] = [];
  const cutoffToday = now.getHours() >= 19; // na 19:00 geen "vandaag" meer

  for (let offset = 0; offset < 5 && days.length < 3; offset++) {
    if (offset === 0 && cutoffToday) continue;
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    days.push(buildDayOption(d, now, lang));
  }
  return days;
}

/**
 * "Nu" volgens de wandklok in Europe/Amsterdam, ongeacht de tijdzone van de
 * server (UTC) of de browser. Voorkomt SSR/hydration-mismatch op dagovergangen.
 */
export function amsterdamNow(base: Date = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Amsterdam",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(base);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return new Date(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") % 24,
    get("minute"),
    get("second"),
  );
}

export function parseKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}
