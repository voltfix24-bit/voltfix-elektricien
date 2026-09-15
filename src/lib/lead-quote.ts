/**
 * Offertegegevens van een groepenkast-aanvraag: wat de KLANT betaalt.
 * Losstaand van `price_cents` — dat is de leadprijs die de monteur betaalt.
 * Deze twee mogen in het dossier nooit door elkaar lopen.
 */

export type QuoteOption = { label: string; priceCents: number }

/** Route waarlangs de prijs tot stand kwam. */
export type QuoteKind = 'package' | 'photo' | 'survey'

export type QuoteInfo = {
  kind: QuoteKind | null
  packageName: string | null
  /** Basisprijs van het pakket; los van de opties. */
  basePriceCents: number | null
  options: QuoteOption[]
  totalPriceCents: number | null
}

export const QUOTE_KIND_LABEL: Record<QuoteKind, string> = {
  package: 'Pakket gekozen',
  photo: 'Prijs volgt uit de foto (pakket nog niet gekozen)',
  survey: 'Schouw op locatie',
}

export function isQuoteKind(value: unknown): value is QuoteKind {
  return value === 'package' || value === 'photo' || value === 'survey'
}

/** Alleen opties met een echte meerprijs zijn interessant in het dossier. */
export function payableOptions(options: QuoteOption[] | null | undefined): QuoteOption[] {
  return (options ?? []).filter((option) => Number(option?.priceCents) > 0)
}

type LeadLike = {
  quote_kind?: string | null
  quote_package?: string | null
  quote_options?: unknown
  customer_price_cents?: number | null
  price_cents?: number | null
}

/** Leest de offertegegevens van een dossier; geeft null als er niets is. */
export function readQuote(lead: LeadLike): QuoteInfo | null {
  const raw = lead.quote_options
  const parsed = Array.isArray(raw) ? raw : []
  const options: QuoteOption[] = parsed
    .map((entry: any) => ({
      label: String(entry?.label ?? '').trim(),
      priceCents: Number.isFinite(Number(entry?.priceCents)) ? Number(entry.priceCents) : 0,
    }))
    .filter((option) => option.label.length > 0)

  const kind = isQuoteKind(lead.quote_kind) ? lead.quote_kind : null
  const total = Number.isFinite(Number(lead.customer_price_cents)) ? Number(lead.customer_price_cents) : null
  const packageName = (lead.quote_package ?? '').trim() || null
  if (!kind && !packageName && total === null && options.length === 0) return null

  const optionsTotal = options.reduce((sum, option) => sum + option.priceCents, 0)
  const base = total !== null ? Math.max(0, total - optionsTotal) : null

  return { kind, packageName, basePriceCents: base, options, totalPriceCents: total }
}
