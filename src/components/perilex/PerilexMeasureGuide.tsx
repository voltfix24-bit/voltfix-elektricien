/**
 * Perilex meetgids — complete sectie voor de Perilex-pagina.
 * Zet deze onder de uitleg en boven de CTA.
 *
 *   import PerilexMeasureGuide from "@/components/perilex/PerilexMeasureGuide";
 *   <PerilexMeasureGuide phone="0686302148" />
 */
import PerilexPlug from "./PerilexPlug";
import PerilexSocket from "./PerilexSocket";
import { TONE, usePerilexMeasurement } from "./usePerilexMeasurement";

const SANS = "'Plus Jakarta Sans', system-ui, sans-serif";
const INK = "#12143C";
const LEGEND = [
  ["L1 bruin", "#7C3F1D"],
  ["L2 zwart", "#111827"],
  ["L3 grijs", "#5C636E"],
  ["N blauw", "#1D4ED8"],
] as const;

type Props = { phone?: string };

export default function PerilexMeasureGuide({ phone = "0686302148" }: Props) {
  const { readings, socketPins, plugPins, result, toggle, reset } = usePerilexMeasurement();
  const tone = TONE[result.tone];

  return (
    <section
      className="perilex-guide"
      style={{
        width: "100%",
        maxWidth: 920,
        margin: "0 auto",
        background: "#fff",
        border: "1px solid rgba(0,0,0,.08)",
        borderRadius: 22,
        boxShadow: "0 2px 14px rgba(18,20,60,.09)",
        overflow: "hidden",
        fontFamily: SANS,
      }}
    >
      <style>{`
        .perilex-guide .pg-steps { display: block; }
        .perilex-guide .pg-step { padding: 0 22px; }
        @media (min-width: 780px) {
          .perilex-guide .pg-intro { padding: 30px 32px 0 !important; }
          .perilex-guide .pg-steps {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px 28px;
            padding: 0 32px;
            align-items: start;
          }
          .perilex-guide .pg-step { padding: 0 !important; }
          .perilex-guide .pg-result { margin: 22px 32px !important; }
          .perilex-guide .pg-footer { padding: 22px 32px 26px !important; }
          .perilex-guide .pg-fineprint { padding: 0 32px 24px !important; }
        }
      `}</style>
      <div style={{ padding: "22px 22px 0" }}>
        <div
          style={{
            font: `700 10.5px ${SANS}`,
            letterSpacing: ".1em",
            textTransform: "uppercase",
            color: "#3A0CA3",
            marginBottom: 7,
          }}
        >
          Zelf meten · 2 minuten
        </div>
        <h2 style={{ margin: "0 0 8px", font: `800 24px/1.15 ${SANS}`, color: INK, letterSpacing: "-.02em" }}>
          Welke Perilex heb je?
        </h2>
        <p style={{ margin: "0 0 18px", font: `400 14px/1.55 ${SANS}`, color: "rgba(18,20,60,.65)", textWrap: "pretty" }}>
          Meet elk contact tegen aarde. Tik hieronder aan wat je tester aangeeft — wij zeggen welk schema past.
        </p>

        <div
          style={{
            display: "flex",
            gap: 11,
            padding: "13px 14px",
            background: "#FFF5F7",
            border: "1px solid rgba(232,17,75,.22)",
            borderRadius: 13,
            marginBottom: 22,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flex: "none", marginTop: 1 }}>
            <path d="M12 3 2.5 20h19L12 3Z" stroke="#E8114B" strokeWidth="2" strokeLinejoin="round" />
            <path d="M12 9.5v4.5" stroke="#E8114B" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="17" r="1.1" fill="#E8114B" />
          </svg>
          <p style={{ margin: 0, font: `500 12.5px/1.5 ${SANS}`, color: INK, textWrap: "pretty" }}>
            Je meet <strong>onder spanning</strong>. Alleen met een CAT-gekeurde tweepolige spanningstester. Raak geen
            blank metaal aan. Twijfel je?{" "}
            <a href={`tel:${phone}`} style={{ color: "#3A0CA3", fontWeight: 600 }}>
              Laat ons het doen
            </a>
            .
          </p>
        </div>
      </div>

      {/* stap 1 */}
      <div style={{ padding: "0 22px" }}>
        <Step n={1} title="Meet het stopcontact" />
        <div style={{ font: `400 12px/1.5 ${SANS}`, color: "rgba(18,20,60,.5)", margin: "0 0 4px 31px" }}>
          Vooraanzicht — zoals je het in de muur ziet.
        </div>

        <PerilexSocket readings={readings} pins={socketPins} onToggle={toggle} />

        <div
          style={{
            display: "flex",
            gap: 16,
            justifyContent: "center",
            padding: "2px 0 4px",
            font: `500 11.5px ${SANS}`,
            color: "rgba(18,20,60,.55)",
          }}
        >
          <Chip color="#7C3F1D">fase</Chip>
          <Chip color="#1D4ED8">nul</Chip>
          <Chip color="rgba(18,20,60,.4)" dashed>
            nog niet
          </Chip>
        </div>
      </div>

      {/* resultaat */}
      <div
        style={{
          margin: "18px 22px",
          padding: "16px 18px",
          background: tone.bg,
          border: `1px solid ${tone.border}`,
          borderRadius: 14,
        }}
      >
        <div
          style={{
            font: `700 10.5px ${SANS}`,
            letterSpacing: ".1em",
            textTransform: "uppercase",
            color: tone.accent,
            marginBottom: 5,
          }}
        >
          Gemeten configuratie
        </div>
        <div style={{ font: `800 19px/1.2 ${SANS}`, color: INK, marginBottom: 6 }}>{result.title}</div>
        <p style={{ margin: 0, font: `400 13px/1.55 ${SANS}`, color: "rgba(18,20,60,.7)", textWrap: "pretty" }}>
          {result.body}
        </p>
      </div>

      {/* stap 2 */}
      <div style={{ padding: "0 22px 4px" }}>
        <Step n={2} title="Sluit de stekker aan" />
        <div
          style={{
            margin: "0 0 10px 31px",
            padding: "11px 13px",
            background: "#F5F2FE",
            border: "1px solid rgba(58,12,163,.18)",
            borderRadius: 11,
          }}
        >
          <div style={{ font: `700 12.5px/1.35 ${SANS}`, color: "#3A0CA3" }}>
            Pinnenzijde — dit is het spiegelbeeld van het stopcontact.
          </div>
          <div
            style={{
              font: `400 11.5px/1.45 ${SANS}`,
              color: "rgba(18,20,60,.6)",
              marginTop: 3,
              textWrap: "pretty",
            }}
          >
            De pennen staan op dezelfde plek als de gemeten contacten, maar links en rechts zijn verwisseld.
          </div>
        </div>

        <PerilexPlug pins={plugPins} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 14px", padding: "6px 0 0" }}>
          {LEGEND.map(([label, color]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, font: `500 12.5px ${SANS}`, color: INK }}>
              <span style={{ width: 13, height: 13, flex: "none", borderRadius: 3, background: color }} />
              {label}
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 8, font: `500 12.5px ${SANS}`, color: INK }}>
            <span
              style={{
                width: 13,
                height: 13,
                flex: "none",
                borderRadius: 3,
                background: "linear-gradient(135deg,#FFE066 50%,#15803D 50%)",
              }}
            />
            PE aarde
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, padding: "18px 22px 22px" }}>
        <a
          href={`tel:${phone}`}
          style={{
            flex: 1,
            minHeight: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            background: INK,
            color: "#fff",
            textDecoration: "none",
            borderRadius: 13,
            font: `700 15px ${SANS}`,
          }}
        >
          Laat het ons doen
        </a>
        <button
          type="button"
          onClick={reset}
          style={{
            minHeight: 50,
            padding: "0 16px",
            background: "#fff",
            border: "1.5px solid rgba(18,20,60,.15)",
            borderRadius: 13,
            font: `600 13.5px ${SANS}`,
            color: "rgba(18,20,60,.7)",
            cursor: "pointer",
          }}
        >
          Reset
        </button>
      </div>

      <div
        style={{
          padding: "0 22px 20px",
          font: `400 11.5px/1.5 ${SANS}`,
          color: "rgba(18,20,60,.42)",
          textWrap: "pretty",
        }}
      >
        Schematisch. Pinposities kunnen per fabrikant verschillen — markeer elk contact fysiek en houd het
        apparaatschema erbij.
      </div>
    </section>
  );
}

function Step({ n, title }: { n: number; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 4 }}>
      <span
        style={{
          width: 22,
          height: 22,
          flex: "none",
          borderRadius: "50%",
          background: INK,
          color: "#fff",
          font: `700 12px/1 ${SANS}`,
          display: "grid",
          placeItems: "center",
        }}
      >
        {n}
      </span>
      <span style={{ font: `700 14.5px/1.3 ${SANS}`, color: INK }}>{title}</span>
    </div>
  );
}

function Chip({ color, dashed, children }: { color: string; dashed?: boolean; children: React.ReactNode }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <svg width="15" height="15" viewBox="0 0 15 15">
        <circle
          cx="7.5"
          cy="7.5"
          r="5.8"
          fill="none"
          stroke={color}
          strokeWidth="2.6"
          strokeDasharray={dashed ? "3.4 3" : undefined}
        />
      </svg>
      {children}
    </span>
  );
}
