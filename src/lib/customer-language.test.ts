import { describe, expect, it } from 'vitest'
import { detectCustomerLanguage } from './customer-language'

describe('detectCustomerLanguage', () => {
  it('respects an explicit choice', () => {
    expect(detectCustomerLanguage({ explicit: 'en', locale: 'nl' })).toBe('en')
  })

  it('uses the page locale', () => {
    expect(detectCustomerLanguage({ locale: 'en' })).toBe('en')
  })

  it('detects the English site path', () => {
    expect(detectCustomerLanguage({ sourcePath: '/en-gb/fuse-box-amsterdam' })).toBe('en')
  })

  it('falls back to the text of the request', () => {
    expect(
      detectCustomerLanguage({ description: 'Could you please replace the fuse box in my apartment?' }),
    ).toBe('en')
    expect(detectCustomerLanguage({ description: 'Mijn groepenkast is kapot, graag vervangen.' })).toBe('nl')
  })

  it('defaults to Dutch', () => {
    expect(detectCustomerLanguage({})).toBe('nl')
  })
})
