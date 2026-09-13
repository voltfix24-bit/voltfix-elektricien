/**
 * Opgeslagen weergaven voor de leadlijst: de actieve filterpil, de zoekterm en
 * de sortering onder één naam. Maximaal één niveau — geen mappen.
 */

export type LeadFilter = 'all' | 'open' | 'urgent' | 'overdue' | 'no-outcome'
export type LeadSort = 'newest' | 'oldest' | 'urgency'

export type ViewFilters = {
  filter: LeadFilter
  search: string
  sort: LeadSort
}

export const DEFAULT_FILTERS: ViewFilters = { filter: 'all', search: '', sort: 'newest' }

export const FILTER_LABEL: Record<LeadFilter, string> = {
  all: 'Alles',
  open: 'Open',
  urgent: 'Spoed',
  overdue: 'Niet opgepakt',
  'no-outcome': 'Zonder afloop',
}

export const SORT_LABEL: Record<LeadSort, string> = {
  newest: 'Nieuwste eerst',
  oldest: 'Oudste eerst',
  urgency: 'Urgentie eerst',
}

/** Drie vaste weergaven; die kan niemand verwijderen of overschrijven. */
export const BUILTIN_VIEWS: { id: string; name: string; filters: ViewFilters }[] = [
  { id: 'builtin-spoed', name: 'Spoed open', filters: { filter: 'urgent', search: '', sort: 'urgency' } },
  { id: 'builtin-escalated', name: 'Niet opgepakt', filters: { filter: 'overdue', search: '', sort: 'oldest' } },
  { id: 'builtin-no-outcome', name: 'Zonder afloop', filters: { filter: 'no-outcome', search: '', sort: 'oldest' } },
]

export function isBuiltin(id: string) {
  return id.startsWith('builtin-')
}

export function normaliseFilters(input: Partial<ViewFilters> | null | undefined): ViewFilters {
  return {
    filter: input?.filter && input.filter in FILTER_LABEL ? input.filter : DEFAULT_FILTERS.filter,
    search: (input?.search ?? '').trim(),
    sort: input?.sort && input.sort in SORT_LABEL ? input.sort : DEFAULT_FILTERS.sort,
  }
}

export function filtersEqual(a: Partial<ViewFilters> | null | undefined, b: Partial<ViewFilters> | null | undefined) {
  const x = normaliseFilters(a)
  const y = normaliseFilters(b)
  return x.filter === y.filter && x.search === y.search && x.sort === y.sort
}

export function hasAnyFilter(filters: Partial<ViewFilters> | null | undefined) {
  return !filtersEqual(filters, DEFAULT_FILTERS)
}
