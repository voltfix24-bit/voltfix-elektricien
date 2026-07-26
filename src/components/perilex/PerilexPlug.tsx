import React from "react";
import { ContactName, DUTCH_COLOR, Mark, WIRE_COLORS } from "./usePerilexMeasurement";

/**
 * Flat frontal technical illustration of a Perilex plug (pin side).
 * This is the MIRROR of the socket — left and right are swapped.
 */

const PINS: { x: number; y: number }[] = [
  { x: 122, y: 154 }, // TL
  { x: 198, y: 154 }, // TR
  { x: 122, y: 238 }, // BL
  { x: 198, y: 238 }, // BR
];

// Leader targets in the 320x-viewBox coordinate system.
const LEADERS: { lx: number; ly: number; side: "left" | "right" }[] = [
  { lx: 12, ly: 120, side: "left" },
  { lx: 308, ly: 120, side: "right" },
  { lx: 12, ly: 270, side: "left" },
  { lx: 308, ly: 270, side: "right" },
];

interface Props {
  contacts: Mark[]; // already mirrored by the hook
  names: ContactName[]; // already mirrored by the hook
  colorFor: (n: ContactName) => string;
}

export default function PerilexPlug({ contacts, names, colorFor }: Props) {
  return (
    <div style={{ width: "100%" }}>
      {/* Callout above */}
      <div
        style={{
          background: "#FFFBEA",
          border: "1px solid #F5E7A6",
          borderRadius: 10,
          padding: "10px 12px",
          marginBottom: 12,
        }}
      >
        <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "#5B4A00" }}>
          Pinnenzijde — dit is het spiegelbeeld van het stopcontact.
        </p>
        <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "#7A6A2A" }}>
          Links en rechts wisselen om: wat in het stopcontact links zit, komt op de stekker rechts uit.
        </p>
      </div>

      <div style={{ position: "relative", width: "100%", maxWidth: 360, margin: "0 auto" }}>
        <svg viewBox="0 62 320 338" width="100%" style={{ display: "block" }}>
          <defs>
            <linearGradient id="plugBody" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F7F1E2" />
              <stop offset="100%" stopColor="#D9D0B6" />
            </linearGradient>
          </defs>

          {/* Body: dome top + straight sides + rounded bottom */}
          <path
            d="M 84 176 A 76 96 0 0 1 236 176 L 236 300 Q 236 340 196 340 L 124 340 Q 84 340 84 300 Z"
            fill="url(#plugBody)"
            stroke="#BFB597"
            strokeWidth={1.5}
          />
          {/* Cable stub */}
          <rect x={148} y={340} width={24} height={54} rx={10} fill="#4A4740" />
          <rect x={140} y={388} width={40} height={10} rx={4} fill="#2F2C27" />

          {/* Raised face circle */}
          <circle cx={160} cy={196} r={72} fill="#EFE8D3" stroke="#BFB597" strokeWidth={1} />

          {/* Center PE strip */}
          <rect x={138} y={188} width={44} height={16} rx={3} fill="#EFE8D3" stroke={WIRE_COLORS.PE} strokeWidth={2} />

          {/* Pins */}
          {PINS.map((p, i) => {
            const mark = contacts[i];
            const name = names[i];
            const measured = mark !== "?";
            const color = measured ? colorFor(name) : "#8A8272";
            const leader = LEADERS[i];

            return (
              <g key={i}>
                {/* Outer status ring */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={22}
                  fill="none"
                  stroke={color}
                  strokeWidth={measured ? 3 : 2}
                  strokeDasharray={measured ? undefined : "4 4"}
                />
                {/* Pin body */}
                <circle cx={p.x} cy={p.y} r={15} fill="#E4E8ED" stroke="#4A4A55" strokeWidth={1.4} />
                {/* Core */}
                <circle cx={p.x} cy={p.y} r={6.5} fill={measured ? color : "#B7BAC3"} />
                {/* Leader */}
                {measured && (
                  <>
                    <line
                      x1={p.x + (leader.side === "left" ? -22 : 22)}
                      y1={p.y}
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
              </g>
            );
          })}
        </svg>

        {/* HTML labels outside the plate */}
        {PINS.map((_, i) => {
          const mark = contacts[i];
          const name = names[i];
          if (mark === "?") return null;
          const leader = LEADERS[i];
          const color = colorFor(name);
          // viewBox is 320 wide, height 338 starting at y=62 -> total 338
          const leftPct = (leader.lx / 320) * 100;
          const topPct = ((leader.ly - 62) / 338) * 100;
          const dutch = DUTCH_COLOR[name] ?? "";
          return (
            <div
              key={`plbl-${i}`}
              style={{
                position: "absolute",
                left: `${leftPct}%`,
                top: `${topPct}%`,
                transform: `translate(${leader.side === "left" ? "-100%" : "0"}, -50%)`,
                padding: "2px 6px",
                background: "rgba(255,255,255,0.92)",
                borderRadius: 4,
                whiteSpace: "nowrap",
                pointerEvents: "none",
                lineHeight: 1.15,
                textAlign: leader.side === "left" ? "right" : "left",
              }}
            >
              <div
                style={{
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontSize: 14,
                  fontWeight: 700,
                  color,
                }}
              >
                {name}
              </div>
              {dutch && (
                <div style={{ fontSize: 10.5, color: "#6B7280" }}>{dutch}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Two-column legend */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
          marginTop: 16,
          fontSize: 13,
        }}
      >
        {[
          { name: "L1", label: "bruin", color: WIRE_COLORS.L1 },
          { name: "L2", label: "zwart", color: WIRE_COLORS.L2 },
          { name: "L3", label: "grijs", color: WIRE_COLORS.L3 },
          { name: "N", label: "blauw", color: WIRE_COLORS.N },
          { name: "PE", label: "aarde (geel/groen)", color: WIRE_COLORS.PE },
        ].map((row) => (
          <div key={row.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: 999,
                background: row.color,
                flex: "0 0 auto",
              }}
            />
            <span style={{ fontWeight: 700, color: row.color, fontFamily: "ui-monospace, monospace" }}>
              {row.name}
            </span>
            <span style={{ color: "#4B5563" }}>{row.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
