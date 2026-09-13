import { useCallback, useState } from 'react'

/**
 * Eén selectiebegrip voor lijsten met bulkacties.
 * De selectie gaat bewust nooit over paginagrenzen heen: de aanroeper wist
 * bij een paginawissel, zodat je altijd weet waarop je een actie uitvoert.
 */
export function useSelection<T extends string>(visibleIds: T[]) {
  const [selected, setSelected] = useState<Set<T>>(new Set())
  const [lastIndex, setLastIndex] = useState<number | null>(null)

  const toggle = useCallback(
    (id: T, index: number, shift = false) => {
      setSelected((prev) => {
        const next = new Set(prev)
        if (shift && lastIndex !== null) {
          const [from, to] = index < lastIndex ? [index, lastIndex] : [lastIndex, index]
          for (let i = from; i <= to; i++) {
            const rangeId = visibleIds[i]
            if (rangeId) next.add(rangeId)
          }
        } else if (next.has(id)) {
          next.delete(id)
        } else {
          next.add(id)
        }
        return next
      })
      setLastIndex(index)
    },
    [lastIndex, visibleIds],
  )

  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id))

  const toggleAllVisible = useCallback(() => {
    setSelected((prev) => (visibleIds.length > 0 && visibleIds.every((id) => prev.has(id)) ? new Set<T>() : new Set(visibleIds)))
  }, [visibleIds])

  const clear = useCallback(() => setSelected(new Set<T>()), [])

  /** Na een half mislukte bulkactie: houd alleen de mislukte gevallen over. */
  const keepOnly = useCallback((ids: T[]) => setSelected(new Set(ids)), [])

  return { selected, count: selected.size, toggle, toggleAllVisible, allVisibleSelected, clear, keepOnly }
}
