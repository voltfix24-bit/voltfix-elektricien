import { describe, expect, it } from 'vitest'
import { buildReviewReminderText, buildReviewRequestText, waReviewHref } from './review-text-dialog'

describe('buildReviewReminderText', () => {
  it('maakt een vriendelijke NL-herinnering', () => {
    const text = buildReviewReminderText({ customerName: 'Sanne', monteurName: 'Mo', jobType: 'Groepenkast' })
    expect(text).toContain('Hopelijk werkt alles rondom de groepenkast nog steeds helemaal naar wens!')
    expect(text).toContain('Mo en VoltFix')
  })

  it('maakt een Engelse herinnering', () => {
    const text = buildReviewReminderText({ customerName: 'John Doe', monteurName: 'Mo', jobType: 'Fuse box', language: 'en' })
    expect(text).toContain('Hi John,')
    expect(text).toContain('Hope everything is still working perfectly regarding the fuse box!')
  })
})

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
