// Semantic cost table for service pages. Renders a real <table> so search
// engines and AI answer engines can extract the price rows, with a
// mobile-friendly stacked layout via data-labels.

export type CostRow = {
  /** Scenario, e.g. "Groepenkast vervangen (3 groepen)". */
  scenario: string;
  /** Short clarification shown under the scenario. */
  detail?: string;
  /** Price or price range, already formatted (e.g. "€ 455 – € 850"). */
  price: string;
  /** Unit / scope, e.g. "incl. materiaal". */
  unit?: string;
};

export function CostTable({
  caption,
  rows,
  footnote,
}: {
  caption: string;
  rows: CostRow[];
  footnote?: string;
}) {
  return (
    <div className="not-prose my-8 overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
      <table className="w-full border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="bg-butter/70">
            <th scope="col" className="px-4 py-3 font-bold text-foreground">
              Werkzaamheid
            </th>
            <th scope="col" className="px-4 py-3 text-right font-bold text-foreground">
              Indicatie
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.scenario} className="border-t border-border align-top">
              <th scope="row" className="px-4 py-3 font-semibold text-foreground">
                {row.scenario}
                {row.detail ? (
                  <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                    {row.detail}
                  </span>
                ) : null}
              </th>
              <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-primary">
                {row.price}
                {row.unit ? (
                  <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                    {row.unit}
                  </span>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {footnote ? (
        <p className="border-t border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
          {footnote}
        </p>
      ) : null}
    </div>
  );
}
