#!/usr/bin/env node
/**
 * VoltFix SEO meta checker.
 *
 * For every route (NL + EN), fetches the SSR HTML from a base URL and verifies:
 *   - <link rel="canonical"> is present, absolute, and self-referential
 *   - hreflang set: nl-NL, x-default, and en-GB when a paired EN page exists
 *   - <meta property="og:locale"> matches the route's language
 *   - NL ↔ EN pairs reference each other's absolute URLs symmetrically
 *
 * Usage:
 *   node scripts/check-seo-meta.mjs                     # http://localhost:8080
 *   node scripts/check-seo-meta.mjs https://voltfix.nl  # production
 */

const BASE = (process.argv[2] ?? "http://localhost:8080").replace(/\/$/, "");
const PROD_ORIGIN = "https://www.voltfix.nl";

// NL paths that HAVE a paired /en-gb version.
const PAIRED = [
  "/",
  "/elektricien-amsterdam",
  "/perilex-amsterdam",
  "/spoed-elektricien-amsterdam",
  "/Groepenkast-Amsterdam",
  "/stroomstoring-amsterdam",
  "/over-ons",
  "/contact",
];

// NL-only routes (no EN counterpart). hreflang must only emit nl-NL + x-default.
const NL_ONLY = [
  "/elektricien-amsterdam-centrum",
  "/elektricien-amsterdam-zuid",
  "/elektricien-amsterdam-west",
  "/elektricien-amsterdam-oost",
  "/elektricien-amsterdam-noord",
  "/elektricien-amsterdam-de-pijp",
  "/elektricien-amsterdam-ijburg",
  "/onze-services",
];

const enPath = (p) => (p === "/" ? "/en-gb" : `/en-gb${p}`);
const abs = (p) => (p === "/" ? `${PROD_ORIGIN}/` : `${PROD_ORIGIN}${p}`);

async function fetchHead(path) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, { redirect: "manual" });
  if (res.status >= 300 && res.status < 400) {
    return { status: res.status, redirect: res.headers.get("location"), head: "" };
  }
  const html = await res.text();
  const head = html.slice(0, html.indexOf("</head>") + 7);
  return { status: res.status, head };
}

function parseTags(head) {
  const canonical = [...head.matchAll(/<link[^>]+rel=["']canonical["'][^>]*>/gi)]
    .map((m) => /href=["']([^"']+)["']/i.exec(m[0])?.[1])
    .filter(Boolean);
  const hreflangs = [...head.matchAll(/<link[^>]+rel=["']alternate["'][^>]*>/gi)]
    .map((m) => ({
      hreflang: /hreflang=["']([^"']+)["']/i.exec(m[0])?.[1],
      href: /href=["']([^"']+)["']/i.exec(m[0])?.[1],
    }))
    .filter((l) => l.hreflang);
  const ogLocale = [...head.matchAll(/<meta[^>]+property=["']og:locale["'][^>]*>/gi)]
    .map((m) => /content=["']([^"']+)["']/i.exec(m[0])?.[1])
    .filter(Boolean);
  const ogLocaleAlt = [...head.matchAll(/<meta[^>]+property=["']og:locale:alternate["'][^>]*>/gi)]
    .map((m) => /content=["']([^"']+)["']/i.exec(m[0])?.[1])
    .filter(Boolean);
  const ogUrl = [...head.matchAll(/<meta[^>]+property=["']og:url["'][^>]*>/gi)]
    .map((m) => /content=["']([^"']+)["']/i.exec(m[0])?.[1])
    .filter(Boolean);
  return { canonical, hreflangs, ogLocale, ogLocaleAlt, ogUrl };
}

function check(path, locale) {
  const expectedCanonical = abs(locale === "en" ? path : path); // path is already routed variant
  const isPaired = locale === "en" || PAIRED.includes(path);
  const isEnRoute = locale === "en";
  const nlPath = isEnRoute ? (path === "/en-gb" ? "/" : path.replace(/^\/en-gb/, "")) : path;

  const expectedHreflangs = new Set(["nl-NL", "x-default"]);
  if (isPaired) expectedHreflangs.add("en-GB");
  const expectedNlHref = abs(nlPath);
  const expectedEnHref = isPaired ? abs(enPath(nlPath)) : null;
  const expectedOgLocale = isEnRoute ? "en_GB" : "nl_NL";
  const expectedOgLocaleAlt = isEnRoute ? "nl_NL" : "en_GB";

  return { expectedCanonical, expectedHreflangs, expectedNlHref, expectedEnHref, expectedOgLocale, expectedOgLocaleAlt, isPaired };
}

const RESET = "\x1b[0m", RED = "\x1b[31m", GRN = "\x1b[32m", YEL = "\x1b[33m", DIM = "\x1b[2m";
let failed = 0, passed = 0;

async function audit(path, locale) {
  const label = `${locale.toUpperCase().padEnd(2)}  ${path}`;
  let res;
  try {
    res = await fetchHead(path);
  } catch (e) {
    console.log(`${RED}FAIL${RESET} ${label}  (fetch error: ${e.message})`);
    failed++;
    return;
  }
  if (res.status !== 200) {
    console.log(`${RED}FAIL${RESET} ${label}  (HTTP ${res.status}${res.redirect ? ` → ${res.redirect}` : ""})`);
    failed++;
    return;
  }
  const tags = parseTags(res.head);
  const exp = check(path, locale);
  const errs = [];

  // Canonical: exactly one, absolute, self-referential.
  if (tags.canonical.length !== 1) errs.push(`canonical count=${tags.canonical.length}`);
  else if (tags.canonical[0] !== exp.expectedCanonical)
    errs.push(`canonical=${tags.canonical[0]} (want ${exp.expectedCanonical})`);

  // Hreflang set.
  const foundLangs = new Set(tags.hreflangs.map((h) => h.hreflang));
  for (const need of exp.expectedHreflangs)
    if (!foundLangs.has(need)) errs.push(`missing hreflang ${need}`);
  if (!exp.isPaired && foundLangs.has("en-GB"))
    errs.push(`unexpected hreflang en-GB on NL-only route`);

  // Hreflang href values.
  const byLang = Object.fromEntries(tags.hreflangs.map((h) => [h.hreflang, h.href]));
  if (byLang["nl-NL"] && byLang["nl-NL"] !== exp.expectedNlHref)
    errs.push(`nl-NL=${byLang["nl-NL"]} (want ${exp.expectedNlHref})`);
  if (exp.expectedEnHref && byLang["en-GB"] && byLang["en-GB"] !== exp.expectedEnHref)
    errs.push(`en-GB=${byLang["en-GB"]} (want ${exp.expectedEnHref})`);
  if (byLang["x-default"] && byLang["x-default"] !== exp.expectedNlHref)
    errs.push(`x-default=${byLang["x-default"]} (want ${exp.expectedNlHref})`);

  // og:locale + alternate.
  if (!tags.ogLocale.includes(exp.expectedOgLocale))
    errs.push(`og:locale=${tags.ogLocale.join(",") || "∅"} (want ${exp.expectedOgLocale})`);
  if (!tags.ogLocaleAlt.includes(exp.expectedOgLocaleAlt))
    errs.push(`og:locale:alternate=${tags.ogLocaleAlt.join(",") || "∅"} (want ${exp.expectedOgLocaleAlt})`);

  // og:url should match canonical when present.
  if (tags.ogUrl.length && tags.ogUrl[0] !== exp.expectedCanonical)
    errs.push(`og:url=${tags.ogUrl[0]} (want ${exp.expectedCanonical})`);

  if (errs.length) {
    console.log(`${RED}FAIL${RESET} ${label}`);
    for (const e of errs) console.log(`     ${DIM}·${RESET} ${e}`);
    failed++;
  } else {
    console.log(`${GRN} OK ${RESET} ${label}`);
    passed++;
  }
}

console.log(`${YEL}▶ SEO meta check @ ${BASE}${RESET}\n`);
for (const p of [...PAIRED, ...NL_ONLY]) await audit(p, "nl");
console.log("");
for (const p of PAIRED) await audit(enPath(p), "en");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
