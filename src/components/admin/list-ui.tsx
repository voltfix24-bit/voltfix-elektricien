import { toast } from 'sonner'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

/**
 * Gedeelde lijstopmaak voor de backoffice (stijlspec):
 * rijen met scheidingslijn, 3px linkerrand in de urgentiekleur,
 * eenduidige lege toestanden en eenduidige foutmeldingen.
 */

/** Kleur van de 3px linkerrand. `none` = gewone borderkleur. */
export const ROW_BORDER = {
  destructive: 'border-l-destructive',
  warning: 'border-l-warning',
  none: 'border-l-border',
} as const

export type RowUrgency = keyof typeof ROW_BORDER

/** Rijpadding volgens de stijlspec: 13px verticaal, 15px horizontaal. */
export const ROW_PADDING = 'py-[13px] px-[15px]'

/**
 * Lege toestand. Twee varianten:
 * - "Niets te doen": de lijst is leeg omdat het werk gedaan is.
 * - "Geen resultaten": een filter of zoekterm levert niets op; met knop Filters wissen.
 */
export function EmptyState({
  title,
  description,
  onClearFilters,
}: {
  title: string
  description: string
  onClearFilters?: () => void
}) {
  return (
    <div className="py-10 text-center">
      <p className="text-[15px] font-bold">{title}</p>
      <p className="mt-1 text-[13.5px] text-muted-foreground">{description}</p>
      {onClearFilters && (
        <Button variant="secondary" className="mt-4 min-h-11" onClick={onClearFilters}>
          Filters wissen
        </Button>
      )}
    </div>
  )
}

/** Laden van een lijst mislukt: binnen de lijstkaart, met opnieuw-knop. Geen technische foutcode. */
export function ListError({ title, onRetry }: { title: string; onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-xl border border-border bg-card py-10 text-center">
      <p className="text-[15px] font-bold">{title}</p>
      <p className="mt-1 text-[13.5px] text-muted-foreground">
        Controleer je internetverbinding en probeer het opnieuw.
      </p>
      <Button variant="secondary" className="mt-4 min-h-11" onClick={onRetry}>
        Opnieuw proberen
      </Button>
    </div>
  )
}

/**
 * Een actie is mislukt: toast met destructive-rand op gewone achtergrond.
 * De tekst zegt wat er níét is gebeurd ("Niet verzonden naar Telegram.").
 */
export function actionError(message: string) {
  toast.error(message, { style: { borderColor: 'var(--destructive)' } })
}

/** Een lead bestaat niet meer (bijv. via een gedeelde ?lead=-link). */
export function LeadGone({ onBack }: { onBack?: () => void }) {
  return (
    <div className="py-10 text-center">
      <p className="text-[15px] font-bold">Deze lead bestaat niet meer</p>
      <p className="mt-1 text-[13.5px] text-muted-foreground">
        Hij is verwijderd of samengevoegd met een duplicaat.
      </p>
      {onBack ? (
        <Button variant="link" className="mt-2 min-h-11" onClick={onBack}>
          Terug naar de lijst
        </Button>
      ) : (
        <Button asChild variant="link" className="mt-2 min-h-11">
          <Link to="/admin/leads" search={{ view: 'list' }}>Terug naar de lijst</Link>
        </Button>
      )}
    </div>
  )
}
