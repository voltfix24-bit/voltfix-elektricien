import { useCallback, useMemo, useState } from "react";

export type Mark = "?" | "L" | "0";
export type PosIndex = 0 | 1 | 2 | 3; // TL, TR, BL, BR

export const WIRE_COLORS = {
  L1: "#7C3F1D",
  L2: "#111827",
  L3: "#5C636E",
  N: "#1D4ED8",
  PE: "#15803D",
  unknown: "#E8114B",
} as const;

export const DUTCH_COLOR: Record<string, string> = {
  L1: "bruin",
  L2: "zwart",
  L3: "grijs",
  N: "blauw",
  PE: "geel/groen",
};

export type ContactName = "?" | "N" | "L1" | "L2" | "L3" | "X";

export type ResultKind = "incomplete" | "none" | "one" | "two" | "three" | "error";

export interface PerilexState {
  contacts: Mark[];
  names: ContactName[];
  colorFor: (name: ContactName) => string;
  cycle: (i: PosIndex) => void;
  reset: () => void;
  liveCount: number;
  hasUnknown: boolean;
  result: {
    kind: ResultKind;
    title: string;
    detail: string;
  };
  // plug view is a horizontal mirror of the socket
  plugContacts: Mark[];
  plugNames: ContactName[];
}

const nextMark = (m: Mark): Mark => (m === "?" ? "L" : m === "L" ? "0" : "?");

export function usePerilexMeasurement(): PerilexState {
  const [contacts, setContacts] = useState<Mark[]>(["?", "?", "?", "?"]);

  const cycle = useCallback((i: PosIndex) => {
    setContacts((cs) => cs.map((c, idx) => (idx === i ? nextMark(c) : c)));
  }, []);

  const reset = useCallback(() => setContacts(["?", "?", "?", "?"]), []);

  const { names, liveCount, hasUnknown } = useMemo(() => {
    let liveSeen = 0;
    const names: ContactName[] = contacts.map((m) => {
      if (m === "?") return "?";
      if (m === "0") return "N";
      liveSeen += 1;
      if (liveSeen <= 3) return (`L${liveSeen}` as ContactName);
      return "X";
    });
    return {
      names,
      liveCount: contacts.filter((c) => c === "L").length,
      hasUnknown: contacts.some((c) => c === "?"),
    };
  }, [contacts]);

  const result = useMemo(() => {
    if (hasUnknown) {
      return {
        kind: "incomplete" as const,
        title: "Nog niet volledig gemeten",
        detail:
          "Tik elk contact aan tot je het resultaat van je tester hebt ingevoerd (L, 0 of ?).",
      };
    }
    if (liveCount === 4) {
      return {
        kind: "error" as const,
        title: "Onmogelijke meting",
        detail:
          "Vier spanningvoerende contacten kan niet kloppen. Meet opnieuw of laat het door ons controleren.",
      };
    }
    if (liveCount === 3)
      return {
        kind: "three" as const,
        title: "3-fase — 400 V",
        detail: "Standaard Perilex voor kookplaat of oven. Controleer of je toestel op 3 fasen is ingesteld.",
      };
    if (liveCount === 2)
      return {
        kind: "two" as const,
        title: "2-fase — even opletten",
        detail: "Twee fasen + nul. Gebruik het 2-fase schema van de fabrikant.",
      };
    if (liveCount === 1)
      return {
        kind: "one" as const,
        title: "1-fase — 230 V op een Perilex",
        detail: "Eén fase en één nul. Gebruik het 1-fase schema van de fabrikant.",
      };
    return {
      kind: "none" as const,
      title: "Geen spanning gemeten",
      detail: "Controleer of de groep aan staat en of je tester werkt.",
    };
  }, [hasUnknown, liveCount]);

  const colorFor = useCallback((name: ContactName): string => {
    if (name === "?" || name === "X") return WIRE_COLORS.unknown;
    if (name === "N") return WIRE_COLORS.N;
    if (name === "L1") return WIRE_COLORS.L1;
    if (name === "L2") return WIRE_COLORS.L2;
    if (name === "L3") return WIRE_COLORS.L3;
    return WIRE_COLORS.unknown;
  }, []);

  // Plug is horizontal mirror: TL<->TR, BL<->BR
  const plugContacts: Mark[] = [contacts[1], contacts[0], contacts[3], contacts[2]];
  const plugNames: ContactName[] = [names[1], names[0], names[3], names[2]];

  return {
    contacts,
    names,
    colorFor,
    cycle,
    reset,
    liveCount,
    hasUnknown,
    result,
    plugContacts,
    plugNames,
  };
}
