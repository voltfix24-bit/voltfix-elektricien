import { createFileRoute } from "@tanstack/react-router";

/**
 * Automatiseringsendpoint voor IndexNow: meldt gewijzigde URL's bij Bing.
 * Beveiligd met dezelfde sleutel als de andere hooks (apikey-header), zodat
 * externe schedulers of deploy-hooks hem kunnen aanroepen.
 *
 * Body (optioneel): { "urls": ["/groepenkast-amsterdam", ...] }
 * Zonder body worden alle pagina's uit de sitemap aangeboden.
 */
export const Route = createFileRoute("/api/public/hooks/indexnow")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey =
          request.headers.get("apikey") ??
          request.headers.get("authorization")?.replace("Bearer ", "");

        const expected = process.env["SUPABASE_PUBLISHABLE_KEY"];
        if (!expected || !apiKey || apiKey !== expected) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const body = (await request.json().catch(() => ({}))) as { urls?: string[] };
          const { pingIndexNow } = await import("@/lib/indexnow.server");
          const result = await pingIndexNow(body.urls);
          console.log("IndexNow-ping verstuurd:", result.submitted, result.status);
          return Response.json({ success: result.accepted, ...result });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.error("IndexNow-ping mislukt:", message);
          return new Response(JSON.stringify({ success: false, error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
