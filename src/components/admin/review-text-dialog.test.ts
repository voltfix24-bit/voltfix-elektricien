import { describe, expect, it } from 'vitest'
import { buildReviewRequestText, waReviewHref } from './review-text-dialog'

describe('buildReviewRequestText', () => {
  it('vult naam, monteur, klus en plaats in', () => {
    const text = buildReviewRequestText({
      customerName: 'Sanne de Vries',
      monteurName: 'Mo',
      jobType: 'Groepenkast vervangen',
      city: 'Amsterdam',
    })
    expect(text).toContain('Hi Sanne,')
    expect(text).toContain('Mo liet net weten dat de werkzaamheden aan je groepenkast vervangen in Amsterdam zijn afgerond.')
    expect(text).toContain('https://g.page/r/CU3tzGD_WrDdEBM/review')
    expect(text).toContain('Team VoltFix')
  })

  it('valt terug zonder plaats of monteur', () => {
    const text = buildReviewRequestText({ customerName: '', monteurName: '', jobType: '', city: null })
    expect(text).toContain('Hi daar,')
    expect(text).toContain('onze monteur')
    expect(text).not.toContain(' in null')
  })
})

describe('waReviewHref', () => {
  it('bouwt een wa.me link met 31-prefix', () => {
    const href = waReviewHref('06 12345678', 'Hoi test')
    expect(href).toBe(`https://wa.me/31612345678?text=${encodeURIComponent('Hoi test')}`)
  })

  it('geeft null zonder geldig nummer', () => {
    expect(waReviewHref(null, 'x')).toBeNull()
    expect(waReviewHref('123', 'x')).toBeNull()
  })
})
