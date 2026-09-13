/**
 * Zwevende actiebalk onder de leadlijst. Verschijnt alleen bij een selectie.
 * Dit is bewust het enige element in de app met een schaduw: hij zweeft
 * over de lijst en moet daarvan losstaan.
 */
export function BulkBar({
  count,
  busy,
  onClear,
  onDispatch,
  onAssign,
  onSpam,
  onCancel,
}: {
  count: number
  busy?: boolean
  onClear: () => void
  onDispatch: () => void
  onAssign: () => void
  onSpam: () => void
  onCancel: () => void
}) {
  if (count === 0) return null

  return (
    <div
      role="region"
      aria-label="Bulkacties"
      className="sticky bottom-0 z-10 flex flex-col gap-3 border-t border-border bg-card px-[15px] py-3 shadow-[0_-12px_32px_oklch(0.27_0.03_264/0.12)] sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-3">
        <span className="text-[14px] font-bold tabular-nums">{count} geselecteerd</span>
        <button type="button" onClick={onClear} className="min-h-11 text-[13px] font-bold text-muted-foreground">
          Wis selectie
        </button>
      </div>

      <div className="flex flex-wrap gap-2.5">
        <button
          type="button"
          disabled={busy}
          onClick={onDispatch}
          className="h-12 rounded-lg bg-primary px-4 text-[14px] font-bold text-primary-foreground disabled:opacity-40 sm:h-11"
        >
          Opnieuw naar Telegram
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onAssign}
          className="h-12 rounded-lg border border-input bg-card px-4 text-[14px] font-bold disabled:opacity-40 sm:h-11"
        >
          Toewijzen
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onSpam}
          className="h-12 rounded-lg border border-input bg-card px-4 text-[14px] font-bold disabled:opacity-40 sm:h-11"
        >
          Als spam markeren
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onCancel}
          className="h-12 rounded-lg border border-input bg-card px-4 text-[14px] font-bold text-muted-foreground disabled:opacity-40 sm:h-11"
        >
          Annuleren
        </button>
      </div>
    </div>
  )
}
