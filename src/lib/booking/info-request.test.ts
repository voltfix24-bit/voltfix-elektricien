import { describe, expect, it } from 'vitest'

import {
  allowedCategories,
  buildCustomerView,
  evaluateAccess,
  evaluateAnswers,
  infoRequestExpiresAt,
  infoRequestSessionMaxSeconds,
  isActionAllowed,
  normaliseAnswers,
  sessionExpiresAt,
  suggestedInfoRequestItems,
} from './info-request'

describe('toegang tot de tijdelijke link', () => {
  const future = new Date(Date.now() + 3 * 86_400_000).toISOString()
  const past = new Date(Date.now() - 60_000).toISOString()

  it('open en geldig geeft toegang', () => {
    expect(evaluateAccess({ status: 'open', expiresAt: future })).toEqual({ ok: true })
  })

  it('verlopen wordt met servertijd geweigerd', () => {
    expect(evaluateAccess({ status: 'open', expiresAt: past })).toEqual({ ok: false, reason: 'expired' })
  })

  it('ingetrokken, vervangen en ingediend geven geen schrijfrecht', () => {
    expect(evaluateAccess({ status: 'withdrawn', expiresAt: future }).ok).toBe(false)
    expect(evaluateAccess({ status: 'superseded', expiresAt: future }).ok).toBe(false)
    expect(evaluateAccess({ status: 'submitted', expiresAt: future })).toEqual({
      ok: false,
      reason: 'already_submitted',
    })
  })

  it('een concept is nog niet open', () => {
    expect(evaluateAccess({ status: 'draft', expiresAt: future })).toEqual({ ok: false, reason: 'not_open' })
  })
})

describe('geldigheid en sessieduur', () => {
  it('standaard zeven dagen', () => {
    const from = new Date('2026-01-01T10:00:00.000Z')
    expect(infoRequestExpiresAt(from)).toBe('2026-01-08T10:00:00.000Z')
  })

  it('sessie duurt hoogstens twee uur', () => {
    const from = new Date('2026-01-01T10:00:00.000Z')
    const expires = sessionExpiresAt('2026-01-08T10:00:00.000Z', from)
    expect(new Date(expires).getTime() - from.getTime()).toBe(infoRequestSessionMaxSeconds * 1000)
  })

  it('sessie loopt nooit voorbij de geldigheid van het verzoek', () => {
    const from = new Date('2026-01-01T10:00:00.000Z')
    expect(sessionExpiresAt('2026-01-01T10:30:00.000Z', from)).toBe('2026-01-01T10:30:00.000Z')
  })
})

describe('statusmatrix', () => {
  it('een lopende lead mag een aanvulling krijgen', () => {
    expect(isActionAllowed('dispatched', 'create')).toBe(true)
    expect(isActionAllowed('claimed', 'customer_submit')).toBe(true)
  })

  it('geannuleerd of spam krijgt geen nieuw verzoek', () => {
    expect(isActionAllowed('cancelled', 'create')).toBe(false)
    expect(isActionAllowed('spam_review', 'create')).toBe(false)
    expect(isActionAllowed('cancelled', 'withdraw')).toBe(true)
  })
})

describe('beantwoording', () => {
  it('een lege aanvulling telt nooit als voltooid', () => {
    const result = evaluateAnswers({ items: ['photo_consumer_unit'], answers: {}, storedCategories: [] })
    expect(result.complete).toBe(false)
    expect(result.open).toEqual(['photo_consumer_unit'])
  })

  it('een opgeslagen bestand in de juiste categorie telt', () => {
    const result = evaluateAnswers({
      items: ['photo_consumer_unit'],
      answers: {},
      storedCategories: ['consumer_unit'],
    })
    expect(result.complete).toBe(true)
  })

  it('"heb ik niet" is een geldig antwoord en wordt eerlijk gemeld', () => {
    const result = evaluateAnswers({
      items: ['kitchen_plan'],
      answers: { kitchen_plan: { unavailable: 'dont_have' } },
      storedCategories: [],
    })
    expect(result.complete).toBe(true)
    expect(result.reported).toEqual([{ code: 'kitchen_plan', reason: 'dont_have' }])
  })

  it('een reden die niet bij het punt hoort telt niet', () => {
    const result = evaluateAnswers({
      items: ['socket_present_choice'],
      answers: { socket_present_choice: { unavailable: 'dont_know' } },
      storedCategories: [],
    })
    expect(result.complete).toBe(false)
  })

  it('een keuzevraag accepteert alleen de vaste opties', () => {
    expect(
      evaluateAnswers({
        items: ['socket_present_choice'],
        answers: { socket_present_choice: { value: 'misschien' } },
        storedCategories: [],
      }).complete,
    ).toBe(false)
    expect(
      evaluateAnswers({
        items: ['socket_present_choice'],
        answers: { socket_present_choice: { value: 'yes' } },
        storedCategories: [],
      }).complete,
    ).toBe(true)
  })
})

describe('opschonen van klantinvoer', () => {
  it('onbekende codes en te lange tekst worden begrensd', () => {
    const answers = normaliseAnswers(['extra_question'], {
      extra_question: { value: 'x'.repeat(5000) },
      geheim: { value: 'mag niet' },
    })
    expect(Object.keys(answers)).toEqual(['extra_question'])
    expect(answers['extra_question']?.value?.length).toBe(1000)
  })

  it('niet-tekstuele rommel wordt genegeerd', () => {
    expect(normaliseAnswers(['extra_question'], { extra_question: 42 })).toEqual({})
    expect(normaliseAnswers(['extra_question'], null)).toEqual({})
  })
})

describe('afscherming en categorieën', () => {
  it('alleen categorieën van gevraagde punten zijn toegestaan', () => {
    expect(allowedCategories(['photo_consumer_unit', 'extra_question'])).toEqual(['consumer_unit'])
  })

  it('de klantweergave bevat uitsluitend de klantgerichte toelichting', () => {
    const view = buildCustomerView({
      language: 'en',
      customerNote: '  Stuur een foto van de kast  ',
      items: ['photo_consumer_unit', 'interne_notitie'],
    })
    expect(view).toEqual({
      language: 'en',
      note: 'Stuur een foto van de kast',
      items: ['photo_consumer_unit'],
      extraQuestion: '',
    })
  })

  it('de gestelde aanvullende vraag gaat alleen mee wanneer die ook gevraagd is', () => {
    expect(
      buildCustomerView({
        language: 'nl',
        customerNote: '',
        items: ['extra_question'],
        extraQuestion: '  Welk merk is het fornuis?  ',
      }).extraQuestion,
    ).toBe('Welk merk is het fornuis?')
    expect(
      buildCustomerView({
        language: 'nl',
        customerNote: '',
        items: ['photo_consumer_unit'],
        extraQuestion: 'Welk merk is het fornuis?',
      }).extraQuestion,
    ).toBe('')
  })

  it('een vrije opmerking blijft bewaard, ook zonder gevraagd punt', () => {
    const answers = normaliseAnswers(['photo_consumer_unit'], {
      general_comment: { value: '  De keuken is op de tweede etage  ' },
    })
    expect(answers['general_comment']).toEqual({ value: 'De keuken is op de tweede etage' })
  })

  it('al ontvangen categorieën worden niet opnieuw voorgesteld', () => {
    expect(
      suggestedInfoRequestItems({
        missingInfo: ['photo_consumer_unit', 'kitchen_plan'],
        receivedCategories: ['consumer_unit'],
      }),
    ).toEqual(['kitchen_plan'])
  })

  it('technische fase- of bedradingsvragen worden nooit voorgesteld', () => {
    expect(
      suggestedInfoRequestItems({ missingInfo: ['supply_phase', 'manufacturer_diagram'], receivedCategories: [] }),
    ).toEqual([])
  })
})
