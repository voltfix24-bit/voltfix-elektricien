import React from "react";
import { ContactName, Mark, WIRE_COLORS } from "./usePerilexMeasurement";

/**
 * Front view of a flush-mounted Perilex wall socket.
 * Labels sit OUTSIDE the SVG as absolutely positioned HTML,
 * connected by a thin leader line drawn inside the SVG.
 */

type PosIndex = 0 | 1 | 2 | 3;

const HOLES: { x: number; y: number }[] = [
  { x: 114, y: 116 }, // TL
  { x: 186, y: 116 }, // TR
  { x: 114, y: 184 }, // BL
  { x: 186, y: 184 }, // BR
];

// Leader end-points in SVG coordinates (300x300) that reach outside the plate.
const LEADERS: { lx: number; ly: number; side: "left" | "right"; vAlign: "top" | "bottom" }[] = [
  { lx: 4, ly: 90, side: "left", vAlign: "top" },
  { lx: 296, ly: 90, side: "right", vAlign: "top" },
  { lx: 4, ly: 210, side: "left", vAlign: "bottom" },
  { lx: 296, ly: 210, side: "right", vAlign: "bottom" },
];

interface Props {
  contacts: Mark[];
  names: ContactName[];
  colorFor: (n: ContactName) => string;
  onTap: (i: PosIndex) => void;
  active?: PosIndex | null;
  onHover?: (i: PosIndex | null) => void;
}

export default function PerilexSocket({ contacts, names, colorFor, onTap, active, onHover }: Props) {
  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 360, margin: "0 auto" }}>
      <svg viewBox="0 0 300 300" width="100%" style={{ display: "block" }}>
        <defs>
          <linearGradient id="plate" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F7F1E2" />
            <stop offset="100%" stopColor="#E6DEC9" />
          </linearGradient>
          <radialGradient id="recess" cx="0.5" cy="0.45" r="0.65">
            <stop offset="0%" stopColor="#EFE8D3" />
            <stop offset="100%" stopColor="#D9D0B6" />
          </radialGradient>
        </defs>

        {/* Cream faceplate */}
        <rect x={12} y={12} width={276} height={276} rx={12} fill="url(#plate)" stroke="#C8BFA3" strokeWidth={1.5} />

        {/* Recessed inner circle */}
        <circle cx={150} cy={150} r={88} fill="url(#recess)" stroke="#BFB597" strokeWidth={1} />

        {/* Central earth strip */}
        <rect x={130} y={140} width={40} height={20} rx={4} fill="#EFE8D3" stroke={WIRE_COLORS.PE} strokeWidth={2} />

        {/* Embossed PERILEX label */}
        <text
          x={150}
          y={222}
          textAnchor="middle"
          fontSize={11}
          fontWeight={700}
          fill="#A89E80"
          letterSpacing="0.22em"
          style={{ fontFamily: "sans-serif" }}
        >
          PERILEX
        </text>

        {/* Contact holes + status rings + hit targets + leaders */}
        {HOLES.map((h, i) => {
          const idx = i as PosIndex;
          const mark = contacts[idx];
          const name = names[idx];
          const measured = mark !== "?";
          const color = measured ? colorFor(name) : "#8A8272";
          const isActive = active === idx;
          const leader = LEADERS[i];

          return (
            <g key={i}>
              {/* Status ring */}
              <circle
                cx={h.x}
                cy={h.y}
                r={27}
                fill="none"
                stroke={color}
                strokeWidth={measured ? 3 : 2}
                strokeDasharray={measured ? undefined : "4 4"}
                opacity={isActive ? 1 : 0.9}
              />
              {/* Contact hole */}
              <circle cx={h.x} cy={h.y} r={19} fill="#1A1A1A" stroke="#000" strokeWidth={1} />
              {/* Leader line (only when measured) */}
              {measured && (
                <>
                  <line
                    x1={h.x + (leader.side === "left" ? -27 : 27)}
                    y1={h.y}
                    x2={leader.lx + (leader.side === "left" ? 6 : -6)}
                    y2={leader.ly}
                    stroke={color}
                    strokeWidth={1.8}
                  />
                  <circle
                    cx={leader.lx + (leader.side === "left" ? 6 : -6)}
                    cy={leader.ly}
                    r={3.4}
                    fill={color}
                  />
                </>
              )}
              {/* Transparent hit target */}
              <circle
                cx={h.x}
                cy={h.y}
                r={30}
                fill="transparent"
                style={{ cursor: "pointer" }}
                onClick={() => onTap(idx)}
                onMouseEnter={() => onHover?.(idx)}
                onMouseLeave={() => onHover?.(null)}
                onFocus={() => onHover?.(idx)}
                onBlur={() => onHover?.(null)}
                tabIndex={0}
                role="button"
                aria-label={`Contact ${i + 1} — tik om te meten`}
              />
            </g>
          );
        })}
      </svg>

      {/* HTML labels absolutely positioned over the SVG (percent coords of 300x300 viewBox) */}
      {HOLES.map((_, i) => {
        const idx = i as PosIndex;
        const mark = contacts[idx];
        const name = names[idx];
        if (mark === "?") return null;
        const leader = LEADERS[i];
        const wireColor = colorFor(name);
        const leftPct = (leader.lx / 300) * 100;
        const topPct = (leader.ly / 300) * 100;
        const style: React.CSSProperties = {
          position: "absolute",
          left: `${leftPct}%`,
          top: `${topPct}%`,
          transform: `translate(${leader.side === "left" ? "-100%" : "0"}, -50%)`,
          padding: "2px 6px",
          fontSize: 12,
          fontWeight: 800,
          color: wireColor,
          background: "rgba(255,255,255,0.9)",
          borderRadius: 4,
          whiteSpace: "nowrap",
          pointerEvents: "none",
          lineHeight: 1.1,
        };
        return (
          <div key={`lbl-${i}`} style={style}>
            {name}
          </div>
        );
      })}
    </div>
  );
}
