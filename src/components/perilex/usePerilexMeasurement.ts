/**
 * Perilex meetgids — meetstaat + afleiding.
 * Contactposities zijn VAST: [topLeft, topRight, bottomLeft, bottomRight],
 * gezien vanaf de voorkant van het stopcontact.
 */
import { useCallback, useState } from "react";
import { type Lang, RESULT_COPY, UNKNOWN_WORD, WIRE_WORD_I18N } from "./copy";

export type Reading = "?" | "L" | "0";
export type WireName = "L1" | "L2" | "L3" | "N" | "L?" | "?";

export const WIRE_COLOR: Record<string, string> = {
  L1: "#7C3F1D",
  L2: "#111827",
  L3: "#5C636E",
  N: "#1D4ED8",
  PE: "#15803D",
};
const INVALID = "#E8114B";
const UNKNOWN_RING = "rgba(18,20,60,.4)";

export type Pin = { name: WireName; word: string; color: string; measured: boolean };

export type ResultTone = "idle" | "ok" | "warn" | "error";
export type Result = { title: string; body: string; tone: ResultTone };

export const TONE: Record<ResultTone, { accent: string; bg: string; border: string }> = {
  idle: { accent: "rgba(18,20,60,.5)", bg: "#F7F7FA", border: "rgba(18,20,60,.12)" },
  ok: { accent: "#3A0CA3", bg: "#F5F2FE", border: "rgba(58,12,163,.2)" },
  warn: { accent: "#B45309", bg: "#FFFAEB", border: "rgba(180,83,9,.25)" },
  error: { accent: "#E8114B", bg: "#FFF5F7", border: "rgba(232,17,75,.22)" },
};

/** De stekker is het spiegelbeeld: plugSlot -> socketIndex */
export const PLUG_FROM_SOCKET = [1, 0, 3, 2] as const;

function toPin(name: WireName, lang: Lang): Pin {
  if (name === "?") {
    return { name, word: UNKNOWN_WORD[lang], color: UNKNOWN_RING, measured: false };
  }
  const words = WIRE_WORD_I18N[lang];
  return {
    name,
    word: words[name] ?? (lang === "en" ? "unknown" : "onbekend"),
    color: WIRE_COLOR[name] ?? INVALID,
    measured: true,
  };
}

export function usePerilexMeasurement(lang: Lang = "nl") {
  const [readings, setReadings] = useState<Reading[]>(["?", "?", "?", "?"]);

  const toggle = useCallback((i: number) => {
    setReadings((prev) => {
      const next = prev.slice();
      next[i] = prev[i] === "?" ? "L" : prev[i] === "L" ? "0" : "?";
      return next;
    });
  }, []);

  const reset = useCallback(() => setReadings(["?", "?", "?", "?"]), []);

  // fasen nummeren, maximaal 3 — een vierde fase bestaat niet op een Perilex
  let phase = 0;
  const names: WireName[] = readings.map((r) =>
    r === "L" ? ((phase < 3 ? `L${++phase}` : "L?") as WireName) : r === "0" ? "N" : "?"
  );

  const socketPins = names.map((n) => toPin(n, lang));
  const plugPins = PLUG_FROM_SOCKET.map((src) => toPin(names[src], lang));

  const live = readings.filter((r) => r === "L").length;
  const complete = readings.every((r) => r !== "?");
  const C = RESULT_COPY[lang];

  let result: Result;
  if (!complete) {
    result = { ...C.idle, tone: "idle" };
  } else if (live === 4) {
    result = { ...C.fourLive, tone: "error" };
  } else if (live === 3) {
    result = { ...C.threePhase, tone: "ok" };
  } else if (live === 2) {
    result = { ...C.twoPhase, tone: "warn" };
  } else if (live === 1) {
    result = { ...C.onePhase, tone: "warn" };
  } else {
    result = { ...C.dead, tone: "error" };
  }

  return { readings, socketPins, plugPins, result, complete, toggle, reset };
}
