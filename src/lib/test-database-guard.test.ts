import { describe, expect, it } from 'vitest'

import { checkDatabaseIsEmpty, checkDisposableDatabaseUrl } from './test-database-guard'

describe('beveiliging van de wegwerpdatabase', () => {
  const ok = 'postgres://postgres@127.0.0.1:55432/infotest'

  it('laat een lokale testdatabase met expliciete toestemming door', () => {
    expect(checkDisposableDatabaseUrl(ok, 'yes')).toEqual({ ok: true })
  })

  it('weigert zonder expliciete toestemming', () => {
    expect(checkDisposableDatabaseUrl(ok, undefined).ok).toBe(false)
  })

  it('weigert een database op afstand', () => {
    expect(checkDisposableDatabaseUrl('postgres://u:p@db.example.com:5432/infotest', 'yes').ok).toBe(false)
  })

  it('weigert een naam zonder test of tmp', () => {
    expect(checkDisposableDatabaseUrl('postgres://postgres@127.0.0.1:5432/voltfix', 'yes').ok).toBe(false)
  })

  it('weigert een naam die op een echte omgeving lijkt', () => {
    expect(checkDisposableDatabaseUrl('postgres://postgres@127.0.0.1:5432/test_prod', 'yes').ok).toBe(false)
  })

  it('weigert een onleesbare URL', () => {
    expect(checkDisposableDatabaseUrl('zomaar-tekst', 'yes').ok).toBe(false)
  })

  it('weigert een database die al gegevens bevat', () => {
    const result = checkDatabaseIsEmpty([{ table: 'leads', rows: 12 }])
    expect(result.ok).toBe(false)
  })

  it('laat een eerder gebruikte wegwerpdatabase opnieuw toe', () => {
    expect(checkDatabaseIsEmpty([{ table: 'leads', rows: 12 }], true)).toEqual({ ok: true })
  })

  it('laat een lege database door', () => {
    expect(checkDatabaseIsEmpty([{ table: 'leads', rows: 0 }])).toEqual({ ok: true })
  })
})
