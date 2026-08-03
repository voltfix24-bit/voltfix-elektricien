#!/usr/bin/env node
/**
 * Guard tegen hardcoded contactgegevens.
 *
 * Alle telefoonnummers, WhatsApp-nummers en e-mailadressen horen uit
 * `src/lib/business.ts` te komen (business.phoneDisplay, business.phoneE164,
 * telHref, whatsappNumber, business.email). Deze check faalt wanneer een
 * nummer opnieuw letterlijk in de broncode terechtkomt.
 *
 * Draaien: `bun run check:contact`
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");

/** Bestanden waarin de letterlijke waarde de bron van waarheid IS. */
const ALLOWLIST = new Set(["src/lib/business.ts"]);

/** Genereerde of niet-relevante bestanden. */
const SKIP_PATTERNS = [/routeTree\.gen\.ts$/, /\.asset\.json$/];

/**
 * Bekende nummers die nooit hardcoded mogen staan.
 * Voeg hier historische nummers toe zodra ze wisselen, zodat een oud
 * nummer nooit stilletjes terugkeert in nieuwe content.
 */
const FORBIDDEN = [
  { label: "belnummer (display)", re: /0\s?6[\s-]?45[\s-]?19[\s-]?35[\s-]?89/ },
  { label: "belnummer (E.164)", re: /\+?31\s?6\s?45\s?19\s?35\s?89/ },
  { label: "belnummer (compact)", re: /0645193589|\+31645193589/ },
  { label: "WhatsApp-nummer", re: /0686302148|\+?31686302148|06[\s-]?86[\s-]?30[\s-]?21[\s-]?48/ },
  { label: "e-mailadres", re: /info@voltfix\.nl/ },
];

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, out);
    } else if (/\.(ts|tsx|js|jsx|md|txt|json)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

const violations = [];

for (const file of walk(SRC)) {
  const rel = relative(ROOT, file).split("\\").join("/");
  if (ALLOWLIST.has(rel)) continue;
  if (SKIP_PATTERNS.some((p) => p.test(rel))) continue;

  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    for (const { label, re } of FORBIDDEN) {
      if (re.test(line)) {
        violations.push({ rel, line: i + 1, label, text: line.trim().slice(0, 120) });
      }
    }
  });
}

if (violations.length > 0) {
  console.error("\n✖ Hardcoded contactgegevens gevonden.\n");
  console.error("  Gebruik in plaats daarvan de waarden uit src/lib/business.ts:");
  console.error("    business.phoneDisplay · business.phoneE164 · telHref");
  console.error("    whatsappNumber · whatsappHref() · business.email · mailHref\n");
  for (const v of violations) {
    console.error(`  ${v.rel}:${v.line}  [${v.label}]`);
    console.error(`    ${v.text}`);
  }
  console.error(`\n  ${violations.length} overtreding(en).\n`);
  process.exit(1);
}

console.log("✓ Geen hardcoded telefoonnummers, WhatsApp-nummers of e-mailadressen in src/.");
