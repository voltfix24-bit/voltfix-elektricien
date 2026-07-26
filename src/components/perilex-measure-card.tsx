import React, { useState } from "react";
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
};

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
  // Plug result step
  plugKicker: string;
  plugTitle: string;
  plugBody: string;
  plugViewNote: string;
  plugAdviceTitle: string;
  plugAdviceBody: string;
  plugWarn: string;
  plugRetry: string;
  plugCta: string;
  plugCtaHref: string;
  labelN: string;
  labelL: string;
  labelPE: string;
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
    labelN: "N (blue) – neutral",
    labelL: "L (brown) – phase",
    labelPE: "PE (green/yellow) – earth",
  },
};

type Mark = "L" | "N" | undefined;

function PlugDiagram({ marks, t }: { marks: Record<PosId, Mark>; t: Copy }) {
  // Pen-side view: 1:1 zelfde posities als het stopcontact.
  const pins: { id: PosId; x: number; y: number }[] = [
    { id: "tl", x: 90, y: 95 },
    { id: "tr", x: 210, y: 95 },
    { id: "bl", x: 90, y: 215 },
    { id: "br", x: 210, y: 215 },
  ];

  const colorFor = (m: Mark) => (m === "N" ? C.wireN : m === "L" ? C.wireL : C.outline);
  const textFor = (m: Mark) => (m === "N" ? "N" : m === "L" ? "L" : "?");

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
        const m = marks[p.id];
        const fill = colorFor(m);
        return (
          <g key={p.id}>
            <circle cx={p.x} cy={p.y} r={22} fill={C.white} stroke={C.stroke} strokeWidth={2} />
            <circle cx={p.x} cy={p.y} r={12} fill={fill} />
            <circle cx={p.x} cy={p.y} r={12} fill="none" stroke={fill} strokeWidth={2} opacity={0.35} />
            <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize={11} fontWeight={800} fill="#fff">
              {textFor(m)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function PlugResult({
  marks,
  t,
}: {
  marks: Record<PosId, Mark>;
  t: Copy;
}) {
  const hasN = Object.values(marks).some((m) => m === "N");
  const hasL = Object.values(marks).some((m) => m === "L");

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

      <div style={{ display: "flex", justifyContent: "center" }}>
        <PlugDiagram marks={marks} t={t} />
      </div>
      <p style={{ fontSize: 12, color: C.outline, textAlign: "center", marginTop: 4 }}>
        {t.plugViewNote}
      </p>

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

  const cycleMark = (id: PosId) =>
    setMarks((m) => {
      const next: Mark = m[id] === "L" ? "N" : m[id] === "N" ? undefined : "L";
      const cp = { ...m };
      if (next === undefined) delete cp[id];
      else cp[id] = next;
      return cp;
    });

  const keys: PosId[] = ["tl", "tr", "bl", "br"];
  const live = keys.filter((k) => marks[k] === "L").length;
  const done = keys.filter((k) => marks[k]).length;

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

  const showPlug = done === 4 && live >= 1 && live <= 3;

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

        <div style={{ display: "flex", justifyContent: "center" }}>
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
              onClick={() => setMarks({} as Record<PosId, Mark>)}
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

      {showPlug && (
        <>
          <PlugResult marks={marks} t={t} />
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
              onClick={() => setMarks({} as Record<PosId, Mark>)}
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
