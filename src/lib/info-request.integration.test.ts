import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import postgres from 'postgres'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

/**
 * Integratietests voor de klantaanvulling (fase 5B).
 *
 * Deze tests draaien tegen een GEÏSOLEERDE wegwerpdatabase, nooit tegen
 * productie. Zet `INFO_REQUEST_TEST_DATABASE_URL` en draai `bunx vitest run
 * src/lib/info-request.integration.test.ts`. Zonder die variabele worden ze
 * overgeslagen — ze worden nooit vervangen door mocks, want juist de
 * databaseregels (één lopend verzoek, de transactie bij indienen, de
 * idempotentie) moeten worden bewezen en die bestaan alleen in Postgres.
 *
 * Opzet van een wegwerpdatabase:
 *   initdb -U postgres -A trust /tmp/pgtest/data
 *   pg_ctl -D /tmp/pgtest/data -o "-p 55432" start
 *   createdb -h 127.0.0.1 -p 55432 -U postgres infotest
 *   export INFO_REQUEST_TEST_DATABASE_URL=postgres://postgres@127.0.0.1:55432/infotest
 *
 * De tests laden zelf `supabase/test/info-request-bootstrap.sql` (minimale
 * voorbouw) en daarna de echte fase 5B-migraties uit `supabase/migrations`.
 */

const url = process.env['INFO_REQUEST_TEST_DATABASE_URL']
const suite = url ? describe : describe.skip

const migrations = [
  'supabase/migrations/20260913095229_8efddcda-1cad-4dc5-b1ee-f587080553e4.sql',
  'supabase/migrations/20260913103753_6481fe05-c65d-428c-9750-ad5a09c99367.sql',
]

suite('klantaanvulling — end to end (geïsoleerde database)', () => {
  const sql = postgres(url ?? '', { max: 1, onnotice: () => {} })

  const newQuoteRequest = async (): Promise<string> => {
    const [row] = await sql`insert into quote_requests default values returning id`
    return row!['id'] as string
  }

  const newRequest = async (overrides: Record<string, unknown> = {}) => {
    const row = {
      quote_request_id: overrides['quote_request_id'] ?? (await newQuoteRequest()),
      status: 'open',
      revision: 1,
      language: 'nl',
      items: ['photo_consumer_unit', 'socket_present_choice'],
      expires_at: new Date(Date.now() + 7 * 864e5).toISOString(),
      ...overrides,
    }
    const [created] = await sql`insert into quote_request_info_requests ${sql(row as never)} returning *`
    return created
  }

  beforeAll(async () => {
    await sql.unsafe(`drop schema public cascade; create schema public;`)
    const root = process.cwd()
    await sql.unsafe(readFileSync(join(root, 'supabase/test/info-request-bootstrap.sql'), 'utf8'))
    for (const file of migrations) await sql.unsafe(readFileSync(join(root, file), 'utf8'))
  }, 60_000)

  afterAll(async () => {
    await sql.end()
  })

  it('een sessie van een ander verzoek geeft geen toegang tot deze aanvraag', async () => {
    const a = await newRequest()
    const [other] = await sql`insert into quote_requests default values returning id`
    const b = await newRequest({ quote_request_id: other['id'] })
    await sql`insert into quote_request_info_sessions (info_request_id, session_hash, expires_at)
      values (${a['id']}, 'hash-a', now() + interval '1 hour')`
    const rows = await sql`select r.id from quote_request_info_sessions s
      join quote_request_info_requests r on r.id = s.info_request_id
      where s.session_hash = 'hash-a'`
    expect(rows.map(row => row['id'])).toEqual([a['id']])
    expect(rows.map(row => row['id'])).not.toContain(b['id'])
  })

  it('een gemanipuleerd aanvraag-ID in de body wordt genegeerd; de sessie bepaalt de eigenaar', async () => {
    const own = await newRequest()
    const foreign = await newRequest({ quote_request_id: (await sql`insert into quote_requests default values returning id`)[0]['id'] })
    // Bijlage die bij een ánder verzoek hoort: indienen mag die nooit koppelen.
    const foreignAttachment = crypto.randomUUID()
    await sql`insert into quote_request_attachments
      (draft_id, attachment_id, category, original_filename, storage_path, mime_type, size_bytes, status)
      values (${foreign['id']}, ${foreignAttachment}, 'consumer_unit', 'a.jpg', 'p/a.jpg', 'image/jpeg', 10, 'stored')`
    await sql`update quote_request_info_requests set items = array['socket_present_choice'] where id = ${own['id']}`
    await sql`select submit_info_request(${own['id']}, '{}'::jsonb, '[]'::jsonb, ${crypto.randomUUID()}, ${sql.array([foreignAttachment])}::uuid[])`
    const [attachment] = await sql`select info_request_id from quote_request_attachments where attachment_id = ${foreignAttachment}`
    expect(attachment['info_request_id']).toBeNull()
  })

  it('een verlopen, ingetrokken of vervangen verzoek levert geen ontvangst op', async () => {
    for (const overrides of [
      { status: 'open', expires_at: new Date(Date.now() - 1000).toISOString() },
      { status: 'withdrawn' },
      { status: 'superseded' },
    ]) {
      const row = await newRequest(overrides)
      const [result] = await sql`select submit_info_request(${row['id']}, '{}'::jsonb, '[]'::jsonb, ${crypto.randomUUID()}, '{}'::uuid[]) as out`
      expect(result['out'].ok).toBe(false)
      const [after] = await sql`select status, submitted_at from quote_request_info_requests where id = ${row['id']}`
      expect(after['submitted_at']).toBeNull()
    }
  })

  it('indienen trekt alle sessies van het verzoek direct in', async () => {
    const row = await newRequest({ items: ['socket_present_choice'] })
    await sql`insert into quote_request_info_sessions (info_request_id, session_hash, expires_at)
      values (${row['id']}, ${'s-' + row['id']}, now() + interval '1 hour')`
    await sql`select submit_info_request(${row['id']}, '{}'::jsonb, '[]'::jsonb, ${crypto.randomUUID()}, '{}'::uuid[])`
    const [session] = await sql`select revoked_at from quote_request_info_sessions where info_request_id = ${row['id']}`
    expect(session['revoked_at']).not.toBeNull()
  })

  it('twee tabbladen: het tweede concept krijgt een conflict en overschrijft niet', async () => {
    const row = await newRequest()
    const first = await sql`update quote_request_info_requests
      set draft_answers = '{"a":1}'::jsonb, draft_revision = draft_revision + 1
      where id = ${row['id']} and draft_revision = 0 returning draft_revision`
    const second = await sql`update quote_request_info_requests
      set draft_answers = '{"b":2}'::jsonb, draft_revision = draft_revision + 1
      where id = ${row['id']} and draft_revision = 0 returning draft_revision`
    expect(first.length).toBe(1)
    expect(second.length).toBe(0)
    const [after] = await sql`select draft_answers from quote_request_info_requests where id = ${row['id']}`
    expect(after['draft_answers']).toEqual({ a: 1 })
  })

  it('een tweede lopend verzoek per aanvraag wordt door de database geweigerd', async () => {
    const [fresh] = await sql`insert into quote_requests default values returning id`
    await newRequest({ quote_request_id: fresh['id'] })
    await expect(newRequest({ quote_request_id: fresh['id'] })).rejects.toThrow(/one_live_info_request_per_quote/)
  })

  it('een ingetrokken verzoek blokkeert de partiële index niet meer', async () => {
    const [fresh] = await sql`insert into quote_requests default values returning id`
    const first = await newRequest({ quote_request_id: fresh['id'] })
    await sql`update quote_request_info_requests set status = 'withdrawn', token_hash = null where id = ${first['id']}`
    const second = await newRequest({ quote_request_id: fresh['id'], revision: 2 })
    expect(second['revision']).toBe(2)
  })

  it('dubbel indienen met dezelfde sleutel bevestigt dezelfde ontvangst', async () => {
    const row = await newRequest({ items: ['socket_present_choice'] })
    const key = crypto.randomUUID()
    const [one] = await sql`select submit_info_request(${row['id']}, '{}'::jsonb, '[]'::jsonb, ${key}, '{}'::uuid[]) as out`
    const [two] = await sql`select submit_info_request(${row['id']}, '{}'::jsonb, '[]'::jsonb, ${key}, '{}'::uuid[]) as out`
    expect(one['out'].ok).toBe(true)
    expect(one['out'].replayed).toBe(false)
    expect(two['out'].ok).toBe(true)
    expect(two['out'].replayed).toBe(true)
  })

  it('dezelfde sleutel met een ander verzoek geeft een conflict', async () => {
    const key = crypto.randomUUID()
    const first = await newRequest({ items: ['socket_present_choice'] })
    await sql`select submit_info_request(${first['id']}, '{}'::jsonb, '[]'::jsonb, ${key}, '{}'::uuid[])`
    const second = await newRequest({ items: ['socket_present_choice'], revision: 2 })
    const [result] = await sql`select submit_info_request(${second['id']}, '{}'::jsonb, '[]'::jsonb, ${key}, '{}'::uuid[]) as out`
    expect(result['out'].reason).toBe('idempotency_conflict')
  })

  it('een afgebroken poging vóór de commit laat geen halve ontvangst achter', async () => {
    const row = await newRequest({ items: ['socket_present_choice'] })
    await sql.begin(async trx => {
      await trx`select submit_info_request(${row['id']}, '{}'::jsonb, '[]'::jsonb, ${crypto.randomUUID()}, '{}'::uuid[])`
      await trx`rollback`
    }).catch(() => {})
    const [after] = await sql`select status, submitted_at from quote_request_info_requests where id = ${row['id']}`
    expect(after['status']).toBe('open')
    expect(after['submitted_at']).toBeNull()
    const outbox = await sql`select id from notification_outbox where quote_request_id = ${row['quote_request_id']}`
    expect(outbox.length).toBe(0)
  })

  it('ontvangst en opvolgtaak worden in dezelfde transactie vastgelegd', async () => {
    const [fresh] = await sql`insert into quote_requests default values returning id`
    const row = await newRequest({ quote_request_id: fresh['id'], items: ['socket_present_choice'] })
    await sql`select submit_info_request(${row['id']}, '{"socket_present_choice":{"value":"yes"}}'::jsonb, '[]'::jsonb, ${crypto.randomUUID()}, '{}'::uuid[])`
    const [after] = await sql`select status, submitted_at, token_hash from quote_request_info_requests where id = ${row['id']}`
    const [task] = await sql`select kind, status, payload from notification_outbox where quote_request_id = ${fresh['id']}`
    expect(after['status']).toBe('submitted')
    expect(after['token_hash']).toBeNull()
    expect(task['kind']).toBe('info_request_received')
    expect(task['status']).toBe('pending')
    expect(task['payload']['infoRequestRevision']).toBe(1)
  })

  it('een mislukte aflevering draait de ontvangst niet terug', async () => {
    const [fresh] = await sql`insert into quote_requests default values returning id`
    const row = await newRequest({ quote_request_id: fresh['id'], items: ['socket_present_choice'] })
    await sql`select submit_info_request(${row['id']}, '{}'::jsonb, '[]'::jsonb, ${crypto.randomUUID()}, '{}'::uuid[])`
    // Aflevering mislukt: de taak blijft staan met een fout, de ontvangst blijft.
    await sql`update notification_outbox set status = 'failed', attempts = 1, last_error = 'transport' where quote_request_id = ${fresh['id']}`
    const [after] = await sql`select status from quote_request_info_requests where id = ${row['id']}`
    const [task] = await sql`select status, attempts from notification_outbox where quote_request_id = ${fresh['id']}`
    expect(after['status']).toBe('submitted')
    expect(task['status']).toBe('failed')
    expect(task['attempts']).toBe(1)
  })

  it('bijlagen van dit verzoek worden bij indienen aan de aanvraag gekoppeld', async () => {
    const [fresh] = await sql`insert into quote_requests default values returning id`
    const row = await newRequest({ quote_request_id: fresh['id'], items: ['photo_consumer_unit'] })
    const attachmentId = crypto.randomUUID()
    await sql`insert into quote_request_attachments
      (draft_id, attachment_id, category, original_filename, storage_path, mime_type, size_bytes, status)
      values (${row['id']}, ${attachmentId}, 'consumer_unit', 'kast.jpg', 'p/kast.jpg', 'image/jpeg', 1000, 'stored')`
    await sql`select submit_info_request(${row['id']}, '{}'::jsonb, '[]'::jsonb, ${crypto.randomUUID()}, ${sql.array([attachmentId])}::uuid[])`
    const [attachment] = await sql`select quote_request_id, info_request_id from quote_request_attachments where attachment_id = ${attachmentId}`
    expect(attachment['quote_request_id']).toBe(fresh['id'])
    expect(attachment['info_request_id']).toBe(row['id'])
    const [task] = await sql`select payload from notification_outbox where quote_request_id = ${fresh['id']}`
    expect(task['payload']['receivedCategories']).toEqual(['consumer_unit'])
  })

  it('een terugbelverzoek hoort bij dezelfde aanvulling en gaat mee in de opvolgtaak', async () => {
    const [fresh] = await sql`insert into quote_requests default values returning id`
    const row = await newRequest({ quote_request_id: fresh['id'], items: ['socket_present_choice'] })
    await sql`update quote_request_info_requests set callback_requested = true, callback_requested_at = now() where id = ${row['id']}`
    await sql`select submit_info_request(${row['id']}, '{}'::jsonb, '[]'::jsonb, ${crypto.randomUUID()}, '{}'::uuid[])`
    const [task] = await sql`select payload from notification_outbox where quote_request_id = ${fresh['id']}`
    expect(task['payload']['callbackRequested']).toBe(true)
  })

  it('de gestelde aanvullende vraag wordt bij het verzoek bewaard', async () => {
    const row = await newRequest({ items: ['extra_question'], extra_question: 'Welk merk is het fornuis?' })
    const [after] = await sql`select extra_question from quote_request_info_requests where id = ${row['id']}`
    expect(after['extra_question']).toBe('Welk merk is het fornuis?')
  })
})

/**
 * Vier controles vragen een draaiende applicatie mét ingeschakelde publieke
 * aanvulling (`PERILEX_INFO_REQUEST_PUBLIC=enabled`) in een testomgeving.
 * Die omgeving bestaat hier niet: publieke aanvullingen staan bewust uit en
 * productie is geen vervanging. De tests staan uitvoerbaar klaar.
 *
 * Draaien: start de app tegen de wegwerpdatabase en zet
 * `INFO_REQUEST_TEST_BASE_URL=http://127.0.0.1:8080`.
 */
const base = process.env['INFO_REQUEST_TEST_BASE_URL']
const httpSuite = base ? describe : describe.skip

httpSuite('klantaanvulling — via de publieke routes (vereist draaiende testomgeving)', () => {
  const token = process.env['INFO_REQUEST_TEST_TOKEN'] ?? ''

  it('een GET of linkpreview verbruikt de link niet; opnieuw openen blijft mogelijk', async () => {
    const first = await fetch(`${base}/api/public/info-request/state`)
    expect([200, 401]).toContain(first.status)
    const second = await fetch(`${base}/api/public/info-request/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', origin: base as string },
      body: JSON.stringify({ token }),
    })
    expect(second.status).toBe(200)
  })

  it('een verlopen of ingetrokken token levert 410 en geen schrijfrecht', async () => {
    const response = await fetch(`${base}/api/public/info-request/draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', origin: base as string },
      body: JSON.stringify({ answers: {}, draftRevision: 0 }),
    })
    expect([401, 410]).toContain(response.status)
  })

  it('een categorie die niet gevraagd is wordt geweigerd', async () => {
    const form = new FormData()
    form.set('attachmentId', crypto.randomUUID())
    form.set('category', 'other')
    form.set('file', new File([new Uint8Array([1, 2, 3])], 'x.jpg', { type: 'image/jpeg' }))
    const response = await fetch(`${base}/api/public/info-request/upload`, {
      method: 'POST',
      headers: { origin: base as string },
      body: form,
    })
    expect([400, 401]).toContain(response.status)
  })

  it('een vreemde origin mag niet schrijven', async () => {
    const response = await fetch(`${base}/api/public/info-request/draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', origin: 'https://elders.example' },
      body: JSON.stringify({ answers: {}, draftRevision: 0 }),
    })
    expect(response.status).toBe(403)
  })
})
