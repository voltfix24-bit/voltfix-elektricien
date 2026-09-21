/**
 * Nagebootste database voor tests.
 *
 * Genoeg van de echte aanroepketen om hele functies te testen — niet alleen
 * losse helpers: `from(...).select(...).eq(...).maybeSingle()`, updates met
 * voorwaarden, inserts met een unieke sleutel en `or(...)`-filters.
 */

type Row = Record<string, any>

export type FakeDb = Record<string, Row[]>

type UniqueSpec = { table: string; columns: string[] }

const DEFAULT_UNIQUE: UniqueSpec[] = [
  { table: 'ads_conversion_outbox', columns: ['lead_id', 'phase', 'account_id'] },
  { table: 'conversion_events', columns: ['event_id'] },
]

type Filter = (row: Row) => boolean

class Builder implements PromiseLike<{ data: any; error: any }> {
  private filters: Filter[] = []
  private op: 'select' | 'insert' | 'update' = 'select'
  private payload: Row | Row[] | null = null
  private returning = false
  private wantsSingle = false

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

  update(patch: Row) {
    this.op = 'update'
    this.payload = patch
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

  gte(column: string, value: string) {
    this.filters.push((row) => String(row[column] ?? '') >= value)
    return this
  }

  lte(column: string, value: string) {
    this.filters.push((row) => String(row[column] ?? '') <= value)
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
        if (tail.startsWith('eq.')) return String(row[column!] ?? '') === tail.slice(3)
        return false
      }),
    )
    return this
  }

  order() {
    return this
  }

  limit() {
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
    return this.rows().filter((row) => this.filters.every((f) => f(row)))
  }

  private violatesUnique(row: Row): boolean {
    return this.unique
      .filter((spec) => spec.table === this.table)
      .some((spec) => {
        if (spec.columns.some((col) => row[col] === undefined || row[col] === null)) return false
        return this.rows().some((existing) => spec.columns.every((col) => existing[col] === row[col]))
      })
  }

  private run(): { data: any; error: any } {
    const failure = this.failures[`${this.table}:${this.op}`]
    if (failure) return { data: null, error: failure }

    if (this.op === 'insert') {
      const incoming = Array.isArray(this.payload) ? this.payload : [this.payload as Row]
      const created: Row[] = []
      for (const row of incoming) {
        if (this.violatesUnique(row)) {
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
