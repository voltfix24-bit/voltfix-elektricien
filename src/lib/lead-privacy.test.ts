import { describe, expect, it } from 'vitest'
import { publicPostalArea, redactLeadText } from './lead-privacy'
import { claimedText, groupTeaser, privateDetails, spamFlaggedText, type LeadRow } from './telegram.server'

const lead: LeadRow = {
  id: 'test', customer_name: 'Test Customer', customer_phone: '+31612345678',
  customer_email: 'customer@example.com', address: null, city: 'Amsterdam',
  postal_code: '1068 TD', job_type: 'Sockets / lighting', price_cents: 2000,
  description: 'Adres: Osdorpplein 963, 1068 TD Amsterdam\nHi,\n9 points in total (lamps, chandeliers and rail lights).\nConcrete ceiling; SDS hammer drill needed.\n- Location: Osdorpplein 963, 1068TD, Amsterdam',
}

describe('Telegram group privacy', () => {
  it('redacts both address lines in the reported message, preserving the job', () => {
    const text = groupTeaser(lead)
    expect(text).not.toContain('Osdorpplein')
    expect(text).not.toContain('963')
    expect(text).not.toContain('1068 TD')
    expect(text).not.toContain('1068TD')
    expect(text).toContain('Amsterdam (1068)')
    expect(text).toContain('9 points in total')
    expect(text).toContain('SDS hammer drill needed')
  })
  it('redacts unlabelled addresses, emails and formatted phone numbers', () => {
    const text = redactLeadText('At Osdorpplein 963, 1068TD. Mail customer@example.com or +31 (6) 1234 5678 or 06-87654321.', lead)
    for (const fragment of ['Osdorpplein', '963', '1068TD', '@', '1234', '87654321']) expect(text).not.toContain(fragment)
  })
  it('redacts known nonstandard street names and contact URLs', () => {
    const text = redactLeadText('Kom naar De Zwaan 12. https://maps.example/pin Mail Test Customer.', { ...lead, address: 'De Zwaan 12' })
    expect(text).not.toContain('De Zwaan')
    expect(text).not.toContain('https:')
    expect(text).not.toContain('Test Customer')
  })
  it('preserves quantities, electrical specifications, prices, dates and time slots', () => {
    const text = '9 points, 3 lamps, 230V, 16A, 3x25A, 2.5 mm², €150. 2026-09-10 08:00 – 09:00'
    expect(redactLeadText(text, lead)).toBe(text)
  })
  it('also protects job types, price agreements and status updates', () => {
    const contactLead = { ...lead, job_type: 'Lampen customer@example.com', price_status: 'fixed', agreed_price_details: '€150, bel +31612345678' }
    for (const text of [groupTeaser(contactLead), claimedText(contactLead, 'Monteur'), spamFlaggedText(contactLead, 'Monteur')]) {
      expect(text).not.toContain('customer@example.com')
      expect(text).not.toContain('31612345678')
      expect(text).not.toContain('Osdorpplein')
      expect(text).toContain('€150')
    }
  })
  it('leaves stored data and private delivery unchanged', () => {
    const original = JSON.stringify(lead)
    groupTeaser(lead)
    expect(JSON.stringify(lead)).toBe(original)
    expect(privateDetails(lead)).toContain('Osdorpplein 963')
    expect(privateDetails(lead)).toContain(lead.customer_phone)
    expect(privateDetails(lead)).toContain('customer@example.com')
  })
  it('never publishes unknown postcode formats verbatim', () => {
    expect(publicPostalArea('1068td')).toBe('1068')
    expect(publicPostalArea('1068 TD')).toBe('1068')
    expect(publicPostalArea('SW1A 1AA')).toBeNull()
  })
})