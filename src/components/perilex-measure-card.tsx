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
};

const CONTACTS = [
  { id: "n", x: 64, y: 64, label: "N", up: true },
  { id: "l2", x: 176, y: 64, label: "L2", up: true },
  { id: "l1", x: 64, y: 176, label: "L1", up: false },
  { id: "l3", x: 176, y: 176, label: "L3", up: false },
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
  },
};

export function PerilexMeasureCard({ lang = "nl" }: { lang?: Lang }) {
  const t = COPY[lang];
  const [marks, setMarks] = useState<Record<string, "L" | "N" | undefined>>({});

  const cycleMark = (id: string) =>
    setMarks((m) => {
      const next = m[id] === "L" ? "N" : m[id] === "N" ? undefined : "L";
      const cp = { ...m };
      if (next === undefined) delete cp[id];
      else cp[id] = next;
      return cp;
    });

  const keys = ["n", "l1", "l2", "l3"];
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

  return (
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
      <h2 style={{ fontSize: 22, fontWeight: 800, color: "#131b2e", margin: "4px 0 14px" }}>
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
            onClick={() => setMarks({})}
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
  );
}
