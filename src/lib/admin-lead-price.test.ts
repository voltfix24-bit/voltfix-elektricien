import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeSupabase, type FakeDb } from '@/test/fake-supabase'

vi.mock('@tanstack/react-start', () => ({
  createServerFn: () => {
    let validate = (input: unknown) => input
    const builder = {
      middleware: () => builder,
      inputValidator: (validator: (input: unknown) => unknown) => { validate = validator; return builder },
      handler: (handler: (args: any) => Promise<unknown>) => (args: any) => handler({ ...args, data: validate(args.data) }),
    }
    return builder
  },
}))
vi.mock('@/integrations/supabase/auth-middleware', () => ({ requireSupabaseAuth: {} }))
vi.mock('@/integrations/supabase/client.server', () => ({ supabaseAdmin: { from: () => ({ insert: vi.fn() }) } }))

import { updateLead } from './admin.functions'

const id = '87687101-b7cc-488a-9e03-1d0da8d780ec'
let db: FakeDb
beforeEach(() => {
  vi.stubEnv('VOLTFIX_TEST_MODE', 'false')
  db = { leads: [{ id, price_cents: 14500, customer_price_cents: null, claimed_by: null }] }
})
function change(changes: Record<string, unknown>, isAdmin = true) {
  const context = { userId: 'admin', supabase: { ...createFakeSupabase(db), rpc: async () => ({ data: isAdmin, error: null }) } }
  return (updateLead as any)({ data: { leadId: id, changes }, context })
}
describe('admin price correction', () => {
  it('persists the €145 to €20 fee correction without altering the customer agreement', async () => {
    await change({ price_cents: 2000, customer_price_cents: 14500 })
    expect(db['leads']?.[0]).toMatchObject({ price_cents: 2000, customer_price_cents: 14500 })
  })
  it('does not silently rewrite a charged contractor fee', async () => {
    const row = db['leads']?.[0]
    if (!row) throw new Error('Missing fixture')
    row['claimed_by'] = 'contractor'
    await expect(change({ price_cents: 2000 })).rejects.toThrow('al opgepakt')
    expect(row['price_cents']).toBe(14500)
  })
  it('rejects price changes without administrator permission', async () => {
    await expect(change({ price_cents: 2000 }, false)).rejects.toThrow('beheerdersrechten')
    expect(db['leads']?.[0]?.['price_cents']).toBe(14500)
  })
})