import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeSupabase } from '@/test/fake-supabase'
import { applyConsentDecision, authoritativeConsent, hashConsentToken, hashVisitorToken,
  issueConsentTicket, missingConsentColumn, recordFormConsent, consentForStorage, resolveRecordedClickOwner } from './ads-consent.server'

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }))
vi.mock('@/integrations/supabase/client.server', () => ({ supabaseAdmin: { rpc } }))
beforeEach(() => { rpc.mockReset().mockResolvedValue({ data: { ok: true }, error: null }) })

describe('browser-bound consent RPC contract', () => {
  it('never issues ownership from a public click ID alone', async () => {
    expect(await issueConsentTicket({ gclid: 'PUBLIC_CLICK' })).toBeNull()
    expect(rpc).not.toHaveBeenCalled()
  })
  it('keeps the same receipt after a second click or a lost response', async () => {
    const visitorToken = 'a'.repeat(64)
    const a = await issueConsentTicket({ visitorToken, gclid: 'CLICK_ONE' })
    const b = await issueConsentTicket({ visitorToken, gclid: 'CLICK_TWO' })
    expect(a?.token).toBe(b?.token)
    expect(rpc.mock.calls[0]?.[1]).toEqual({
      p_visitor_hash: await hashVisitorToken(visitorToken), p_token_hash: await hashConsentToken(a!.token),
    })
    expect(JSON.stringify(rpc.mock.calls)).not.toContain('CLICK_ONE')
    expect(JSON.stringify(rpc.mock.calls)).not.toContain(visitorToken)
  })
  it('can withdraw after receiving no ticket response at all', async () => {
    await applyConsentDecision({ visitorToken: 'a'.repeat(64), seq: 5, adUserData: 'denied', adStorage: 'denied' })
    expect(rpc.mock.calls.map(c=>c[0])).toEqual(['ads_consent_subject_v2','ads_consent_apply_v2'])
    expect(rpc.mock.calls[1]?.[1]).toMatchObject({ p_seq: 5, p_ad_user_data: 'denied' })
  })
  it('does not acknowledge an unavailable migration', async () => {
    rpc.mockResolvedValue({error:{code:'PGRST202',message:'RPC missing'}})
    await expect(issueConsentTicket({visitorToken:'b'.repeat(64)})).rejects.toThrow('RPC missing')
  })
  it('propagates an incomplete database decision as failure', async () => {
    rpc.mockResolvedValue({error:{message:'database offline'}})
    await expect(applyConsentDecision({token:'a'.repeat(64),seq:1,adUserData:'denied',adStorage:'denied'})).rejects.toThrow('database offline')
  })
  it('does not use click-ID matches to read a foreign decision', async () => {
    const db=createFakeSupabase({ad_consent_subjects_v2:[
      {visitor_hash:'owner',ad_user_data:'granted',ad_storage:'granted'},
      {visitor_hash:'foreign',ad_user_data:'denied',ad_storage:'denied'},
    ]})
    expect(await authoritativeConsent(db,{consent_visitor_hash:'owner',gclid:'SHARED'})).toBe('granted')
    expect(await authoritativeConsent(db,{gclid:'SHARED'})).toBeNull()
  })
  it('requires both storage and data permission', async () => {
    const db=createFakeSupabase({ad_consent_subjects_v2:[{visitor_hash:'owner',ad_user_data:'granted',ad_storage:'denied'}]})
    expect(await authoritativeConsent(db,{consent_visitor_hash:'owner'})).toBe('denied')
  })
  it('recognizes PostgreSQL and PostgREST missing-column responses only', () => {
    expect(missingConsentColumn({code:'42703'})).toBe(true)
    expect(missingConsentColumn({code:'PGRST204'})).toBe(true)
    expect(missingConsentColumn({code:'23505'})).toBe(false)
    expect(missingConsentColumn(null)).toBe(false)
  })
  it('missing consent storage never makes a form grant implicit permission', async () => {
    const db=createFakeSupabase({}, {failures:{'ad_consent_subjects_v2:select':{message:'missing relation'}}})
    expect(await consentForStorage(db,'owner')).toBeNull()
  })
  it('binds message proof only to a unique non-internal recorded owner', async () => {
    const rows=[{gclid:'PUBLIC_CLICK',consent_visitor_hash:'owner',is_internal:false,is_bot:false}]
    const db=createFakeSupabase({conversion_events:rows})
    expect(await resolveRecordedClickOwner(db,{gclid:'PUBLIC_CLICK'})).toBe('owner')
    rows.push({...rows[0]!,consent_visitor_hash:'foreign'})
    expect(await resolveRecordedClickOwner(db,{gclid:'PUBLIC_CLICK'})).toBeNull()
  })
  it('does not upgrade an old form without a recorded choice sequence', async () => {
    await recordFormConsent({adVisitorToken:'a'.repeat(64),adConsentAdUserData:'granted',adConsentAdStorage:'granted'})
    expect(rpc).not.toHaveBeenCalled()
  })
  it('forwards the original form sequence, not a newly fabricated one', async () => {
    await recordFormConsent({adVisitorToken:'a'.repeat(64),adConsentSeq:73,adConsentAdUserData:'granted',adConsentAdStorage:'granted'})
    expect(rpc.mock.calls[1]?.[1]).toMatchObject({p_seq:73,p_origin:'form_snapshot'})
  })
})
