/**
 * Opgeslagen weergaven voor de leadlijst: de actieve filterpil, de zoekterm en
 * de sortering onder één naam. Maximaal één niveau — geen mappen.
 */

import { PILL_LABEL, type StagePill } from './lead-status'

/** De filterpil is één status uit het statusmodel; er bestaat geen tweede lijst. */
export type LeadFilter = StagePill
export type LeadSort = 'newest' | 'oldest' | 'urgency'

export type ViewFilters = {
  filter: LeadFilter
  search: string
  sort: LeadSort
}

export const DEFAULT_FILTERS: ViewFilters = { filter: 'work', search: '', sort: 'newest' }

export const FILTER_LABEL = PILL_LABEL

export const SORT_LABEL: Record<LeadSort, string> = {
  newest: 'Nieuwste eerst',
  oldest: 'Oudste eerst',
  urgency: 'Urgentie eerst',
}

/** Drie vaste weergaven; die kan niemand verwijderen of overschrijven. */
export const BUILTIN_VIEWS: { id: string; name: string; filters: ViewFilters }[] = [
  { id: 'builtin-nieuw', name: 'Nieuw', filters: { filter: 'new', search: '', sort: 'urgency' } },
  { id: 'builtin-opgepakt', name: 'Opgepakt', filters: { filter: 'claimed', search: '', sort: 'oldest' } },
  { id: 'builtin-review', name: 'Wacht op review', filters: { filter: 'awaiting_review', search: '', sort: 'oldest' } },
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
