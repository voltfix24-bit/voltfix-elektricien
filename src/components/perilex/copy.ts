/**
 * Copy voor de Perilex meetgids — NL en EN.
 * SVG-coördinaten en logica blijven ongewijzigd; alleen tekst wordt gewisseld.
 */
export type Lang = "nl" | "en";

export const COPY = {
  nl: {
    kicker: "Zelf meten · 2 minuten",
    title: "Welke Perilex heb je?",
    intro:
      "Meet elk contact tegen aarde. Tik hieronder aan wat je tester aangeeft — wij zeggen welk schema past.",
    safetyPrefix: "Je meet ",
    safetyStrong: "onder spanning",
    safetySuffix:
      ". Alleen met een CAT-gekeurde tweepolige spanningstester. Raak geen blank metaal aan. Twijfel je? ",
    safetyLink: "Laat ons het doen",
    step1Title: "Meet het stopcontact",
    step1BlockTitle: "Vooraanzicht",
    step1BlockBody: "Zoals je het in de muur ziet. Tik aan wat je tester aangeeft.",
    legendPhase: "fase",
    legendNeutral: "nul",
    legendUnknown: "nog niet",
    resultKicker: "Gemeten configuratie",
    step2Title: "Sluit de stekker aan",
    step2BlockTitle: "Pinnenzijde — spiegelbeeld",
    step2BlockBody: "Zelfde posities als het stopcontact, maar links en rechts verwisseld.",
    wireL1: "L1 bruin",
    wireL2: "L2 zwart",
    wireL3: "L3 grijs",
    wireN: "N blauw",
    wirePE: "PE aarde",
    earthShort: "aarde",
    ctaCall: "Laat het ons doen",
    reset: "Reset",
    fineprint:
      "Schematisch. Pinposities kunnen per fabrikant verschillen — markeer elk contact fysiek en houd het apparaatschema erbij.",
    // aria
    ariaContact: (i: number, r: "L" | "0" | "?") =>
      `Contact ${i}: ${r === "L" ? "spanning" : r === "0" ? "geen spanning" : "nog niet gemeten"}`,
  },
  en: {
    kicker: "Measure yourself · 2 minutes",
    title: "Which Perilex do you have?",
    intro:
      "Test each contact against earth. Tap below what your tester shows — we'll tell you which configuration matches.",
    safetyPrefix: "You are measuring ",
    safetyStrong: "live",
    safetySuffix:
      ". Only use a CAT-rated two-pole voltage tester. Don't touch bare metal. Not sure? ",
    safetyLink: "Let us do it",
    step1Title: "Test the socket",
    step1BlockTitle: "Front view",
    step1BlockBody: "As you see it in the wall. Tap what your tester shows.",
    legendPhase: "phase",
    legendNeutral: "neutral",
    legendUnknown: "not yet",
    resultKicker: "Measured configuration",
    step2Title: "Wire the plug",
    step2BlockTitle: "Pin side — mirrored",
    step2BlockBody: "Same positions as the socket, but left and right swapped.",
    wireL1: "L1 brown",
    wireL2: "L2 black",
    wireL3: "L3 grey",
    wireN: "N blue",
    wirePE: "PE earth",
    earthShort: "earth",
    ctaCall: "Let us do it",
    reset: "Reset",
    fineprint:
      "Schematic. Pin positions may vary by manufacturer — physically mark each contact and keep the appliance diagram on hand.",
    ariaContact: (i: number, r: "L" | "0" | "?") =>
      `Contact ${i}: ${r === "L" ? "live" : r === "0" ? "no voltage" : "not measured"}`,
  },
} as const;

/** Woorden voor draad-kleuren in de resultaat-teksten (bruin/zwart/... / brown/black/...) */
export const WIRE_WORD_I18N: Record<Lang, Record<string, string>> = {
  nl: { L1: "bruin", L2: "zwart", L3: "grijs", N: "blauw", "L?": "onmogelijk" },
  en: { L1: "brown", L2: "black", L3: "grey", N: "blue", "L?": "impossible" },
};

export const UNKNOWN_WORD: Record<Lang, string> = {
  nl: "nog niet",
  en: "not yet",
};

/** Resultaat-teksten per meetscenario. */
export const RESULT_COPY = {
  nl: {
    idle: {
      title: "Nog niet volledig gemeten",
      body: "Tik alle vier de contacten aan. Dan zien we welk schema erbij hoort.",
    },
    fourLive: {
      title: "Vier keer spanning — dat kan niet",
      body: "Eén contact hoort de nul te zijn. Meet opnieuw met je tester tegen aarde (PE), of laat het ons doen.",
    },
    threePhase: {
      title: "3-fase — 400 V",
      body: "Drie fasen en een nul. Standaard Perilex voor kookplaat of oven. Controleer of je toestel op 3 fasen is ingesteld.",
    },
    twoPhase: {
      title: "2-fase — even opletten",
      body: "Meet de twee L-contacten ook onderling. 0 V = dezelfde fase (dan is het feitelijk 1-fase), 400 V = twee echte fasen.",
    },
    onePhase: {
      title: "1-fase — 230 V op een Perilex",
      body: "Eén fase actief. Veel toestellen kunnen hierop, maar dan op beperkt vermogen. Laat dit controleren voor je een kookplaat aansluit.",
    },
    dead: {
      title: "Geen spanning gemeten",
      body: "Groep uit, kapotte tester of een dood stopcontact. Zet de groep aan en meet opnieuw.",
    },
  },
  en: {
    idle: {
      title: "Not fully measured yet",
      body: "Tap all four contacts. Then we'll show which configuration matches.",
    },
    fourLive: {
      title: "Four live contacts — impossible",
      body: "One contact should be neutral. Measure again with your tester against earth (PE), or let us do it.",
    },
    threePhase: {
      title: "3-phase — 400 V",
      body: "Three phases and a neutral. Standard Perilex for hobs or ovens. Check that your appliance is set to 3 phases.",
    },
    twoPhase: {
      title: "2-phase — take care",
      body: "Also measure between the two L-contacts. 0 V = same phase (effectively 1-phase), 400 V = two real phases.",
    },
    onePhase: {
      title: "1-phase — 230 V on a Perilex",
      body: "One phase active. Many appliances can run on this, but at limited power. Have this checked before connecting a hob.",
    },
    dead: {
      title: "No voltage measured",
      body: "Circuit off, faulty tester or a dead socket. Switch the circuit on and measure again.",
    },
  },
} as const;
