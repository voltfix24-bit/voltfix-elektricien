// Meet per advertentiebezoeker: welke pagina's, hoe lang, scrollgedrag en
// welke contactactie. Alleen voor bezoeken die via Google Ads binnenkwamen.
// Geen cookies of opslag: het bezoek-id leeft alleen in het geheugen van dit
// tabblad, dus het verdwijnt zodra de bezoeker de site sluit.
import { readConsent } from "@/lib/consent";
import { getConversionContext } from "@/lib/conversion-context";
import { isInternalPath } from "@/lib/internal-traffic";

const ENDPOINT = "/api/public/track/visit";
const AD_PARAMS = ["gclid", "gbraid", "wbraid", "gad_source", "gad_campaignid"];

type Visit = { id: string; campaignId: string | null; utmCampaign: string | null; hasClickId: boolean; seq: number };
type PageView = {
  id: string; path: string; seq: number; enteredAt: number; visibleMs: number; visibleSince: number | null;
  maxScroll: number; dirChanges: number; lastY: number; lastDir: 0 | 1 | -1; action: string | null;
};

let visit: Visit | null = null;
let current: PageView | null = null;

function rid() {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Herkent een advertentiebezoek op de eerste pagina van het tabblad. */
export function detectAdVisit(search: string, source: string): Visit | null {
  const p = new URLSearchParams(search);
  const fromAd = AD_PARAMS.some((k) => p.get(k)) || source === "google-ads";
  if (!fromAd) return null;
  return {
    id: rid(),
    campaignId: p.get("gad_campaignid")?.slice(0, 40) ?? null,
    utmCampaign: p.get("utm_campaign")?.slice(0, 120) ?? null,
    hasClickId: Boolean(p.get("gclid") || p.get("gbraid") || p.get("wbraid")),
    seq: 0,
  };
}

function send(final: boolean) {
  if (!visit || !current) return;
  const now = Date.now();
  const visible = current.visibleMs + (current.visibleSince != null ? now - current.visibleSince : 0);
  const ctx = getConversionContext();
  const body = JSON.stringify({
    pageViewId: current.id, visitId: visit.id, seq: current.seq, pagePath: current.path,
    language: current.path.startsWith("/en-gb") ? "en" : "nl", device: ctx.device,
    campaignId: visit.campaignId, utmCampaign: visit.utmCampaign, hasClickId: visit.hasClickId,
    consentAds: readConsent()?.ad_storage ?? null,
    enteredAt: new Date(current.enteredAt).toISOString(), durationMs: now - current.enteredAt,
    visibleMs: visible, maxScrollPct: current.maxScroll, scrollDirectionChanges: current.dirChanges,
    action: current.action, final,
  });
  try {
    if (navigator.sendBeacon?.(ENDPOINT, new Blob([body], { type: "application/json" }))) return;
  } catch { /* val terug op fetch */ }
  void fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => undefined);
}

function onScroll() {
  if (!current) return;
  const doc = document.documentElement;
  const max = Math.max(1, doc.scrollHeight - window.innerHeight);
  const y = window.scrollY;
  current.maxScroll = Math.max(current.maxScroll, Math.min(100, Math.round((y / max) * 100)));
  const delta = y - current.lastY;
  if (Math.abs(delta) > 40) {
    const dir = delta > 0 ? 1 : -1;
    if (current.lastDir !== 0 && dir !== current.lastDir) current.dirChanges++;
    current.lastDir = dir;
    current.lastY = y;
  }
}

function onVisibility() {
  if (!current) return;
  if (document.visibilityState === "hidden") {
    if (current.visibleSince != null) current.visibleMs += Date.now() - current.visibleSince;
    current.visibleSince = null;
    send(true);
  } else {
    current.visibleSince = Date.now();
  }
}

let installed = false;
let heartbeat: ReturnType<typeof setInterval> | null = null;

/** Aanroepen bij elke paginawissel (ook de eerste). */
export function trackAdPageView(path: string) {
  if (typeof window === "undefined" || isInternalPath(path)) return;
  if (!visit && !installed) {
    visit = detectAdVisit(window.location.search, getConversionContext().source);
  }
  if (!installed) {
    installed = true;
    if (visit) {
      window.addEventListener("scroll", onScroll, { passive: true });
      document.addEventListener("visibilitychange", onVisibility);
      window.addEventListener("pagehide", () => send(true));
      heartbeat = setInterval(() => document.visibilityState === "visible" && send(false), 15000);
    }
  }
  if (!visit) return;
  if (current?.path === path) return;
  if (current) send(true);
  visit.seq++;
  const now = Date.now();
  current = {
    id: rid(), path, seq: visit.seq, enteredAt: now, visibleMs: 0,
    visibleSince: document.visibilityState === "visible" ? now : null,
    maxScroll: 0, dirChanges: 0, lastY: window.scrollY, lastDir: 0, action: null,
  };
  send(false);
}

/** Bellen, WhatsApp of formulier op de huidige pagina vastleggen. */
export function markAdVisitAction(action: string) {
  if (!visit || !current) return;
  current.action = current.action ? `${current.action},${action}`.slice(0, 80) : action;
  send(false);
}

export function __resetAdVisit() {
  visit = null; current = null; installed = false;
  if (heartbeat) clearInterval(heartbeat);
}
