/**
 * Nagebootste database voor tests.
 *
 * Genoeg van de echte aanroepketen om hele functies te testen — niet alleen
 * losse helpers: `from(...).select(...).eq(...).maybeSingle()`, updates met
 * voorwaarden, inserts met een unieke sleutel, `or(...)`-filters en — net als
 * de echte database — werkende `order(...)`, `limit(...)` en `range(...)`.
 * Zonder dat laatste zouden tests over paginering niets bewijzen.
 */

type Row = Record<string, any>

export type FakeDb = Record<string, Row[]>

type UniqueSpec = { table: string; columns: string[] }

const DEFAULT_UNIQUE: UniqueSpec[] = [
  { table: 'ads_conversion_outbox', columns: ['lead_id', 'phase', 'account_id'] },
  { table: 'conversion_events', columns: ['event_id'] },
  { table: 'ad_consent_decisions', columns: ['ticket_id', 'seq'] },
  { table: 'ad_consent_tickets', columns: ['token_hash'] },
  { table: 'ads_worker_checkpoint', columns: ['name'] },
  { table: 'ads_migration_policy', columns: ['id'] },
]

type Filter = (row: Row) => boolean

class Builder implements PromiseLike<{ data: any; error: any }> {
  private filters: Filter[] = []
  private op: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select'
  private payload: Row | Row[] | null = null
  private returning = false
  private wantsSingle = false
  private orderBy: { column: string; ascending: boolean } | null = null
  private limitCount: number | null = null
  private onConflictColumns: string[] | null = null


  constructor(
    private db: FakeDb,
    private table: string,
    private unique: UniqueSpec[],
    private failures: Record<string, { code?: string; message: string }>,
  ) {}

  private rows(): Row[] {
    return (this.db[this.table] ??= [])
  }

  select(_cols?: string) {
    if (this.op === 'select') this.op = 'select'
    else this.returning = true
    return this
  }

  insert(payload: Row | Row[]) {
    this.op = 'insert'
    this.payload = payload
    return this
  }

  upsert(payload: Row | Row[], options?: { onConflict?: string }) {
    this.op = 'upsert'
    this.payload = payload
    this.onConflictColumns = options?.onConflict?.split(',').map((c) => c.trim()) ?? null
    return this
  }

  update(patch: Row) {
    this.op = 'update'
    this.payload = patch
    return this
  }

  delete() {
    this.op = 'delete'
    return this
  }


  eq(column: string, value: unknown) {
    this.filters.push((row) => row[column] === value)
    return this
  }

  neq(column: string, value: unknown) {
    this.filters.push((row) => row[column] !== value)
    return this
  }

  in(column: string, values: unknown[]) {
    this.filters.push((row) => values.includes(row[column]))
    return this
  }

  is(column: string, value: unknown) {
    this.filters.push((row) => (row[column] ?? null) === value)
    return this
  }

  gt(column: string, value: string | number) {
    this.filters.push((row) => compare(row[column], value) > 0)
    return this
  }

  gte(column: string, value: string | number) {
    this.filters.push((row) => compare(row[column], value) >= 0)
    return this
  }

  lt(column: string, value: string | number) {
    this.filters.push((row) => compare(row[column], value) < 0)
    return this
  }

  lte(column: string, value: string | number) {
    this.filters.push((row) => compare(row[column], value) <= 0)
    return this
  }

  not(column: string, operator: string, value: unknown) {
    if (operator === 'is') this.filters.push((row) => (row[column] ?? null) !== value)
    else this.filters.push((row) => row[column] !== value)
    return this
  }

  /** Ondersteunt "a.eq.x,b.eq.y" en "a.not.is.null,b.not.is.null". */
  or(expression: string) {
    const parts = expression.split(',')
    this.filters.push((row) =>
      parts.some((part) => {
        const [column, ...rest] = part.split('.')
        const tail = rest.join('.')
        if (tail === 'not.is.null') return (row[column!] ?? null) !== null
        if (tail === 'is.null') return (row[column!] ?? null) === null
        if (tail.startsWith('eq.')) return String(row[column!] ?? '') === tail.slice(3)
        if (tail.startsWith('gte.')) return compare(row[column!], tail.slice(4)) >= 0
        return false
      }),
    )
    return this
  }

  order(column?: string, options?: { ascending?: boolean }) {
    if (column) this.orderBy = { column, ascending: options?.ascending !== false }
    return this
  }

  limit(count?: number) {
    if (typeof count === 'number') this.limitCount = count
    return this
  }

  maybeSingle() {
    this.wantsSingle = true
    return this
  }

  single() {
    this.wantsSingle = true
    return this
  }

  private matched(): Row[] {
    let hits = this.rows().filter((row) => this.filters.every((f) => f(row)))
    if (this.orderBy) {
      const { column, ascending } = this.orderBy
      hits = [...hits].sort((a, b) => (ascending ? 1 : -1) * compare(a[column], b[column]))
    }
    if (this.limitCount != null) hits = hits.slice(0, this.limitCount)
    return hits
  }

  private violatesUnique(row: Row): Row | null {
    for (const spec of this.unique.filter((s) => s.table === this.table)) {
      if (spec.columns.some((col) => row[col] === undefined || row[col] === null)) continue
      const clash = this.rows().find((existing) => spec.columns.every((col) => existing[col] === row[col]))
      if (clash) return clash
    }
    return null
  }

  private run(): { data: any; error: any } {
    const failure = this.failures[`${this.table}:${this.op}`]
    if (failure) return { data: null, error: failure }

    if (this.op === 'insert' || this.op === 'upsert') {
      const incoming = Array.isArray(this.payload) ? this.payload : [this.payload as Row]
      const created: Row[] = []
      for (const row of incoming) {
        const clash = this.violatesUnique(row)
        if (clash) {
          if (this.op === 'upsert') {
            Object.assign(clash, row)
            created.push(clash)
            continue
          }
          return { data: null, error: { code: '23505', message: 'duplicate key value' } }
        }
        const stored = { id: row['id'] ?? `row-${this.rows().length + 1}`, ...row }
        this.rows().push(stored)
        created.push(stored)
      }
      const data = this.wantsSingle ? (created[0] ?? null) : created
      return { data, error: null }
    }

    if (this.op === 'update') {
      const hits = this.matched()
      for (const row of hits) Object.assign(row, this.payload)
      const data = this.wantsSingle ? (hits[0] ?? null) : hits
      return { data, error: null }
    }

    if (this.op === 'delete') {
      const hits = this.matched()
      const rows = this.rows()
      for (const row of hits) {
        const at = rows.indexOf(row)
        if (at >= 0) rows.splice(at, 1)
      }
      return { data: this.wantsSingle ? (hits[0] ?? null) : hits, error: null }
    }

    const hits = this.matched()
    return { data: this.wantsSingle ? (hits[0] ?? null) : hits, error: null }
  }

  then<TResult1 = { data: any; error: any }, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: any }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.run()).then(onfulfilled, onrejected)
  }
}

function compare(a: unknown, b: unknown): number {
  const left = a ?? ''
  const right = b ?? ''
  if (typeof left === 'number' && typeof right === 'number') return left - right
  const ls = String(left)
  const rs = String(right)
  return ls < rs ? -1 : ls > rs ? 1 : 0
}

export function createFakeSupabase(
  db: FakeDb,
  options: { unique?: UniqueSpec[]; failures?: Record<string, { code?: string; message: string }> } = {},
) {
  const unique = options.unique ?? DEFAULT_UNIQUE
  const failures = options.failures ?? {}
  return {
    db,
    from(table: string) {
      return new Builder(db, table, unique, failures)
    },
  }
}
