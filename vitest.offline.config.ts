// Testconfiguratie met netwerkslot: bunx vitest run --config vitest.offline.config.ts
// Identiek aan de gewone configuratie, maar elke uitgaande aanroep faalt hard,
// zodat een testrun de echte omgeving niet kan raken.
import { defineConfig, mergeConfig } from "vitest/config";

import base from "./vite.config";

export default defineConfig(async (env) => {
  const resolved = typeof base === "function" ? await base(env) : base;
  return mergeConfig(resolved as never, {
    test: { setupFiles: ["./src/test/offline-guard.ts"] },
  });
});
