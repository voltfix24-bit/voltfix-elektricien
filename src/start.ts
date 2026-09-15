import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";

// Vervangt de gegenereerde `attachSupabaseAuth`: die importeert de
// inlogbibliotheek statisch, waardoor die op élke pagina meeging (~300 kB).
// Functioneel identiek — alleen wordt de client nu pas opgehaald op het moment
// dat er daadwerkelijk een server-functie wordt aangeroepen.
const attachSupabaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return next({ headers: token ? { Authorization: `Bearer ${token}` } : {} });
  },
);

const errorMiddleware = createMiddleware().server(async ({ next, request }) => {
  const url = new URL(request.url);
  if (
    url.pathname.startsWith("/lovable/") ||
    url.pathname.startsWith("/api/public/") ||
    // Aanroepen van server-functies verwachten data terug, geen HTML-foutpagina:
    // die zou de app een wit scherm geven in plaats van een nette melding.
    url.pathname.startsWith("/_serverFn")
  ) {

    return next();
  }
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [errorMiddleware],
}));
