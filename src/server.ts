import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

// Publieke marketingpagina's zijn voor iedere bezoeker identiek en mogen kort
// op de rand (CDN) blijven staan. Alles wat persoonlijk of beveiligd is blijft
// ongecached. Bij `stale-while-revalidate` ziet de bezoeker nooit verouderde
// inhoud langer dan de achtergrondvernieuwing duurt.
const UNCACHEABLE_PREFIXES = [
  "/api/",
  "/admin",
  "/auth",
  "/aanvullen",
  "/ondertekenen",
  "/review",
  "/aanmelden",
  "/onboarding",
  "/topup-klaar",
  "/dev-preview",
  "/lovable/",
  "/indexnow",
  "/conversie-monitor",
  "/seo-monitor",
  "/keyword-tool",
];

function isCacheablePublicPage(request: Request, response: Response): boolean {
  if (request.method !== "GET") return false;
  if (response.status !== 200) return false;
  if (!(response.headers.get("content-type") ?? "").includes("text/html")) return false;
  if (response.headers.has("set-cookie")) return false;
  if (request.headers.get("authorization")) return false;
  if ((request.headers.get("cookie") ?? "").includes("sb-")) return false;

  const path = new URL(request.url).pathname.toLowerCase();
  return !UNCACHEABLE_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function withEdgeCache(request: Request, response: Response): Response {
  if (!isCacheablePublicPage(request, response)) return response;
  const headers = new Headers(response.headers);
  // Browser controleert altijd (max-age=0); de CDN mag 5 minuten serveren en
  // daarna maximaal een dag verouderd terwijl hij op de achtergrond vernieuwt.
  headers.set(
    "cache-control",
    "public, max-age=0, s-maxage=300, stale-while-revalidate=86400",
  );
  headers.set("vary", "accept-encoding");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return withEdgeCache(request, await normalizeCatastrophicSsrResponse(response));
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
