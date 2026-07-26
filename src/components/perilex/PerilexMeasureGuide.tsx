import React from "react";
import { usePerilexMeasurement } from "./usePerilexMeasurement";
import PerilexSocket from "./PerilexSocket";
import PerilexPlug from "./PerilexPlug";

interface Props {
  phone?: string;
  contactHref?: string;
}

const IRIS = "#3A0CA3";
const INK = "#131b2e";
const MUTED = "#454654";
const STROKE = "#E2E8F0";

export default function PerilexMeasureGuide({ phone = "0645193589", contactHref = "/contact" }: Props) {
  const m = usePerilexMeasurement();
  const [active, setActive] = React.useState<0 | 1 | 2 | 3 | null>(null);

  const telHref = `tel:${phone.replace(/\s+/g, "")}`;

  return (
    <section
      aria-label="Perilex meten"
      style={{
        background: "#fff",
        border: `1px solid ${STROKE}`,
        borderRadius: 14,
        padding: 18,
        boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
      }}
    >
      {/* Safety notice */}
      <div
        role="alert"
        style={{
          display: "flex",
          gap: 10,
          padding: "12px 14px",
          borderRadius: 10,
          background: "#fdecef",
          border: "1px solid #f7c9d2",
          marginBottom: 16,
        }}
      >
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" style={{ flex: "0 0 auto", marginTop: 2 }}>
          <path
            d="M12 3 2 21h20L12 3Zm0 6v5m0 3v.5"
            stroke="#EC1F4C"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p style={{ margin: 0, fontSize: 13.5, color: "#93000a", lineHeight: 1.45 }}>
          Meten gebeurt onder spanning. <strong>Alleen met een CAT-gekeurde tweepolige spanningstester.</strong> Raak
          geen blank metaal aan.{" "}
          <a href={contactHref} style={{ color: IRIS, fontWeight: 700, textDecoration: "underline" }}>
            Liever laten doen? Neem contact op
          </a>
          .
        </p>
      </div>

      {/* Step 1 header */}
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 14 }}>
        <span
          aria-hidden
          style={{
            width: 32,
            height: 32,
            borderRadius: 999,
            background: IRIS,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: "0 0 auto",
            fontWeight: 800,
            fontSize: 15,
          }}
        >
          1
        </span>
        <div>
          <p style={{ fontSize: 16, fontWeight: 700, color: INK, margin: 0 }}>Meet het stopcontact</p>
          <p style={{ fontSize: 13, color: "#757685", margin: "2px 0 0" }}>
            Tik elk buitencontact aan. Elke tik wisselt: ? → L (spanning) → 0 (geen).
          </p>
        </div>
      </div>

      {/* Socket + Plug side by side on desktop, stacked mobile */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 20,
          alignItems: "start",
        }}
      >
        <div>
          <PerilexSocket
            contacts={m.contacts}
            names={m.names}
            colorFor={m.colorFor}
            onTap={m.cycle}
            active={active}
            onHover={setActive}
          />
          <p style={{ textAlign: "center", fontSize: 12, color: "#757685", marginTop: 6 }}>
            Stopcontact (gemeten) — vooraanzicht
          </p>
        </div>
        <div>
          <PerilexPlug contacts={m.plugContacts} names={m.plugNames} colorFor={m.colorFor} />
        </div>
      </div>

      {/* Result card */}
      <div
        style={{
          border: `1px solid ${m.result.kind === "error" ? "#EC1F4C" : IRIS}`,
          borderRadius: 12,
          padding: 16,
          marginTop: 18,
          background: m.result.kind === "error" ? "#fff5f6" : "#f7f5ff",
        }}
      >
        <p
          style={{
            fontSize: 11,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            fontWeight: 700,
            color: m.result.kind === "error" ? "#EC1F4C" : IRIS,
            margin: 0,
          }}
        >
          Gemeten configuratie
        </p>
        <p
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: m.result.kind === "error" ? "#EC1F4C" : IRIS,
            margin: "4px 0 6px",
          }}
        >
          {m.result.title}
        </p>
        <p style={{ fontSize: 13.5, color: MUTED, margin: 0, lineHeight: 1.5 }}>{m.result.detail}</p>

        {/* CTAs */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          <a
            href={telHref}
            style={{
              minHeight: 44,
              display: "inline-flex",
              alignItems: "center",
              padding: "0 14px",
              borderRadius: 999,
              background: IRIS,
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            Bel {phone}
          </a>
          <button
            type="button"
            onClick={m.reset}
            style={{
              minHeight: 44,
              padding: "0 14px",
              borderRadius: 999,
              background: "transparent",
              border: `1px solid ${IRIS}`,
              color: IRIS,
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Meting resetten
          </button>
        </div>
      </div>
    </section>
  );
}
