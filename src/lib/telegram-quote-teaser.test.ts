import { describe, expect, it } from 'vitest'
import { groupTeaser } from './telegram.server'

describe('groepsbericht met offertevelden', () => {
  it('toont pakket, opties, richtprijs en klantnotitie zonder interne systeemtaal', () => {
    const lead: any = {
      id: 'x', customer_name: 'TEST Structuur', customer_phone: '0600000000', ref_number: 1041, job_type: 'Groepenkast vervangen — prijscontrole', price_cents: 5000,
      customer_price_cents: 118300, quote_base_price_cents: 109500, quote_kind: 'package',
      quote_package: '3-fase uitgebreid, 10-12 groepen',
      quote_options: [{ label: 'DIN-rail stopcontact', priceCents: 3900 }, { label: 'Beltrafo', priceCents: 4900 }],
      install_preference: 'in overleg', image_urls: ['a.jpg'], city: 'Landsmeer', postal_code: '1121 AA',
      created_at: '2026-09-16T20:31:00Z', is_urgent: false,
      description: 'Nu 1-fase, wil naar 3-fase. Bestaande groepen overnemen waar mogelijk, conform NEN 1010, graag ruimte voor uitbreiding.',
    }
    const text = groupTeaser(lead)
    expect(text).toContain('GEPLAND · Groepenkast vervangen')
    expect(text).toContain('lead €50,00 ex. btw')
    expect(text).toContain('3-fase uitgebreid, 10-12 groepen — €1.095,00')
    expect(text).toContain('DIN-rail stopcontact +€39,00')
    expect(text).toContain('€1.183,00 incl. btw (vaste prijs na fotocontrole)')
    expect(text).toContain('Installatie:</b> in overleg')
    expect(text).toContain("Foto's:</b> 1 meegestuurd")
    expect(text).toContain('Aanvraagnummer: #1041')
    expect(text).not.toContain('intentie')
    expect(text).not.toContain('all-in')
    expect(text).not.toMatch(/0600000000|TEST Structuur/)
  })
})
