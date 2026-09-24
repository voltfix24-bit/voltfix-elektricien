import { beforeEach, describe, expect, it, vi } from 'vitest'

const { apply } = vi.hoisted(() => ({ apply: vi.fn() }))
vi.mock('@tanstack/react-router', () => ({ createFileRoute: () => (options: unknown) => options }))
vi.mock('@/lib/ads-consent.server', () => ({ applyConsentDecision: apply }))
import { Route } from '@/routes/api/public/track/consent'

const post = (body: unknown) => (Route as any).server.handlers.POST({
  request: new Request('http://localhost/api/public/track/consent', {
    method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify(body),
  }),
}) as Promise<Response>
const valid = { visitorToken: 'a'.repeat(64), seq: 1770000000000000,
  adUserData: 'denied', adStorage: 'denied', version: 3 }
beforeEach(() => { apply.mockReset().mockResolvedValue({ok:true,events:0,leads:0,blocked:0,unblocked:0}) })

describe('public consent HTTP contract', () => {
  it('accepts a browser withdrawal without any ad ID or receipt response', async () => {
    expect((await post(valid)).status).toBe(200)
    expect(apply).toHaveBeenCalledWith(expect.objectContaining(valid))
  })
  it('rejects public click IDs without browser credentials', async () => {
    expect((await post({...valid,visitorToken:undefined,gclid:'PUBLIC_CLICK'})).status).toBe(400)
    expect(apply).not.toHaveBeenCalled()
  })
  it('reports a failed database transaction without acknowledging consent', async () => {
    apply.mockRejectedValue(new Error('transaction rolled back'))
    expect((await post(valid)).status).toBe(500)
  })
  it('distinguishes a stale decision from a conflicting one', async () => {
    for(const reason of ['stale','conflict']) {
      apply.mockResolvedValue({ok:false,reason})
      const response=await post(valid)
      expect(response.status).toBe(409)
      expect((await response.json()).reason).toBe(reason)
    }
  })
  it('does not round unsafe sequence numbers', async () => {
    expect((await post({...valid,seq:Number.MAX_SAFE_INTEGER+1})).status).toBe(400)
    expect(apply).not.toHaveBeenCalled()
  })
})
