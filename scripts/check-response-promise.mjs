#!/usr/bin/env node
/**
 * VoltFix response-promise consistency checker.
 *
 * Enforces one single "spoed / emergency response" belofte across the site:
 *   NL:  "binnen 60 minuten"
 *   EN:  "within 60 minutes"
 *
 * Fails (exit 1) when any file under src/ or public/ contains a divergent
 * phrasing such as:
 *   - "binnen 30 minuten", "binnen 45 minuten", "binnen 90 minuten", ...
 *   - "within 30 minutes", "within 45 minutes", ...
 *   - "binnen het uur", "binnen een uur", "within an hour", "within the hour"
 *   - "binnen 1 uur", "binnen één uur", "within 1 hour"
 *
 * Also verifies the canonical strings in src/lib/business.ts still contain
 * the "60" number so any accidental edit is caught.
 *
 * Allow-listed:
 *   - src/components/response-times.tsx — per-wijk richttijden mogen variëren
 *     zolang ze ≤ 60 min blijven (dat wordt hier ook gecontroleerd).
 *   - dit script zelf (bevat alle patronen als tekst).
 *
 * Usage:  node scripts/check-response-promise.mjs
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SCAN_DIRS = ["src", "public"];
const SCAN_EXT = /\.(tsx?|jsx?|mjs|cjs|md|txt|json|html|css)$/i;
const SELF = "scripts/check-response-promise.mjs";

// Files where per-neighbourhood tijden mogen afwijken (nooit > 60 min).
const NEIGHBOURHOOD_TIMES_FILES = new Set([
  "src/components/response-times.tsx",
  "src/data/locations.ts",
]);

// Files die over een ander soort belofte gaan dan de spoed-response:
//   - WhatsApp-reactietijd (callback / price-indicator note)
//   - Terugbel / planning-vensters
//   - Woordelijke klantenquotes
// Deze mogen eigen tijdsformuleringen bevatten.
const NON_RESPONSE_PROMISE_FILES = new Set([
  "src/components/callback-form.tsx",
  "src/components/price-indicator.tsx",
  "src/components/schedule-picker.tsx",
  "src/data/reviews.ts",
]);

// Wildcards in de nummers vangen álle andere getallen dan 60.
const BAD_PATTERNS = [
  // NL — expliciete minuten anders dan 60
  { re: /binnen\s+(\d{1,3})\s*(?:min|minuten|minuut)\b/gi, lang: "NL" },
  // EN — expliciete minuten anders dan 60
  { re: /within\s+(\d{1,3})\s*(?:min|minutes|minute)\b/gi, lang: "EN" },
  // NL — vage "uur"-formuleringen die de belofte verwateren
  { re: /binnen\s+(?:het|een|1|één)\s+uur\b/gi, lang: "NL", fixed: true },
  // EN — idem
  { re: /within\s+(?:the|an|a|1|one)\s+hour\b/gi, lang: "EN", fixed: true },
];

// Canonieke strings die MOETEN blijven bestaan.
const REQUIRED_STRINGS = [
  { file: "src/lib/business.ts", str: "responsePromiseMinutes = 60" },
  { file: "src/lib/business.ts", str: "binnen 60 minuten" },
  { file: "src/lib/business.ts", str: "within 60 minutes" },
];

const errors = [];

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else if (SCAN_EXT.test(entry)) out.push(p);
  }
  return out;
}

function checkFile(path) {
  const rel = relative(ROOT, path).replaceAll("\\", "/");
  if (rel === SELF) return;
  if (NON_RESPONSE_PROMISE_FILES.has(rel)) return;
  const text = readFileSync(path, "utf8");


  for (const { re, lang, fixed } of BAD_PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      const num = fixed ? null : Number(m[1]);
      // Alleen fout als het getal niet 60 is (of vage uur-formulering: altijd fout).
      if (fixed || num !== 60) {
        // Neighbourhood-uitzondering: per-wijk tijden ≤ 60 zijn toegestaan.
        if (NEIGHBOURHOOD_TIMES_FILES.has(rel) && !fixed && num > 0 && num <= 60) continue;
        const line = text.slice(0, m.index).split("\n").length;
        errors.push(
          `[${lang}] ${rel}:${line}  "${m[0]}" — verwacht "binnen 60 minuten" / "within 60 minutes"`,
        );
      }
    }
  }
}

// 1. Scan divergent phrasings
for (const dir of SCAN_DIRS) {
  const abs = join(ROOT, dir);
  try {
    statSync(abs);
  } catch {
    continue;
  }
  for (const f of walk(abs)) checkFile(f);
}

// 2. Verify canonical strings still exist
for (const { file, str } of REQUIRED_STRINGS) {
  try {
    const text = readFileSync(join(ROOT, file), "utf8");
    if (!text.includes(str)) {
      errors.push(`[MISSING] ${file}  ontbreekt canonieke string: "${str}"`);
    }
  } catch {
    errors.push(`[MISSING] ${file}  bestand niet gevonden`);
  }
}

if (errors.length) {
  console.error(`\n✗ Response-promise consistency check FAILED — ${errors.length} probleem(en):\n`);
  for (const e of errors) console.error("  " + e);
  console.error(
    "\nHerstel: gebruik overal exact `binnen 60 minuten` (NL) / `within 60 minutes` (EN).\n" +
      "Canonieke bron: src/lib/business.ts → responsePromiseNl / responsePromiseEn.\n",
  );
  process.exit(1);
}

console.log("✓ Response-promise check OK — overal exact `binnen 60 minuten` / `within 60 minutes`.");
