/**
 * Netwerkslot voor testruns.
 *
 * Gebruik: bunx vitest run --setupFiles src/test/offline-guard.ts
 *
 * Elke uitgaande aanroep tijdens een test faalt hard. Zo kan een testopstelling
 * nooit per ongeluk de echte omgeving raken (aanvragen aanmaken, Telegram-
 * berichten sturen). Alleen localhost blijft toegestaan voor lokale hulpdiensten.
 */
const allowed = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?\//

const realFetch = globalThis.fetch
globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  if (allowed.test(url)) return realFetch(input as never, init)
  throw new Error(`Netwerk geblokkeerd tijdens test: ${url}`)
}) as typeof fetch
