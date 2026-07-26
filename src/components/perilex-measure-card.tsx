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

const POS_ORDER: PosId[] = ["tl", "tr", "bl", "br"];

const CONTACTS: { id: PosId; x: number; y: number; up: boolean }[] = [
  { id: "tl", x: 64, y: 64, up: true },
  { id: "tr", x: 176, y: 64, up: true },
  { id: "bl", x: 64, y: 176, up: false },
  { id: "br", x: 176, y: 176, up: false },
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
  socketCaption: string;
  plugCaption: string;
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
    conf2Title: "2-fase",
    conf2Detail: "Twee fasen + nul/aarde. Gebruik het 2-fase schema van de fabrikant.",
    conf3Title: "3-fase",
    conf3Detail: "Drie fasen + één nul. Gebruik het 3-fase schema.",
    errTitle: "Controleer je meting",
    errDetail: (live) => `${live}× spanning is ongebruikelijk. Meet opnieuw of raadpleeg een vakman.`,
    legendL: "Spanning (L)",
    legendN: "Geen (N)",
    legendPE: "Aarde (PE)",
    schemaNote:
      "Schematische weergave — de werkelijke pinpositie kan afwijken. Markeer fysiek elk contact en raadpleeg het apparaatschema dat bij déze configuratie past.",
    reset: "Meting resetten",
    socketCaption: "Stopcontact (gemeten)",
    plugCaption: "Stekker (live aansluitschema)",
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
    conf2Title: "2-phase",
    conf2Detail: "Two phases + neutral/earth. Use the manufacturer's 2-phase diagram.",
    conf3Title: "3-phase",
    conf3Detail: "Three phases + one neutral. Use the 3-phase diagram.",
    errTitle: "Check your measurement",
    errDetail: (live) => `${live}× voltage is unusual. Measure again or consult a professional.`,
    legendL: "Voltage (L)",
    legendN: "None (N)",
    legendPE: "Earth (PE)",
    schemaNote:
      "Schematic view — the actual pin position may differ. Physically mark each contact and consult the appliance diagram that matches THIS configuration.",
    reset: "Reset measurement",
    socketCaption: "Socket (measured)",
    plugCaption: "Plug (live wiring diagram)",
  },
};

type Mark = "L" | "N" | undefined;

function PlugDiagram({
  marks,
  active,
  onPinEnter,
  onPinLeave,
  onPinClick,
}: {
  marks: Record<PosId, Mark>;
  active: PosId | null;
  onPinEnter: (id: PosId) => void;
  onPinLeave: () => void;
  onPinClick: (id: PosId) => void;
}) {
  const pinLabel = (id: PosId) => (marks[id] === "N" ? "N" : marks[id] === "L" ? "L" : "?");
  const pinFill = (id: PosId) => {
    const lbl = pinLabel(id);
    if (lbl === "N") return C.wireN;
    if (lbl === "?" || !marks[id]) return C.white;
    return C.wireL;
  };

  return (
    <svg viewBox="0 0 240 240" width="100%" style={{ maxWidth: 260 }}>
      {/* cable stub */}
      <path d="M 106 232 L 106 252 L 134 252 L 134 232" fill="none" stroke={C.outline} strokeWidth={8} strokeLinecap="round" />
      <circle cx={120} cy={120} r={112} fill={C.white} stroke={C.stroke} strokeWidth={2} />
      <circle cx={120} cy={120} r={26} fill={C.green} />
      <text x={120} y={125} textAnchor="middle" fontSize={14} fontWeight={700} fill="#fff">
        PE
      </text>
      {CONTACTS.map((ct) => {
        const lbl = pinLabel(ct.id);
        const fill = pinFill(ct.id);
        const stroke = marks[ct.id] ? fill : C.outline;
        const textFill = marks[ct.id] ? "#fff" : C.outline;
        const ly = ct.up ? ct.y - 32 : ct.y + 40;
        const isActive = active === ct.id;
        return (
          <g
            key={ct.id}
            onMouseEnter={() => onPinEnter(ct.id)}
            onMouseLeave={onPinLeave}
            onFocus={() => onPinEnter(ct.id)}
            onBlur={onPinLeave}
            onClick={() => onPinClick(ct.id)}
            style={{ cursor: "pointer" }}
            tabIndex={0}
            role="button"
            aria-label={`Pin ${ct.label}`}
          >
            {isActive && (
              <circle cx={ct.x} cy={ct.y} r={32} fill="none" stroke={C.blue} strokeWidth={3} opacity={0.9} />
            )}
            <text x={ct.x} y={ly} textAnchor="middle" fontSize={12} fontWeight={700} fill={isActive ? C.blue : C.muted}>
              {ct.label}
            </text>
            <circle cx={ct.x} cy={ct.y} r={24} fill={fill} stroke={stroke} strokeWidth={2} />
            <text x={ct.x} y={ct.y + 5} textAnchor="middle" fontSize={14} fontWeight={700} fill={textFill}>
              {lbl}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function PerilexMeasureCard({ lang = "nl" }: { lang?: Lang }) {
  const t = COPY[lang];
  const [marks, setMarks] = useState<Record<PosId, Mark>>({} as Record<PosId, Mark>);
  const [active, setActive] = useState<PosId | null>(null);

  const cycleMark = (id: PosId) =>
    setMarks((m) => {
      const next: Mark = m[id] === "L" ? "N" : m[id] === "N" ? undefined : "L";
      const cp = { ...m };
      if (next === undefined) delete cp[id];
      else cp[id] = next;
      return cp;
    });

  const keys: PosId[] = POS_ORDER;
  const livePositions = keys.filter((k) => marks[k] === "L");
  const live = livePositions.length;
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

  const resetAll = () => {
    setMarks({} as Record<PosId, Mark>);
  };

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
            {/* square faceplate */}
            <rect x={20} y={20} width={200} height={200} rx={18} fill="#f5f3e8" stroke="#d4d0c0" strokeWidth={2} />
            {/* inner circular recess */}
            <circle cx={120} cy={120} r={84} fill="#e8e4d6" stroke="#d4d0c0" strokeWidth={1} />
            {/* side screws */}
            <g>
              <circle cx={52} cy={120} r={6} fill="#c0c0c0" stroke="#999" strokeWidth={1} />
            </g>
            <g>
              <circle cx={188} cy={120} r={6} fill="#c0c0c0" stroke="#999" strokeWidth={1} />
            </g>
            {/* centre PE slot (flat pin) */}
            <rect x={94} y={116} width={52} height={8} rx={4} fill={C.green} />
            <text x={120} y={112} textAnchor="middle" fontSize={9} fontWeight={700} fill="#fff">
              PE
            </text>
            {/* embossed PERILEX label */}
            <text
              x={120}
              y={188}
              textAnchor="middle"
              fontSize={10}
              fontWeight={700}
              fill="#b8b4a4"
              letterSpacing="0.18em"
              style={{ fontFamily: "sans-serif" }}
            >
              PERILEX
            </text>
            {CONTACTS.map((ct) => {
              const m = marks[ct.id];
              const stateFill = m === "L" ? C.red : m === "N" ? "#94a0b3" : "transparent";
              const inner = m === "L" ? "L" : m === "N" ? "N" : "?";
              const innerFill = m ? "#fff" : "transparent";
              const ly = ct.up ? ct.y - 32 : ct.y + 40;
              const isActive = active === ct.id;
              return (
                <g
                  key={ct.id}
                  onClick={() => cycleMark(ct.id)}
                  onMouseEnter={() => setActive(ct.id)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(ct.id)}
                  onBlur={() => setActive(null)}
                  style={{ cursor: "pointer" }}
                  tabIndex={0}
                  role="button"
                  aria-label={m ? `Contact ${ct.label}` : "Onbekend contact — tik om te meten"}
                >
                  {/* dark socket hole */}
                  <circle cx={ct.x} cy={ct.y} r={13} fill="#1a1a1a" stroke="#000" strokeWidth={1} />
                  {/* active highlight ring */}
                  {isActive && (
                    <circle cx={ct.x} cy={ct.y} r={22} fill="none" stroke={C.blue} strokeWidth={3} opacity={0.9} />
                  )}
                  {/* measured state ring */}
                  <circle
                    cx={ct.x}
                    cy={ct.y}
                    r={18}
                    fill="none"
                    stroke={stateFill}
                    strokeWidth={m ? 3 : 0}
                    opacity={m ? 1 : 0}
                  />
                  {/* measured state fill */}
                  {m && <circle cx={ct.x} cy={ct.y} r={8} fill={stateFill} />}
                  {/* position label — only show after this contact has been measured */}
                  {m && (
                    <text x={ct.x} y={ly} textAnchor="middle" fontSize={12} fontWeight={700} fill={isActive ? C.blue : C.muted}>
                      {ct.label}
                    </text>
                  )}
                  {/* state text */}
                  {m && (
                    <text x={ct.x} y={ct.y + 4} textAnchor="middle" fontSize={12} fontWeight={700} fill={innerFill}>
                      {inner}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
          <figcaption style={{ fontSize: 12, color: C.outline, marginTop: 4 }}>
            {t.socketCaption}
          </figcaption>
        </figure>

        <figure style={{ margin: 0, flex: "1 1 240px", maxWidth: 300, textAlign: "center" }}>
          <PlugDiagram
            marks={marks}
            active={active}
            onPinEnter={setActive}
            onPinLeave={() => setActive(null)}
            onPinClick={cycleMark}
          />
          <figcaption style={{ fontSize: 12, color: C.outline, marginTop: 4 }}>
            {t.plugCaption}
          </figcaption>
        </figure>
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
  );
}
