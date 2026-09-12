import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Bewijst het gedrag van de meldingenwachtrij (outbox) zonder echte database:
 * één taak per aanvraag, geen dubbele lead bij opnieuw versturen, pogingenteller
 * met uitgesteld volgend probeermoment, definitief mislukt na het maximum, en
 * twee gelijktijdige verwerkers die nooit dezelfde taak oppakken.
 */

const dispatch = vi.fn()

vi.mock('@/lib/leads-intake.server', () => ({
  createAndDispatchLead: (...args: unknown[]) => dispatch(...args),
}))
vi.mock('@/lib/email-templates/send-email', () => ({
  sendTemplateEmail: vi.fn(async () => ({ sent: true })),
}))

type OutboxRow = {
  id: string
  quote_request_id: string
  kind: string
  status: string
  attempts: number
  last_error: string | null
  next_attempt_at: string
  lease_until: string | null
  sent_at: string | null
  payload: Record<string, unknown>
}

const QUOTE = {
  id: 'q1',
  name: 'Test Klant',
  phone: '0612345678',
  email: null,
  postal_code: '1011AB',
  street: 'Damrak',
  house_number: '1',
  city: 'Amsterdam',
  job_type: 'Groepenkast vervangen',
  message: 'Graag snel',
  locale: 'nl',
  source_path: '/groepenkast-amsterdam',
  appointment_date: null,
  appointment_slot: null,
  attachment_paths: [],
  created_at: new Date().toISOString(),
}

function makeFakeSupabase() {
  const outbox: OutboxRow[] = []
  const quotes = [{ ...QUOTE }]
  const quoteStatus: Record<string, string> = {}

  function tableRows(table: string): any[] {
    return table === 'notification_outbox' ? outbox : quotes
  }

  function from(table: string) {
    return {
      upsert(rows: any[], _opts: any) {
        for (const row of rows) {
          const exists = outbox.some(
            (r) => r.quote_request_id === row.quote_request_id && r.kind === row.kind,
          )
          if (exists) continue // onConflict + ignoreDuplicates
          outbox.push({
            id: `${row.quote_request_id}:${row.kind}`,
            quote_request_id: row.quote_request_id,
            kind: row.kind,
            status: 'pending',
            attempts: 0,
            last_error: null,
            next_attempt_at: new Date(0).toISOString(),
            lease_until: null,
            sent_at: null,
            payload: row.payload ?? {},
          })
        }
        return Promise.resolve({ error: null })
      },
      select(_cols: string) {
        const filters: Array<[string, unknown]> = []
        const result = () => tableRows(table).filter((r) => filters.every(([c, v]) => r[c] === v))
        const builder: any = {
          eq(col: string, val: unknown) {
            filters.push([col, val])
            return builder
          },
          maybeSingle: () => Promise.resolve({ data: result()[0] ?? null, error: null }),
          then: (res: any) => res({ data: result(), error: null }),
        }
        return builder
      },
      update(patch: Record<string, unknown>) {
        return {
          eq(col: string, val: unknown) {
            if (table === 'quote_requests' && 'notification_status' in patch) {
              quoteStatus[String(val)] = String(patch['notification_status'])
            }
            for (const row of tableRows(table)) if (row[col] === val) Object.assign(row, patch)
            return Promise.resolve({ error: null })
          },
        }
      },
    }
  }

  return {
    outbox,
    quoteStatus,
    from,
    storage: { from: () => ({ createSignedUrl: async () => ({ data: null }) }) },
    rpc(_fn: string, args: { _limit: number; _quote_request_id?: string }) {
      // Zelfde semantiek als reserve_notifications: alleen openstaande taken die
      // toe zijn en niet geleased zijn, en die worden meteen geleased.
      const now = Date.now()
      const due = outbox
        .filter(
          (r) =>
            r.status === 'pending' &&
            Date.parse(r.next_attempt_at) <= now &&
            (!r.lease_until || Date.parse(r.lease_until) <= now) &&
            (!args._quote_request_id || r.quote_request_id === args._quote_request_id),
        )
        .slice(0, Math.max(args._limit, 1))
      for (const row of due) row.lease_until = new Date(now + 5 * 60_000).toISOString()
      return Promise.resolve({ data: due.map((r) => ({ ...r })), error: null })
    },
  }
}

async function load() {
  return await import('./notifications.server')
}

let supabase: ReturnType<typeof makeFakeSupabase>

beforeEach(() => {
  dispatch.mockReset()
  dispatch.mockResolvedValue({ id: 'lead-1' })
  supabase = makeFakeSupabase()
})

describe('notification outbox', () => {
  it('een aanvraag krijgt exact één internal_lead-taak', async () => {
    const { enqueueNotifications, ensureNotifications } = await load()
    await enqueueNotifications(supabase as never, 'q1', [{ kind: 'internal_lead' }])
    await enqueueNotifications(supabase as never, 'q1', [{ kind: 'internal_lead' }])
    const added = await ensureNotifications(supabase as never, 'q1', [{ kind: 'internal_lead' }])
    expect(supabase.outbox.filter((r) => r.kind === 'internal_lead')).toHaveLength(1)
    expect(added.added).toBe(0)
  })

  it('opnieuw versturen maakt geen tweede lead en geen tweede taak', async () => {
    const { enqueueNotifications, runNotificationsForRequest } = await load()
    await enqueueNotifications(supabase as never, 'q1', [{ kind: 'internal_lead' }])
    const first = await runNotificationsForRequest(supabase as never, 'q1')
    const second = await runNotificationsForRequest(supabase as never, 'q1')
    expect(first.sent).toBe(1)
    expect(second.sent).toBe(0)
    expect(dispatch).toHaveBeenCalledTimes(1)
    expect(supabase.outbox).toHaveLength(1)
    expect(supabase.outbox[0]!.status).toBe('sent')
    expect(supabase.quoteStatus['q1']).toBe('sent')
    // Dezelfde aanvraag levert altijd dezelfde leadreferentie op.
    expect(dispatch.mock.calls[0]![0]).toMatchObject({ externalRef: 'quote:q1' })
  })

  it('mislukte leadmelding blijft pending met pogingenteller en next_attempt_at', async () => {
    const { enqueueNotifications, runNotificationsForRequest } = await load()
    dispatch.mockRejectedValueOnce(new Error('Telegram sendMessage failed [502]'))
    await enqueueNotifications(supabase as never, 'q1', [{ kind: 'internal_lead' }])
    const result = await runNotificationsForRequest(supabase as never, 'q1')
    const row = supabase.outbox[0]!
    expect(result.failed).toBe(1)
    expect(row.status).toBe('pending')
    expect(row.attempts).toBe(1)
    expect(row.last_error).toContain('Telegram')
    expect(Date.parse(row.next_attempt_at)).toBeGreaterThan(Date.now())
    expect(row.lease_until).toBeNull()
    expect(supabase.quoteStatus['q1']).toBe('pending')
  })

  it('na het maximum aantal pogingen wordt de taak definitief failed', async () => {
    const { enqueueNotifications, processDueNotifications } = await load()
    dispatch.mockRejectedValue(new Error('Telegram down'))
    await enqueueNotifications(supabase as never, 'q1', [{ kind: 'internal_lead' }])
    for (let i = 0; i < 6; i++) {
      supabase.outbox[0]!.next_attempt_at = new Date(0).toISOString()
      await processDueNotifications(supabase as never)
    }
    expect(supabase.outbox[0]!.attempts).toBe(6)
    expect(supabase.outbox[0]!.status).toBe('failed')
    expect(supabase.quoteStatus['q1']).toBe('failed')
    // Definitief mislukte taken worden niet opnieuw gereserveerd.
    const again = await processDueNotifications(supabase as never)
    expect(again.requests).toBe(0)
  })

  it('twee gelijktijdige verwerkers pakken nooit dezelfde taak', async () => {
    const { enqueueNotifications } = await load()
    await enqueueNotifications(supabase as never, 'q1', [{ kind: 'internal_lead' }])
    const [a, b] = await Promise.all([
      supabase.rpc('reserve_notifications', { _limit: 10 }),
      supabase.rpc('reserve_notifications', { _limit: 10 }),
    ])
    const taken = [...a.data, ...b.data]
    expect(taken).toHaveLength(1)
  })
})
