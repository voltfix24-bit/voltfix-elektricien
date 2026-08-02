import { createFileRoute } from "@tanstack/react-router";

/**
 * Wekelijkse cron-endpoint: legt de posities van de gevolgde zoekwoorden vast.
 * Wordt aangeroepen door pg_cron met de anon key in de `apikey` header.
 */
export const Route = createFileRoute("/api/public/hooks/rank-snapshot")({
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
          const body = (await request.json().catch(() => ({}))) as { backfillWeeks?: number };
          const { captureWeeklySnapshot, backfillWeeks } = await import(
            "@/lib/rank-tracking.server"
          );

          if (typeof body.backfillWeeks === "number" && body.backfillWeeks > 0) {
            const weeks = Math.min(Math.floor(body.backfillWeeks), 12);
            const filled = await backfillWeeks(weeks);
            console.log("Historische rangmetingen opgeslagen:", filled);
            return Response.json({ success: true, backfilled: filled });
          }

          const result = await captureWeeklySnapshot();
          console.log("Rangsnapshot opgeslagen:", result);
          return Response.json({ success: true, ...result });
        } catch (err) {

          const message = err instanceof Error ? err.message : String(err);
          console.error("Rangsnapshot mislukt:", message);
          return new Response(JSON.stringify({ success: false, error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
