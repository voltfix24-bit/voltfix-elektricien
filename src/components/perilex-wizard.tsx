import React, { useState, useEffect, useRef } from "react";
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
  type LucideIcon,
} from "lucide-react";

import { business, telHref } from "@/lib/business";
import { useTrackConversion } from "@/lib/analytics";

/*  ────────────────────────────────────────────────────────────────
    PERILEX DIY-WIZARD — VoltFix Precision designsysteem
    Zelfstandige, tweetalige component (NL/EN). Alle classes geprefixt
    met `vf-` zodat het de rest van de site niet beïnvloedt.
   ──────────────────────────────────────────────────────────────── */

const COMPANY = business.name;
const PHONE = business.phoneDisplay;
const EMAIL = business.email;

export type WizardLang = "nl" | "en";

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

/* Gangbare perilex-pinindeling (zicht op de contactdoos). */
const CONTACTS = [
  { id: "n", x: 64, y: 64, label: "N", up: true },
  { id: "l2", x: 176, y: 64, label: "L2", up: true },
  { id: "l1", x: 64, y: 176, label: "L1", up: false },
  { id: "l3", x: 176, y: 176, label: "L3", up: false },
];

const WIRE_SWATCHES = [
  "linear-gradient(135deg,#f2d600 0 50%,#3aa83a 50% 100%)",
  "#2f6fd6",
  "#7a4a22",
  "#1c1813",
  "#9a948c",
];

const STEP_ICONS: LucideIcon[] = [Activity, Zap, Wrench, PlugZap, ShieldCheck, Gauge, Check];
const PHASE_KEYS = ["intro", "device", "situation", "safetygate", "steps", "verify", "done"] as const;
const phaseOf = (s: string): number =>
  (({ intro: 0, device: 1, situation: 2, safetygate: 3, steps: 4, verify: 5, done: 5 }) as Record<string, number>)[s] ??
  0;

// ---------------------------------------------------------------------------
// Vertalingen
// ---------------------------------------------------------------------------

type Copy = {
  brandSub: string;
  emergency: string;
  callBtn: string;
  restart: string;
  back: string;
  prev: string;
  next: string;
  continue: string;
  phaseLabel: (n: number, name: string) => string;
  phases: string[];
  escape: string;
  // intro
  introKicker: string;
  introTitle: string;
  introBody: string;
  dangerTitle: string;
  dangerBody: string;
  agree: string;
  startCheck: string;
  // device
  step1Kicker: string;
  deviceTitle: string;
  devices: { k: string; t: string; i: LucideIcon }[];
  powerTitle: string;
  powers: [string, string, string][];
  // situation
  step2Kicker: string;
  situationTitle: string;
  situationIntro: string;
  situations: { k: string; t: string; route: "safetygate" | "pro" }[];
  // safety
  step3Kicker: string;
  safetyTitle: string;
  safetyIntro: string;
  safetyItems: { k: string; t: string }[];
  yes: string;
  no: string;
  safetyWarn: string;
  toSteps: string;
  seeAdvice: string;
  // steps
  stepKicker: (i: number, total: number) => string;
  steps: { title: string; body: string }[];
  measureWarn: string;
  measuredConfig: string;
  measuredProgress: (done: number) => string;
  measureHint: string;
  conf1Title: string;
  conf1Detail: string;
  conf2Title: string;
  conf2Detail: string;
  conf3Title: string;
  conf3Detail: string;
  confErrTitle: string;
  confErrDetail: (live: number) => string;
  legendL: string;
  legendN: string;
  legendPE: string;
  schemaNote: string;
  wires: { label: string; to: string }[];
  toCheck: string;
  // verify
  step5Kicker: string;
  verifyTitle: string;
  verifyIntro: string;
  verifyItems: string[];
  finish: string;
  // done
  doneTitle: string;
  doneBody: string;
  inspectTitle: string;
  inspectBody: string;
  planControl: string;
  restartFull: string;
  // pro
  proTitle: string;
  proCee: string;
  proStopcontact: string;
  proWeet: string;
  proDefault: string;
  proOutro: string;
  whatWeDoTitle: string;
  whatWeDo: string[];
  requestQuote: string;
  // contact
  contactTitle: string;
  contactBody: string;
  callDirect: string;
};

const COPY: Record<WizardLang, Copy> = {
  nl: {
    brandSub: "Perilex zelf aansluiten",
    emergency: "Spoed met je elektra?",
    callBtn: `Bel ${PHONE}`,
    restart: "Opnieuw",
    back: "Terug",
    prev: "Vorige",
    next: "Volgende stap",
    continue: "Verder",
    phaseLabel: (n, name) => `Fase ${n}/5 — ${name}`,
    phases: ["Start", "Apparaat", "Situatie", "Veiligheid", "Aansluiten", "Controle"],
    escape: "Liever zekerheid? Laat VoltFix het aansluiten →",
    introKicker: "24/7 Service · Krachtstroom",
    introTitle: "Perilex zelf aansluiten",
    introBody:
      "Deze wizard helpt je veilig stap voor stap. We checken eerst óf je situatie geschikt is om zelf te doen. Zodra er meterkastwerk nodig is, komt VoltFix het vakkundig regelen.",
    dangerTitle: "Werken met 400V is levensgevaarlijk",
    dangerBody:
      "Een fout met driefasespanning kan brand of een ernstig ongeluk veroorzaken. Werk nooit onder spanning. Deze tool is informatief en vervangt geen vakkundige beoordeling ter plaatse.",
    agree: "Ik begrijp dat ik op eigen risico handel en de instructies opvolg met gezond verstand.",
    startCheck: "Start de check",
    step1Kicker: "Stap 1",
    deviceTitle: "Welk apparaat sluit je aan?",
    devices: [
      { k: "fornuis", t: "Fornuis", i: Plug },
      { k: "kookplaat", t: "Inductie- of keramische kookplaat", i: Gauge },
      { k: "oven", t: "Inbouwoven", i: Plug },
      { k: "anders", t: "Ander krachtstroom-apparaat", i: CircleHelp },
    ],
    powerTitle: "Vermogen van het apparaat",
    powers: [
      ["tot11", "≤ 11 kW", "16 A"],
      ["tot17", "11–17 kW", "25 A"],
      ["weet", "Weet ik niet", "?"],
    ],
    step2Kicker: "Stap 2",
    situationTitle: "Wat is de huidige situatie?",
    situationIntro:
      "Dit bepaalt of je verder kunt. Alleen een bestaande, correcte perilex-aansluiting is geschikt om zelf op aan te sluiten.",
    situations: [
      { k: "perilex", t: "Er zit al een werkende perilex-contactdoos", route: "safetygate" },
      { k: "cee", t: "Er zit een rode CEE-krachtstroomaansluiting", route: "pro" },
      { k: "stopcontact", t: "Alleen een gewoon stopcontact / nog niets", route: "pro" },
      { k: "weet", t: "Ik weet het niet zeker", route: "pro" },
    ],
    step3Kicker: "Stap 3",
    safetyTitle: "Veiligheidscheck",
    safetyIntro:
      "Beantwoord eerlijk. Ontbreekt er iets, dan is dit een klus voor een installateur — geen schande, wél veilig.",
    safetyItems: [
      { k: "groep", t: "Aparte groep met juiste zekering (16 A of 25 A)" },
      { k: "als", t: "Aardlekschakelaar aanwezig op de groep" },
      { k: "kabel", t: "Juiste kabeldoorsnede beschikbaar (min. 2,5 mm²)" },
      { k: "tester", t: "Spanningstester aanwezig — en je weet hoe je 'm gebruikt" },
      { k: "schema", t: "Aansluitschema (bruggen) van het apparaat bij de hand" },
    ],
    yes: "JA",
    no: "NEE",
    safetyWarn: "Eén of meer voorwaarden ontbreken. Ga niet zelf verder — vraag een aansluiting aan.",
    toSteps: "Naar de stappen",
    seeAdvice: "Bekijk advies",
    stepKicker: (i, total) => `Stap ${i} / ${total}`,
    steps: [
      {
        title: "Meet de configuratie",
        body: "Bepaal eerst hóe de bestaande contactdoos bedraad is. Dit doe je ónder spanning — dus uiterst voorzichtig, met een goedgekeurde dubbelpolige spanningstester en droge handen. Zet één pen in het middencontact (meestal de aarde) en ga met de andere pen elk gat langs. Markeer waar wél spanning staat (L) en waar niet (N).",
      },
      {
        title: "Spanning eraf",
        body: "Configuratie genoteerd? Schakel nu de juiste groep in de meterkast uit. Controleer met je spanningstester dat er écht geen spanning meer op de aansluiting staat — meet op alle contacten.",
      },
      {
        title: "Kabel voorbereiden",
        body: "Strip de buitenmantel en de losse aders op de juiste lengte. Houd de aardader (geel-groen) iets langer dan de fasen en de nul, zodat die als laatste loskomt bij trekken.",
      },
      {
        title: "Aders op kleurcode",
        body: "Sluit elke ader aan op de gemarkeerde klem in de stekker. Volg de labels op de stekker zelf, niet alleen de penpositie. Geen blank koper buiten de klem.",
      },
      {
        title: "Trekontlasting vast",
        body: "Zet de kabelklem stevig vast op de buitenmantel, nooit op de losse aders. Een goede trekontlasting voorkomt dat aders loskomen bij belasting.",
      },
      {
        title: "Apparaatzijde: bruggen",
        body: "Stel de bruggen op het aansluitblok van je apparaat in volgens het fabrikantsschema dat hoort bij de configuratie die je net hebt gemeten (1-, 2- of 3-fase). Verkeerde bruggen is een veelgemaakte, gevaarlijke fout.",
      },
      {
        title: "Sluiten & controleren",
        body: "Schroef de stekker dicht, controleer of alle schroeven vastzitten en niets klemt. Pas hierna mag de groep weer aan — bij twijfel laat je het natuurlijk meten.",
      },
    ],
    measureWarn:
      "Deze meting doe je bewust ónder spanning. Gebruik een CAT-gekeurde dubbelpolige tester en raak nooit blank metaal aan.",
    measuredConfig: "Gemeten configuratie",
    measuredProgress: (done) => `${done}/4 gemeten`,
    measureHint: "Tik elk buitencontact aan. Elke tik wisselt: ? → L (spanning) → N (geen).",
    conf1Title: "1-fase",
    conf1Detail: "Eén fase, de rest nul/aarde. Gebruik het 1-fase schema van de fabrikant.",
    conf2Title: "2-fase — let op",
    conf2Detail:
      "Meet de twee L-contacten óók onderling: 0 V = zelfde fase; spanning = twee verschillende fasen, dan ander schema.",
    conf3Title: "3-fase",
    conf3Detail: "Drie fasen + één nul. Gebruik het 3-fase schema.",
    confErrTitle: "Controleer je meting",
    confErrDetail: (live) => `${live}× spanning is ongebruikelijk. Meet opnieuw of raadpleeg een vakman.`,
    legendL: "Spanning (L)",
    legendN: "Geen (N)",
    legendPE: "Aarde (PE)",
    schemaNote:
      "Schematische weergave — de werkelijke pinpositie kan afwijken (L1/L3 zijn soms verwisseld). Markeer fysiek elk contact en raadpleeg het apparaatschema dat bij déze configuratie past.",
    wires: [
      { label: "Geel-groen", to: "Aarde (PE)" },
      { label: "Blauw", to: "Nul (N)" },
      { label: "Bruin", to: "Fase L1" },
      { label: "Zwart", to: "Fase L2" },
      { label: "Grijs", to: "Fase L3" },
    ],
    toCheck: "Naar controle",
    step5Kicker: "Stap 5",
    verifyTitle: "Eindcontrole",
    verifyIntro: "Vink alles af voordat de groep weer aan mag.",
    verifyItems: [
      "Configuratie vooraf gemeten en contacten gemarkeerd (L/N)",
      "Spanningsloos gecontroleerd vóór het bedraden",
      "Geen blank koper buiten de klemmen",
      "Alle klemschroeven stevig vast",
      "Trekontlasting op de mantel, niet op de aders",
      "Bruggen op het apparaat kloppen met de gemeten fase-configuratie",
      "Stekker volledig dichtgeschroefd",
    ],
    finish: "Afronden",
    doneTitle: "Aansluiting gereed",
    doneBody:
      "Mooi werk. Laat bij twijfel of voor 100% zekerheid een meting/keuring doen — VoltFix komt graag controleren of het naar norm is aangesloten.",
    inspectTitle: "Inspectie aanvragen",
    inspectBody: "Een korte controlemeting geeft rust én voorkomt verzekeringsgedoe bij schade.",
    planControl: "Plan een controle",
    restartFull: "Opnieuw beginnen",
    proTitle: "Dit is vakwerk",
    proCee:
      "Een CEE-aansluiting ombouwen naar perilex vraagt om vaste-installatiewerk en de juiste keuzes in de meterkast. ",
    proStopcontact:
      "Er is een nieuwe krachtstroomgroep nodig in de meterkast. Dat valt onder de NEN 1010-norm. ",
    proWeet: "Zonder zekerheid over de aansluiting kunnen we je niet veilig zelf laten doorgaan. ",
    proDefault: "Op basis van je antwoorden is dit geen verantwoorde doe-het-zelf-klus. ",
    proOutro: "VoltFix regelt het graag vakkundig en met garantie.",
    whatWeDoTitle: "Wat wij doen",
    whatWeDo: [
      "Groep + zekering volgens NEN 1010",
      "Aardlek en juiste kabeldoorsnede",
      "Aansluiten, meten en opleveren met garantie",
    ],
    requestQuote: "Vraag een offerte aan",
    contactTitle: "Neem contact op",
    contactBody: "Bel of mail VoltFix — we plannen graag een afspraak of controle in Amsterdam.",
    callDirect: "Bel direct",
  },
  en: {
    brandSub: "Connect a perilex yourself",
    emergency: "Electrical emergency?",
    callBtn: `Call ${PHONE}`,
    restart: "Restart",
    back: "Back",
    prev: "Previous",
    next: "Next step",
    continue: "Continue",
    phaseLabel: (n, name) => `Phase ${n}/5 — ${name}`,
    phases: ["Start", "Appliance", "Situation", "Safety", "Wiring", "Check"],
    escape: "Prefer peace of mind? Let VoltFix connect it →",
    introKicker: "24/7 Service · Power circuit",
    introTitle: "Connect a perilex yourself",
    introBody:
      "This wizard guides you safely, step by step. First we check whether your situation is suitable to do yourself. As soon as fuse-box work is needed, VoltFix handles it professionally.",
    dangerTitle: "Working with 400V is life-threatening",
    dangerBody:
      "A mistake with three-phase power can cause fire or serious injury. Never work on a live connection. This tool is informational and does not replace a professional on-site assessment.",
    agree: "I understand that I act at my own risk and follow the instructions with common sense.",
    startCheck: "Start the check",
    step1Kicker: "Step 1",
    deviceTitle: "Which appliance are you connecting?",
    devices: [
      { k: "fornuis", t: "Range / cooker", i: Plug },
      { k: "kookplaat", t: "Induction or ceramic hob", i: Gauge },
      { k: "oven", t: "Built-in oven", i: Plug },
      { k: "anders", t: "Other power-circuit appliance", i: CircleHelp },
    ],
    powerTitle: "Appliance power rating",
    powers: [
      ["tot11", "≤ 11 kW", "16 A"],
      ["tot17", "11–17 kW", "25 A"],
      ["weet", "Not sure", "?"],
    ],
    step2Kicker: "Step 2",
    situationTitle: "What is the current situation?",
    situationIntro:
      "This determines whether you can continue. Only an existing, correct perilex connection is suitable to connect to yourself.",
    situations: [
      { k: "perilex", t: "There's already a working perilex socket", route: "safetygate" },
      { k: "cee", t: "There's a red CEE power socket", route: "pro" },
      { k: "stopcontact", t: "Only a normal socket / nothing yet", route: "pro" },
      { k: "weet", t: "I'm not sure", route: "pro" },
    ],
    step3Kicker: "Step 3",
    safetyTitle: "Safety check",
    safetyIntro:
      "Answer honestly. If something is missing, this is a job for an installer — no shame, just safe.",
    safetyItems: [
      { k: "groep", t: "Dedicated circuit with the right fuse (16 A or 25 A)" },
      { k: "als", t: "Residual-current device (RCD) present on the circuit" },
      { k: "kabel", t: "Correct cable cross-section available (min. 2.5 mm²)" },
      { k: "tester", t: "Voltage tester available — and you know how to use it" },
      { k: "schema", t: "Appliance wiring diagram (bridges) at hand" },
    ],
    yes: "YES",
    no: "NO",
    safetyWarn: "One or more conditions are missing. Don't continue yourself — request a connection.",
    toSteps: "Go to the steps",
    seeAdvice: "See advice",
    stepKicker: (i, total) => `Step ${i} / ${total}`,
    steps: [
      {
        title: "Measure the configuration",
        body: "First determine how the existing socket is wired. You do this on a LIVE connection — so be extremely careful, with an approved two-pole voltage tester and dry hands. Put one probe in the centre contact (usually earth) and test each hole with the other probe. Mark where there IS voltage (L) and where there isn't (N).",
      },
      {
        title: "Power off",
        body: "Configuration noted? Now switch off the correct circuit in the fuse box. Use your voltage tester to confirm there really is no voltage left on the connection — measure on all contacts.",
      },
      {
        title: "Prepare the cable",
        body: "Strip the outer sheath and the cores to the correct length. Keep the earth core (yellow-green) slightly longer than the phases and neutral, so it disconnects last under strain.",
      },
      {
        title: "Cores by colour code",
        body: "Connect each core to the marked terminal in the plug. Follow the labels on the plug itself, not just the pin position. No bare copper outside the terminal.",
      },
      {
        title: "Strain relief tight",
        body: "Clamp the cable grip firmly onto the outer sheath, never onto the individual cores. Good strain relief prevents cores from coming loose under load.",
      },
      {
        title: "Appliance side: bridges",
        body: "Set the bridges on your appliance's terminal block according to the manufacturer diagram that matches the configuration you just measured (1-, 2- or 3-phase). Wrong bridges is a common, dangerous mistake.",
      },
      {
        title: "Close & check",
        body: "Screw the plug shut, check that all screws are tight and nothing is pinched. Only then may the circuit go back on — when in doubt, have it measured.",
      },
    ],
    measureWarn:
      "You do this measurement deliberately on a LIVE connection. Use a CAT-rated two-pole tester and never touch bare metal.",
    measuredConfig: "Measured configuration",
    measuredProgress: (done) => `${done}/4 measured`,
    measureHint: "Tap each outer contact. Each tap cycles: ? → L (voltage) → N (none).",
    conf1Title: "1-phase",
    conf1Detail: "One phase, the rest neutral/earth. Use the manufacturer's 1-phase diagram.",
    conf2Title: "2-phase — note",
    conf2Detail:
      "Also measure the two L contacts against each other: 0 V = same phase; voltage = two different phases, then a different diagram.",
    conf3Title: "3-phase",
    conf3Detail: "Three phases + one neutral. Use the 3-phase diagram.",
    confErrTitle: "Check your measurement",
    confErrDetail: (live) => `${live}× voltage is unusual. Measure again or consult a professional.`,
    legendL: "Voltage (L)",
    legendN: "None (N)",
    legendPE: "Earth (PE)",
    schemaNote:
      "Schematic view — the actual pin position may differ (L1/L3 are sometimes swapped). Physically mark each contact and consult the appliance diagram that matches THIS configuration.",
    wires: [
      { label: "Yellow-green", to: "Earth (PE)" },
      { label: "Blue", to: "Neutral (N)" },
      { label: "Brown", to: "Phase L1" },
      { label: "Black", to: "Phase L2" },
      { label: "Grey", to: "Phase L3" },
    ],
    toCheck: "Go to check",
    step5Kicker: "Step 5",
    verifyTitle: "Final check",
    verifyIntro: "Tick everything off before the circuit goes back on.",
    verifyItems: [
      "Configuration measured beforehand and contacts marked (L/N)",
      "Confirmed dead before wiring",
      "No bare copper outside the terminals",
      "All terminal screws firmly tightened",
      "Strain relief on the sheath, not on the cores",
      "Bridges on the appliance match the measured phase configuration",
      "Plug fully screwed shut",
    ],
    finish: "Finish",
    doneTitle: "Connection complete",
    doneBody:
      "Nice work. When in doubt, or for 100% certainty, have a measurement/inspection done — VoltFix is happy to verify it's connected to standard.",
    inspectTitle: "Request an inspection",
    inspectBody: "A short verification measurement gives peace of mind and avoids insurance hassle if damage occurs.",
    planControl: "Schedule a check",
    restartFull: "Start over",
    proTitle: "This is a job for a pro",
    proCee:
      "Converting a CEE connection to perilex requires fixed-installation work and the right choices in the fuse box. ",
    proStopcontact: "A new power circuit is needed in the fuse box. This falls under the NEN 1010 standard. ",
    proWeet: "Without certainty about the connection, we can't safely let you continue yourself. ",
    proDefault: "Based on your answers, this isn't a responsible DIY job. ",
    proOutro: "VoltFix is happy to handle it professionally and with warranty.",
    whatWeDoTitle: "What we do",
    whatWeDo: [
      "Circuit + fuse to NEN 1010",
      "RCD and correct cable cross-section",
      "Connect, measure and deliver with warranty",
    ],
    requestQuote: "Request a quote",
    contactTitle: "Get in touch",
    contactBody: "Call or email VoltFix — we're happy to schedule an appointment or check in Amsterdam.",
    callDirect: "Call now",
  },
};

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

export function PerilexWizard({ lang = "nl" }: { lang?: WizardLang }) {
  const t = COPY[lang];
  const track = useTrackConversion();

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

  const rootRef = useRef<HTMLDivElement>(null);

  // Scroll niet de hele pagina naar boven, maar enkel de wizard zelf netjes
  // in beeld (top van de wizard). Voorkomt de ongewenste "spring naar boven".
  const scrollToWizard = () => {
    if (typeof window === "undefined") return;
    requestAnimationFrame(() => {
      const el = rootRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY - 12;
      window.scrollTo({ top, behavior: "smooth" });
    });
  };

  const go = (next: Screen) => {
    setHistory((h) => [...h, screen]);
    setScreen(next);
    scrollToWizard();
  };
  const back = () => {
    setHistory((h) => {
      const c = [...h];
      const p = c.pop();
      if (p) setScreen(p);
      return c;
    });
    scrollToWizard();
  };
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
    scrollToWizard();
  };

  // Navigeer naar het contactscherm en registreer een offerte-conversie.
  const goQuote = (location: string) => {
    track("quote", location);
    go("contactnote");
  };

  const safetyAllOk = t.safetyItems.every((i) => safety[i.k] === "ja");
  const verifyAll = t.verifyItems.every((_, i) => verify[i]);

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
  `;

  const EmergencyBar = () => (
    <div className="vf-emerg">
      <div className="vf-wrap" style={{ paddingTop: 12, paddingBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: 14 }}>
            <AlertTriangle size={18} /> {t.emergency}
          </span>
          <a
            href={telHref}
            onClick={() => track("call", "wizard-emergency")}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 700 }}
          >
            <PhoneCall size={18} /> {t.callBtn}
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
              <p style={{ fontSize: 12, color: C.muted }}>{t.brandSub}</p>
            </div>
          </div>
          {screen !== "intro" && (
            <button className="vf-btn ghost" style={{ padding: "8px 12px", fontSize: 13 }} onClick={restart}>
              <RotateCcw size={15} /> {t.restart}
            </button>
          )}
        </div>

        {!["intro", "done"].includes(screen) && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", gap: 6 }}>
              {PHASE_KEYS.map((_, i) => (
                <span key={i} className={`vf-dot ${i <= phaseOf(screen) ? "on" : ""}`} />
              ))}
            </div>
            <p style={{ marginTop: 8, fontSize: 12, color: C.muted, fontWeight: 600 }}>
              {t.phaseLabel(phaseOf(screen), t.phases[phaseOf(screen)])}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const EscapeFoot = () => (
    <div style={{ marginTop: 24, textAlign: "center" }}>
      <button
        onClick={() => goQuote("wizard-escape")}
        style={{ background: "none", border: "none", color: C.blue, fontWeight: 600, cursor: "pointer", fontSize: 14 }}
      >
        {t.escape}
      </button>
    </div>
  );

  const NavRow = ({
    onNext,
    nextLabel,
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
          <ArrowLeft size={16} /> {t.back}
        </button>
      )}
      <button className="vf-btn prim" style={{ marginLeft: "auto" }} onClick={onNext} disabled={disabled}>
        {nextLabel ?? t.continue} <ArrowRight size={16} />
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
      <span className="vf-kick">{t.introKicker}</span>
      <h2 className="vf-h" style={{ fontSize: 28, marginTop: 6, marginBottom: 12 }}>
        {t.introTitle}
      </h2>
      <p style={{ color: C.muted, marginBottom: 18 }}>{t.introBody}</p>

      <div className="vf-card" style={{ padding: 16, marginBottom: 18, background: "#fff5f6", borderColor: "#f7c9d2" }}>
        <div style={{ display: "flex", gap: 12 }}>
          <AlertTriangle size={22} color={C.red} style={{ flex: "0 0 auto", marginTop: 2 }} />
          <div>
            <p className="vf-h" style={{ fontSize: 15, color: C.redInk, marginBottom: 4 }}>
              {t.dangerTitle}
            </p>
            <p style={{ fontSize: 13.5, color: C.muted }}>{t.dangerBody}</p>
          </div>
        </div>
      </div>

      <button className="vf-check" style={{ marginBottom: 18, width: "100%" }} onClick={() => setAgreed(!agreed)}>
        <span className={`vf-box ${agreed ? "on" : ""}`}>{agreed && <Check size={16} color="#fff" />}</span>
        <span style={{ fontSize: 14, textAlign: "left" }}>{t.agree}</span>
      </button>

      <button
        className="vf-btn prim"
        style={{ width: "100%", justifyContent: "center" }}
        disabled={!agreed}
        onClick={() => go("device")}
      >
        {t.startCheck} <ArrowRight size={16} />
      </button>
    </div>
  );

  const renderDevice = () => (
    <div className="vf-fade">
      <SectionTitle kicker={t.step1Kicker} title={t.deviceTitle} />
      <div style={{ display: "grid", gap: 10 }}>
        {t.devices.map((d) => {
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
        {t.powerTitle}
      </h3>
      <div style={{ display: "grid", gap: 10 }}>
        {t.powers.map(([k, label, a]) => (
          <button
            key={k}
            className={`vf-opt ${power === k ? "sel" : ""}`}
            style={{ justifyContent: "space-between" }}
            onClick={() => setPower(k)}
          >
            <span style={{ fontWeight: 600 }}>{label}</span>
            <span style={{ fontSize: 13, color: C.muted, fontWeight: 600 }}>{a}</span>
          </button>
        ))}
      </div>

      <NavRow onNext={() => go("situation")} disabled={!device || !power} />
    </div>
  );

  const renderSituation = () => {
    const chosen = t.situations.find((o) => o.k === situation);
    return (
      <div className="vf-fade">
        <SectionTitle kicker={t.step2Kicker} title={t.situationTitle} />
        <p style={{ color: C.muted, marginBottom: 16, fontSize: 14 }}>{t.situationIntro}</p>
        <div style={{ display: "grid", gap: 10 }}>
          {t.situations.map((o) => (
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
      <SectionTitle kicker={t.step3Kicker} title={t.safetyTitle} />
      <p style={{ color: C.muted, marginBottom: 16, fontSize: 14 }}>{t.safetyIntro}</p>
      <div style={{ display: "grid", gap: 10 }}>
        {t.safetyItems.map((it) => (
          <div key={it.k} className="vf-card" style={{ padding: 14 }}>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>{it.t}</p>
            <div className="vf-toggle">
              <button
                className={`ja ${safety[it.k] === "ja" ? "on" : ""}`}
                onClick={() => setSafety((s) => ({ ...s, [it.k]: "ja" }))}
              >
                {t.yes}
              </button>
              <button
                className={`nee ${safety[it.k] === "nee" ? "on" : ""}`}
                onClick={() => setSafety((s) => ({ ...s, [it.k]: "nee" }))}
              >
                {t.no}
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
          <span style={{ fontSize: 13.5, color: C.redInk }}>{t.safetyWarn}</span>
        </div>
      )}
      <NavRow
        onNext={() => go(safetyAllOk ? "steps" : "pro")}
        nextLabel={safetyAllOk ? t.toSteps : t.seeAdvice}
        disabled={Object.keys(safety).length < t.safetyItems.length}
      />
    </div>
  );

  const renderSteps = () => {
    const s = t.steps[wireStep];
    const Icon = STEP_ICONS[wireStep];
    const last = wireStep === t.steps.length - 1;
    return (
      <div className="vf-fade">
        <SectionTitle kicker={t.stepKicker(wireStep + 1, t.steps.length)} title={s.title} />

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
                <span style={{ fontSize: 13, color: C.redInk }}>{t.measureWarn}</span>
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
                  title = t.measuredProgress(done);
                  detail = t.measureHint;
                  tone = C.blue;
                } else if (live === 1) {
                  title = t.conf1Title;
                  detail = t.conf1Detail;
                  tone = C.green;
                } else if (live === 2) {
                  title = t.conf2Title;
                  detail = t.conf2Detail;
                  tone = C.blue;
                } else if (live === 3) {
                  title = t.conf3Title;
                  detail = t.conf3Detail;
                  tone = C.green;
                } else {
                  title = t.confErrTitle;
                  detail = t.confErrDetail(live);
                  tone = C.red;
                }
                return (
                  <div className="vf-card" style={{ padding: 14, marginTop: 14, borderColor: tone }}>
                    <p className="vf-kick" style={{ color: tone }}>
                      {t.measuredConfig}
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
                  <span style={{ width: 12, height: 12, borderRadius: 999, background: C.red }} /> {t.legendL}
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 12, height: 12, borderRadius: 999, background: "#94a0b3" }} /> {t.legendN}
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 12, height: 12, borderRadius: 999, background: C.green }} /> {t.legendPE}
                </span>
              </div>

              <p style={{ fontSize: 11.5, color: C.outline, marginTop: 12 }}>{t.schemaNote}</p>
            </div>
          )}

          {wireStep === 3 && (
            <div style={{ marginTop: 16, display: "grid", gap: 8 }}>
              {t.wires.map((w, i) => (
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
                  <span style={{ width: 18, height: 18, borderRadius: 4, background: WIRE_SWATCHES[i], flex: "0 0 auto" }} />
                  <span style={{ fontSize: 13.5, fontWeight: 600, minWidth: 100 }}>{w.label}</span>
                  <ArrowRight size={14} color={C.outline} />
                  <span style={{ fontSize: 13.5, color: C.muted }}>{w.to}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 20, alignItems: "center" }}>
          <button
            className="vf-btn ghost"
            onClick={() => {
              if (wireStep === 0) back();
              else {
                setWireStep((w) => w - 1);
                scrollToWizard();
              }
            }}
          >
            <ArrowLeft size={16} /> {wireStep === 0 ? t.back : t.prev}
          </button>
          <button
            className="vf-btn prim"
            style={{ marginLeft: "auto" }}
            onClick={() => {
              if (last) go("verify");
              else {
                setWireStep((w) => w + 1);
                scrollToWizard();
              }
            }}
          >
            {last ? t.toCheck : t.next} <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  const renderVerify = () => (
    <div className="vf-fade">
      <SectionTitle kicker={t.step5Kicker} title={t.verifyTitle} />
      <p style={{ color: C.muted, marginBottom: 16, fontSize: 14 }}>{t.verifyIntro}</p>
      <div style={{ display: "grid", gap: 10 }}>
        {t.verifyItems.map((item, i) => (
          <button key={i} className="vf-check" onClick={() => setVerify((v) => ({ ...v, [i]: !v[i] }))}>
            <span className={`vf-box ${verify[i] ? "on" : ""}`}>{verify[i] && <Check size={16} color="#fff" />}</span>
            <span style={{ fontSize: 14, textAlign: "left" }}>{item}</span>
          </button>
        ))}
      </div>
      <NavRow onNext={() => go("done")} nextLabel={t.finish} disabled={!verifyAll} />
    </div>
  );

  const renderDone = () => (
    <div className="vf-fade" style={{ textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
        <CheckCircle2 size={56} color={C.green} />
      </div>
      <h2 className="vf-h" style={{ fontSize: 26, marginBottom: 10 }}>
        {t.doneTitle}
      </h2>
      <p style={{ color: C.muted, marginBottom: 18, maxWidth: 440, marginInline: "auto" }}>{t.doneBody}</p>

      <div className="vf-card" style={{ padding: 16, marginBottom: 18, textAlign: "left" }}>
        <p className="vf-h" style={{ fontSize: 15, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
          <ShieldCheck size={18} color={C.green} /> {t.inspectTitle}
        </p>
        <p style={{ fontSize: 13.5, color: C.muted }}>{t.inspectBody}</p>
      </div>

      <button
        className="vf-btn prim"
        style={{ width: "100%", justifyContent: "center" }}
        onClick={() => goQuote("wizard-done")}
      >
        <Phone size={16} /> {t.planControl}
      </button>
      <button
        onClick={restart}
        style={{
          marginTop: 14,
          background: "none",
          border: "none",
          color: C.blue,
          fontWeight: 600,
          cursor: "pointer",
          fontSize: 14,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <RotateCcw size={15} /> {t.restartFull}
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
              {t.proTitle}
            </p>
            <p style={{ fontSize: 14, color: C.muted }}>
              {situation === "cee" && t.proCee}
              {situation === "stopcontact" && t.proStopcontact}
              {situation === "weet" && t.proWeet}
              {!["cee", "stopcontact", "weet"].includes(situation || "") && t.proDefault}
              {t.proOutro}
            </p>
          </div>
        </div>
      </div>

      <div className="vf-card" style={{ padding: 16, marginBottom: 16 }}>
        <p className="vf-h" style={{ fontSize: 15, marginBottom: 10 }}>
          {t.whatWeDoTitle}
        </p>
        {t.whatWeDo.map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", fontSize: 14 }}>
            <CheckCircle2 size={18} color={C.green} /> {item}
          </div>
        ))}
      </div>

      <button
        className="vf-btn prim"
        style={{ width: "100%", justifyContent: "center" }}
        onClick={() => goQuote("wizard-pro")}
      >
        {t.requestQuote} <ArrowRight size={16} />
      </button>
      <button
        onClick={restart}
        style={{
          marginTop: 14,
          background: "none",
          border: "none",
          color: C.blue,
          fontWeight: 600,
          cursor: "pointer",
          fontSize: 14,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <RotateCcw size={15} /> {t.restartFull}
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
        {t.contactTitle}
      </h2>
      <p style={{ color: C.muted, marginBottom: 18, maxWidth: 420, marginInline: "auto" }}>{t.contactBody}</p>

      <div className="vf-card" style={{ padding: 16, marginBottom: 18, textAlign: "left" }}>
        <p className="vf-h" style={{ fontSize: 15, marginBottom: 6 }}>
          {COMPANY} · Amsterdam
        </p>
        <p style={{ fontSize: 14, color: C.muted }}>tel · {PHONE}</p>
        <p style={{ fontSize: 14, color: C.muted }}>{EMAIL}</p>
      </div>

      <a
        href={telHref}
        onClick={() => track("call", "wizard-contact")}
        className="vf-btn prim"
        style={{ width: "100%", justifyContent: "center", textDecoration: "none" }}
      >
        <Phone size={16} /> {t.callDirect}
      </a>
      <div style={{ marginTop: 14 }}>
        <button className="vf-btn ghost" onClick={back}>
          <ArrowLeft size={16} /> {t.back}
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
