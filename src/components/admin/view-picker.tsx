import { filtersEqual, hasAnyFilter, isBuiltin, type ViewFilters } from '@/lib/admin-views'

export type SavedView = { id: string; name: string; filters: ViewFilters; is_shared?: boolean }

/**
 * Opgeslagen weergaven links van de filterpillen. "Bewaar als nieuw" en
 * "Bijwerken" verschijnen alleen wanneer de huidige filters afwijken.
 */
export function ViewPicker({
  views,
  activeId,
  filters,
  onSelect,
  onSaveNew,
  onUpdate,
  onDelete,
}: {
  views: SavedView[]
  activeId: string | null
  filters: ViewFilters
  onSelect: (id: string | null) => void
  onSaveNew: () => void
  onUpdate: () => void
  onDelete: () => void
}) {
  const active = views.find((v) => v.id === activeId) ?? null
  const dirty = active ? !filtersEqual(active.filters, filters) : hasAnyFilter(filters)

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2.5">
      <label className="sr-only" htmlFor="admin-view">Opgeslagen weergave</label>
      <select
        id="admin-view"
        value={activeId ?? ''}
        onChange={(event) => onSelect(event.target.value || null)}
        className="h-11 rounded-lg border border-input bg-card px-3 text-[14px] font-semibold"
      >
        <option value="">Alle leads</option>
        {views.map((view) => (
          <option key={view.id} value={view.id}>
            {view.name}
          </option>
        ))}
      </select>

      {active && !isBuiltin(active.id) && (
        <button type="button" onClick={onDelete} className="min-h-11 text-[13px] font-bold text-muted-foreground">
          Verwijderen
        </button>
      )}

      {dirty && (
        <div className="flex items-center gap-2.5">
          {active && !isBuiltin(active.id) && (
            <button type="button" onClick={onUpdate} className="min-h-11 text-[13px] font-bold text-primary">
              Bijwerken
            </button>
          )}
          <button type="button" onClick={onSaveNew} className="min-h-11 text-[13px] font-bold text-primary">
            Bewaar als nieuw
          </button>
        </div>
      )}
    </div>
  )
}
