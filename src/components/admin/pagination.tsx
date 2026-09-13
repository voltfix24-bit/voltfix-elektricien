/** Paginering onder de lijst: bereik van het totaal binnen de actieve filters. */
export function Pagination({
  page,
  pageSize,
  total,
  onPage,
}: {
  page: number
  pageSize: number
  total: number
  onPage: (page: number) => void
}) {
  const from = total === 0 ? 0 : page * pageSize + 1
  const to = Math.min(total, (page + 1) * pageSize)

  return (
    <div className="flex items-center justify-between gap-3 border-t border-border px-[15px] py-3">
      <span className="text-[13px] tabular-nums text-muted-foreground">
        {from}–{to} van {total}
      </span>
      <div className="flex gap-2.5">
        <button
          type="button"
          disabled={page === 0}
          onClick={() => onPage(page - 1)}
          className="h-11 rounded-lg border border-input bg-card px-4 text-[14px] font-bold disabled:opacity-40"
        >
          Vorige
        </button>
        <button
          type="button"
          disabled={to >= total}
          onClick={() => onPage(page + 1)}
          className="h-11 rounded-lg border border-input bg-card px-4 text-[14px] font-bold disabled:opacity-40"
        >
          Volgende
        </button>
      </div>
    </div>
  )
}
