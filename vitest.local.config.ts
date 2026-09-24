import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Deliberately do not import vite.config or read any .env files.
export default defineConfig({
  envDir: false,
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: { environment: 'node', setupFiles: ['./src/test/offline-guard.ts'],
    include: ['src/**/*.test.ts'], testTimeout: 15000 },
})
