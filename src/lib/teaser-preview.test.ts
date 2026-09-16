import { describe, it } from 'vitest'
import { groupTeaser } from './telegram.server'

describe('preview', () => {
  it('toont het nieuwe groepsbericht', () => {
    const lead: any = {
      id: 'x', customer_name: 'TEST Structuur', customer_phone: '0600000000', ref_number: 1041, job_type: 'Groepenkast vervangen — prijscontrole', price_cents: 5000,
      customer_price_cents: 118300, quote_base_price_cents: 109500, quote_kind: 'package',
      quote_package: '3-fase uitgebreid, 10-12 groepen',
      quote_options: [{ label: 'DIN-rail stopcontact', priceCents: 3900 }, { label: 'Beltrafo', priceCents: 4900 }],
      install_preference: 'in overleg', image_urls: ['a.jpg'], city: 'Landsmeer', postal_code: '1121 AA',
      created_at: '2026-09-16T20:31:00Z', is_urgent: false,
      description: 'Nu 1-fase, wil naar 3-fase. Bestaande groepen overnemen waar mogelijk, conform NEN 1010, graag ruimte voor uitbreiding.',
    }
    console.log('\n' + groupTeaser(lead) + '\n')
  })
})
