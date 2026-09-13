import { describe, expect, it } from 'vitest'
import { BUILTIN_VIEWS, DEFAULT_FILTERS, filtersEqual, hasAnyFilter, isBuiltin, normaliseFilters } from './admin-views'

describe('admin-views', () => {
  it('herkent de vaste weergaven', () => {
    expect(BUILTIN_VIEWS).toHaveLength(3)
    expect(BUILTIN_VIEWS.every((view) => isBuiltin(view.id))).toBe(true)
    expect(isBuiltin('8f1f0d1e-0000-4000-8000-000000000000')).toBe(false)
  })

  it('vult ontbrekende of onbekende waarden aan met de standaard', () => {
    expect(normaliseFilters(null)).toEqual(DEFAULT_FILTERS)
    expect(normaliseFilters({ filter: 'bestaat-niet' as any, search: '  spoed ', sort: 'x' as any })).toEqual({
      filter: 'work',
      search: 'spoed',
      sort: 'newest',
    })
  })

  it('vergelijkt filters ongeacht spaties', () => {
    expect(filtersEqual({ filter: 'claimed', search: ' a ', sort: 'newest' }, { filter: 'claimed', search: 'a', sort: 'newest' })).toBe(true)
    expect(filtersEqual({ filter: 'claimed' }, { filter: 'scheduled' })).toBe(false)
  })

  it('weet wanneer er iets gefilterd is', () => {
    expect(hasAnyFilter(DEFAULT_FILTERS)).toBe(false)
    expect(hasAnyFilter({ ...DEFAULT_FILTERS, search: 'jan' })).toBe(true)
    expect(hasAnyFilter({ ...DEFAULT_FILTERS, sort: 'oldest' })).toBe(true)
  })
})
