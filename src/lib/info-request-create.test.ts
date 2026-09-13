import { describe, expect, it } from 'vitest'

import { createInfoRequest } from './info-request.server'

/**
 * R7: revisies bouwen voort op de volledige verzoekgeschiedenis, en het
 * vervangen van een lopend verzoek gaat atomair — mislukt de insert, dan staat
 * het oude verzoek exact terug. Deze test gebruikt de echte aanmaakfunctie met
 * een gecontroleerde databaselaag, geen handmatig ingevoegde rijen met een
 * zelfgekozen revisienummer.
 */

type Row = {
  id: string
  revision: number
  status: string
  token_hash: string | null
  superseded_by?: string | null
}

function fakeSupabase(rows: Row[], options: { failInsert?: boolean } = {}) {
  const state = { rows, inserted: null as null | Record<string, unknown> }
  const table = () => {
    const filters: Array<(row: Row) => boolean> = []
    const api: any = {
      select: () => api,
      eq: (column: string, value: unknown) => {
        filters.push(row => (row as any)[column] === value)
        return api
      },
      in: (column: string, values: unknown[]) => {
        filters.push(row => values.includes((row as any)[column]))
        return api
      },
      update: (patch: Record<string, unknown>) => {
        const runner: any = {
          eq: (column: string, value: unknown) => {
            filters.push(row => (row as any)[column] === value)
            return runner
          },
          in: (column: string, values: unknown[]) => {
            filters.push(row => values.includes((row as any)[column]))
            return runner
          },
          then: (resolve: (value: { error: null }) => void) => {
            for (const row of state.rows) {
              if (filters.every(check => check(row))) Object.assign(row, patch)
            }
            resolve({ error: null })
          },
        }
        return runner
      },
      insert: (values: Record<string, unknown>) => ({
        select: () => ({
          single: async () => {
            if (options.failInsert) return { data: null, error: { code: 'XX000' } }
            state.inserted = values
            const created = {
              id: 'new-id',
              revision: values['revision'] as number,
              status: values['status'] as string,
              token_hash: null,
            }
            state.rows.push(created)
            return { data: created, error: null }
          },
        }),
      }),
      then: (resolve: (value: { data: Row[] }) => void) => {
        resolve({ data: state.rows.filter(row => filters.every(check => check(row))) })
      },
    }
    return api
  }
  return { client: { from: () => table() } as any, state }
}

const input = {
  quoteRequestId: 'q1',
  assessmentId: null,
  items: ['photo_consumer_unit'],
  language: 'nl',
  customerNote: '',
  actorId: null,
  leadStatus: 'new',
  openNow: true,
}

describe('createInfoRequest', () => {
  it('telt door op de volledige geschiedenis na een ingediend verzoek', async () => {
    const { client, state } = fakeSupabase([
      { id: 'a', revision: 1, status: 'submitted', token_hash: null },
      { id: 'b', revision: 2, status: 'withdrawn', token_hash: null },
    ])
    const result = await createInfoRequest(client, input)
    expect(result.ok).toBe(true)
    expect(state.inserted?.['revision']).toBe(3)
  })

  it('vervangt een lopend verzoek en zet het terug wanneer de insert mislukt', async () => {
    const open: Row = { id: 'live', revision: 4, status: 'open', token_hash: 'hash' }
    const { client } = fakeSupabase([open], { failInsert: true })
    const result = await createInfoRequest(client, input)
    expect(result.ok).toBe(false)
    // Het oude verzoek staat exact terug: nog steeds open, met zijn token.
    expect(open.status).toBe('open')
    expect(open.token_hash).toBe('hash')
  })
})
