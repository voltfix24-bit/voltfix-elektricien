import React, { useState, useMemo } from "react";
import { Activity, AlertTriangle } from "lucide-react";

/*  Zelfstandige "Meet de configuratie"-kaart.
    Losgekoppeld van de stap-voor-stap wizard, zodat bezoekers
    direct kunnen meten zonder eerst alle voorgaande stappen door
    te lopen. UI is een 1-op-1 duplicaat van stap 1 uit de wizard. */

const C = {
  white: "#ffffff",
  soft: "#F8FAFC",
  tint: "#f2f3ff",
  stroke: "#E2E8F0",
  muted: "#454654",
  outline: "#757685",
  blue: "#3546C8",
  red: "#EC1F4C",
  redInk: "#93000a",
  green: "#3BBF9E",
  wireN: "#2563EB",
  wireL: "#8B4513",
  wirePE: "#059669",
  ink: "#131b2e",
};

type PosId = "tl" | "tr" | "bl" | "br";

const POS_ORDER: PosId[] = ["tl", "tr", "bl", "br"];

const CONTACTS: { id: PosId; x: number; y: number; label: string; up: boolean }[] = [
  { id: "tl", x: 64, y: 64, label: "N", up: true },
  { id: "tr", x: 176, y: 64, label: "L2", up: true },
  { id: "bl", x: 64, y: 176, label: "L1", up: false },
  { id: "br", x: 176, y: 176, label: "L3", up: false },
];

type Lang = "nl" | "en";


type Copy = {
  kicker: string;
  title: string;
  body: string;
  warn: string;
  measuredConfig: string;
  measuredProgress: (n: number) => string;
  hint: string;
  conf1Title: string;
  conf1Detail: string;
  conf2Title: string;
  conf2Detail: string;
  conf3Title: string;
  conf3Detail: string;
  errTitle: string;
  errDetail: (n: number) => string;
  legendL: string;
  legendN: string;
  legendPE: string;
  schemaNote: string;
  reset: string;
  // Cross-phase step
  crossKicker: string;
  crossTitle: string;
  crossBody: (n: number) => string;
  crossProgress: (done: number, total: number) => string;
  crossHint: string;
  crossPairLabel: (a: string, b: string) => string;
  crossValV: string;
  crossVal0: string;
  crossLegendV: string;
  crossLegend0: string;
  crossResolvedTitle: string;
  crossResolvedDetail: string;
  crossUncertainTitle: string;
  crossUncertainDetail: string;
  crossSamePhaseTitle: string;
  crossSamePhaseDetail: string;
  crossPending: string;
  crossReset: string;
};

const COPY: Record<Lang, Copy> = {
  nl: {
    kicker: "Snelle hulp",
    title: "Meet de configuratie",
    body: "Bepaal hóe de bestaande contactdoos bedraad is. Zet één pen van je dubbelpolige spanningstester in het middencontact (PE) en ga met de andere pen elk buitengat langs. Tik hieronder aan wat je meet — L (spanning) of N (geen) — en zie direct of het 1-, 2- of 3-fase is.",
    warn: "Deze meting doe je bewust ónder spanning. Gebruik een CAT-gekeurde dubbelpolige tester en raak nooit blank metaal aan.",
    measuredConfig: "Gemeten configuratie",
    measuredProgress: (n) => `${n}/4 gemeten`,
    hint: "Tik elk buitencontact aan. Elke tik wisselt: ? → L (spanning) → N (geen).",
    conf1Title: "1-fase",
    conf1Detail: "Eén fase, de rest nul/aarde. Gebruik het 1-fase schema van de fabrikant.",
    conf2Title: "2-fase — let op",
    conf2Detail:
      "Meet de twee L-contacten óók onderling: 0 V = zelfde fase; spanning = twee verschillende fasen, dan ander schema.",
    conf3Title: "3-fase",
    conf3Detail: "Drie fasen + één nul. Gebruik het 3-fase schema.",
    errTitle: "Controleer je meting",
    errDetail: (live) => `${live}× spanning is ongebruikelijk. Meet opnieuw of raadpleeg een vakman.`,
    legendL: "Spanning (L)",
    legendN: "Geen (N)",
    legendPE: "Aarde (PE)",
    schemaNote:
      "Schematische weergave — de werkelijke pinpositie kan afwijken (L1/L3 zijn soms verwisseld). Markeer fysiek elk contact en raadpleeg het apparaatschema dat bij déze configuratie past.",
    reset: "Meting resetten",
    crossKicker: "Stap 2 — Fasen onderling",
    crossTitle: "Meet de fasen onderling",
    crossBody: (n) =>
      `Je hebt ${n} spanningvoerende contacten. Meet nu tussen élk paar L-contacten (pen op pen, niet via PE). ~400 V = verschillende fasen. 0 V = dezelfde fase.`,
    crossProgress: (done, total) => `${done}/${total} paren gemeten`,
    crossHint: "Elke tik wisselt: ? → ~400 V → 0 V.",
    crossPairLabel: (a, b) => `Meet tussen ${a} en ${b}`,
    crossValV: "~400 V",
    crossVal0: "0 V",
    crossLegendV: "~400 V (andere fase)",
    crossLegend0: "0 V (zelfde fase)",
    crossResolvedTitle: "Fasen betrouwbaar toegewezen",
    crossResolvedDetail:
      "Alle paren tonen spanning: de L-contacten zijn L1/L2/L3 (in leesvolgorde toegekend). Fysiek kan L1/L3 verwisseld zijn — markeer elk contact voor de zekerheid.",
    crossUncertainTitle: "Fase-adres nog niet zeker",
    crossUncertainDetail:
      "Zolang niet elk paar spanning toont, labelen we de L-contacten generiek als 'L (fase)'. Rond de metingen af voor L1/L2/L3.",
    crossSamePhaseTitle: "Zelfde fase gemeten — controleer",
    crossSamePhaseDetail:
      "0 V tussen twee L-contacten is ongebruikelijk bij een correct Perilex-stopcontact. Herhaal de meting of raadpleeg een vakman. We tonen tot die tijd geen L1/L2/L3-toewijzing.",
    crossPending: "Meting nog niet afgerond",
    crossReset: "Fasen-meting resetten",
    plugKicker: "Zo sluit je de stekker aan",
    plugTitle: "Van meting naar stekker",
    plugBody:
      "Op basis van jouw meting van het bestaande Perilex-stopcontact ziet de aansluiting van de stekker er als volgt uit. Elke pen krijgt de ader die je op diezelfde positie hebt gemeten.",
    plugViewNote: "Stekker gezien vanaf de pennenzijde.",
    plugAdviceTitle: "Aansluitadvies",
    plugAdviceBody:
      "Sluit de stekker aan volgens de hierboven weergegeven posities. Dit schema is gebaseerd op de meting die je zojuist aan het bestaande Perilex-stopcontact hebt uitgevoerd.",
    plugWarn:
      "Controleer altijd ook het aansluitschema van de kookplaat, oven of het fornuis. De interne aansluiting van het apparaat kan per fabrikant verschillen.",
    plugRetry: "Meting opnieuw uitvoeren",
    plugCta: "Liever laten aansluiten? Laat VoltFix helpen",
    plugCtaHref: "/perilex-amsterdam#offerte",
    socketCaption: "Stopcontact (gemeten)",
    plugCaption: "Stekker (aan te sluiten)",
    labelN: "N (blauw) – nul",
    labelL: "L (bruin) – fase",
    labelPE: "PE (geel/groen) – aarde",
  },
  en: {
    kicker: "Quick help",
    title: "Measure the configuration",
    body: "Find out how the existing socket is wired. Place one probe of your two-pole voltage tester on the centre contact (PE) and touch each outer hole with the other probe. Tap below what you measure — L (voltage) or N (none) — and instantly see whether it is 1-, 2- or 3-phase.",
    warn: "You do this measurement deliberately on a LIVE connection. Use a CAT-rated two-pole tester and never touch bare metal.",
    measuredConfig: "Measured configuration",
    measuredProgress: (n) => `${n}/4 measured`,
    hint: "Tap each outer contact. Each tap cycles: ? → L (voltage) → N (none).",
    conf1Title: "1-phase",
    conf1Detail: "One phase, the rest neutral/earth. Use the manufacturer's 1-phase diagram.",
    conf2Title: "2-phase — note",
    conf2Detail:
      "Also measure the two L contacts against each other: 0 V = same phase; voltage = two different phases, then a different diagram.",
    conf3Title: "3-phase",
    conf3Detail: "Three phases + one neutral. Use the 3-phase diagram.",
    errTitle: "Check your measurement",
    errDetail: (live) => `${live}× voltage is unusual. Measure again or consult a professional.`,
    legendL: "Voltage (L)",
    legendN: "None (N)",
    legendPE: "Earth (PE)",
    schemaNote:
      "Schematic view — the actual pin position may differ (L1/L3 are sometimes swapped). Physically mark each contact and consult the appliance diagram that matches THIS configuration.",
    reset: "Reset measurement",
    crossKicker: "Step 2 — Phase cross-check",
    crossTitle: "Measure phases against each other",
    crossBody: (n) =>
      `You have ${n} live contacts. Now measure between each pair of L contacts (probe to probe, not via PE). ~400 V = different phases. 0 V = same phase.`,
    crossProgress: (done, total) => `${done}/${total} pairs measured`,
    crossHint: "Each tap cycles: ? → ~400 V → 0 V.",
    crossPairLabel: (a, b) => `Measure between ${a} and ${b}`,
    crossValV: "~400 V",
    crossVal0: "0 V",
    crossLegendV: "~400 V (different phase)",
    crossLegend0: "0 V (same phase)",
    crossResolvedTitle: "Phases reliably assigned",
    crossResolvedDetail:
      "All pairs show voltage: the L contacts are L1/L2/L3 (assigned in reading order). Physically L1/L3 may be swapped — mark each contact to be sure.",
    crossUncertainTitle: "Phase address not yet certain",
    crossUncertainDetail:
      "Until every pair shows voltage, we label the L contacts generically as 'L (phase)'. Finish the measurements for L1/L2/L3.",
    crossSamePhaseTitle: "Same phase detected — verify",
    crossSamePhaseDetail:
      "0 V between two L contacts is unusual on a correct Perilex socket. Repeat the measurement or consult a professional. Until then we show no L1/L2/L3 assignment.",
    crossPending: "Measurement not yet complete",
    crossReset: "Reset phase measurement",
    plugKicker: "How to wire the plug",
    plugTitle: "From measurement to plug",
    plugBody:
      "Based on your measurement of the existing Perilex socket, the plug should be wired like this. Each pin gets the wire you measured at that same position.",
    plugViewNote: "Plug viewed from the pin side.",
    plugAdviceTitle: "Wiring advice",
    plugAdviceBody:
      "Wire the plug according to the positions shown above. This diagram is based on the measurement you just performed on the existing Perilex socket.",
    plugWarn:
      "Always cross-check with the wiring diagram of the hob, oven or cooker. The appliance side wiring may differ per manufacturer.",
    plugRetry: "Redo the measurement",
    plugCta: "Rather have it done? Let VoltFix help",
    plugCtaHref: "/en-gb/perilex-amsterdam#offerte",
    socketCaption: "Socket (measured)",
    plugCaption: "Plug (to wire)",
    labelN: "N (blue) – neutral",
    labelL: "L (brown) – phase",
    labelPE: "PE (green/yellow) – earth",
  },
};

type Mark = "L" | "N" | undefined;
type PhaseMark = "V" | "0" | undefined;
type PhaseLabel = "L1" | "L2" | "L3" | "L" | "N";

// Human-readable name for a position (used in the cross-measure step).
const POS_NAME: Record<PosId, string> = {
  tl: "linksboven",
  tr: "rechtsboven",
  bl: "linksonder",
  br: "rechtsonder",
};
const POS_NAME_EN: Record<PosId, string> = {
  tl: "top-left",
  tr: "top-right",
  bl: "bottom-left",
  br: "bottom-right",
};

const pairKey = (a: PosId, b: PosId) => (POS_ORDER.indexOf(a) < POS_ORDER.indexOf(b) ? `${a}-${b}` : `${b}-${a}`);

function buildPairs(livePositions: PosId[]): [PosId, PosId][] {
  const pairs: [PosId, PosId][] = [];
  for (let i = 0; i < livePositions.length; i++) {
    for (let j = i + 1; j < livePositions.length; j++) {
      pairs.push([livePositions[i], livePositions[j]]);
    }
  }
  return pairs;
}

type PhaseResolution = {
  status: "single" | "pending" | "same-phase" | "resolved-2" | "resolved-3";
  labels: Partial<Record<PosId, PhaseLabel>>;
};

function resolvePhases(
  marks: Record<PosId, Mark>,
  pairs: Record<string, PhaseMark>,
  livePositions: PosId[],
): PhaseResolution {
  const labels: Partial<Record<PosId, PhaseLabel>> = {};
  for (const p of POS_ORDER) if (marks[p] === "N") labels[p] = "N";

  if (livePositions.length === 1) {
    labels[livePositions[0]] = "L";
    return { status: "single", labels };
  }

  const required = buildPairs(livePositions).map(([a, b]) => pairKey(a, b));
  const values = required.map((k) => pairs[k]);
  const anySame = values.some((v) => v === "0");
  const allV = values.every((v) => v === "V");

  if (anySame) {
    for (const p of livePositions) labels[p] = "L";
    return { status: "same-phase", labels };
  }
  if (!allV) {
    for (const p of livePositions) labels[p] = "L";
    return { status: "pending", labels };
  }

  // All pairs show ~400V → assign L1/L2/... in reading order.
  const names: PhaseLabel[] = ["L1", "L2", "L3"];
  livePositions.forEach((p, i) => {
    labels[p] = names[i] ?? "L";
  });
  return {
    status: livePositions.length === 3 ? "resolved-3" : "resolved-2",
    labels,
  };
}

function PlugDiagram({
  labels,
  t,
}: {
  labels: Partial<Record<PosId, PhaseLabel>>;
  t: Copy;
}) {
  // Pen-side view: 1:1 zelfde posities als het stopcontact.
  const pins: { id: PosId; x: number; y: number }[] = [
    { id: "tl", x: 90, y: 95 },
    { id: "tr", x: 210, y: 95 },
    { id: "bl", x: 90, y: 215 },
    { id: "br", x: 210, y: 215 },
  ];

  const colorFor = (lbl: PhaseLabel | undefined) =>
    lbl === "N" ? C.wireN : lbl && lbl.startsWith("L") ? C.wireL : C.outline;
  const textFor = (lbl: PhaseLabel | undefined) => lbl ?? "?";

  return (
    <svg viewBox="0 0 300 380" width="100%" style={{ maxWidth: 320 }} aria-label={t.plugTitle}>
      {/* stekkerbehuizing */}
      <rect
        x={40}
        y={30}
        width={220}
        height={260}
        rx={110}
        ry={80}
        fill={C.soft}
        stroke={C.stroke}
        strokeWidth={2}
      />
      {/* kabeltule */}
      <path
        d="M120 285 Q120 330 130 360 L170 360 Q180 330 180 285 Z"
        fill={C.soft}
        stroke={C.stroke}
        strokeWidth={2}
      />
      {/* PE lip midden */}
      <rect x={140} y={148} width={20} height={44} rx={4} fill={C.wirePE} opacity={0.15} stroke={C.wirePE} strokeWidth={1.5} />
      <text x={150} y={175} textAnchor="middle" fontSize={12} fontWeight={800} fill={C.wirePE}>
        PE
      </text>

      {/* pennen */}
      {pins.map((p) => {
        const lbl = labels[p.id];
        const fill = colorFor(lbl);
        const label = textFor(lbl);
        return (
          <g key={p.id}>
            <circle cx={p.x} cy={p.y} r={22} fill={C.white} stroke={C.stroke} strokeWidth={2} />
            <circle cx={p.x} cy={p.y} r={14} fill={fill} />
            <circle cx={p.x} cy={p.y} r={14} fill="none" stroke={fill} strokeWidth={2} opacity={0.35} />
            <text
              x={p.x}
              y={p.y + 4}
              textAnchor="middle"
              fontSize={label.length > 1 ? 10 : 12}
              fontWeight={800}
              fill="#fff"
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function CrossPhaseStep({
  livePositions,
  pairs,
  setPairs,
  resolution,
  t,
  lang,
}: {
  livePositions: PosId[];
  pairs: Record<string, PhaseMark>;
  setPairs: React.Dispatch<React.SetStateAction<Record<string, PhaseMark>>>;
  resolution: PhaseResolution;
  t: Copy;
  lang: Lang;
}) {
  const pairList = buildPairs(livePositions);
  const total = pairList.length;
  const done = pairList.filter(([a, b]) => pairs[pairKey(a, b)]).length;
  const NAMES = lang === "nl" ? POS_NAME : POS_NAME_EN;

  const cyclePair = (a: PosId, b: PosId) =>
    setPairs((prev) => {
      const key = pairKey(a, b);
      const cur = prev[key];
      const next: PhaseMark = cur === "V" ? "0" : cur === "0" ? undefined : "V";
      const cp = { ...prev };
      if (next === undefined) delete cp[key];
      else cp[key] = next;
      return cp;
    });

  let tone = C.blue;
  let title = t.crossPending;
  let detail = t.crossHint;
  if (resolution.status === "resolved-2" || resolution.status === "resolved-3") {
    tone = C.green;
    title = t.crossResolvedTitle;
    detail = t.crossResolvedDetail;
  } else if (resolution.status === "same-phase") {
    tone = C.red;
    title = t.crossSamePhaseTitle;
    detail = t.crossSamePhaseDetail;
  } else if (done > 0) {
    tone = C.blue;
    title = t.crossUncertainTitle;
    detail = t.crossUncertainDetail;
  }

  return (
    <section
      aria-label={t.crossTitle}
      style={{
        marginTop: 20,
        background: C.white,
        border: `1px solid ${C.stroke}`,
        borderRadius: 12,
        padding: 20,
      }}
    >
      <p
        style={{
          fontSize: 11,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          fontWeight: 700,
          color: C.blue,
          margin: 0,
        }}
      >
        {t.crossKicker}
      </p>
      <h3 style={{ fontSize: 20, fontWeight: 800, color: C.ink, margin: "4px 0 10px" }}>
        {t.crossTitle}
      </h3>
      <p style={{ fontSize: 14.5, color: C.muted, margin: "0 0 8px" }}>
        {t.crossBody(livePositions.length)}
      </p>
      <p style={{ fontSize: 12, color: C.outline, margin: "0 0 14px" }}>
        {t.crossProgress(done, total)} · {t.crossHint}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {pairList.map(([a, b]) => {
          const key = pairKey(a, b);
          const val = pairs[key];
          const bg = val === "V" ? "#ecfdf5" : val === "0" ? "#fff5f6" : C.soft;
          const border = val === "V" ? C.wirePE : val === "0" ? C.red : C.stroke;
          const valText = val === "V" ? t.crossValV : val === "0" ? t.crossVal0 : "?";
          const valColor = val === "V" ? C.wirePE : val === "0" ? C.red : C.outline;
          return (
            <button
              key={key}
              type="button"
              onClick={() => cyclePair(a, b)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
                background: bg,
                border: `1px solid ${border}`,
                borderRadius: 10,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>
                {t.crossPairLabel(NAMES[a], NAMES[b])}
              </span>
              <span style={{ fontSize: 13, fontWeight: 800, color: valColor }}>{valText}</span>
            </button>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          gap: 14,
          marginTop: 12,
          flexWrap: "wrap",
          fontSize: 12,
          color: C.muted,
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 12, height: 12, borderRadius: 999, background: C.wirePE }} /> {t.crossLegendV}
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 12, height: 12, borderRadius: 999, background: C.red }} /> {t.crossLegend0}
        </span>
        {done > 0 && (
          <button
            type="button"
            onClick={() => setPairs({})}
            style={{
              marginLeft: "auto",
              fontSize: 12,
              fontWeight: 600,
              color: C.blue,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            {t.crossReset}
          </button>
        )}
      </div>

      <div
        style={{
          border: `1px solid ${tone}`,
          borderRadius: 10,
          padding: 14,
          marginTop: 14,
        }}
      >
        <p style={{ fontSize: 16, fontWeight: 700, color: tone, margin: "0 0 4px" }}>{title}</p>
        <p style={{ fontSize: 13.5, color: C.muted, margin: 0 }}>{detail}</p>
      </div>
    </section>
  );
}

function PlugResult({
  labels,
  t,
}: {
  labels: Partial<Record<PosId, PhaseLabel>>;
  t: Copy;
}) {
  const vals = Object.values(labels);
  const hasN = vals.includes("N");
  const hasL = vals.some((v) => v && v.startsWith("L"));

  return (
    <section
      aria-label={t.plugTitle}
      style={{
        marginTop: 20,
        background: C.white,
        border: `1px solid ${C.stroke}`,
        borderRadius: 12,
        padding: 20,
      }}
    >
      <p
        style={{
          fontSize: 11,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          fontWeight: 700,
          color: C.blue,
          margin: 0,
        }}
      >
        {t.plugKicker}
      </p>
      <h3 style={{ fontSize: 20, fontWeight: 800, color: C.ink, margin: "4px 0 10px" }}>
        {t.plugTitle}
      </h3>
      <p style={{ fontSize: 14.5, color: C.muted, margin: "0 0 14px" }}>{t.plugBody}</p>


      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          marginTop: 14,
          fontSize: 13,
          color: C.muted,
        }}
      >
        {hasN && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 12, height: 12, borderRadius: 999, background: C.wireN }} /> {t.labelN}
          </span>
        )}
        {hasL && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 12, height: 12, borderRadius: 999, background: C.wireL }} /> {t.labelL}
          </span>
        )}
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 12, height: 12, borderRadius: 999, background: C.wirePE }} /> {t.labelPE}
        </span>
      </div>

      <div
        style={{
          border: `1px solid ${C.wirePE}`,
          background: "#ecfdf5",
          borderRadius: 10,
          padding: 14,
          marginTop: 16,
        }}
      >
        <p style={{ fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, color: C.wirePE, margin: 0 }}>
          {t.plugAdviceTitle}
        </p>
        <p style={{ fontSize: 14, color: C.ink, margin: "4px 0 0" }}>{t.plugAdviceBody}</p>
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          padding: 12,
          borderRadius: 6,
          background: "#fff8ec",
          border: "1px solid #f3d38a",
          marginTop: 12,
        }}
      >
        <AlertTriangle size={18} color="#a15c00" style={{ flex: "0 0 auto" }} />
        <span style={{ fontSize: 13, color: "#6a3d00" }}>{t.plugWarn}</span>
      </div>
    </section>
  );
}

export function PerilexMeasureCard({ lang = "nl" }: { lang?: Lang }) {
  const t = COPY[lang];
  const [marks, setMarks] = useState<Record<PosId, Mark>>({} as Record<PosId, Mark>);
  const [pairs, setPairs] = useState<Record<string, PhaseMark>>({});

  const cycleMark = (id: PosId) =>
    setMarks((m) => {
      const next: Mark = m[id] === "L" ? "N" : m[id] === "N" ? undefined : "L";
      const cp = { ...m };
      if (next === undefined) delete cp[id];
      else cp[id] = next;
      // Reset cross-measurements when the base config changes.
      setPairs({});
      return cp;
    });

  const keys: PosId[] = POS_ORDER;
  const livePositions = keys.filter((k) => marks[k] === "L");
  const live = livePositions.length;
  const done = keys.filter((k) => marks[k]).length;

  const resolution = useMemo(
    () => resolvePhases(marks, pairs, livePositions),
    [marks, pairs, livePositions],
  );

  let cTitle: string, cDetail: string, tone: string;
  if (done < 4) {
    cTitle = t.measuredProgress(done);
    cDetail = t.hint;
    tone = C.blue;
  } else if (live === 1) {
    cTitle = t.conf1Title;
    cDetail = t.conf1Detail;
    tone = C.green;
  } else if (live === 2) {
    cTitle = t.conf2Title;
    cDetail = t.conf2Detail;
    tone = C.blue;
  } else if (live === 3) {
    cTitle = t.conf3Title;
    cDetail = t.conf3Detail;
    tone = C.green;
  } else {
    cTitle = t.errTitle;
    cDetail = t.errDetail(live);
    tone = C.red;
  }

  const showCross = done === 4 && live >= 2 && live <= 3;
  const showPlug = done === 4 && live >= 1 && live <= 3;

  const resetAll = () => {
    setMarks({} as Record<PosId, Mark>);
    setPairs({});
  };

  return (
    <>
      <section
        aria-label={t.title}
        style={{
          background: C.white,
          border: `1px solid ${C.stroke}`,
          borderRadius: 12,
          padding: 20,
          boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
        }}
      >
        <p
          style={{
            fontSize: 11,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            fontWeight: 700,
            color: C.blue,
            margin: 0,
          }}
        >
          {t.kicker}
        </p>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: C.ink, margin: "4px 0 14px" }}>
          {t.title}
        </h2>

        <div style={{ display: "flex", gap: 14 }}>
          <span
            style={{
              width: 44,
              height: 44,
              borderRadius: 8,
              background: C.tint,
              color: C.blue,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flex: "0 0 auto",
            }}
          >
            <Activity size={22} />
          </span>
          <p style={{ fontSize: 14.5, color: C.muted, margin: 0 }}>{t.body}</p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            padding: 12,
            borderRadius: 6,
            background: "#fff5f6",
            border: "1px solid #f7c9d2",
            margin: "16px 0",
          }}
        >
          <AlertTriangle size={18} color={C.red} style={{ flex: "0 0 auto" }} />
          <span style={{ fontSize: 13, color: C.redInk }}>{t.warn}</span>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "flex-start",
            gap: 16,
          }}
        >
          <figure style={{ margin: 0, flex: "1 1 240px", maxWidth: 300, textAlign: "center" }}>
            <svg viewBox="0 0 240 240" width="100%" style={{ maxWidth: 260 }}>
              <circle cx={120} cy={120} r={112} fill={C.soft} stroke={C.stroke} strokeWidth={2} />
              <circle cx={120} cy={120} r={26} fill={C.green} />
              <text x={120} y={125} textAnchor="middle" fontSize={14} fontWeight={700} fill="#fff">
                PE
              </text>
              {CONTACTS.map((ct) => {
                const m = marks[ct.id];
                const fill = m === "L" ? C.red : m === "N" ? "#94a0b3" : C.white;
                const stroke = m ? fill : C.outline;
                const inner = m === "L" ? "L" : m === "N" ? "N" : "?";
                const innerFill = m ? "#fff" : C.outline;
                const ly = ct.up ? ct.y - 32 : ct.y + 40;
                return (
                  <g key={ct.id} onClick={() => cycleMark(ct.id)} style={{ cursor: "pointer" }}>
                    <text x={ct.x} y={ly} textAnchor="middle" fontSize={12} fontWeight={700} fill={C.muted}>
                      {ct.label}
                    </text>
                    <circle cx={ct.x} cy={ct.y} r={24} fill={fill} stroke={stroke} strokeWidth={2} />
                    <text x={ct.x} y={ct.y + 5} textAnchor="middle" fontSize={14} fontWeight={700} fill={innerFill}>
                      {inner}
                    </text>
                  </g>
                );
              })}
            </svg>
            <figcaption style={{ fontSize: 12, color: C.outline, marginTop: 4 }}>
              {t.socketCaption}
            </figcaption>
          </figure>

          {showPlug && (
            <figure style={{ margin: 0, flex: "1 1 240px", maxWidth: 300, textAlign: "center" }}>
              <PlugDiagram labels={resolution.labels} t={t} />
              <figcaption style={{ fontSize: 12, color: C.outline, marginTop: 4 }}>
                {t.plugCaption} · {t.plugViewNote}
              </figcaption>
            </figure>
          )}
        </div>

        <div
          style={{
            border: `1px solid ${tone}`,
            borderRadius: 10,
            padding: 14,
            marginTop: 14,
          }}
        >
          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontWeight: 700,
              color: tone,
              margin: 0,
            }}
          >
            {t.measuredConfig}
          </p>
          <p style={{ fontSize: 18, fontWeight: 700, color: tone, margin: "2px 0 4px" }}>{cTitle}</p>
          <p style={{ fontSize: 13.5, color: C.muted, margin: 0 }}>{cDetail}</p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 14,
            marginTop: 12,
            flexWrap: "wrap",
            fontSize: 12,
            color: C.muted,
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 12, height: 12, borderRadius: 999, background: C.red }} /> {t.legendL}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 12, height: 12, borderRadius: 999, background: "#94a0b3" }} /> {t.legendN}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 12, height: 12, borderRadius: 999, background: C.green }} /> {t.legendPE}
          </span>
          {done > 0 && (
            <button
              type="button"
              onClick={resetAll}
              style={{
                marginLeft: "auto",
                fontSize: 12,
                fontWeight: 600,
                color: C.blue,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              {t.reset}
            </button>
          )}
        </div>

        <p style={{ fontSize: 11.5, color: C.outline, marginTop: 12 }}>{t.schemaNote}</p>
      </section>

      {showCross && (
        <CrossPhaseStep
          livePositions={livePositions}
          pairs={pairs}
          setPairs={setPairs}
          resolution={resolution}
          t={t}
          lang={lang}
        />
      )}

      {showPlug && (
        <>
          <PlugResult labels={resolution.labels} t={t} />
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              marginTop: 12,
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <button
              type="button"
              onClick={resetAll}
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: C.blue,
                background: "transparent",
                border: `1px solid ${C.stroke}`,
                borderRadius: 8,
                padding: "10px 14px",
                cursor: "pointer",
              }}
            >
              {t.plugRetry}
            </button>
            <a
              href={t.plugCtaHref}
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#fff",
                background: C.blue,
                borderRadius: 8,
                padding: "10px 14px",
                textDecoration: "none",
              }}
            >
              {t.plugCta}
            </a>
          </div>
        </>
      )}
    </>
  );
}
