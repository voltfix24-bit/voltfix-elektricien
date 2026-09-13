import { describe, expect, it } from 'vitest'

import {
  clearedSessionCookie,
  hashToken,
  isInfoRequestPublicEnabled,
  newToken,
  rateLimit,
  readSessionCookie,
  sameOrigin,
  sessionCookie,
} from './info-request.server'

describe('tokens', () => {
  it('zijn onvoorspelbaar en lang genoeg (32 bytes)', () => {
    const token = newToken()
    expect(token.length).toBeGreaterThanOrEqual(42)
    expect(token).not.toMatch(/[^A-Za-z0-9_-]/)
    expect(newToken()).not.toBe(token)
  })

  it('worden alleen als hash bewaard', async () => {
    const token = newToken()
    const hash = await hashToken(token)
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
    expect(hash).not.toContain(token)
    expect(await hashToken(token)).toBe(hash)
  })
})

describe('sessiecookie', () => {
  it('is Secure, HttpOnly en SameSite', () => {
    const cookie = sessionCookie('abc', 7200)
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('Secure')
    expect(cookie).toContain('SameSite=Lax')
    expect(cookie).toContain('Max-Age=7200')
  })

  it('wordt bij indienen direct gewist', () => {
    expect(clearedSessionCookie()).toContain('Max-Age=0')
  })

  it('leest alleen de eigen cookie', () => {
    const request = new Request('https://www.voltfix.nl/x', { headers: { cookie: 'a=1; vf_ir=xyz; b=2' } })
    expect(readSessionCookie(request)).toBe('xyz')
    expect(readSessionCookie(new Request('https://www.voltfix.nl/x'))).toBeNull()
  })
})

describe('CSRF en herkomst', () => {
  it('een vreemde origin wordt geweigerd', () => {
    const request = new Request('https://www.voltfix.nl/api/public/info-request/submit', {
      method: 'POST',
      headers: { origin: 'https://kwaadaardig.example' },
    })
    expect(sameOrigin(request)).toBe(false)
  })

  it('de eigen origin wordt geaccepteerd', () => {
    const request = new Request('https://www.voltfix.nl/api/public/info-request/submit', {
      method: 'POST',
      headers: { origin: 'https://www.voltfix.nl' },
    })
    expect(sameOrigin(request)).toBe(true)
  })

  it('een Host-header zonder origin geeft geen toegang', () => {
    const request = new Request('https://www.voltfix.nl/api/public/info-request/submit', {
      method: 'POST',
      headers: { host: 'kwaadaardig.example' },
    })
    expect(sameOrigin(request)).toBe(false)
  })
})

describe('begrenzing en activatie', () => {
  it('remt herhaald proberen af', () => {
    const key = `test-${Math.random()}`
    expect(rateLimit(key, 2, 60)).toBe(true)
    expect(rateLimit(key, 2, 60)).toBe(true)
    expect(rateLimit(key, 2, 60)).toBe(false)
  })

  it('de publieke aanvulling staat standaard uit', () => {
    delete process.env['PERILEX_INFO_REQUEST_PUBLIC']
    expect(isInfoRequestPublicEnabled()).toBe(false)
    process.env['PERILEX_INFO_REQUEST_PUBLIC'] = 'ja'
    expect(isInfoRequestPublicEnabled()).toBe(false)
    process.env['PERILEX_INFO_REQUEST_PUBLIC'] = 'enabled'
    expect(isInfoRequestPublicEnabled()).toBe(true)
    delete process.env['PERILEX_INFO_REQUEST_PUBLIC']
  })
})
