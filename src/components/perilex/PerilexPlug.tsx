/**
 * Perilex stekker — frontaal, pennenzijde. Vaste illustratie, alleen labels
 * en kleuren wisselen. Spiegelbeeld van het stopcontact.
 */
import type { Pin } from "./usePerilexMeasurement";

type Props = { pins: Pin[] };

/** vaste penposities in viewBox 0 62 320 338 */
const PINS = [
  [122, 154],
  [198, 154],
  [122, 238],
  [198, 238],
] as const;

const LEADS = [
  { path: "M56 124 H82 L98 144", dot: [99, 145], label: { left: "0%", width: "16%", top: "18.3%", align: "right" } },
  { path: "M264 124 H238 L222 144", dot: [221, 145], label: { left: "84%", width: "16%", top: "18.3%", align: "left" } },
  { path: "M56 268 H82 L98 248", dot: [99, 247], label: { left: "0%", width: "16%", top: "61%", align: "right" } },
  { path: "M264 268 H238 L222 248", dot: [221, 247], label: { left: "84%", width: "16%", top: "61%", align: "left" } },
] as const;

const MONO = 'ui-monospace, Menlo, Consolas, monospace';
const SANS = "'Plus Jakarta Sans', system-ui, sans-serif";

export default function PerilexPlug({ pins }: Props) {
  return (
    <div style={{ position: "relative" }}>
      <svg viewBox="0 62 320 338" style={{ display: "block", width: "100%", height: "auto" }}>
        {/* kabel */}
        <path
          d="M146 318 h28 v58 q0 13 -14 13 q-14 0 -14 -13 Z"
          fill="#EFE9DB"
          stroke="rgba(70,60,40,.34)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* nok bovenop */}
        <rect x="148" y="74" width="24" height="14" rx="3" fill="#F7F2E6" stroke="rgba(70,60,40,.3)" strokeWidth="1.4" />
        {/* behuizing */}
        <path
          d="M84 176 A76 96 0 0 1 236 176 L236 300 C236 315 225 325 209 325 L111 325 C95 325 84 315 84 300 Z"
          fill="#F7F2E6"
          stroke="rgba(70,60,40,.4)"
          strokeWidth="1.8"
        />
        <path
          d="M92 178 A68 86 0 0 1 228 178 L228 298 C228 309 220 317 208 317 L112 317 C100 317 92 309 92 298 Z"
          fill="none"
          stroke="rgba(255,255,255,.7)"
          strokeWidth="1.4"
        />
        {/* front */}
        <circle cx="160" cy="196" r="72" fill="#FCF9F0" stroke="rgba(70,60,40,.3)" strokeWidth="1.5" />
        <circle cx="160" cy="196" r="58" fill="none" stroke="rgba(70,60,40,.1)" strokeWidth="1.2" />
        <text
          x="160"
          y="310"
          textAnchor="middle"
          fontFamily={MONO}
          fontSize="10"
          fontWeight="700"
          letterSpacing="2.2"
          fill="rgba(90,78,56,.3)"
        >
          PERILEX
        </text>

        {/* PE — middencontact */}
        <rect x="138" y="188" width="44" height="16" rx="3" fill="#EDF0F3" stroke="#15803D" strokeWidth="1.6" />
        <rect x="146" y="194" width="28" height="4" rx="2" fill="rgba(40,44,50,.35)" />
        <path d="M264 196 H188" fill="none" stroke="#15803D" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="186" cy="196" r="3.2" fill="#15803D" />

        {/* pennen */}
        {PINS.map(([cx, cy], i) => (
          <g key={`pin-${i}`}>
            <circle cx={cx} cy={cy} r="22" fill="none" stroke={pins[i].color} strokeWidth="2.4" />
            <circle cx={cx} cy={cy} r="15" fill="#E4E8ED" stroke="rgba(40,44,50,.55)" strokeWidth="1.6" />
            <circle cx={cx} cy={cy} r="6.5" fill="#C4CAD1" />
          </g>
        ))}

        {/* leiderlijnen met ankerpunt */}
        {LEADS.map((lead, i) => (
          <g key={`lead-${i}`}>
            <path
              d={lead.path}
              fill="none"
              stroke={pins[i].color}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx={lead.dot[0]} cy={lead.dot[1]} r="3.2" fill={pins[i].color} />
          </g>
        ))}
      </svg>

      {LEADS.map((lead, i) => (
        <div
          key={`label-${i}`}
          style={{
            position: "absolute",
            left: lead.label.left,
            width: lead.label.width,
            top: lead.label.top,
            transform: "translateY(-50%)",
            textAlign: lead.label.align as "left" | "right",
            pointerEvents: "none",
          }}
        >
          <div style={{ font: `700 14px/1.15 ${MONO}`, color: pins[i].color }}>{pins[i].name}</div>
          <div style={{ font: `500 10.5px/1.25 ${SANS}`, color: "rgba(18,20,60,.5)" }}>{pins[i].word}</div>
        </div>
      ))}
      <div
        style={{
          position: "absolute",
          left: "84%",
          width: "16%",
          top: "39.6%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
        }}
      >
        <div style={{ font: `700 14px/1.15 ${MONO}`, color: "#15803D" }}>PE</div>
        <div style={{ font: `500 10.5px/1.25 ${SANS}`, color: "rgba(18,20,60,.5)" }}>aarde</div>
      </div>
    </div>
  );
}
