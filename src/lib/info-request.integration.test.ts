import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import postgres from 'postgres'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import {
  checkDatabaseIsEmpty,
  checkDisposableDatabaseUrl,
  disposableDatabaseError,
  disposableMarkerTable,
} from './test-database-guard'

/**
 * Integratietests voor de klantaanvulling (fase 5B).
 *
 * Deze tests draaien tegen een GEÏSOLEERDE wegwerpdatabase, nooit tegen
 * productie. Het schema wordt opnieuw opgebouwd, dus vóór iedere handeling
 * staat een harde controle: lokale host, databasenaam met "test" of "tmp",
 * expliciete toestemming én een lege database. Faalt één daarvan, dan stopt
 * de test zonder iets te wissen.
 *
 * Opzet van een wegwerpdatabase:
 *   initdb -U postgres -A trust /tmp/pgtest/data
 *   pg_ctl -D /tmp/pgtest/data -o "-p 55432" start
 *   createdb -h 127.0.0.1 -p 55432 -U postgres infotest
 *   export INFO_REQUEST_TEST_DATABASE_URL=postgres://postgres@127.0.0.1:55432/infotest
 *   export INFO_REQUEST_TEST_ALLOW_RESET=yes
 *
 * De tests laden zelf `supabase/test/info-request-bootstrap.sql` (minimale
 * voorbouw) en daarna de echte fase 5B-migraties uit `supabase/migrations`.
 */

const url = process.env['INFO_REQUEST_TEST_DATABASE_URL']
const suite = url ? describe : describe.skip

const migrations = [
  'supabase/migrations/20260913095229_8efddcda-1cad-4dc5-b1ee-f587080553e4.sql',
  'supabase/migrations/20260913103753_6481fe05-c65d-428c-9750-ad5a09c99367.sql',
  'supabase/migrations/20260913114737_740551a1-b695-4552-90bc-19d404068dd9.sql',
]

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex')

async function prepareDisposableDatabase(sql: ReturnType<typeof postgres>) {
  const check = checkDisposableDatabaseUrl(url, process.env['INFO_REQUEST_TEST_ALLOW_RESET'])
  if (!check.ok) throw disposableDatabaseError(check.reason)

  // Tweede slot: staan er al gegevens in, dan is dit geen wegwerpdatabase.
  const tables = await sql<Array<{ table_name: string }>>`
    select table_name from information_schema.tables
    where table_schema = 'public' and table_type = 'BASE TABLE'`
  const counts: Array<{ table: string; rows: number }> = []
  for (const row of tables) {
    const [count] = await sql.unsafe(`select count(*)::int as n from public."${row.table_name}"`)
    counts.push({ table: row.table_name, rows: Number(count?.['n'] ?? 0) })
  }
  const marker = tables.some(row => row.table_name === disposableMarkerTable)
  const empty = checkDatabaseIsEmpty(counts, marker)
  if (!empty.ok) throw disposableDatabaseError(empty.reason)

  await sql.unsafe(`drop schema public cascade; create schema public;`)
  // Merkteken: deze database is en blijft een wegwerpdatabase.
  await sql.unsafe(`create table public."${disposableMarkerTable}" (created_at timestamptz not null default now())`)
  const root = process.cwd()
  await sql.unsafe(readFileSync(join(root, 'supabase/test/info-request-bootstrap.sql'), 'utf8'))
  for (const file of migrations) await sql.unsafe(readFileSync(join(root, file), 'utf8'))
}

suite('klantaanvulling — end to end (geïsoleerde database)', () => {
  const sql = postgres(url ?? '', { max: 1, onnotice: () => {} })
  // Aparte verbindingen: alleen zo ontstaat echte gelijktijdigheid.
  const sqlA = postgres(url ?? '', { max: 1, onnotice: () => {} })
  const sqlB = postgres(url ?? '', { max: 1, onnotice: () => {} })

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
    await prepareDisposableDatabase(sql)
  }, 60_000)

  afterAll(async () => {
    await Promise.all([sql.end(), sqlA.end(), sqlB.end()])
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

  it('twee tabbladen tegelijk: het tweede concept krijgt een conflict en overschrijft niet', async () => {
    const row = await newRequest()
    // Echt gelijktijdig, over twee losse verbindingen.
    const [first, second] = await Promise.all([
      sqlA`update quote_request_info_requests
        set draft_answers = '{"a":1}'::jsonb, draft_revision = draft_revision + 1
        where id = ${row['id']} and draft_revision = 0 returning draft_answers`,
      sqlB`update quote_request_info_requests
        set draft_answers = '{"b":2}'::jsonb, draft_revision = draft_revision + 1
        where id = ${row['id']} and draft_revision = 0 returning draft_answers`,
    ])
    // Precies één van beide slaagt; welke maakt niet uit, overschrijven mag niet.
    expect(first.length + second.length).toBe(1)
    const winner = (first[0] ?? second[0])!['draft_answers']
    const [after] = await sql`select draft_answers, draft_revision from quote_request_info_requests where id = ${row['id']}`
    expect(after['draft_answers']).toEqual(winner)
    expect(after['draft_revision']).toBe(1)
  })

  it('twee gelijktijdige inzendingen leveren samen één ontvangst en één opvolgtaak', async () => {
    const [fresh] = await sql`insert into quote_requests default values returning id`
    const row = await newRequest({ quote_request_id: fresh['id'], items: ['socket_present_choice'] })
    const key = crypto.randomUUID()
    const [one, two] = await Promise.all([
      sqlA`select submit_info_request(${row['id']}, '{}'::jsonb, '[]'::jsonb, ${key}, '{}'::uuid[]) as out`,
      sqlB`select submit_info_request(${row['id']}, '{}'::jsonb, '[]'::jsonb, ${key}, '{}'::uuid[]) as out`,
    ])
    const results = [one[0]!['out'], two[0]!['out']]
    expect(results.every(result => result.ok)).toBe(true)
    expect(results.filter(result => result.replayed === true).length).toBe(1)
    const tasks = await sql`select id from notification_outbox where quote_request_id = ${fresh['id']}`
    expect(tasks.length).toBe(1)
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
    const marker = 'afgebroken-na-aanroep'
    // De fout komt ná een geslaagde aanroep, en wordt hier ook echt verwacht:
    // een vroegtijdige fout mag niet stiekem als "geslaagd" tellen.
    let thrown: unknown = null
    await sql
      .begin(async trx => {
        const [inner] = await trx`select submit_info_request(${row['id']}, '{}'::jsonb, '[]'::jsonb, ${crypto.randomUUID()}, '{}'::uuid[]) as out`
        expect(inner!['out'].ok).toBe(true)
        throw new Error(marker)
      })
      .catch(error => {
        thrown = error
      })
    expect((thrown as Error | null)?.message).toBe(marker)
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

  it('een lopende aflevering sluit een nieuwe aanvulling niet af als verstuurd', async () => {
    const [fresh] = await sql`insert into quote_requests default values returning id`
    const first = await newRequest({ quote_request_id: fresh['id'], items: ['socket_present_choice'] })
    await sql`select submit_info_request(${first['id']}, '{}'::jsonb, '[]'::jsonb, ${crypto.randomUUID()}, '{}'::uuid[])`

    // De verwerker pakt de taak op en krijgt een afleverkenmerk.
    const [reserved] = await sql`select * from reserve_notifications(10, ${fresh['id']})`
    expect(reserved!['delivery_token']).not.toBeNull()

    // Ondertussen dient de klant een tweede, nieuwe aanvulling in.
    const second = await newRequest({ quote_request_id: fresh['id'], items: ['socket_present_choice'], revision: 2 })
    await sql`select submit_info_request(${second['id']}, '{}'::jsonb, '[]'::jsonb, ${crypto.randomUUID()}, '{}'::uuid[])`

    // De late afronding van de eerste aflevering raakt niets meer.
    const closed = await sql`update notification_outbox set status = 'sent', sent_at = now()
      where id = ${reserved!['id']} and delivery_token = ${reserved!['delivery_token']} returning id`
    expect(closed.length).toBe(0)
    const [task] = await sql`select status, payload, delivery_token from notification_outbox where quote_request_id = ${fresh['id']}`
    expect(task['status']).toBe('pending')
    expect(task['delivery_token']).toBeNull()
    expect(task['payload']['infoRequestRevision']).toBe(2)
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
 * De routecontroles vragen een draaiende applicatie mét ingeschakelde publieke
 * aanvulling (`PERILEX_INFO_REQUEST_PUBLIC=enabled`) die op dezelfde
 * wegwerpdatabase staat. Ze zetten zélf een geldige en een verlopen link klaar
 * en gebruiken echte sessiecookies — geen "401 telt ook als goed".
 *
 * Draaien: start de app tegen de wegwerpdatabase en zet
 *   INFO_REQUEST_TEST_BASE_URL=http://127.0.0.1:8080
 */
const base = process.env['INFO_REQUEST_TEST_BASE_URL']
const httpSuite = base && url ? describe : describe.skip

httpSuite('klantaanvulling — via de publieke routes (vereist draaiende testomgeving)', () => {
  const sql = postgres(url ?? '', { max: 2, onnotice: () => {} })
  const origin = base as string
  let openToken = ''
  let expiredToken = ''
  let cookie = ''

  const seed = async (token: string, expiresAt: string) => {
    const [quote] = await sql`insert into quote_requests default values returning id`
    const [row] = await sql`insert into quote_request_info_requests
      (quote_request_id, status, revision, language, items, token_hash, expires_at)
      values (${quote!['id']}, 'open', 1, 'nl', array['photo_consumer_unit','socket_present_choice'],
              ${sha256(token)}, ${expiresAt}) returning *`
    return row!
  }

  const session = async (token: string) =>
    fetch(`${origin}/api/public/info-request/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', origin },
      body: JSON.stringify({ token }),
    })

  beforeAll(async () => {
    openToken = crypto.randomUUID() + crypto.randomUUID()
    expiredToken = crypto.randomUUID() + crypto.randomUUID()
    await seed(openToken, new Date(Date.now() + 7 * 864e5).toISOString())
    await seed(expiredToken, new Date(Date.now() - 60_000).toISOString())
    const response = await session(openToken)
    cookie = (response.headers.get('set-cookie') ?? '').split(';')[0] ?? ''
  }, 60_000)

  afterAll(async () => {
    await sql.end()
  })

  it('een linkpreview verbruikt de link niet; opnieuw openen blijft mogelijk', async () => {
    const preview = await fetch(`${origin}/api/public/info-request/state`)
    expect(preview.status).toBe(401) // zonder sessie geen inzage
    const again = await session(openToken)
    expect(again.status).toBe(200)
    const state = await fetch(`${origin}/api/public/info-request/state`, { headers: { cookie } })
    expect(state.status).toBe(200)
    const body = (await state.json()) as { ok: boolean; state: { items: string[] } }
    expect(body.ok).toBe(true)
    expect(body.state.items).toContain('socket_present_choice')
  })

  it('een verlopen token geeft geen toegang en geen schrijfrecht', async () => {
    const response = await session(expiredToken)
    expect(response.status).toBe(410)
    expect(response.headers.get('set-cookie')).toBeNull()
  })

  it('een ingetrokken link geeft met een bestaande sessie geen schrijfrecht meer', async () => {
    const token = crypto.randomUUID() + crypto.randomUUID()
    const row = await seed(token, new Date(Date.now() + 864e5).toISOString())
    const opened = await session(token)
    const ownCookie = (opened.headers.get('set-cookie') ?? '').split(';')[0] ?? ''
    await sql`update quote_request_info_requests set status = 'withdrawn', token_hash = null where id = ${row['id']}`
    const write = await fetch(`${origin}/api/public/info-request/draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', origin, cookie: ownCookie },
      body: JSON.stringify({ answers: {}, draftRevision: 0 }),
    })
    expect(write.status).toBe(410)
  })

  it('een categorie die niet gevraagd is wordt geweigerd, ook met een geldige sessie', async () => {
    const form = new FormData()
    form.set('attachmentId', crypto.randomUUID())
    form.set('category', 'other')
    // Echt geldige JPEG-kop: de weigering moet over de categorie gaan.
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0xff, 0xd9])
    form.set('file', new File([jpeg], 'x.jpg', { type: 'image/jpeg' }))
    const response = await fetch(`${origin}/api/public/info-request/upload`, {
      method: 'POST',
      headers: { origin, cookie },
      body: form,
    })
    expect(response.status).toBe(400)
    const body = (await response.json()) as { code?: string }
    expect(body.code).toBe('category_not_requested')
  })

  it('een vreemde origin mag niet schrijven, ook niet met een geldige sessie', async () => {
    const response = await fetch(`${origin}/api/public/info-request/draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', origin: 'https://elders.example', cookie },
      body: JSON.stringify({ answers: {}, draftRevision: 0 }),
    })
    expect(response.status).toBe(403)
  })
})
