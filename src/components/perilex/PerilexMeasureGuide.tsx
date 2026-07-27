/**
 * Perilex meetgids — complete sectie voor de Perilex-pagina.
 * Zet deze onder de uitleg en boven de CTA.
 *
 *   import PerilexMeasureGuide from "@/components/perilex/PerilexMeasureGuide";
 *   <PerilexMeasureGuide phone="0686302148" />
 */
import { COPY, type Lang } from "./copy";
import PerilexPlug from "./PerilexPlug";
import PerilexSocket from "./PerilexSocket";
import { TONE, usePerilexMeasurement } from "./usePerilexMeasurement";

const SANS = "'Plus Jakarta Sans', system-ui, sans-serif";
const INK = "#12143C";

type Props = { phone?: string; lang?: Lang };

export default function PerilexMeasureGuide({ phone = "0686302148", lang = "nl" }: Props) {
  const T = COPY[lang];
  const LEGEND = [
    [T.wireL1, "#7C3F1D"],
    [T.wireL2, "#111827"],
    [T.wireL3, "#5C636E"],
    [T.wireN, "#1D4ED8"],
  ] as const;
  const { readings, socketPins, plugPins, result, toggle, reset } = usePerilexMeasurement(lang);
  const tone = TONE[result.tone];

  return (
    <section
      className="perilex-guide"
      style={{
        width: "100%",
        maxWidth: 820,
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
        .perilex-guide .pg-steps {
          display: grid;
          grid-template-columns: 1fr;
          gap: 32px;
          padding: 22px 22px 0;
          align-items: stretch;
        }
        .perilex-guide .pg-step-1 { order: 1; display: flex; flex-direction: column; }
        .perilex-guide .pg-result { order: 2; }
        .perilex-guide .pg-step-2 { order: 3; display: flex; flex-direction: column; }
        .perilex-guide .pg-infoblock { min-height: 82px; height: auto; }
        .perilex-guide .pg-drawing-wrap {
          width: 100%;
          max-width: 300px;
          margin-inline: auto;
          aspect-ratio: 320 / 338;
          display: grid;
          place-items: center;
          margin-top: 10px;
          margin-bottom: 12px;
        }
        .perilex-guide .pg-legend {
          min-height: 52px;
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
          gap: 8px 16px;
          padding: 10px 0 0;
          font: 500 12.5px 'Plus Jakarta Sans', system-ui, sans-serif;
          color: #12143C;
        }

        @media (min-width: 768px) {
          .perilex-guide .pg-intro { padding: 30px 22px 8px !important; }
          .perilex-guide .pg-steps {
            grid-template-columns: 1fr 1fr;
            grid-template-areas: "s1 s2" "res res";
            column-gap: 28px;
            row-gap: 28px;
            padding: 28px 22px 0;
          }
          .perilex-guide .pg-step-1 { grid-area: s1; }
          .perilex-guide .pg-step-2 { grid-area: s2; }
          .perilex-guide .pg-result { grid-area: res; margin: 0 !important; }
          .perilex-guide .pg-infoblock { height: 100%; }
          .perilex-guide .pg-footer { padding: 26px 22px 26px !important; }
        }
        @media (max-width: 767px) {
          .perilex-guide .pg-result { margin: 0 !important; }
        }
      `}</style>


      <div className="pg-intro" style={{ padding: "22px 22px 18px" }}>
        <div
          style={{
            font: `700 10.5px ${SANS}`,
            letterSpacing: ".1em",
            textTransform: "uppercase",
            color: "#3A0CA3",
            marginBottom: 7,
          }}
        >
          {T.kicker}
        </div>
        <h2 style={{ margin: "0 0 8px", font: `800 24px/1.15 ${SANS}`, color: INK, letterSpacing: "-.02em" }}>
          {T.title}
        </h2>
        <p style={{ margin: "0 0 18px", font: `400 14px/1.55 ${SANS}`, color: "rgba(18,20,60,.65)", textWrap: "pretty" }}>
          {T.intro}
        </p>

        <div
          style={{
            display: "flex",
            gap: 11,
            padding: "13px 14px",
            background: "#FFF5F7",
            border: "1px solid rgba(232,17,75,.22)",
            borderRadius: 13,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flex: "none", marginTop: 1 }}>
            <path d="M12 3 2.5 20h19L12 3Z" stroke="#E8114B" strokeWidth="2" strokeLinejoin="round" />
            <path d="M12 9.5v4.5" stroke="#E8114B" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="17" r="1.1" fill="#E8114B" />
          </svg>
          <p style={{ margin: 0, font: `500 12.5px/1.5 ${SANS}`, color: INK, textWrap: "pretty" }}>
            {T.safetyPrefix}<strong>{T.safetyStrong}</strong>{T.safetySuffix}
            <a href={`tel:${phone}`} style={{ color: "#3A0CA3", fontWeight: 600 }}>
              {T.safetyLink}
            </a>
            .
          </p>
        </div>
      </div>

      {/* steps grid */}
      <div className="pg-steps">
        {/* stap 1 */}
        <div className="pg-step-1">
          <Step n={1} title={T.step1Title} />
          <div
            className="pg-infoblock"
            style={{
              margin: "0 0 10px 0",
              padding: "14px 16px",
              background: "#F4F5F8",
              border: "1px solid rgba(18,20,60,.10)",
              borderRadius: 11,
            }}
          >
            <div style={{ font: `700 12.5px/1.35 ${SANS}`, color: INK }}>{T.step1BlockTitle}</div>
            <div
              style={{
                font: `400 11.5px/1.45 ${SANS}`,
                color: "rgba(18,20,60,.6)",
                marginTop: 3,
                textWrap: "pretty",
              }}
            >
              {T.step1BlockBody}
            </div>
          </div>

          <div className="pg-drawing-wrap">
            <PerilexSocket readings={readings} pins={socketPins} onToggle={toggle} lang={lang} />
          </div>

          <div className="pg-legend">
            <Chip color="#7C3F1D">{T.legendPhase}</Chip>
            <Chip color="#1D4ED8">{T.legendNeutral}</Chip>
            <Chip color="rgba(18,20,60,.4)" dashed>
              {T.legendUnknown}
            </Chip>
          </div>
        </div>

        {/* resultaat */}
        <div
          className="pg-result"
          style={{
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
            {T.resultKicker}
          </div>
          <div style={{ font: `800 19px/1.2 ${SANS}`, color: INK, marginBottom: 6 }}>{result.title}</div>
          <p style={{ margin: 0, font: `400 13px/1.55 ${SANS}`, color: "rgba(18,20,60,.7)", textWrap: "pretty" }}>
            {result.body}
          </p>
        </div>

        {/* stap 2 */}
        <div className="pg-step-2">
          <Step n={2} title={T.step2Title} />
          <div
            className="pg-infoblock"
            style={{
              margin: "0 0 10px 0",
              padding: "14px 16px",
              background: "#F4F5F8",
              border: "1px solid rgba(18,20,60,.10)",
              borderRadius: 11,
            }}
          >
            <div style={{ font: `700 12.5px/1.35 ${SANS}`, color: INK }}>{T.step2BlockTitle}</div>
            <div
              style={{
                font: `400 11.5px/1.45 ${SANS}`,
                color: "rgba(18,20,60,.6)",
                marginTop: 3,
                textWrap: "pretty",
              }}
            >
              {T.step2BlockBody}
            </div>
          </div>

          <div className="pg-drawing-wrap">
            <PerilexPlug pins={plugPins} lang={lang} />
          </div>

          <div className="pg-legend">
            {LEGEND.map(([label, color]) => (
              <span key={label} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 12, height: 12, flex: "none", borderRadius: 3, background: color }} />
                {label}
              </span>
            ))}
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 12,
                  height: 12,
                  flex: "none",
                  borderRadius: 3,
                  background: "linear-gradient(135deg,#FFE066 50%,#15803D 50%)",
                }}
              />
              {T.wirePE}
            </span>
          </div>
        </div>
      </div>
      {/* end steps grid */}

      <div className="pg-footer" style={{ display: "flex", gap: 10, padding: "22px 22px 22px" }}>
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
          {T.ctaCall}
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
          {T.reset}
        </button>
      </div>

      <div
        className="pg-fineprint"
        style={{
          padding: "0 22px 20px",
          font: `400 11.5px/1.5 ${SANS}`,
          color: "rgba(18,20,60,.42)",
          textWrap: "pretty",
        }}
      >
        {T.fineprint}
      </div>
    </section>
  );
}

function Step({ n, title }: { n: number; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
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
