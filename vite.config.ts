// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import path from "node:path";
import { loadEnv } from "vite";

import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Server-side env (server routes/functions) beschikbaar maken via process.env.
// Nooit toevoegen aan client-defines — dat zou geheimen in de browserbundel lekken.
const serverEnv = loadEnv(process.env.NODE_ENV ?? "development", process.cwd(), "");
Object.assign(process.env, serverEnv);

// Het buildproces verwacht SUPABASE_ANON_KEY als define; die staat nergens meer
// (het project gebruikt de publiceerbare sleutel). Zonder waarde genereert esbuild
// een ongeldige define en faalt de SSR-build. Koppel daarom aan de publiceerbare
// sleutel — dit is geen geheim en verandert niets aan het gedrag.
if (!process.env.SUPABASE_ANON_KEY && serverEnv.SUPABASE_PUBLISHABLE_KEY) {
  process.env.SUPABASE_ANON_KEY = serverEnv.SUPABASE_PUBLISHABLE_KEY;
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    resolve: {
      alias: {
        // Dwing entities v4.5.0 (hoisted) af; een geneste v7-copy breekt SSR.
        "entities/lib/decode.js": path.resolve(__dirname, "node_modules/entities/lib/decode.js"),
        "entities/lib/encode.js": path.resolve(__dirname, "node_modules/entities/lib/encode.js"),
        entities: path.resolve(__dirname, "node_modules/entities"),
      },
    },
  },
});
