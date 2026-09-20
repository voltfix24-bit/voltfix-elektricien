import { describe, expect, it } from 'vitest'

import { isInternalPath } from './internal-traffic'

describe('isInternalPath', () => {
  it('herkent beheer- en testpagina\'s', () => {
    expect(isInternalPath('/admin/leads')).toBe(true)
    expect(isInternalPath('/admin')).toBe(true)
    expect(isInternalPath('/auth')).toBe(true)
    expect(isInternalPath('/dev-preview/perilex')).toBe(true)
    expect(isInternalPath('/conversie-monitor')).toBe(true)
    expect(isInternalPath('/ondertekenen?token=x')).toBe(true)
  })

  it('laat klantpagina\'s met rust', () => {
    expect(isInternalPath('/')).toBe(false)
    expect(isInternalPath('/spoed-elektricien-amsterdam')).toBe(false)
    expect(isInternalPath('/en-gb/elektricien-amsterdam')).toBe(false)
    expect(isInternalPath('/administratie-kosten')).toBe(false)
    expect(isInternalPath(null)).toBe(false)
  })
})
