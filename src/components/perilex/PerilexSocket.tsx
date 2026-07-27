/**
 * Perilex stopcontact — vooraanzicht, vaste coördinaten.
 * Tik op een contact om de meting te wisselen: ? -> spanning -> 0 V -> ?
 */
import { COPY, type Lang } from "./copy";
import type { Pin, Reading } from "./usePerilexMeasurement";

type Props = {
  readings: Reading[];
  pins: Pin[];
  onToggle: (index: number) => void;
  lang?: Lang;
};

/** [x, y] per contact, vaste posities in de viewBox 0 0 300 300 */
const HOLES = [
  [114, 116],
  [186, 116],
  [114, 184],
  [186, 184],
] as const;

/** leiderlijn + labelpositie per contact (label als HTML-overlay) */
const LEADS = [
  { path: "M48 60 L94 97", dot: [95, 98], label: { left: "11%", top: "17%" } },
  { path: "M252 60 L206 97", dot: [205, 98], label: { left: "89%", top: "17%" } },
  { path: "M48 240 L94 203", dot: [95, 202], label: { left: "11%", top: "83%" } },
  { path: "M252 240 L206 203", dot: [205, 202], label: { left: "89%", top: "83%" } },
] as const;

const MONO = 'ui-monospace, Menlo, Consolas, monospace';
const SANS = "'Plus Jakarta Sans', system-ui, sans-serif";

export default function PerilexSocket({ readings, pins, onToggle }: Props) {
  return (
    <div style={{ position: "relative" }}>
      <svg viewBox="0 0 300 300" style={{ display: "block", width: "100%", height: "auto", userSelect: "none" }}>
        <defs>
          <linearGradient id="pxPlate" x1=".15" y1="0" x2=".85" y2="1">
            <stop offset="0" stopColor="#FFFDF6" />
            <stop offset=".4" stopColor="#F7F1E2" />
            <stop offset="1" stopColor="#E6DEC9" />
          </linearGradient>
          <radialGradient id="pxWell" cx=".4" cy=".32" r=".85">
            <stop offset="0" stopColor="#F6EFDD" />
            <stop offset=".7" stopColor="#EAE1CB" />
            <stop offset="1" stopColor="#CFC5AC" />
          </radialGradient>
          <radialGradient id="pxHole" cx=".4" cy=".3" r=".9">
            <stop offset="0" stopColor="#4A443A" />
            <stop offset=".55" stopColor="#241F19" />
            <stop offset="1" stopColor="#100D0A" />
          </radialGradient>
          <linearGradient id="pxBlade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#E9E4D6" />
            <stop offset=".5" stopColor="#FDFBF4" />
            <stop offset="1" stopColor="#D6CFBC" />
          </linearGradient>
        </defs>

        {/* wandplaat */}
        <rect x="12" y="12" width="276" height="276" rx="12" fill="url(#pxPlate)" stroke="rgba(70,60,40,.28)" strokeWidth="1.8" />
        <rect x="20" y="20" width="260" height="260" rx="9" fill="none" stroke="rgba(255,255,255,.75)" strokeWidth="1.6" />

        {/* verzonken binnenwerk */}
        <circle cx="150" cy="152" r="90" fill="rgba(90,78,56,.1)" />
        <circle cx="150" cy="150" r="88" fill="url(#pxWell)" stroke="rgba(70,60,40,.22)" strokeWidth="1.6" />
        <circle cx="150" cy="150" r="80" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="1.4" />
        <path d="M136 64 h28 v12 h-28 Z" fill="url(#pxPlate)" stroke="rgba(70,60,40,.22)" strokeWidth="1.4" />
        <text
          x="150"
          y="222"
          textAnchor="middle"
          fontFamily={MONO}
          fontSize="13"
          fontWeight="700"
          letterSpacing="2.5"
          fill="rgba(90,78,56,.35)"
        >
          PERILEX
        </text>

        {/* contactgaten */}
        {HOLES.map(([cx, cy], i) => (
          <circle key={`hole-${i}`} cx={cx} cy={cy} r="19" fill="url(#pxHole)" />
        ))}

        {/* aardestrip */}
        <rect x="130" y="140" width="40" height="20" rx="4" fill="url(#pxBlade)" stroke="#15803D" strokeWidth="2" />
        <rect x="135" y="146" width="30" height="8" rx="2.5" fill="#1B1814" />
        <path d="M256 150 h-84" fill="none" stroke="#15803D" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="171" cy="150" r="3.4" fill="#15803D" />

        {/* meetstatus: ring om het gat */}
        {HOLES.map(([cx, cy], i) => (
          <circle
            key={`ring-${i}`}
            cx={cx}
            cy={cy}
            r="27"
            fill="none"
            stroke={pins[i].color}
            strokeWidth="3"
            strokeDasharray={pins[i].measured ? undefined : "6 5"}
          />
        ))}

        {/* leiderlijnen met ankerpunt */}
        {LEADS.map((lead, i) => (
          <g key={`lead-${i}`}>
            <path
              d={lead.path}
              fill="none"
              stroke={pins[i].color}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx={lead.dot[0]} cy={lead.dot[1]} r="3.2" fill={pins[i].color} />
          </g>
        ))}

        {/* tikvlakken (laatste, dus bovenop) */}
        {HOLES.map(([cx, cy], i) => (
          <circle
            key={`hit-${i}`}
            cx={cx}
            cy={cy}
            r="30"
            fill="transparent"
            style={{ cursor: "pointer" }}
            onClick={() => onToggle(i)}
            role="button"
            aria-label={`Contact ${i + 1}: ${readings[i] === "L" ? "spanning" : readings[i] === "0" ? "geen spanning" : "nog niet gemeten"}`}
          />
        ))}
      </svg>

      {/* labels als HTML-overlay — nooit als tekst binnen <text> */}
      {LEADS.map((lead, i) => (
        <div
          key={`label-${i}`}
          style={{
            position: "absolute",
            left: lead.label.left,
            top: lead.label.top,
            transform: "translate(-50%,-50%)",
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          <div style={{ font: `700 15px/1.15 ${MONO}`, color: pins[i].color }}>{pins[i].name}</div>
          <div style={{ font: `500 10.5px/1.25 ${SANS}`, color: "rgba(18,20,60,.5)" }}>{pins[i].word}</div>
        </div>
      ))}
      <div
        style={{
          position: "absolute",
          left: "90.5%",
          top: "50%",
          transform: "translate(-50%,-50%)",
          textAlign: "center",
          pointerEvents: "none",
        }}
      >
        <div style={{ font: `700 14px/1.15 ${MONO}`, color: "#15803D" }}>PE</div>
        <div style={{ font: `500 10.5px/1.25 ${SANS}`, color: "rgba(18,20,60,.5)" }}>aarde</div>
      </div>
    </div>
  );
}
