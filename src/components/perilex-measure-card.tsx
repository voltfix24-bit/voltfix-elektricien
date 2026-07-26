import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { telHref, whatsappHref } from "@/lib/business";

/*  Zelfstandige "Meet de configuratie"-kaart.
    Losgekoppeld van de stap-voor-stap wizard, zodat bezoekers
    direct kunnen meten zonder eerst alle voorgaande stappen door
    te lopen. */

const C = {
  white: "#ffffff",
  soft: "#F8FAFC",
  tint: "#f2f3ff",
  stroke: "#E2E8F0",
  muted: "#454654",
  outline: "#757685",
  blue: "#3546C8",
  iris: "#3A0CA3",
  red: "#EC1F4C",
  redInk: "#93000a",
  redBg: "#fdecef",
  redBorder: "#f7c9d2",
  green: "#3BBF9E",
  wireN: "#2563EB",
  wireL: "#8B4513",
  wirePE: "#059669",
  ink: "#131b2e",
  faceplate: "#f5f3e8",
  faceplateStroke: "#d4d0c0",
  recess: "#e8e4d6",
  socketHole: "#1a1a1a",
  cornerHint: "#b8b4a4",
};

type PosId = "tl" | "tr" | "bl" | "br";

const POS_ORDER: PosId[] = ["tl", "tr", "bl", "br"];

const CORNER_LABEL: Record<PosId, string> = { tl: "A", tr: "B", bl: "C", br: "D" };

const CONTACTS: { id: PosId; x: number; y: number; up: boolean; leader: { lx: number; ly: number; tx: number; ty: number } }[] = [
  { id: "tl", x: 64, y: 64, up: true, leader: { lx: 46, ly: 46, tx: 22, ty: 40 } },
  { id: "tr", x: 176, y: 64, up: true, leader: { lx: 194, ly: 46, tx: 218, ty: 40 } },
  { id: "bl", x: 64, y: 176, up: false, leader: { lx: 46, ly: 194, tx: 22, ty: 208 } },
  { id: "br", x: 176, y: 176, up: false, leader: { lx: 194, ly: 194, tx: 218, ty: 208 } },
];

type Lang = "nl" | "en";

type Copy = {
  kicker: string;
  title: string;
  body: string;
  warn: string;
  escape: string;
  stepLabel: string;
  stepTitle: string;
  stepSubtitle: string;
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
  legendNotMeasured: string;
  legendPE: string;
  schemaNote: string;
  reset: string;
  socketCaption: string;
  plugCaption: string;
};

const COPY: Record<Lang, Copy> = {
  nl: {
    kicker: "Zelf meten · 2 minuten",
    title: "Welke Perilex heb je?",
    body: "Meet elk contact tegen aarde. Tik hieronder aan wat je tester aangeeft — wij zeggen welk schema past.",
    warn: "Je meet onder spanning. Alleen met een CAT-gekeurde tweepolige spanningstester. Raak geen blank metaal aan. Twijfel je?",
    escape: "Laat ons het doen",
    stepLabel: "1",
    stepTitle: "Meet het stopcontact",
    stepSubtitle: "Vooraanzicht — zoals je het in de muur ziet.",
    measuredConfig: "Gemeten configuratie",
    measuredProgress: (n) => `${n}/4 gemeten`,
    hint: "Tik elk buitencontact aan. Elke tik wisselt: ? → L (spanning) → N (geen).",
    conf1Title: "1-fase — 230 V",
    conf1Detail: "Eén fase en één nul. Gebruik het 1-fase schema van de fabrikant.",
    conf2Title: "2-fase — 400 V",
    conf2Detail: "Twee fasen + nul/aarde. Gebruik het 2-fase schema van de fabrikant.",
    conf3Title: "3-fase — 400 V",
    conf3Detail: "Drie fasen en een nul. Standaard Perilex voor kookplaat of oven. Controleer of je toestel op 3 fasen is ingesteld.",
    errTitle: "Controleer je meting",
    errDetail: (live) => `${live}× spanning is ongebruikelijk. Meet opnieuw of raadpleeg een vakman.`,
    legendL: "~230 V = fase",
    legendN: "0 V = nul",
    legendNotMeasured: "niet gemeten",
    legendPE: "Aarde (PE)",
    schemaNote:
      "Schematische weergave — de werkelijke pinpositie kan afwijken. Markeer fysiek elk contact en raadpleeg het apparaatschema dat bij déze configuratie past.",
    reset: "Meting resetten",
    socketCaption: "Stopcontact (gemeten)",
    plugCaption: "Stekker (live aansluitschema)",
  },
  en: {
    kicker: "Measure yourself · 2 minutes",
    title: "Which Perilex do you have?",
    body: "Measure each contact against earth. Tap below what your tester shows — we'll tell you which diagram fits.",
    warn: "You do this measurement on a LIVE connection. Only with a CAT-rated two-pole voltage tester. Never touch bare metal. In doubt?",
    escape: "Let us handle it",
    stepLabel: "1",
    stepTitle: "Measure the socket",
    stepSubtitle: "Front view — as you see it on the wall.",
    measuredConfig: "Measured configuration",
    measuredProgress: (n) => `${n}/4 measured`,
    hint: "Tap each outer contact. Each tap cycles: ? → L (voltage) → N (none).",
    conf1Title: "1-phase — 230 V",
    conf1Detail: "One phase and one neutral. Use the manufacturer's 1-phase diagram.",
    conf2Title: "2-phase — 400 V",
    conf2Detail: "Two phases + neutral/earth. Use the manufacturer's 2-phase diagram.",
    conf3Title: "3-phase — 400 V",
    conf3Detail: "Three phases and one neutral. Standard Perilex for hobs or ovens. Check your appliance is set to 3 phases.",
    errTitle: "Check your measurement",
    errDetail: (live) => `${live}× voltage is unusual. Measure again or consult a professional.`,
    legendL: "~230 V = phase",
    legendN: "0 V = neutral",
    legendNotMeasured: "not measured",
    legendPE: "Earth (PE)",
    schemaNote:
      "Schematic view — the actual pin position may differ. Physically mark each contact and consult the appliance diagram that matches THIS configuration.",
    reset: "Reset measurement",
    socketCaption: "Socket (measured)",
    plugCaption: "Plug (live wiring diagram)",
  },
};

type Mark = "L" | "N" | undefined;

function useDynamicLabels(marks: Record<PosId, Mark>, liveSeq: Record<PosId, number>) {
  const rankedL = Object.entries(liveSeq)
    .sort((a, b) => a[1] - b[1])
    .map(([id]) => id as PosId);
  const getLabel = (id: PosId): string | undefined => {
    const m = marks[id];
    if (!m) return undefined;
    if (m === "N") return "N";
    const rank = rankedL.indexOf(id) + 1;
    return `L${rank}`;
  };
  return { getLabel, rankedL };
}

function PlugDiagram({
  marks,
  getLabel,
  active,
  onPinEnter,
  onPinLeave,
  onPinClick,
}: {
  marks: Record<PosId, Mark>;
  getLabel: (id: PosId) => string | undefined;
  active: PosId | null;
  onPinEnter: (id: PosId) => void;
  onPinLeave: () => void;
  onPinClick: (id: PosId) => void;
}) {
  const pinInner = (id: PosId) => (marks[id] === "N" ? "N" : marks[id] === "L" ? "L" : "?");
  const pinFill = (id: PosId) => {
    const inner = pinInner(id);
    if (inner === "N") return C.wireN;
    if (inner === "?" || !marks[id]) return C.white;
    return C.wireL;
  };

  return (
    <svg viewBox="0 0 240 240" width="100%" style={{ maxWidth: 260 }}>
      <path d="M 106 232 L 106 252 L 134 252 L 134 232" fill="none" stroke={C.outline} strokeWidth={8} strokeLinecap="round" />
      <circle cx={120} cy={120} r={112} fill={C.white} stroke={C.stroke} strokeWidth={2} />
      <circle cx={120} cy={120} r={26} fill={C.green} />
      <text x={120} y={125} textAnchor="middle" fontSize={14} fontWeight={700} fill="#fff">
        PE
      </text>
      {CONTACTS.map((ct) => {
        const inner = pinInner(ct.id);
        const fill = pinFill(ct.id);
        const stroke = marks[ct.id] ? fill : C.outline;
        const textFill = marks[ct.id] ? "#fff" : C.outline;
        const ly = ct.up ? ct.y - 32 : ct.y + 40;
        const isActive = active === ct.id;
        const label = getLabel(ct.id);
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
            aria-label={`Pin ${label ?? "?"}`}
          >
            {isActive && (
              <circle cx={ct.x} cy={ct.y} r={32} fill="none" stroke={C.blue} strokeWidth={3} opacity={0.9} />
            )}
            {label && (
              <text x={ct.x} y={ly} textAnchor="middle" fontSize={12} fontWeight={700} fill={isActive ? C.blue : C.muted}>
                {label}
              </text>
            )}
            <circle cx={ct.x} cy={ct.y} r={24} fill={fill} stroke={stroke} strokeWidth={2} />
            <text x={ct.x} y={ct.y + 5} textAnchor="middle" fontSize={14} fontWeight={700} fill={textFill}>
              {inner}
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
  const [liveSeq, setLiveSeq] = useState<Record<PosId, number>>({} as Record<PosId, number>);
  const [active, setActive] = useState<PosId | null>(null);

  const { getLabel } = useDynamicLabels(marks, liveSeq);

  const cycleMark = (id: PosId) => {
    setMarks((m) => {
      const next: Mark = m[id] === "L" ? "N" : m[id] === "N" ? undefined : "L";
      const cp = { ...m };
      if (next === undefined) delete cp[id];
      else cp[id] = next;
      return cp;
    });
    setLiveSeq((seq) => {
      const currentMark = marks[id];
      const nextMark: Mark = currentMark === "L" ? "N" : currentMark === "N" ? undefined : "L";
      const cp = { ...seq };
      if (currentMark === "L" || nextMark !== "L") {
        delete cp[id];
      }
      if (nextMark === "L" && !(id in cp)) {
        const nextNum = Object.values(cp).length > 0 ? Math.max(...Object.values(cp)) + 1 : 1;
        cp[id] = nextNum;
      }
      return cp;
    });
  };

  const keys: PosId[] = POS_ORDER;
  const livePositions = keys.filter((k) => marks[k] === "L");
  const live = livePositions.length;
  const done = keys.filter((k) => marks[k]).length;

  let cTitle: string, cDetail: string, tone: string;
  if (done < 4) {
    cTitle = t.measuredProgress(done);
    cDetail = t.hint;
    tone = C.iris;
  } else if (live === 1) {
    cTitle = t.conf1Title;
    cDetail = t.conf1Detail;
    tone = C.iris;
  } else if (live === 2) {
    cTitle = t.conf2Title;
    cDetail = t.conf2Detail;
    tone = C.iris;
  } else if (live === 3) {
    cTitle = t.conf3Title;
    cDetail = t.conf3Detail;
    tone = C.iris;
  } else {
    cTitle = t.errTitle;
    cDetail = t.errDetail(live);
    tone = C.red;
  }

  const resetAll = () => {
    setMarks({} as Record<PosId, Mark>);
    setLiveSeq({} as Record<PosId, number>);
  };

  const escapeHref = lang === "en"
    ? whatsappHref("Hi, I'd rather have VoltFix measure my Perilex socket. When can you come?")
    : whatsappHref("Hoi, ik laat het meten van mijn Perilex-stopcontact liever aan VoltFix over. Wanneer kunnen jullie langskomen?");

  return (
    <section
      aria-label={t.title}
      style={{
        background: C.white,
        border: `1px solid ${C.stroke}`,
        borderRadius: 14,
        padding: 22,
        boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
      }}
    >
      {/* Kicker + title + intro */}
      <p
        style={{
          fontSize: 11,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          fontWeight: 700,
          color: C.iris,
          margin: 0,
        }}
      >
        {t.kicker}
      </p>
      <h2 style={{ fontSize: 24, lineHeight: 1.15, fontWeight: 800, color: C.ink, margin: "6px 0 8px" }}>
        {t.title}
      </h2>
      <p style={{ fontSize: 15, color: C.muted, margin: 0 }}>{t.body}</p>

      {/* Safety alert with escape hatch */}
      <div
        style={{
          display: "flex",
          gap: 10,
          padding: 14,
          borderRadius: 10,
          background: C.redBg,
          border: `1px solid ${C.redBorder}`,
          margin: "16px 0 20px",
        }}
      >
        <AlertTriangle size={18} color={C.red} style={{ flex: "0 0 auto", marginTop: 2 }} />
        <p style={{ fontSize: 13.5, color: C.redInk, margin: 0, lineHeight: 1.45 }}>
          {t.warn}{" "}
          <a
            href={escapeHref}
            target="_blank"
            rel="noopener noreferrer"
            data-track="perilex_wizard_escape"
            style={{ color: C.iris, fontWeight: 700, textDecoration: "underline" }}
          >
            {t.escape}
          </a>
          .
        </p>
      </div>

      {/* Numbered step header */}
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 14 }}>
        <span
          aria-hidden
          style={{
            width: 32,
            height: 32,
            borderRadius: 999,
            background: C.iris,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: "0 0 auto",
            fontWeight: 800,
            fontSize: 15,
          }}
        >
          {t.stepLabel}
        </span>
        <div>
          <p style={{ fontSize: 16, fontWeight: 700, color: C.ink, margin: 0 }}>{t.stepTitle}</p>
          <p style={{ fontSize: 13, color: C.outline, margin: "2px 0 0" }}>{t.stepSubtitle}</p>
        </div>
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
          <svg viewBox="0 0 240 240" width="100%" style={{ maxWidth: 280 }}>
            {/* square faceplate */}
            <rect x={20} y={20} width={200} height={200} rx={18} fill={C.faceplate} stroke={C.faceplateStroke} strokeWidth={2} />
            {/* inner circular recess */}
            <circle cx={120} cy={120} r={84} fill={C.recess} stroke={C.faceplateStroke} strokeWidth={1} />
            {/* side screws (plain silver, no cross) */}
            <circle cx={52} cy={120} r={6} fill="#c0c0c0" stroke="#999" strokeWidth={1} />
            <circle cx={188} cy={120} r={6} fill="#c0c0c0" stroke="#999" strokeWidth={1} />
            {/* centre PE slot */}
            <rect x={94} y={116} width={52} height={10} rx={4} fill={C.green} />
            {/* PE external leader */}
            <line x1={146} y1={121} x2={196} y2={121} stroke={C.green} strokeWidth={1.5} />
            <text x={200} y={125} fontSize={11} fontWeight={700} fill={C.green}>PE</text>
            {/* embossed PERILEX label */}
            <text
              x={120}
              y={188}
              textAnchor="middle"
              fontSize={10}
              fontWeight={700}
              fill={C.cornerHint}
              letterSpacing="0.18em"
              style={{ fontFamily: "sans-serif" }}
            >
              PERILEX
            </text>
            {/* corner hints A/B/C/D */}
            {CONTACTS.map((ct) => {
              const cornerX = ct.id === "tl" || ct.id === "bl" ? 34 : 206;
              const cornerY = ct.id === "tl" || ct.id === "tr" ? 40 : 210;
              return (
                <text
                  key={`corner-${ct.id}`}
                  x={cornerX}
                  y={cornerY}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight={700}
                  fill={C.cornerHint}
                  letterSpacing="0.08em"
                >
                  {CORNER_LABEL[ct.id]}
                </text>
              );
            })}
            {CONTACTS.map((ct) => {
              const m = marks[ct.id];
              const label = getLabel(ct.id);
              const stateColor = m === "L" ? C.wireL : m === "N" ? C.wireN : C.outline;
              const isActive = active === ct.id;
              // Leader-line for measured contacts
              const leader = ct.leader;
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
                  aria-label={m ? `Contact ${label}` : `Contact ${CORNER_LABEL[ct.id]} — tik om te meten`}
                >
                  {/* active highlight ring */}
                  {isActive && (
                    <circle cx={ct.x} cy={ct.y} r={22} fill="none" stroke={C.blue} strokeWidth={3} opacity={0.9} />
                  )}
                  {/* measured ring */}
                  {m && (
                    <circle cx={ct.x} cy={ct.y} r={18} fill="none" stroke={stateColor} strokeWidth={3} />
                  )}
                  {/* dark socket hole */}
                  <circle cx={ct.x} cy={ct.y} r={13} fill={C.socketHole} stroke="#000" strokeWidth={1} />
                  {/* leader-line + external label once measured */}
                  {label && (
                    <>
                      <line
                        x1={ct.x + (ct.id === "tl" || ct.id === "bl" ? -15 : 15)}
                        y1={ct.y + (ct.up ? -10 : 10)}
                        x2={leader.tx + (ct.id === "tl" || ct.id === "bl" ? 8 : -8)}
                        y2={leader.ty - (ct.up ? 0 : 0)}
                        stroke={stateColor}
                        strokeWidth={1.5}
                      />
                      <text
                        x={leader.tx}
                        y={leader.ty}
                        textAnchor={ct.id === "tl" || ct.id === "bl" ? "end" : "start"}
                        fontSize={14}
                        fontWeight={800}
                        fill={isActive ? C.blue : stateColor}
                      >
                        {label}
                      </text>
                    </>
                  )}
                </g>
              );
            })}
          </svg>
          <figcaption style={{ fontSize: 12, color: C.outline, marginTop: 6 }}>
            {t.socketCaption}
          </figcaption>
        </figure>

        <figure style={{ margin: 0, flex: "1 1 240px", maxWidth: 300, textAlign: "center" }}>
          <PlugDiagram
            marks={marks}
            getLabel={getLabel}
            active={active}
            onPinEnter={setActive}
            onPinLeave={() => setActive(null)}
            onPinClick={cycleMark}
          />
          <figcaption style={{ fontSize: 12, color: C.outline, marginTop: 6 }}>
            {t.plugCaption}
          </figcaption>
        </figure>
      </div>

      {/* Legend with tokens matching the socket styling */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginTop: 14,
          flexWrap: "wrap",
          fontSize: 12.5,
          color: C.muted,
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 14, height: 14, borderRadius: 999, border: `2.5px solid ${C.wireL}`, background: "#fff" }} />
          {t.legendL}
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 14, height: 14, borderRadius: 999, border: `2.5px solid ${C.wireN}`, background: "#fff" }} />
          {t.legendN}
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              border: `1.5px dashed ${C.outline}`,
              background: "transparent",
            }}
          />
          {t.legendNotMeasured}
        </span>
      </div>

      {/* Result card */}
      <div
        style={{
          border: `1px solid ${tone}`,
          borderRadius: 12,
          padding: 16,
          marginTop: 16,
          background: tone === C.iris ? "#f7f5ff" : "#fff5f6",
        }}
      >
        <p
          style={{
            fontSize: 11,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            fontWeight: 700,
            color: tone,
            margin: 0,
          }}
        >
          {t.measuredConfig}
        </p>
        <p style={{ fontSize: 20, fontWeight: 800, color: tone, margin: "4px 0 6px" }}>{cTitle}</p>
        <p style={{ fontSize: 13.5, color: C.muted, margin: 0, lineHeight: 1.5 }}>{cDetail}</p>
      </div>

      {/* Reset + note */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, gap: 12, flexWrap: "wrap" }}>
        <p style={{ fontSize: 11.5, color: C.outline, margin: 0, flex: "1 1 220px" }}>{t.schemaNote}</p>
        {done > 0 && (
          <button
            type="button"
            onClick={resetAll}
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: C.iris,
              background: "transparent",
              border: `1px solid ${C.iris}`,
              borderRadius: 999,
              padding: "6px 12px",
              cursor: "pointer",
            }}
          >
            {t.reset}
          </button>
        )}
      </div>

      {/* Hidden fallback CTA for users without WhatsApp */}
      <a href={telHref} style={{ display: "none" }} aria-hidden="true">tel</a>
    </section>
  );
}
