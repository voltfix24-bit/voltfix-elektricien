/**
 * Perilex meetgids — meetstaat + afleiding.
 * Contactposities zijn VAST: [topLeft, topRight, bottomLeft, bottomRight],
 * gezien vanaf de voorkant van het stopcontact.
 */
import { useCallback, useState } from "react";

export type Reading = "?" | "L" | "0";
export type WireName = "L1" | "L2" | "L3" | "N" | "L?" | "?";

export const WIRE_COLOR: Record<string, string> = {
  L1: "#7C3F1D",
  L2: "#111827",
  L3: "#5C636E",
  N: "#1D4ED8",
  PE: "#15803D",
};
export const WIRE_WORD: Record<string, string> = {
  L1: "bruin",
  L2: "zwart",
  L3: "grijs",
  N: "blauw",
  "L?": "onmogelijk",
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

function toPin(name: WireName): Pin {
  if (name === "?") {
    return { name, word: "nog niet", color: UNKNOWN_RING, measured: false };
  }
  return { name, word: WIRE_WORD[name] ?? "onbekend", color: WIRE_COLOR[name] ?? INVALID, measured: true };
}

export function usePerilexMeasurement() {
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

  const socketPins = names.map(toPin);
  const plugPins = PLUG_FROM_SOCKET.map((src) => toPin(names[src]));

  const live = readings.filter((r) => r === "L").length;
  const complete = readings.every((r) => r !== "?");

  let result: Result;
  if (!complete) {
    result = {
      title: "Nog niet volledig gemeten",
      body: "Tik alle vier de contacten aan. Dan zien we welk schema erbij hoort.",
      tone: "idle",
    };
  } else if (live === 4) {
    result = {
      title: "Vier keer spanning — dat kan niet",
      body: "Eén contact hoort de nul te zijn. Meet opnieuw met je tester tegen aarde (PE), of laat het ons doen.",
      tone: "error",
    };
  } else if (live === 3) {
    result = {
      title: "3-fase — 400 V",
      body: "Drie fasen en een nul. Standaard Perilex voor kookplaat of oven. Controleer of je toestel op 3 fasen is ingesteld.",
      tone: "ok",
    };
  } else if (live === 2) {
    result = {
      title: "2-fase — even opletten",
      body: "Meet de twee L-contacten ook onderling. 0 V = dezelfde fase (dan is het feitelijk 1-fase), 400 V = twee echte fasen.",
      tone: "warn",
    };
  } else if (live === 1) {
    result = {
      title: "1-fase — 230 V op een Perilex",
      body: "Eén fase actief. Veel toestellen kunnen hierop, maar dan op beperkt vermogen. Laat dit controleren voor je een kookplaat aansluit.",
      tone: "warn",
    };
  } else {
    result = {
      title: "Geen spanning gemeten",
      body: "Groep uit, kapotte tester of een dood stopcontact. Zet de groep aan en meet opnieuw.",
      tone: "error",
    };
  }

  return { readings, socketPins, plugPins, result, complete, toggle, reset };
}
