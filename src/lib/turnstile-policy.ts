/**
 * Beslist of een aanvraag de anti-spamcontrole moet doorstaan.
 *
 * - Ontbreekt de secret key op een ontwikkel-/previewadres, dan blijft de
 *   controle bewust open zodat testen mogelijk blijft ("allow-open").
 * - Ontbreekt de secret key op een productieadres, dan wordt de aanvraag
 *   geweigerd ("deny"). Stilzwijgend openstaan op de live site is nooit goed.
 */

export type TurnstileGate = 'verify' | 'allow-open' | 'deny'

const PRODUCTION_HOSTS = [
  /(^|\.)voltfix\.nl$/i,
  /(^|\.)voltfixamsterdam\.com$/i,
]

/** True voor de echte live hostnamen (inclusief www). */
export function isProductionHost(hostname: string): boolean {
  const host = (hostname || '').trim().toLowerCase().split(':')[0] ?? ''
  if (!host) return false
  return PRODUCTION_HOSTS.some((pattern) => pattern.test(host))
}

export function turnstileGate(opts: { hasSecret: boolean; hostname: string }): TurnstileGate {
  if (opts.hasSecret) return 'verify'
  return isProductionHost(opts.hostname) ? 'deny' : 'allow-open'
}
