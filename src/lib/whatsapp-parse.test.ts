import { describe, expect, it } from 'vitest'
import { JOBS } from '@/lib/lead-jobs'
import { normalisePhone, parseWhatsApp } from '@/lib/whatsapp-parse'

describe('normalisePhone', () => {
  it('laat een gewoon mobiel nummer staan', () => {
    expect(normalisePhone('0612345678')).toBe('0612345678')
  })
  it('haalt spaties en punten weg', () => {
    expect(normalisePhone('06 12 34 56 78')).toBe('0612345678')
    expect(normalisePhone('020.123.45.67')).toBe('0201234567')
  })
  it('begrijpt +31 en 0031, ook met (0)', () => {
    expect(normalisePhone('+31 6 12345678')).toBe('0612345678')
    expect(normalisePhone('0031612345678')).toBe('0612345678')
    expect(normalisePhone('+31 (0)6 1234 5678')).toBe('0612345678')
  })
  it('weigert iets wat geen Nederlands nummer is', () => {
    expect(normalisePhone('12345')).toBeNull()
    expect(normalisePhone('+44 20 7123 4567')).toBeNull()
  })
})

describe('parseWhatsApp — telefoon', () => {
  it('vindt een mobiel nummer in lopende tekst', () => {
    const out = parseWhatsApp('Hoi, mijn nummer is 06-12345678, bel maar')
    expect(out.phone.value).toBe('0612345678')
    expect(out.phone.confidence).toBe('certain')
  })
  it('vindt een vast nummer', () => {
    expect(parseWhatsApp('U kunt bellen naar 020 123 4567').phone.value).toBe('0201234567')
  })
  it('geeft Voorstel bij meerdere nummers', () => {
    const out = parseWhatsApp('Bel 0612345678 of anders 0687654321')
    expect(out.phone.value).toBe('0612345678')
    expect(out.phone.confidence).toBe('suggested')
  })
  it('vindt niets als er geen nummer staat', () => {
    expect(parseWhatsApp('Hallo, kan iemand langskomen?').phone.confidence).toBe('missing')
  })
})

describe('parseWhatsApp — postcode', () => {
  it('herkent 1234 AB', () => {
    expect(parseWhatsApp('Adres: 1012 AB Amsterdam').postalCode.value).toBe('1012 AB')
  })
  it('herkent 1234AB zonder spatie en maakt hoofdletters', () => {
    expect(parseWhatsApp('postcode 1073ab').postalCode.value).toBe('1073 AB')
  })
  it('vindt niets zonder postcode', () => {
    expect(parseWhatsApp('Ik woon in Amsterdam').postalCode.confidence).toBe('missing')
  })
})

describe('parseWhatsApp — adres', () => {
  it('herkent straat met huisnummer', () => {
    const out = parseWhatsApp('Ik woon op de Ceintuurbaan 118-2')
    expect(out.address.value).toBe('Ceintuurbaan 118-2')
    expect(out.houseNumber.value).toBe('118-2')
    expect(out.address.confidence).toBe('certain')
  })
  it('herkent toevoeging hs', () => {
    expect(parseWhatsApp('Adres is Jan Evertsenstraat 42 hs').address.value).toBe('Jan Evertsenstraat 42 hs')
  })
  it('herkent toevoeging hoog', () => {
    expect(parseWhatsApp('Wij zitten Bilderdijkkade 3 hoog').houseNumber.value).toBe('3 hoog')
  })
  it('geeft Voorstel bij een straat zonder herkenbare uitgang', () => {
    const out = parseWhatsApp('Kom naar Nieuwmarkt 12 alsjeblieft')
    expect(out.address.value).toBe('Nieuwmarkt 12')
  })
  it('vindt niets zonder adres', () => {
    expect(parseWhatsApp('Kan iemand bellen?').address.confidence).toBe('missing')
  })
})

describe('parseWhatsApp — taal', () => {
  it('herkent een Engelstalig gesprek', () => {
    const out = parseWhatsApp('Hello, I have no power in my apartment. Could you please come tomorrow?')
    expect(out.language.value).toBe('en')
  })
  it('houdt Nederlands aan bij een Nederlands gesprek', () => {
    expect(parseWhatsApp('Hallo, ik heb geen stroom in de keuken, graag een afspraak').language.value).toBe('nl')
  })
  it('valt terug op Nederlands als voorstel bij te weinig signaal', () => {
    const out = parseWhatsApp('ok')
    expect(out.language.value).toBe('nl')
    expect(out.language.confidence).toBe('suggested')
  })
})

describe('parseWhatsApp — spoed', () => {
  it('ja bij geen stroom', () => {
    expect(parseWhatsApp('Er is geen stroom in huis').urgent.value).toBe(true)
  })
  it('ja bij kortsluiting', () => {
    expect(parseWhatsApp('Volgens mij is er kortsluiting').urgent.value).toBe(true)
  })
  it('ja bij vandaag nog', () => {
    expect(parseWhatsApp('Kan iemand vandaag nog langskomen?').urgent.value).toBe(true)
  })
  it('nee bij hoeft niet vandaag', () => {
    expect(parseWhatsApp('Het hoeft niet vandaag hoor').urgent.value).toBe(false)
  })
  it('nee bij deze week', () => {
    expect(parseWhatsApp('Deze week is prima').urgent.value).toBe(false)
  })
  it('ontkenning wint van het woord vandaag', () => {
    expect(parseWhatsApp('Spoed? nee hoor, hoeft niet vandaag').urgent.value).toBe(false)
  })
  it('niets gevonden blijft niets', () => {
    expect(parseWhatsApp('Goedemiddag, ik wil een lamp laten ophangen').urgent.confidence).toBe('missing')
  })
})

describe('parseWhatsApp — klus', () => {
  it('matcht op de bestaande klussenlijst', () => {
    for (const out of [
      parseWhatsApp('mijn groepenkast moet vervangen worden'),
      parseWhatsApp('perilex voor de nieuwe kookplaat'),
      parseWhatsApp('graag een laadpaal voor de auto'),
      parseWhatsApp('een extra stopcontact in de slaapkamer'),
      parseWhatsApp('twee lampen ophangen'),
      parseWhatsApp('ik wil een keuring van de installatie'),
    ]) {
      expect(JOBS).toContain(out.jobType.value as never)
    }
  })
  it('kiest storing bij geen stroom', () => {
    expect(parseWhatsApp('sinds vanochtend geen stroom').jobType.value).toBe('Storing / geen stroom')
  })
  it('geeft Voorstel bij twee mogelijke klussen', () => {
    const out = parseWhatsApp('Geen stroom meer, volgens mij door de groepenkast')
    expect(out.jobType.confidence).toBe('suggested')
  })
  it('vindt niets bij een vaag bericht', () => {
    expect(parseWhatsApp('Kunt u mij helpen?').jobType.confidence).toBe('missing')
  })
})

describe('parseWhatsApp — naam', () => {
  it('herkent "mijn naam is"', () => {
    expect(parseWhatsApp('Goedemiddag, mijn naam is Sanne Bakker').name.value).toBe('Sanne Bakker')
  })
  it('herkent een WhatsApp-exportregel', () => {
    const out = parseWhatsApp('[12-09-2026 13:21] Youssef: hallo, is er iemand beschikbaar?')
    expect(out.name.value).toBe('Youssef')
    expect(out.name.confidence).toBe('suggested')
  })
  it('vindt niets zonder naam', () => {
    expect(parseWhatsApp('hallo').name.confidence).toBe('missing')
  })
})

describe('parseWhatsApp — geheel', () => {
  it('leest een compleet gesprek', () => {
    const out = parseWhatsApp(
      [
        '[13-09-2026 08:02] Mark de Vries: Goedemorgen! Mijn naam is Mark de Vries.',
        'Sinds vanochtend heb ik geen stroom in de hele woning, kortsluiting denk ik.',
        'Adres is Ceintuurbaan 118-2, 1072 GB Amsterdam. Mijn nummer: +31 (0)6 1234 5678',
      ].join('\n'),
    )
    expect(out.name.value).toBe('Mark de Vries')
    expect(out.phone.value).toBe('0612345678')
    expect(out.postalCode.value).toBe('1072 GB')
    expect(out.address.value).toBe('Ceintuurbaan 118-2')
    expect(out.jobType.value).toBe('Storing / geen stroom')
    expect(out.urgent.value).toBe(true)
    expect(out.language.value).toBe('nl')
  })
  it('geeft overal niets terug bij lege invoer', () => {
    const out = parseWhatsApp('   ')
    expect(Object.values(out).every((guess) => guess.confidence === 'missing')).toBe(true)
  })
})
