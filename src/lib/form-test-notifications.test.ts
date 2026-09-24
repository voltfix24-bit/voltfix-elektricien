import { beforeEach, describe, expect, it, vi } from 'vitest'

const dispatch = vi.fn(async () => ({ id: 'lead-1' }))
const sendEmail = vi.fn(async () => ({ sent: true }))
vi.mock('@/lib/leads-intake.server', () => ({ createAndDispatchLead: (...a: unknown[]) => (dispatch as any)(...a) }))
vi.mock('./leads-intake.server', () => ({ createAndDispatchLead: (...a: unknown[]) => (dispatch as any)(...a) }))
vi.mock('./email-templates/send-email', () => ({ sendTemplateEmail: (...a: unknown[]) => (sendEmail as any)(...a) }))

import { __runOneForTest as runOne } from './notifications.server'

const base = {
  id: 'q1', name: 'TEST Formulier NL-A', phone: '0600000001', email: 'eigen@example.test', postal_code: '1011AB',
  street: null, house_number: null, city: null, job_type: 'Storing', message: 'TEST', locale: 'nl',
  source_path: '/contact', appointment_date: null, appointment_slot: null, appointment_note: null,
  attachment_paths: [], created_at: new Date().toISOString(), service_answers: {},
  gclid: null, gbraid: null, wbraid: null,
} as any

describe('testaanvraag via beheerderstestlink', () => {
  beforeEach(() => { dispatch.mockClear(); sendEmail.mockClear() })

  it('dossier krijgt testmarkering bij aanmaken', async () => {
    await runOne({} as any, { ...base, is_test: true }, 'internal_lead', {})
    expect((dispatch.mock.calls[0] as any)[0].isTest).toBe(true)
  })
  it('gewone aanvraag blijft géén test', async () => {
    await runOne({} as any, { ...base, is_test: false }, 'internal_lead', {})
    expect((dispatch.mock.calls[0] as any)[0].isTest).toBe(false)
  })
  it('geen klant- of eigenaarsmail voor een test, ook niet via herstel', async () => {
    await runOne({} as any, { ...base, is_test: true }, 'customer_email', {})
    await runOne({} as any, { ...base, is_test: true }, 'owner_email', {})
    expect(sendEmail).not.toHaveBeenCalled()
  })
})
