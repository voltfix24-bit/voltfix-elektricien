// Slot generator voor de planningstool (UI-mock).
// Statische regels: cutoff 15:00 voor "vandaag", weekend alleen ochtend/middag.

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
  label: string; // Vandaag / Morgen / Overmorgen
  dayName: string; // ma, di, wo…
  dateLabel: string; // 12 nov
  slots: SlotOption[];
}

const DAY_NAMES_NL = ["zo", "ma", "di", "wo", "do", "vr", "za"];
const MONTH_NL = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

function fmtKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function slotsForDay(d: Date, isToday: boolean): SlotOption[] {
  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
  const hour = new Date().getHours();

  const morning: SlotOption = {
    id: "morning",
    label: "Ochtend",
    time: "08:00 – 12:00",
    full: isToday && hour >= 10,
  };
  const afternoon: SlotOption = {
    id: "afternoon",
    label: "Middag",
    time: "12:00 – 17:00",
    // laat één "vol" zien op morgen middag voor realisme
    full: !isToday && d.getDay() % 3 === 0,
  };
  const evening: SlotOption = {
    id: "evening",
    label: "Avond",
    time: "17:00 – 20:00",
    surcharge: true,
    full: isToday && hour >= 15,
  };

  if (isWeekend) return [morning, afternoon];
  return [morning, afternoon, evening];
}

export function buildDayOption(date: Date, now: Date = new Date()): DayOption {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = Math.round((d.getTime() - today.getTime()) / 86_400_000);
  const isToday = diff === 0;
  const label =
    diff === 0 ? "Vandaag" : diff === 1 ? "Morgen" : diff === 2 ? "Overmorgen" : "Op datum";
  return {
    key: fmtKey(d),
    label,
    dayName: DAY_NAMES_NL[d.getDay()],
    dateLabel: `${d.getDate()} ${MONTH_NL[d.getMonth()]}`,
    slots: slotsForDay(d, isToday),
  };
}

export function generateDayOptions(now: Date = new Date()): DayOption[] {
  const days: DayOption[] = [];
  const cutoffToday = now.getHours() >= 15;

  for (let offset = 0; offset < 4 && days.length < 3; offset++) {
    if (offset === 0 && cutoffToday) continue;
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    days.push(buildDayOption(d, now));
  }
  return days;
}

export function parseKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}
