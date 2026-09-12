import { describe, expect, it } from 'vitest'

import { isProductionHost, turnstileGate } from './turnstile-policy'

describe('turnstile-policy', () => {
  it('herkent productiehosts', () => {
    expect(isProductionHost('www.voltfix.nl')).toBe(true)
    expect(isProductionHost('voltfix.nl')).toBe(true)
    expect(isProductionHost('VoltFix.nl:443')).toBe(true)
    expect(isProductionHost('www.voltfixamsterdam.com')).toBe(true)
    expect(isProductionHost('localhost')).toBe(false)
    expect(isProductionHost('id-preview--123.lovable.app')).toBe(false)
  })

  it('productie zonder secret: aanvraag wordt geweigerd (fail-closed)', () => {
    expect(turnstileGate({ hasSecret: false, hostname: 'www.voltfix.nl' })).toBe('deny')
    expect(turnstileGate({ hasSecret: false, hostname: 'voltfix.nl' })).toBe('deny')
  })

  it('preview/development zonder secret blijft gecontroleerd open', () => {
    expect(turnstileGate({ hasSecret: false, hostname: 'localhost' })).toBe('allow-open')
    expect(turnstileGate({ hasSecret: false, hostname: 'project--x-dev.lovable.app' })).toBe('allow-open')
  })

  it('met secret wordt altijd echt geverifieerd', () => {
    expect(turnstileGate({ hasSecret: true, hostname: 'www.voltfix.nl' })).toBe('verify')
    expect(turnstileGate({ hasSecret: true, hostname: 'localhost' })).toBe('verify')
  })
})
