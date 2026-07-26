// Slot generator voor de planningstool (UI-mock).
// Statische regels: cutoff 15:00 voor "vandaag", weekend alleen ochtend/middag.

export type Lang = "nl" | "en";
export type SlotId = "morning" | "afternoon" | "evening";

export interface SlotOption {
  id: SlotId;
  label: string;
  time: string;
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

const SLOT_LABELS: Record<Lang, Record<SlotId, string>> = {
  nl: { morning: "Ochtend", afternoon: "Middag", evening: "Avond" },
  en: { morning: "Morning", afternoon: "Afternoon", evening: "Evening" },
};

function fmtKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function slotsForDay(d: Date, isToday: boolean, lang: Lang): SlotOption[] {
  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
  const hour = new Date().getHours();
  const L = SLOT_LABELS[lang];

  const morning: SlotOption = {
    id: "morning",
    label: L.morning,
    time: "08:00 – 12:00",
    full: isToday && hour >= 10,
  };
  const afternoon: SlotOption = {
    id: "afternoon",
    label: L.afternoon,
    time: "12:00 – 17:00",
    // laat één "vol" zien op morgen middag voor realisme
    full: !isToday && d.getDay() % 3 === 0,
  };
  const evening: SlotOption = {
    id: "evening",
    label: L.evening,
    time: "17:00 – 20:00",
    surcharge: true,
    full: isToday && hour >= 15,
  };

  if (isWeekend) return [morning, afternoon];
  return [morning, afternoon, evening];
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
    slots: slotsForDay(d, isToday, lang),
  };
}

export function generateDayOptions(now: Date = new Date(), lang: Lang = "nl"): DayOption[] {
  const days: DayOption[] = [];
  const cutoffToday = now.getHours() >= 15;

  for (let offset = 0; offset < 4 && days.length < 3; offset++) {
    if (offset === 0 && cutoffToday) continue;
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    days.push(buildDayOption(d, now, lang));
  }
  return days;
}

export function parseKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}
