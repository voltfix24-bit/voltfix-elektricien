import React, { useState, useEffect } from "react";
import {
  Zap,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Wrench,
  PhoneCall,
  RotateCcw,
  Plug,
  Gauge,
  Check,
  CircleHelp,
  PlugZap,
  Phone,
  Activity,
} from "lucide-react";

import { business, telHref } from "@/lib/business";

/*  ────────────────────────────────────────────────────────────────
    PERILEX DIY-WIZARD — VoltFix Precision designsysteem
    Zelfstandige component, alle classes geprefixt met `vf-` zodat het
    de rest van de site niet beïnvloedt.
   ──────────────────────────────────────────────────────────────── */

const COMPANY = business.name;
const PHONE = business.phoneDisplay;
const EMAIL = business.email;

/* VoltFix Precision tokens */
const C = {
  bg: "#faf8ff",
  white: "#ffffff",
  soft: "#F8FAFC",
  tint: "#f2f3ff",
  stroke: "#E2E8F0",
  ink: "#131b2e",
  muted: "#454654",
  outline: "#757685",
  blue: "#3546C8",
  blueDark: "#1629b1",
  blueSoft: "#dfe0ff",
  red: "#EC1F4C",
  redInk: "#93000a",
  green: "#3BBF9E",
  greenInk: "#00372b",
};

const WIRES = [
  { label: "Geel-groen", to: "Aarde (PE)", sw: "linear-gradient(135deg,#f2d600 0 50%,#3aa83a 50% 100%)" },
  { label: "Blauw", to: "Nul (N)", sw: "#2f6fd6" },
  { label: "Bruin", to: "Fase L1", sw: "#7a4a22" },
  { label: "Zwart", to: "Fase L2", sw: "#1c1813" },
  { label: "Grijs", to: "Fase L3", sw: "#9a948c" },
];

const WIRE_STEPS = [
  {
    icon: Activity,
    title: "Meet de configuratie",
    body: "Bepaal eerst hóe de bestaande contactdoos bedraad is. Dit doe je ónder spanning — dus uiterst voorzichtig, met een goedgekeurde dubbelpolige spanningstester en droge handen. Zet één pen in het middencontact (meestal de aarde) en ga met de andere pen elk gat langs. Markeer waar wél spanning staat (L) en waar niet (N).",
  },
  {
    icon: Zap,
    title: "Spanning eraf",
    body: "Configuratie genoteerd? Schakel nu de juiste groep in de meterkast uit. Controleer met je spanningstester dat er écht geen spanning meer op de aansluiting staat — meet op alle contacten.",
  },
  {
    icon: Wrench,
    title: "Kabel voorbereiden",
    body: "Strip de buitenmantel en de losse aders op de juiste lengte. Houd de aardader (geel-groen) iets langer dan de fasen en de nul, zodat die als laatste loskomt bij trekken.",
  },
  {
    icon: PlugZap,
    title: "Aders op kleurcode",
    body: "Sluit elke ader aan op de gemarkeerde klem in de stekker. Volg de labels op de stekker zelf, niet alleen de penpositie. Geen blank koper buiten de klem.",
  },
  {
    icon: ShieldCheck,
    title: "Trekontlasting vast",
    body: "Zet de kabelklem stevig vast op de buitenmantel, nooit op de losse aders. Een goede trekontlasting voorkomt dat aders loskomen bij belasting.",
  },
  {
    icon: Gauge,
    title: "Apparaatzijde: bruggen",
    body: "Stel de bruggen op het aansluitblok van je apparaat in volgens het fabrikantsschema dat hoort bij de configuratie die je net hebt gemeten (1-, 2- of 3-fase). Verkeerde bruggen is een veelgemaakte, gevaarlijke fout.",
  },
  {
    icon: Check,
    title: "Sluiten & controleren",
    body: "Schroef de stekker dicht, controleer of alle schroeven vastzitten en niets klemt. Pas hierna mag de groep weer aan — bij twijfel laat je het natuurlijk meten.",
  },
];

/* Gangbare perilex-pinindeling (zicht op de contactdoos). */
const CONTACTS = [
  { id: "n", x: 64, y: 64, label: "N", up: true },
  { id: "l2", x: 176, y: 64, label: "L2", up: true },
  { id: "l1", x: 64, y: 176, label: "L1", up: false },
  { id: "l3", x: 176, y: 176, label: "L3", up: false },
];

const VERIFY_ITEMS = [
  "Configuratie vooraf gemeten en contacten gemarkeerd (L/N)",
  "Spanningsloos gecontroleerd vóór het bedraden",
  "Geen blank koper buiten de klemmen",
  "Alle klemschroeven stevig vast",
  "Trekontlasting op de mantel, niet op de aders",
  "Bruggen op het apparaat kloppen met de gemeten fase-configuratie",
  "Stekker volledig dichtgeschroefd",
];

const SAFETY_ITEMS = [
  { k: "groep", t: "Aparte groep met juiste zekering (16 A of 25 A)" },
  { k: "als", t: "Aardlekschakelaar aanwezig op de groep" },
  { k: "kabel", t: "Juiste kabeldoorsnede beschikbaar (min. 2,5 mm²)" },
  { k: "tester", t: "Spanningstester aanwezig — en je weet hoe je 'm gebruikt" },
  { k: "schema", t: "Aansluitschema (bruggen) van het apparaat bij de hand" },
];

const PHASES = ["Start", "Apparaat", "Situatie", "Veiligheid", "Aansluiten", "Controle"];
const phaseOf = (s: string): number =>
  (({ intro: 0, device: 1, situation: 2, safetygate: 3, steps: 4, verify: 5, done: 5 }) as Record<string, number>)[s] ??
  0;

type Screen =
  | "intro"
  | "device"
  | "situation"
  | "safetygate"
  | "steps"
  | "verify"
  | "done"
  | "pro"
  | "contactnote";

export function PerilexWizard() {
  const [screen, setScreen] = useState<Screen>("intro");
  const [history, setHistory] = useState<Screen[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [device, setDevice] = useState<string | null>(null);
  const [power, setPower] = useState<string | null>(null);
  const [situation, setSituation] = useState<string | null>(null);
  const [safety, setSafety] = useState<Record<string, "ja" | "nee">>({});
  const [wireStep, setWireStep] = useState(0);
  const [verify, setVerify] = useState<Record<number, boolean>>({});
  const [marks, setMarks] = useState<Record<string, "L" | "N" | undefined>>({});

  const cycleMark = (id: string) =>
    setMarks((m) => {
      const next = m[id] === "L" ? "N" : m[id] === "N" ? undefined : "L";
      const cp = { ...m };
      if (next === undefined) delete cp[id];
      else cp[id] = next;
      return cp;
    });

  useEffect(() => {
    const id = "vf-fonts";
    if (typeof document !== "undefined" && !document.getElementById(id)) {
      const l = document.createElement("link");
      l.id = id;
      l.rel = "stylesheet";
      l.href =
        "https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700&family=Inter:wght@400;500;600&display=swap";
      document.head.appendChild(l);
    }
  }, []);

  const go = (next: Screen) => {
    setHistory((h) => [...h, screen]);
    setScreen(next);
    window.scrollTo?.({ top: 0 });
  };
  const back = () =>
    setHistory((h) => {
      const c = [...h];
      const p = c.pop();
      if (p) setScreen(p);
      return c;
    });
  const restart = () => {
    setScreen("intro");
    setHistory([]);
    setAgreed(false);
    setDevice(null);
    setPower(null);
    setSituation(null);
    setSafety({});
    setWireStep(0);
    setVerify({});
    setMarks({});
    window.scrollTo?.({ top: 0 });
  };

  const safetyAllOk = SAFETY_ITEMS.every((i) => safety[i.k] === "ja");
  const verifyAll = VERIFY_ITEMS.every((_, i) => verify[i]);

  const css = `
    .vf *{box-sizing:border-box;margin:0;padding:0}
    .vf{font-family:'Inter',sans-serif;color:${C.ink};background:${C.bg};width:100%;line-height:1.5;-webkit-font-smoothing:antialiased;border-radius:12px;overflow:hidden}
    .vf-h{font-family:'Montserrat',sans-serif;font-weight:700;letter-spacing:-0.01em}
    .vf-wrap{max-width:680px;margin:0 auto;padding:24px 16px 32px}
    .vf-kick{font-family:'Inter',sans-serif;font-weight:600;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:${C.blue};display:inline-block}
    .vf-card{background:${C.white};border:1px solid ${C.stroke};border-radius:8px;box-shadow:0 4px 20px rgba(15,23,42,.05)}

    .vf-emerg{background:${C.red};color:#fff;font-family:'Inter',sans-serif}
    .vf-emerg a{color:#fff;text-decoration:none}

    .vf-opt{background:${C.white};border:1px solid ${C.stroke};border-radius:8px;padding:16px;width:100%;text-align:left;cursor:pointer;
      transition:.16s ease;display:flex;gap:13px;align-items:center;color:${C.ink};box-shadow:0 2px 10px rgba(15,23,42,.04)}
    .vf-opt:hover{border-color:${C.blue};box-shadow:0 8px 26px rgba(15,23,42,.10);transform:translateY(-1px)}
    .vf-opt.sel{border-color:${C.blue};box-shadow:0 0 0 1px ${C.blue} inset;background:${C.tint}}

    .vf-btn{font-family:'Inter',sans-serif;font-weight:600;font-size:15px;border:none;border-radius:4px;cursor:pointer;
      padding:13px 22px;display:inline-flex;align-items:center;gap:9px;transition:.16s ease}
    .vf-btn.prim{background:${C.blue};color:#fff;box-shadow:0 4px 16px rgba(53,70,200,.22)}
    .vf-btn.prim:hover{background:${C.blueDark};box-shadow:0 8px 22px rgba(53,70,200,.3)}
    .vf-btn.prim:disabled{background:#c5c7d6;color:#fff;cursor:not-allowed;box-shadow:none}
    .vf-btn.ghost{background:${C.white};color:${C.blue};border:1px solid ${C.blue}}
    .vf-btn.ghost:hover{background:${C.tint}}
    .vf-btn.emerg{background:${C.red};color:#fff;box-shadow:0 4px 16px rgba(236,31,76,.25)}
    .vf-btn.emerg:hover{filter:brightness(1.06)}

    .vf-toggle{display:flex;gap:8px}
    .vf-toggle button{flex:1;font-family:'Inter',sans-serif;font-size:13px;font-weight:600;letter-spacing:.04em;
      padding:10px;border:1px solid ${C.stroke};background:${C.white};color:${C.muted};border-radius:4px;cursor:pointer;transition:.14s}
    .vf-toggle button.ja.on{background:${C.green};color:${C.greenInk};border-color:${C.green}}
    .vf-toggle button.nee.on{background:${C.red};color:#fff;border-color:${C.red}}

    .vf-check{display:flex;align-items:center;gap:13px;padding:14px;border:1px solid ${C.stroke};background:${C.white};border-radius:4px;cursor:pointer;transition:.14s;box-shadow:0 2px 8px rgba(15,23,42,.03)}
    .vf-check:hover{border-color:${C.blue}}
    .vf-box{width:24px;height:24px;border:2px solid ${C.outline};border-radius:4px;flex:0 0 auto;display:flex;align-items:center;justify-content:center;transition:.14s}
    .vf-box.on{background:${C.green};border-color:${C.green}}

    .vf-dot{height:4px;flex:1;border-radius:999px;background:${C.stroke};transition:.3s}
    .vf-dot.on{background:${C.blue}}

    .vf-fade{animation:vfUp .4s cubic-bezier(.2,.7,.3,1) both}
    @keyframes vfUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
    .vf-pulse{animation:vfPulse 2.6s ease-in-out infinite}
    @keyframes vfPulse{0%,100%{box-shadow:0 0 0 0 rgba(236,31,76,.30)}50%{box-shadow:0 0 0 9px rgba(236,31,76,0)}}
  `;

  const EmergencyBar = () => (
    <div className="vf-emerg">
      <div className="vf-wrap" style={{ paddingTop: 12, paddingBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: 14 }}>
            <AlertTriangle size={18} /> Spoed met je elektra?
          </span>
          <a href={telHref} style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
            <PhoneCall size={18} /> Bel {PHONE}
          </a>
        </div>
      </div>
    </div>
  );

  const Header = () => (
    <div style={{ borderBottom: `1px solid ${C.stroke}`, background: C.white }}>
      <div className="vf-wrap" style={{ paddingTop: 16, paddingBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: C.blue,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flex: "0 0 auto",
              }}
            >
              <Zap size={22} />
            </span>
            <div>
              <p className="vf-h" style={{ fontSize: 16, lineHeight: 1.1 }}>
                {COMPANY}
              </p>
              <p style={{ fontSize: 12, color: C.muted }}>Perilex zelf aansluiten</p>
            </div>
          </div>
          {screen !== "intro" && (
            <button className="vf-btn ghost" style={{ padding: "8px 12px", fontSize: 13 }} onClick={restart}>
              <RotateCcw size={15} /> Opnieuw
            </button>
          )}
        </div>

        {!["intro", "done"].includes(screen) && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", gap: 6 }}>
              {PHASES.map((_, i) => (
                <span key={i} className={`vf-dot ${i <= phaseOf(screen) ? "on" : ""}`} />
              ))}
            </div>
            <p style={{ marginTop: 8, fontSize: 12, color: C.muted, fontWeight: 600 }}>
              Fase {phaseOf(screen)}/5 — {PHASES[phaseOf(screen)]}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const EscapeFoot = () => (
    <div style={{ marginTop: 24, textAlign: "center" }}>
      <button
        onClick={() => go("contactnote")}
        style={{ background: "none", border: "none", color: C.blue, fontWeight: 600, cursor: "pointer", fontSize: 14 }}
      >
        Liever zekerheid? Laat VoltFix het aansluiten →
      </button>
    </div>
  );

  const NavRow = ({
    onNext,
    nextLabel = "Verder",
    disabled,
    showBack = true,
  }: {
    onNext: () => void;
    nextLabel?: string;
    disabled?: boolean;
    showBack?: boolean;
  }) => (
    <div style={{ display: "flex", gap: 10, marginTop: 24, alignItems: "center" }}>
      {showBack && history.length > 0 && (
        <button className="vf-btn ghost" onClick={back}>
          <ArrowLeft size={16} /> Terug
        </button>
      )}
      <button className="vf-btn prim" style={{ marginLeft: "auto" }} onClick={onNext} disabled={disabled}>
        {nextLabel} <ArrowRight size={16} />
      </button>
    </div>
  );

  const SectionTitle = ({ kicker, title }: { kicker: string; title: string }) => (
    <>
      <span className="vf-kick">{kicker}</span>
      <h2 className="vf-h" style={{ fontSize: 24, marginTop: 6, marginBottom: 16 }}>
        {title}
      </h2>
    </>
  );

  /* ── SCREENS ────────────────────────────────────────────── */

  const renderIntro = () => (
    <div className="vf-fade">
      <span className="vf-kick">24/7 Service · Krachtstroom</span>
      <h2 className="vf-h" style={{ fontSize: 28, marginTop: 6, marginBottom: 12 }}>
        Perilex zelf aansluiten
      </h2>
      <p style={{ color: C.muted, marginBottom: 18 }}>
        Deze wizard helpt je veilig stap voor stap. We checken eerst óf je situatie geschikt is om zelf te doen. Zodra er
        meterkastwerk nodig is, komt VoltFix het vakkundig regelen.
      </p>

      <div
        className="vf-card"
        style={{ padding: 16, marginBottom: 18, background: "#fff5f6", borderColor: "#f7c9d2" }}
      >
        <div style={{ display: "flex", gap: 12 }}>
          <AlertTriangle size={22} color={C.red} style={{ flex: "0 0 auto", marginTop: 2 }} />
          <div>
            <p className="vf-h" style={{ fontSize: 15, color: C.redInk, marginBottom: 4 }}>
              Werken met 400V is levensgevaarlijk
            </p>
            <p style={{ fontSize: 13.5, color: C.muted }}>
              Een fout met driefasespanning kan brand of een ernstig ongeluk veroorzaken. Werk nooit onder spanning. Deze
              tool is informatief en vervangt geen vakkundige beoordeling ter plaatse.
            </p>
          </div>
        </div>
      </div>

      <button className="vf-check" style={{ marginBottom: 18, width: "100%" }} onClick={() => setAgreed(!agreed)}>
        <span className={`vf-box ${agreed ? "on" : ""}`}>{agreed && <Check size={16} color="#fff" />}</span>
        <span style={{ fontSize: 14, textAlign: "left" }}>
          Ik begrijp dat ik op eigen risico handel en de instructies opvolg met gezond verstand.
        </span>
      </button>

      <button className="vf-btn prim" style={{ width: "100%", justifyContent: "center" }} disabled={!agreed} onClick={() => go("device")}>
        Start de check <ArrowRight size={16} />
      </button>
    </div>
  );

  const renderDevice = () => {
    const devices = [
      { k: "fornuis", t: "Fornuis", i: Plug },
      { k: "kookplaat", t: "Inductie- of keramische kookplaat", i: Gauge },
      { k: "oven", t: "Inbouwoven", i: Plug },
      { k: "anders", t: "Ander krachtstroom-apparaat", i: CircleHelp },
    ];
    return (
      <div className="vf-fade">
        <SectionTitle kicker="Stap 1" title="Welk apparaat sluit je aan?" />
        <div style={{ display: "grid", gap: 10 }}>
          {devices.map((d) => {
            const Icon = d.i;
            return (
              <button key={d.k} className={`vf-opt ${device === d.k ? "sel" : ""}`} onClick={() => setDevice(d.k)}>
                <Icon size={20} color={C.blue} />
                <span style={{ fontWeight: 600 }}>{d.t}</span>
              </button>
            );
          })}
        </div>

        <h3 className="vf-h" style={{ fontSize: 16, marginTop: 22, marginBottom: 10 }}>
          Vermogen van het apparaat
        </h3>
        <div style={{ display: "grid", gap: 10 }}>
          {[
            ["tot11", "≤ 11 kW", "16 A"],
            ["tot17", "11–17 kW", "25 A"],
            ["weet", "Weet ik niet", "?"],
          ].map(([k, t, a]) => (
            <button
              key={k}
              className={`vf-opt ${power === k ? "sel" : ""}`}
              style={{ justifyContent: "space-between" }}
              onClick={() => setPower(k)}
            >
              <span style={{ fontWeight: 600 }}>{t}</span>
              <span style={{ fontSize: 13, color: C.muted, fontWeight: 600 }}>{a}</span>
            </button>
          ))}
        </div>

        <NavRow onNext={() => go("situation")} disabled={!device || !power} />
      </div>
    );
  };

  const renderSituation = () => {
    const opts = [
      { k: "perilex", t: "Er zit al een werkende perilex-contactdoos", route: "safetygate" as Screen },
      { k: "cee", t: "Er zit een rode CEE-krachtstroomaansluiting", route: "pro" as Screen },
      { k: "stopcontact", t: "Alleen een gewoon stopcontact / nog niets", route: "pro" as Screen },
      { k: "weet", t: "Ik weet het niet zeker", route: "pro" as Screen },
    ];
    const chosen = opts.find((o) => o.k === situation);
    return (
      <div className="vf-fade">
        <SectionTitle kicker="Stap 2" title="Wat is de huidige situatie?" />
        <p style={{ color: C.muted, marginBottom: 16, fontSize: 14 }}>
          Dit bepaalt of je verder kunt. Alleen een bestaande, correcte perilex-aansluiting is geschikt om zelf op aan te
          sluiten.
        </p>
        <div style={{ display: "grid", gap: 10 }}>
          {opts.map((o) => (
            <button key={o.k} className={`vf-opt ${situation === o.k ? "sel" : ""}`} onClick={() => setSituation(o.k)}>
              <Plug size={20} color={C.blue} />
              <span style={{ fontWeight: 600 }}>{o.t}</span>
            </button>
          ))}
        </div>
        <NavRow onNext={() => go(chosen?.route || "pro")} disabled={!situation} />
      </div>
    );
  };

  const renderSafety = () => (
    <div className="vf-fade">
      <SectionTitle kicker="Stap 3" title="Veiligheidscheck" />
      <p style={{ color: C.muted, marginBottom: 16, fontSize: 14 }}>
        Beantwoord eerlijk. Ontbreekt er iets, dan is dit een klus voor een installateur — geen schande, wél veilig.
      </p>
      <div style={{ display: "grid", gap: 10 }}>
        {SAFETY_ITEMS.map((it) => (
          <div key={it.k} className="vf-card" style={{ padding: 14 }}>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>{it.t}</p>
            <div className="vf-toggle">
              <button
                className={`ja ${safety[it.k] === "ja" ? "on" : ""}`}
                onClick={() => setSafety((s) => ({ ...s, [it.k]: "ja" }))}
              >
                JA
              </button>
              <button
                className={`nee ${safety[it.k] === "nee" ? "on" : ""}`}
                onClick={() => setSafety((s) => ({ ...s, [it.k]: "nee" }))}
              >
                NEE
              </button>
            </div>
          </div>
        ))}
      </div>
      {Object.values(safety).includes("nee") && (
        <div
          className="vf-card"
          style={{ padding: 14, marginTop: 14, background: "#fff5f6", borderColor: "#f7c9d2", display: "flex", gap: 10 }}
        >
          <AlertTriangle size={20} color={C.red} style={{ flex: "0 0 auto" }} />
          <span style={{ fontSize: 13.5, color: C.redInk }}>
            Eén of meer voorwaarden ontbreken. Ga niet zelf verder — vraag een aansluiting aan.
          </span>
        </div>
      )}
      <NavRow
        onNext={() => go(safetyAllOk ? "steps" : "pro")}
        nextLabel={safetyAllOk ? "Naar de stappen" : "Bekijk advies"}
        disabled={Object.keys(safety).length < SAFETY_ITEMS.length}
      />
    </div>
  );

  const renderSteps = () => {
    const s = WIRE_STEPS[wireStep];
    const Icon = s.icon;
    const last = wireStep === WIRE_STEPS.length - 1;
    return (
      <div className="vf-fade">
        <SectionTitle kicker={`Stap ${wireStep + 1} / ${WIRE_STEPS.length}`} title={s.title} />

        <div className="vf-card" style={{ padding: 18 }}>
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
              <Icon size={22} />
            </span>
            <p style={{ fontSize: 14.5, color: C.muted }}>{s.body}</p>
          </div>

          {wireStep === 0 && (
            <div style={{ marginTop: 18 }}>
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  padding: 12,
                  borderRadius: 6,
                  background: "#fff5f6",
                  border: "1px solid #f7c9d2",
                  marginBottom: 16,
                }}
              >
                <AlertTriangle size={18} color={C.red} style={{ flex: "0 0 auto" }} />
                <span style={{ fontSize: 13, color: C.redInk }}>
                  Deze meting doe je bewust ónder spanning. Gebruik een CAT-gekeurde dubbelpolige tester en raak nooit
                  blank metaal aan.
                </span>
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

              {(() => {
                const keys = ["n", "l1", "l2", "l3"];
                const live = keys.filter((k) => marks[k] === "L").length;
                const done = keys.filter((k) => marks[k]).length;
                let title: string, detail: string, tone: string;
                if (done < 4) {
                  title = `${done}/4 gemeten`;
                  detail = "Tik elk buitencontact aan. Elke tik wisselt: ? → L (spanning) → N (geen).";
                  tone = C.blue;
                } else if (live === 1) {
                  title = "1-fase";
                  detail = "Eén fase, de rest nul/aarde. Gebruik het 1-fase schema van de fabrikant.";
                  tone = C.green;
                } else if (live === 2) {
                  title = "2-fase — let op";
                  detail =
                    "Meet de twee L-contacten óók onderling: 0 V = zelfde fase; spanning = twee verschillende fasen, dan ander schema.";
                  tone = C.blue;
                } else if (live === 3) {
                  title = "3-fase";
                  detail = "Drie fasen + één nul. Gebruik het 3-fase schema.";
                  tone = C.green;
                } else {
                  title = "Controleer je meting";
                  detail = `${live}× spanning is ongebruikelijk. Meet opnieuw of raadpleeg een vakman.`;
                  tone = C.red;
                }
                return (
                  <div className="vf-card" style={{ padding: 14, marginTop: 14, borderColor: tone }}>
                    <p className="vf-kick" style={{ color: tone }}>
                      Gemeten configuratie
                    </p>
                    <p className="vf-h" style={{ fontSize: 18, color: tone, margin: "2px 0 4px" }}>
                      {title}
                    </p>
                    <p style={{ fontSize: 13.5, color: C.muted }}>{detail}</p>
                  </div>
                );
              })()}

              <div style={{ display: "flex", gap: 14, marginTop: 12, flexWrap: "wrap", fontSize: 12, color: C.muted }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 12, height: 12, borderRadius: 999, background: C.red }} /> Spanning (L)
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 12, height: 12, borderRadius: 999, background: "#94a0b3" }} /> Geen (N)
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 12, height: 12, borderRadius: 999, background: C.green }} /> Aarde (PE)
                </span>
              </div>

              <p style={{ fontSize: 11.5, color: C.outline, marginTop: 12 }}>
                Schematische weergave — de werkelijke pinpositie kan afwijken (L1/L3 zijn soms verwisseld). Markeer fysiek
                elk contact en raadpleeg het apparaatschema dat bij déze configuratie past.
              </p>
            </div>
          )}

          {wireStep === 3 && (
            <div style={{ marginTop: 16, display: "grid", gap: 8 }}>
              {WIRES.map((w) => (
                <div
                  key={w.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 12px",
                    border: `1px solid ${C.stroke}`,
                    borderRadius: 6,
                  }}
                >
                  <span style={{ width: 18, height: 18, borderRadius: 4, background: w.sw, flex: "0 0 auto" }} />
                  <span style={{ fontSize: 13.5, fontWeight: 600, minWidth: 90 }}>{w.label}</span>
                  <ArrowRight size={14} color={C.outline} />
                  <span style={{ fontSize: 13.5, color: C.muted }}>{w.to}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 20, alignItems: "center" }}>
          <button className="vf-btn ghost" onClick={() => (wireStep === 0 ? back() : setWireStep((w) => w - 1))}>
            <ArrowLeft size={16} /> {wireStep === 0 ? "Terug" : "Vorige"}
          </button>
          <button
            className="vf-btn prim"
            style={{ marginLeft: "auto" }}
            onClick={() => (last ? go("verify") : setWireStep((w) => w + 1))}
          >
            {last ? "Naar controle" : "Volgende stap"} <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  const renderVerify = () => (
    <div className="vf-fade">
      <SectionTitle kicker="Stap 5" title="Eindcontrole" />
      <p style={{ color: C.muted, marginBottom: 16, fontSize: 14 }}>Vink alles af voordat de groep weer aan mag.</p>
      <div style={{ display: "grid", gap: 10 }}>
        {VERIFY_ITEMS.map((t, i) => (
          <button key={i} className="vf-check" onClick={() => setVerify((v) => ({ ...v, [i]: !v[i] }))}>
            <span className={`vf-box ${verify[i] ? "on" : ""}`}>{verify[i] && <Check size={16} color="#fff" />}</span>
            <span style={{ fontSize: 14, textAlign: "left" }}>{t}</span>
          </button>
        ))}
      </div>
      <NavRow onNext={() => go("done")} nextLabel="Afronden" disabled={!verifyAll} />
    </div>
  );

  const renderDone = () => (
    <div className="vf-fade" style={{ textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
        <CheckCircle2 size={56} color={C.green} />
      </div>
      <h2 className="vf-h" style={{ fontSize: 26, marginBottom: 10 }}>
        Aansluiting gereed
      </h2>
      <p style={{ color: C.muted, marginBottom: 18, maxWidth: 440, marginInline: "auto" }}>
        Mooi werk. Laat bij twijfel of voor 100% zekerheid een meting/keuring doen — VoltFix komt graag controleren of het
        naar norm is aangesloten.
      </p>

      <div className="vf-card" style={{ padding: 16, marginBottom: 18, textAlign: "left" }}>
        <p className="vf-h" style={{ fontSize: 15, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
          <ShieldCheck size={18} color={C.green} /> Inspectie aanvragen
        </p>
        <p style={{ fontSize: 13.5, color: C.muted }}>
          Een korte controlemeting geeft rust én voorkomt verzekeringsgedoe bij schade.
        </p>
      </div>

      <button className="vf-btn prim" style={{ width: "100%", justifyContent: "center" }} onClick={() => go("contactnote")}>
        <Phone size={16} /> Plan een controle
      </button>
      <button
        onClick={restart}
        style={{ marginTop: 14, background: "none", border: "none", color: C.blue, fontWeight: 600, cursor: "pointer", fontSize: 14, display: "inline-flex", alignItems: "center", gap: 6 }}
      >
        <RotateCcw size={15} /> Opnieuw beginnen
      </button>
    </div>
  );

  const renderPro = () => (
    <div className="vf-fade">
      <div className="vf-card" style={{ padding: 18, marginBottom: 16 }}>
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
            <Wrench size={22} />
          </span>
          <div>
            <p className="vf-h" style={{ fontSize: 18, marginBottom: 6 }}>
              Dit is vakwerk
            </p>
            <p style={{ fontSize: 14, color: C.muted }}>
              {situation === "cee" &&
                "Een CEE-aansluiting ombouwen naar perilex vraagt om vaste-installatiewerk en de juiste keuzes in de meterkast. "}
              {situation === "stopcontact" &&
                "Er is een nieuwe krachtstroomgroep nodig in de meterkast. Dat valt onder de NEN 1010-norm. "}
              {situation === "weet" &&
                "Zonder zekerheid over de aansluiting kunnen we je niet veilig zelf laten doorgaan. "}
              {!["cee", "stopcontact", "weet"].includes(situation || "") &&
                "Op basis van je antwoorden is dit geen verantwoorde doe-het-zelf-klus. "}
              VoltFix regelt het graag vakkundig en met garantie.
            </p>
          </div>
        </div>
      </div>

      <div className="vf-card" style={{ padding: 16, marginBottom: 16 }}>
        <p className="vf-h" style={{ fontSize: 15, marginBottom: 10 }}>
          Wat wij doen
        </p>
        {["Groep + zekering volgens NEN 1010", "Aardlek en juiste kabeldoorsnede", "Aansluiten, meten en opleveren met garantie"].map(
          (t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", fontSize: 14 }}>
              <CheckCircle2 size={18} color={C.green} /> {t}
            </div>
          ),
        )}
      </div>

      <button className="vf-btn prim" style={{ width: "100%", justifyContent: "center" }} onClick={() => go("contactnote")}>
        Vraag een offerte aan <ArrowRight size={16} />
      </button>
      <button
        onClick={restart}
        style={{ marginTop: 14, background: "none", border: "none", color: C.blue, fontWeight: 600, cursor: "pointer", fontSize: 14, display: "inline-flex", alignItems: "center", gap: 6 }}
      >
        <RotateCcw size={15} /> Opnieuw beginnen
      </button>
    </div>
  );

  const renderContact = () => (
    <div className="vf-fade" style={{ textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
        <span
          style={{
            width: 56,
            height: 56,
            borderRadius: 12,
            background: C.blue,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <PhoneCall size={26} />
        </span>
      </div>
      <h2 className="vf-h" style={{ fontSize: 24, marginBottom: 10 }}>
        Neem contact op
      </h2>
      <p style={{ color: C.muted, marginBottom: 18, maxWidth: 420, marginInline: "auto" }}>
        Bel of mail VoltFix — we plannen graag een afspraak of controle in Amsterdam.
      </p>

      <div className="vf-card" style={{ padding: 16, marginBottom: 18, textAlign: "left" }}>
        <p className="vf-h" style={{ fontSize: 15, marginBottom: 6 }}>
          {COMPANY} · Amsterdam
        </p>
        <p style={{ fontSize: 14, color: C.muted }}>tel · {PHONE}</p>
        <p style={{ fontSize: 14, color: C.muted }}>{EMAIL}</p>
      </div>

      <a href={telHref} className="vf-btn prim" style={{ width: "100%", justifyContent: "center", textDecoration: "none" }}>
        <Phone size={16} /> Bel direct
      </a>
      <div style={{ marginTop: 14 }}>
        <button className="vf-btn ghost" onClick={back}>
          <ArrowLeft size={16} /> Terug
        </button>
      </div>
    </div>
  );

  const body = {
    intro: renderIntro,
    device: renderDevice,
    situation: renderSituation,
    safetygate: renderSafety,
    steps: renderSteps,
    verify: renderVerify,
    done: renderDone,
    pro: renderPro,
    contactnote: renderContact,
  }[screen]();

  const showFoot = !["intro", "pro", "contactnote", "done"].includes(screen);

  return (
    <div className="vf">
      <style>{css}</style>
      <EmergencyBar />
      <Header />
      <div className="vf-wrap">
        {body}
        {showFoot && <EscapeFoot />}
      </div>
    </div>
  );
}
